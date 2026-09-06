from functools import wraps

import mysql.connector
from flask import Blueprint, current_app, g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

try:
    from ..database import get_connection
except ImportError:
    from database import get_connection


auth_bp = Blueprint('auth', __name__, url_prefix='/api')
TOKEN_MAX_AGE = 60 * 60 * 8


def get_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'])


def user_summary(user: dict, role: str) -> dict:
    if role == 'student':
        return {
            'id': user['id'],
            'role': role,
            'name': user['name'],
            'email': user['email'],
            'student_id': user['student_id'],
            'department': user['department'],
        }
    return {
        'id': user['id'],
        'role': role,
        'name': user['name'],
        'email': user['email'],
        'company': user['company'],
    }


def issue_token(user_id: int, role: str) -> str:
    return get_serializer().dumps({'user_id': user_id, 'role': role})


def require_auth(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        authorization = request.headers.get('Authorization', '')
        if not authorization.startswith('Bearer '):
            return jsonify({'error': 'A Bearer token is required.'}), 401

        token = authorization.removeprefix('Bearer ').strip()
        try:
            payload = get_serializer().loads(token, max_age=TOKEN_MAX_AGE)
        except SignatureExpired:
            return jsonify({'error': 'Your session has expired. Please log in again.'}), 401
        except BadSignature:
            return jsonify({'error': 'The provided session token is invalid.'}), 401

        g.current_user = payload
        return view(*args, **kwargs)

    return wrapped_view


@auth_bp.post('/login')
def login():
    payload = request.get_json(silent=True) or {}
    role = payload.get('role', '').strip().lower()
    identifier = payload.get('identifier', '').strip().lower()
    password = payload.get('password', '')

    if role not in {'student', 'recruiter'}:
        return jsonify({'error': 'Choose either student or recruiter login.'}), 400
    if not identifier or not password:
        return jsonify({'error': 'Identifier and password are required.'}), 400

    table_name = 'students' if role == 'student' else 'recruiters'
    identifier_column = 'email'
    if role == 'student' and '@' not in identifier:
        identifier_column = 'student_id'

    with get_connection() as connection:
        user = connection.execute(
            f'SELECT * FROM {table_name} WHERE LOWER({identifier_column}) = ?',
            (identifier,),
        ).fetchone()

    if user is None or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid login details.'}), 401

    user_data = dict(user)
    return jsonify({
        'token': issue_token(user_data['id'], role),
        'user': user_summary(user_data, role),
    })


@auth_bp.post('/register')
def register():
    payload = request.get_json(silent=True) or {}
    role = str(payload.get('role', '')).strip().lower()
    if role not in {'student', 'recruiter'}:
        return jsonify({'error': 'Choose either student or recruiter registration.'}), 400

    required = ('name', 'email', 'password')
    if role == 'student':
        required += ('student_id', 'department', 'cgpa', 'graduation_year')
    else:
        required += ('company',)
    if any(not str(payload.get(field, '')).strip() for field in required):
        return jsonify({'error': 'Complete all required registration fields.'}), 400
    if len(payload['password']) < 6:
        return jsonify({'error': 'Password must contain at least 6 characters.'}), 400

    try:
        with get_connection() as connection:
            if role == 'student':
                cgpa = float(payload['cgpa'])
                graduation_year = int(payload['graduation_year'])
                if not 0 <= cgpa <= 10:
                    return jsonify({'error': 'CGPA must be between 0 and 10.'}), 400
                cursor = connection.execute(
                    """
                    INSERT INTO students (
                        student_id, name, email, password, department, cgpa, graduation_year,
                        skills, programming_languages, projects, certifications,
                        preferred_role, preferred_location
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (payload['student_id'].strip(), payload['name'].strip(), payload['email'].strip().lower(),
                     generate_password_hash(payload['password']), payload['department'].strip(), cgpa, graduation_year,
                     str(payload.get('skills', '')).strip(), str(payload.get('programming_languages', '')).strip(),
                     str(payload.get('projects', '')).strip(), str(payload.get('certifications', '')).strip(),
                     str(payload.get('preferred_role', '')).strip(), str(payload.get('preferred_location', '')).strip()),
                )
                user = connection.execute('SELECT * FROM students WHERE id = ?', (cursor.lastrowid,)).fetchone()
            else:
                cursor = connection.execute(
                    'INSERT INTO recruiters (name, email, password, company) VALUES (?, ?, ?, ?)',
                    (payload['name'].strip(), payload['email'].strip().lower(), generate_password_hash(payload['password']), payload['company'].strip()),
                )
                user = connection.execute('SELECT * FROM recruiters WHERE id = ?', (cursor.lastrowid,)).fetchone()
            connection.commit()
    except mysql.connector.Error as error:
        if error.errno == 1062:
            return jsonify({'error': 'That email or student ID is already registered.'}), 409
        raise

    user_data = dict(user)
    return jsonify({'token': issue_token(user_data['id'], role), 'user': user_summary(user_data, role)}), 201


@auth_bp.get('/me')
@require_auth
def current_user():
    role = g.current_user['role']
    table_name = 'students' if role == 'student' else 'recruiters'
    with get_connection() as connection:
        user = connection.execute(
            f'SELECT * FROM {table_name} WHERE id = ?',
            (g.current_user['user_id'],),
        ).fetchone()

    if user is None:
        return jsonify({'error': 'User no longer exists.'}), 404
    return jsonify({'user': user_summary(dict(user), role)})
