from flask import Blueprint, g, jsonify

try:
    from ..database import get_connection
    from .auth_routes import require_auth
except ImportError:
    from database import get_connection
    from routes.auth_routes import require_auth


notification_bp = Blueprint('notifications', __name__, url_prefix='/api')


def create_notification(connection, role, user_id, title, message, link=None):
    """Insert a notification row using an existing open connection (so callers can batch it with their own writes)."""
    connection.execute(
        'INSERT INTO notifications (role, user_id, title, message, link) VALUES (?, ?, ?, ?, ?)',
        (role, user_id, title, message, link),
    )


@notification_bp.get('/notifications')
@require_auth
def list_notifications():
    with get_connection() as connection:
        notifications = connection.execute(
            """
            SELECT id, title, message, link, is_read, created_at
            FROM notifications
            WHERE role = ? AND user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 50
            """,
            (g.current_user['role'], g.current_user['user_id']),
        ).fetchall()
        unread = connection.execute(
            'SELECT COUNT(*) AS total FROM notifications WHERE role = ? AND user_id = ? AND is_read = 0',
            (g.current_user['role'], g.current_user['user_id']),
        ).fetchone()['total']

    items = []
    for row in notifications:
        item = dict(row)
        item['is_read'] = bool(item['is_read'])
        if item.get('created_at') is not None:
            item['created_at'] = item['created_at'].isoformat()
        items.append(item)
    return jsonify({'notifications': items, 'unread_count': unread})


@notification_bp.post('/notifications/read-all')
@require_auth
def mark_all_read():
    with get_connection() as connection:
        connection.execute(
            'UPDATE notifications SET is_read = 1 WHERE role = ? AND user_id = ? AND is_read = 0',
            (g.current_user['role'], g.current_user['user_id']),
        )
        connection.commit()
    return jsonify({'message': 'All notifications marked as read.'})


@notification_bp.post('/notifications/<int:notification_id>/read')
@require_auth
def mark_one_read(notification_id):
    with get_connection() as connection:
        connection.execute(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND role = ? AND user_id = ?',
            (notification_id, g.current_user['role'], g.current_user['user_id']),
        )
        connection.commit()
    return jsonify({'message': 'Notification marked as read.'})
