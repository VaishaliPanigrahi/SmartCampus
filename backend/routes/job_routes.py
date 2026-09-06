import mysql.connector

from flask import Blueprint, g, jsonify, request

try:
    from ..database import get_connection
    from ..ml.eligibility import check_eligibility
    from ..ml.matching import calculate_match
    from .auth_routes import require_auth
except ImportError:
    from database import get_connection
    from ml.eligibility import check_eligibility
    from ml.matching import calculate_match
    from routes.auth_routes import require_auth


job_bp = Blueprint('jobs', __name__, url_prefix='/api')


def recruiter_only():
    if g.current_user['role'] != 'recruiter':
        return jsonify({'error': 'This endpoint is available to recruiters only.'}), 403
    return None


def recommendation_job_data(job, match, eligible=True, reasons=None):
    return {
        'id': job['id'],
        'job_title': job['job_title'],
        'company': job['company'],
        'description': job['description'],
        'required_skills': job['required_skills'],
        'minimum_cgpa': job['minimum_cgpa'],
        'department': job['department'],
        'graduation_year': job['graduation_year'],
        'location': job['location'],
        'eligible': eligible,
        'eligibility_reasons': reasons or [],
        **match,
    }


@job_bp.get('/student/recommendations')
@require_auth
def student_recommendations():
    if g.current_user['role'] != 'student':
        return jsonify({'error': 'This endpoint is available to students only.'}), 403

    with get_connection() as connection:
        student = connection.execute('SELECT * FROM students WHERE id = ?', (g.current_user['user_id'],)).fetchone()
        jobs = connection.execute('SELECT * FROM jobs ORDER BY created_at DESC').fetchall()

    if student is None:
        return jsonify({'error': 'Student profile not found.'}), 404

    recommendations = []
    excluded_jobs = []
    for job in jobs:
        eligible, reasons = check_eligibility(student, job)
        if eligible:
            recommendations.append(recommendation_job_data(job, calculate_match(student, job)))
        else:
            excluded_jobs.append({
                'job_title': job['job_title'],
                'company': job['company'],
                'reasons': reasons,
            })

    recommendations.sort(key=lambda item: item['final_score'], reverse=True)
    return jsonify({
        'recommendations': recommendations,
        'excluded_jobs': excluded_jobs,
        'student_eligibility': {
            'cgpa': float(student['cgpa']),
            'department': student['department'],
            'graduation_year': int(student['graduation_year']),
        },
        'eligibility_filter': 'CGPA, department, and graduation year',
        'model_weights': {'tfidf': 0.30, 'semantic': 0.70},
    })


@job_bp.get('/jobs')
def list_jobs():
    with get_connection() as connection:
        jobs = connection.execute('SELECT * FROM jobs ORDER BY created_at DESC').fetchall()
    return jsonify({'jobs': [dict(job) for job in jobs]})


@job_bp.get('/jobs/<int:job_id>')
@require_auth
def job_details(job_id):
    with get_connection() as connection:
        job = connection.execute('SELECT * FROM jobs WHERE id = ?', (job_id,)).fetchone()
        if job is None:
            return jsonify({'error': 'Job not found.'}), 404
        student = None
        application = None
        if g.current_user['role'] == 'student':
            student = connection.execute('SELECT * FROM students WHERE id = ?', (g.current_user['user_id'],)).fetchone()
            application = connection.execute(
                'SELECT status FROM applications WHERE student_id = ? AND job_id = ?',
                (g.current_user['user_id'], job_id),
            ).fetchone()

    eligible, reasons = check_eligibility(student, job) if student else (False, ['Student login is required.'])
    match = calculate_match(student, job) if student and eligible else {
        'tfidf_score': 0,
        'semantic_score': 0,
        'final_score': 0,
        'matched_skills': [],
        'semantic_model': 'not-calculated',
        'weights': {'tfidf': 0.30, 'semantic': 0.70},
    }
    return jsonify({
        'job': recommendation_job_data(job, match, eligible, reasons),
        'application_status': application['status'] if application else None,
    })


@job_bp.post('/jobs/<int:job_id>/apply')
@require_auth
def apply_for_job(job_id):
    if g.current_user['role'] != 'student':
        return jsonify({'error': 'Only students can apply for jobs.'}), 403

    with get_connection() as connection:
        job = connection.execute('SELECT * FROM jobs WHERE id = ?', (job_id,)).fetchone()
        student = connection.execute('SELECT * FROM students WHERE id = ?', (g.current_user['user_id'],)).fetchone()
        if job is None:
            return jsonify({'error': 'Job not found.'}), 404
        eligible, reasons = check_eligibility(student, job)
        if not eligible:
            return jsonify({'error': 'You are not eligible for this job.', 'eligibility_reasons': reasons}), 403
        try:
            connection.execute(
                "INSERT INTO applications (student_id, job_id, status) VALUES (?, ?, 'Applied')",
                (g.current_user['user_id'], job_id),
            )
            connection.commit()
        except mysql.connector.Error as error:
            if error.errno != 1062:
                raise
            return jsonify({'error': 'You have already applied for this job.'}), 409

    return jsonify({'message': 'Application submitted successfully.', 'status': 'Applied'}), 201


