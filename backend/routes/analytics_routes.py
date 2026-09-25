from flask import Blueprint, g, jsonify

try:
    from ..database import get_connection
    from .auth_routes import require_auth
except ImportError:
    from database import get_connection
    from routes.auth_routes import require_auth


analytics_bp = Blueprint('analytics', __name__, url_prefix='/api')

FUNNEL_ORDER = ('Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected')


def ordered_funnel(rows):
    counts = {row['status']: row['total'] for row in rows}
    return [{'status': status, 'count': counts.get(status, 0)} for status in FUNNEL_ORDER]


@analytics_bp.get('/student/analytics')
@require_auth
def student_analytics():
    if g.current_user['role'] != 'student':
        return jsonify({'error': 'This endpoint is available to students only.'}), 403

    uid = g.current_user['user_id']
    with get_connection() as connection:
        funnel_rows = connection.execute(
            'SELECT status, COUNT(*) AS total FROM applications WHERE student_id = ? GROUP BY status',
            (uid,),
        ).fetchall()
        timeline = connection.execute(
            """
            SELECT DATE_FORMAT(applied_at, '%Y-%m-%d') AS day, COUNT(*) AS total
            FROM applications WHERE student_id = ?
            GROUP BY day ORDER BY day
            """,
            (uid,),
        ).fetchall()
        upcoming = connection.execute(
            'SELECT COUNT(*) AS total FROM interviews WHERE student_id = ? AND scheduled_at >= NOW()',
            (uid,),
        ).fetchone()['total']
        jobs_available = connection.execute('SELECT COUNT(*) AS total FROM jobs').fetchone()['total']

    funnel = ordered_funnel(funnel_rows)
    return jsonify({
        'funnel': funnel,
        'applications_total': sum(item['count'] for item in funnel),
        'timeline': [{'date': row['day'], 'count': row['total']} for row in timeline],
        'upcoming_interviews': upcoming,
        'jobs_available': jobs_available,
    })


@analytics_bp.get('/recruiter/analytics')
@require_auth
def recruiter_analytics():
    if g.current_user['role'] != 'recruiter':
        return jsonify({'error': 'This endpoint is available to recruiters only.'}), 403

    rid = g.current_user['user_id']
    with get_connection() as connection:
        funnel_rows = connection.execute(
            """
            SELECT applications.status AS status, COUNT(*) AS total
            FROM applications
            JOIN jobs ON jobs.id = applications.job_id
            WHERE jobs.recruiter_id = ?
            GROUP BY applications.status
            """,
            (rid,),
        ).fetchall()
        timeline = connection.execute(
            """
            SELECT DATE_FORMAT(applications.applied_at, '%Y-%m-%d') AS day, COUNT(*) AS total
            FROM applications
            JOIN jobs ON jobs.id = applications.job_id
            WHERE jobs.recruiter_id = ?
            GROUP BY day ORDER BY day
            """,
            (rid,),
        ).fetchall()
        per_job = connection.execute(
            """
            SELECT jobs.job_title AS job_title, COUNT(applications.id) AS total
            FROM jobs
            LEFT JOIN applications ON applications.job_id = jobs.id
            WHERE jobs.recruiter_id = ?
            GROUP BY jobs.id
            ORDER BY total DESC, jobs.created_at DESC
            """,
            (rid,),
        ).fetchall()
        jobs_total = connection.execute(
            'SELECT COUNT(*) AS total FROM jobs WHERE recruiter_id = ?', (rid,),
        ).fetchone()['total']
        interviews_total = connection.execute(
            'SELECT COUNT(*) AS total FROM interviews WHERE recruiter_id = ?', (rid,),
        ).fetchone()['total']

    funnel = ordered_funnel(funnel_rows)
    return jsonify({
        'funnel': funnel,
        'applicants_total': sum(item['count'] for item in funnel),
        'timeline': [{'date': row['day'], 'count': row['total']} for row in timeline],
        'per_job': [{'job_title': row['job_title'], 'count': row['total']} for row in per_job],
        'jobs_total': jobs_total,
        'interviews_total': interviews_total,
    })
