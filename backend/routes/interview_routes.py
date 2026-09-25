from datetime import datetime

from flask import Blueprint, g, jsonify, request

try:
    from ..database import get_connection
    from .auth_routes import require_auth
    from .notification_routes import create_notification
except ImportError:
    from database import get_connection
    from routes.auth_routes import require_auth
    from routes.notification_routes import create_notification


interview_bp = Blueprint('interviews', __name__, url_prefix='/api')


def recruiter_only():
    if g.current_user['role'] != 'recruiter':
        return jsonify({'error': 'This endpoint is available to recruiters only.'}), 403
    return None


def parse_scheduled_at(value):
    """Accept ISO strings from datetime-local inputs (e.g. 2026-10-01T14:30)."""
    text = str(value).strip().replace('T', ' ')
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def serialize_interview(row):
    """Return a JSON-safe interview dict with a naive ISO datetime so the browser renders it in local time."""
    interview = dict(row)
    for field in ('scheduled_at', 'created_at'):
        if interview.get(field) is not None:
            interview[field] = interview[field].isoformat()
    return interview


@interview_bp.post('/jobs/<int:job_id>/candidates/<int:student_id>/interview')
@require_auth
def schedule_interview(job_id, student_id):
    blocked = recruiter_only()
    if blocked:
        return blocked

    payload = request.get_json(silent=True) or {}
    scheduled_at = parse_scheduled_at(payload.get('scheduled_at', ''))
    if scheduled_at is None:
        return jsonify({'error': 'A valid interview date and time are required.'}), 400

    mode = str(payload.get('mode') or 'Online').strip() or 'Online'
    meeting_link = str(payload.get('meeting_link') or '').strip() or None
    location = str(payload.get('location') or '').strip() or None
    notes = str(payload.get('notes') or '').strip() or None
    if mode.lower() == 'online' and not meeting_link:
        return jsonify({'error': 'A meeting link is required for online interviews.'}), 400
    if mode.lower() == 'onsite' and not location:
        return jsonify({'error': 'A location is required for on-site interviews.'}), 400

    with get_connection() as connection:
        job = connection.execute(
            'SELECT id, job_title, company FROM jobs WHERE id = ? AND recruiter_id = ?',
            (job_id, g.current_user['user_id']),
        ).fetchone()
        if job is None:
            return jsonify({'error': 'Job not found or not owned by this recruiter.'}), 404

        application = connection.execute(
            'SELECT status FROM applications WHERE student_id = ? AND job_id = ?',
            (student_id, job_id),
        ).fetchone()
        if application is None or application['status'] not in ('Shortlisted', 'Interview'):
            return jsonify({'error': 'Only shortlisted candidates can be scheduled for an interview.'}), 400

        student = connection.execute('SELECT id, name FROM students WHERE id = ?', (student_id,)).fetchone()
        if student is None:
            return jsonify({'error': 'Candidate not found.'}), 404

        connection.execute(
            """
            INSERT INTO interviews (job_id, student_id, recruiter_id, scheduled_at, mode, meeting_link, location, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                scheduled_at = VALUES(scheduled_at), mode = VALUES(mode),
                meeting_link = VALUES(meeting_link), location = VALUES(location),
                notes = VALUES(notes), status = 'Scheduled'
            """,
            (job_id, student_id, g.current_user['user_id'], scheduled_at, mode, meeting_link, location, notes),
        )
        create_notification(
            connection, 'student', student_id,
            f'Interview scheduled — {job["job_title"]}',
            f'Your interview with {job["company"]} is on {scheduled_at.strftime("%d %b %Y, %I:%M %p")} ({mode}).',
            '/student/interviews',
        )
        connection.execute(
            "UPDATE applications SET status = 'Interview' WHERE student_id = ? AND job_id = ? AND status = 'Shortlisted'",
            (student_id, job_id),
        )
        connection.commit()

        interview = connection.execute(
            'SELECT * FROM interviews WHERE job_id = ? AND student_id = ?',
            (job_id, student_id),
        ).fetchone()

    return jsonify({'message': 'Interview scheduled.', 'interview': serialize_interview(interview)}), 201


@interview_bp.get('/student/interviews')
@require_auth
def student_interviews():
    if g.current_user['role'] != 'student':
        return jsonify({'error': 'This endpoint is available to students only.'}), 403

    with get_connection() as connection:
        interviews = connection.execute(
            """
            SELECT interviews.id, interviews.scheduled_at, interviews.mode, interviews.meeting_link,
                   interviews.location, interviews.notes, interviews.status,
                   jobs.id AS job_id, jobs.job_title, jobs.company, recruiters.name AS recruiter_name
            FROM interviews
            JOIN jobs ON jobs.id = interviews.job_id
            JOIN recruiters ON recruiters.id = interviews.recruiter_id
            WHERE interviews.student_id = ?
            ORDER BY interviews.scheduled_at ASC
            """,
            (g.current_user['user_id'],),
        ).fetchall()
    return jsonify({'interviews': [serialize_interview(row) for row in interviews]})


@interview_bp.get('/recruiter/interviews')
@require_auth
def recruiter_interviews():
    blocked = recruiter_only()
    if blocked:
        return blocked

    with get_connection() as connection:
        interviews = connection.execute(
            """
            SELECT interviews.id, interviews.scheduled_at, interviews.mode, interviews.meeting_link,
                   interviews.location, interviews.notes, interviews.status,
                   jobs.id AS job_id, jobs.job_title, jobs.company,
                   students.name AS student_name, students.student_id AS college_id, students.email AS student_email
            FROM interviews
            JOIN jobs ON jobs.id = interviews.job_id
            JOIN students ON students.id = interviews.student_id
            WHERE interviews.recruiter_id = ?
            ORDER BY interviews.scheduled_at ASC
            """,
            (g.current_user['user_id'],),
        ).fetchall()
    return jsonify({'interviews': [serialize_interview(row) for row in interviews]})
