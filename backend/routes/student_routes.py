from functools import wraps
from pathlib import Path
from uuid import uuid4

import mysql.connector
from flask import Blueprint, current_app, g, jsonify, request
from werkzeug.utils import secure_filename

try:
    from ..database import get_connection
    from ..ml.eligibility import check_eligibility
    from ..resume_parser import analyze_resume, extract_text_from_pdf
    from .auth_routes import require_auth
except ImportError:
    from database import get_connection
    from ml.eligibility import check_eligibility
    from resume_parser import analyze_resume, extract_text_from_pdf
    from routes.auth_routes import require_auth


student_bp = Blueprint('student', __name__, url_prefix='/api/student')
PROFILE_FIELDS = (
    'name',
    'email',
    'department',
    'cgpa',
    'graduation_year',
    'skills',
    'programming_languages',
    'projects',
    'certifications',
    'preferred_role',
    'preferred_location',
)


def require_student(view):
    @require_auth
    @wraps(view)
    def student_view(*args, **kwargs):
        if g.current_user['role'] != 'student':
            return jsonify({'error': 'This endpoint is available to students only.'}), 403
        return view(*args, **kwargs)

    return student_view


def profile_data(row) -> dict:
    data = dict(row)
    data.pop('password', None)
    return data


@student_bp.get('/profile')
@require_student
def get_profile():
    with get_connection() as connection:
        student = connection.execute(
            'SELECT * FROM students WHERE id = ?',
            (g.current_user['user_id'],),
        ).fetchone()

    if student is None:
        return jsonify({'error': 'Student profile not found.'}), 404
    return jsonify({'profile': profile_data(student)})


@student_bp.get('/dashboard')
@require_student
def student_dashboard():
    with get_connection() as connection:
        student = connection.execute('SELECT * FROM students WHERE id = ?', (g.current_user['user_id'],)).fetchone()
        application_count = connection.execute(
            'SELECT COUNT(*) AS total FROM applications WHERE student_id = ?',
            (g.current_user['user_id'],),
        ).fetchone()['total']
        jobs = connection.execute('SELECT * FROM jobs').fetchall()

    if student is None:
        return jsonify({'error': 'Student profile not found.'}), 404

    completion_fields = ('name', 'email', 'department', 'cgpa', 'graduation_year', 'skills', 'projects', 'preferred_role', 'preferred_location')
    completed_fields = sum(bool(student[field]) for field in completion_fields)
    eligible_jobs = sum(check_eligibility(student, job)[0] for job in jobs)
    return jsonify({
        'student': {'name': student['name'], 'student_id': student['student_id']},
        'profile_completion': round(completed_fields / len(completion_fields) * 100),
        'recommended_jobs': eligible_jobs,
        'applications': application_count,
        'resume_uploaded': bool(student['resume_path']),
    })


@student_bp.put('/profile')
@require_student
def update_profile():
    payload = request.get_json(silent=True) or {}
    updates = {field: payload[field] for field in PROFILE_FIELDS if field in payload}

    if not updates:
        return jsonify({'error': 'Add at least one profile field to update.'}), 400
    if 'name' in updates and not str(updates['name']).strip():
        return jsonify({'error': 'Name cannot be empty.'}), 400
    if 'email' in updates and '@' not in str(updates['email']):
        return jsonify({'error': 'Enter a valid email address.'}), 400

    for numeric_field in ('cgpa', 'graduation_year'):
        if numeric_field in updates:
            try:
                updates[numeric_field] = float(updates[numeric_field]) if numeric_field == 'cgpa' else int(updates[numeric_field])
            except (TypeError, ValueError):
                return jsonify({'error': f'{numeric_field} must be a number.'}), 400
    if 'cgpa' in updates and not 0 <= updates['cgpa'] <= 10:
        return jsonify({'error': 'CGPA must be between 0 and 10.'}), 400

    assignments = ', '.join(f'{field} = ?' for field in updates)
    values = list(updates.values()) + [g.current_user['user_id']]
    try:
        with get_connection() as connection:
            connection.execute(
                f'UPDATE students SET {assignments} WHERE id = ?',
                values,
            )
            updated_student = connection.execute(
                'SELECT * FROM students WHERE id = ?',
                (g.current_user['user_id'],),
            ).fetchone()
            connection.commit()
    except mysql.connector.Error as error:
        if error.errno == 1062:
            return jsonify({'error': 'That email address is already in use.'}), 409
        raise

    return jsonify({'profile': profile_data(updated_student)})


@student_bp.get('/resume')
@require_student
def get_resume():
    with get_connection() as connection:
        student = connection.execute(
            'SELECT * FROM students WHERE id = ?',
            (g.current_user['user_id'],),
        ).fetchone()

    if student is None:
        return jsonify({'error': 'Student profile not found.'}), 404
    if not student['resume_path']:
        return jsonify({'resume': {'uploaded': False}})

    return jsonify({
        'resume': {
            'uploaded': True,
            'filename': Path(student['resume_path']).name,
            'text': student['resume_text'] or '',
            'character_count': len(student['resume_text'] or ''),
            'analysis': analyze_resume(student['resume_text'] or '', student),
        },
    })


@student_bp.post('/resume')
@require_student
def upload_resume():
    uploaded_file = request.files.get('resume')
    if uploaded_file is None or not uploaded_file.filename:
        return jsonify({'error': 'Choose a PDF resume to upload.'}), 400
    if not uploaded_file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF resumes are supported.'}), 400

    safe_name = secure_filename(uploaded_file.filename)
    if not safe_name:
        return jsonify({'error': 'The uploaded filename is not valid.'}), 400

    upload_folder = Path(current_app.config['UPLOAD_FOLDER'])
    upload_folder.mkdir(parents=True, exist_ok=True)
    stored_name = f"student_{g.current_user['user_id']}_{uuid4().hex}.pdf"
    stored_path = upload_folder / stored_name
    uploaded_file.save(stored_path)

    try:
        extracted_text = extract_text_from_pdf(stored_path)
    except Exception:
        stored_path.unlink(missing_ok=True)
        return jsonify({'error': 'The PDF could not be read. Please upload a valid PDF file.'}), 400

    relative_path = str(Path('uploads') / stored_name)
    with get_connection() as connection:
        connection.execute(
            'UPDATE students SET resume_path = ?, resume_text = ? WHERE id = ?',
            (relative_path, extracted_text, g.current_user['user_id']),
        )
        connection.commit()

        student = connection.execute(
            'SELECT * FROM students WHERE id = ?',
            (g.current_user['user_id'],),
        ).fetchone()

    return jsonify({
        'message': 'Resume uploaded and analyzed successfully.',
        'resume': {
            'uploaded': True,
            'filename': safe_name,
            'text': extracted_text,
            'character_count': len(extracted_text),
            'analysis': analyze_resume(extracted_text, student),
        },
    }), 201
