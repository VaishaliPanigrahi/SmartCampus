import os

from flask import Flask, jsonify
from flask_cors import CORS

try:
    from .database import initialize_database
    from .routes.auth_routes import auth_bp
    from .routes.student_routes import student_bp
    from .routes.job_routes import job_bp
except ImportError:
    from database import initialize_database
    from routes.auth_routes import auth_bp
    from routes.student_routes import student_bp
    from routes.job_routes import job_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SMART_CAMPUS_SECRET', 'development-only-secret')
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024
    CORS(app)
    initialize_database()
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(job_bp)

    @app.get('/api/health')
    def health_check():
        return jsonify({'status': 'ok', 'service': 'smart-campus-api'})

    return app


app = create_app()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