@job_bp.get('/student/applications')
@require_auth
def student_applications():
    if g.current_user['role'] != 'student':
        return jsonify({'error': 'This endpoint is available to students only.'}), 403

    with get_connection() as connection:
        applications = connection.execute(
            """
            SELECT applications.id, applications.status, applications.applied_at,
                   jobs.id AS job_id, jobs.job_title, jobs.company, jobs.location
            FROM applications
            JOIN jobs ON jobs.id = applications.job_id
            WHERE applications.student_id = ?
            ORDER BY applications.applied_at DESC
            """,
            (g.current_user['user_id'],),
        ).fetchall()
    return jsonify({'applications': [dict(application) for application in applications]})


@job_bp.post('/jobs')
@require_auth
def create_job():
    blocked = recruiter_only()
    if blocked:
        return blocked

    payload = request.get_json(silent=True) or {}
    required_fields = ('job_title', 'company', 'description', 'required_skills', 'location')
    if any(not str(payload.get(field, '')).strip() for field in required_fields):
        return jsonify({'error': 'Job title, company, description, skills, and location are required.'}), 400

    try:
        minimum_cgpa = float(payload.get('minimum_cgpa', 0))
        graduation_year = int(payload['graduation_year']) if payload.get('graduation_year') else None
    except (TypeError, ValueError):
        return jsonify({'error': 'CGPA and graduation year must be valid numbers.'}), 400
    if not 0 <= minimum_cgpa <= 10:
        return jsonify({'error': 'Minimum CGPA must be between 0 and 10.'}), 400

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO jobs (
                recruiter_id, job_title, company, description, required_skills,
                minimum_cgpa, department, graduation_year, location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (g.current_user['user_id'], payload['job_title'].strip(), payload['company'].strip(),
             payload['description'].strip(), payload['required_skills'].strip(), minimum_cgpa,
             str(payload.get('department') or 'All').strip(), graduation_year, payload['location'].strip()),
        )
        connection.commit()
        job = connection.execute('SELECT * FROM jobs WHERE id = ?', (cursor.lastrowid,)).fetchone()
    return jsonify({'job': dict(job)}), 201


@job_bp.get('/recruiter/jobs')
@require_auth
def recruiter_jobs():
    blocked = recruiter_only()
    if blocked:
        return blocked
    with get_connection() as connection:
        jobs = connection.execute(
            """
            SELECT jobs.*, COUNT(applications.id) AS applicant_count
            FROM jobs
            LEFT JOIN applications ON applications.job_id = jobs.id
            WHERE jobs.recruiter_id = ?
            GROUP BY jobs.id
            ORDER BY jobs.created_at DESC
            """,
            (g.current_user['user_id'],),
        ).fetchall()
    return jsonify({'jobs': [dict(job) for job in jobs]})


@job_bp.get('/jobs/<int:job_id>/candidates')
@require_auth
def ranked_candidates(job_id):
    blocked = recruiter_only()
    if blocked:
        return blocked
    with get_connection() as connection:
        job = connection.execute(
            'SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?',
            (job_id, g.current_user['user_id']),
        ).fetchone()
        students = connection.execute(
            """
            SELECT students.*, applications.status AS application_status
            FROM students
            LEFT JOIN applications ON applications.student_id = students.id AND applications.job_id = ?
            ORDER BY students.id
            """,
            (job_id,),
        ).fetchall()
    if job is None:
        return jsonify({'error': 'Job not found or not owned by this recruiter.'}), 404

    candidates = []
    for student in students:
        eligible, reasons = check_eligibility(student, job)
        if not eligible:
            continue
        match = calculate_match(student, job)
        candidates.append({
            'student_id': student['id'],
            'college_id': student['student_id'],
            'name': student['name'],
            'email': student['email'],
            'department': student['department'],
            'cgpa': student['cgpa'],
            'graduation_year': student['graduation_year'],
            'skills': student['skills'],
            'projects': student['projects'],
            'certifications': student['certifications'],
            'resume_uploaded': bool(student['resume_path']),
            'application_status': student['application_status'],
            'eligible': True,
            'eligibility_reasons': reasons,
            **match,
        })
    candidates.sort(key=lambda candidate: candidate['final_score'], reverse=True)
    return jsonify({'job': dict(job), 'candidates': candidates})


@job_bp.post('/jobs/<int:job_id>/candidates/<int:student_id>/shortlist')
@require_auth
def shortlist_candidate(job_id, student_id):
    blocked = recruiter_only()
    if blocked:
        return blocked

    with get_connection() as connection:
        job = connection.execute(
            'SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?',
            (job_id, g.current_user['user_id']),
        ).fetchone()
        if job is None:
            return jsonify({'error': 'Job not found or not owned by this recruiter.'}), 404

        application = connection.execute(
            """
            SELECT id, status FROM applications
            WHERE student_id = ? AND job_id = ?
            """,
            (student_id, job_id),
        ).fetchone()
        if application is None:
            return jsonify({'error': 'A candidate must apply before being shortlisted.'}), 400
        if application['status'] == 'Shortlisted':
            return jsonify({'message': 'Candidate is already shortlisted.', 'status': 'Shortlisted'}), 200

        connection.execute(
            "UPDATE applications SET status = 'Shortlisted' WHERE id = ?",
            (application['id'],),
        )
        connection.commit()

    return jsonify({'message': 'Candidate shortlisted successfully.', 'status': 'Shortlisted'}), 200
