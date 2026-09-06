import mysql.connector

try:
    from .config import MYSQL_CONFIG
except ImportError:
    from config import MYSQL_CONFIG


SCHEMA = """
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(150) NOT NULL,
    cgpa DECIMAL(4,2) NOT NULL,
    graduation_year INT NOT NULL,
    skills TEXT, programming_languages TEXT, projects TEXT, certifications TEXT,
    preferred_role VARCHAR(150), preferred_location VARCHAR(150),
    resume_path VARCHAR(255), resume_text LONGTEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS recruiters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, company VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recruiter_id INT NOT NULL, job_title VARCHAR(200) NOT NULL,
    company VARCHAR(150) NOT NULL, description TEXT NOT NULL,
    required_skills TEXT, minimum_cgpa DECIMAL(4,2) NOT NULL DEFAULT 0,
    department VARCHAR(150) NOT NULL DEFAULT 'All', graduation_year INT NULL,
    location VARCHAR(150) NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_recruiter_job (recruiter_id, job_title, company),
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS applications (
    id INT PRIMARY KEY AUTO_INCREMENT, student_id INT NOT NULL, job_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Applied', applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_application (student_id, job_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS matching_results (
    id INT PRIMARY KEY AUTO_INCREMENT, student_id INT NOT NULL, job_id INT NOT NULL,
    tfidf_score DECIMAL(6,2) NOT NULL, semantic_score DECIMAL(6,2) NOT NULL,
    final_score DECIMAL(6,2) NOT NULL, matched_skills TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_matching_result (student_id, job_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
"""


class DatabaseConnection:
    def __init__(self, connection):
        self.connection = connection

    def execute(self, query, parameters=()):
        cursor = self.connection.cursor(dictionary=True, buffered=True)
        cursor.execute(query.replace('?', '%s'), parameters)
        return cursor

    def executemany(self, query, parameters):
        cursor = self.connection.cursor()
        cursor.executemany(query.replace('?', '%s'), parameters)
        cursor.close()

    def executescript(self, script):
        cursor = self.connection.cursor()
        for statement in script.split(';'):
            if statement.strip():
                cursor.execute(statement)
        cursor.close()

    def commit(self):
        self.connection.commit()

    def close(self):
        self.connection.close()

    def __enter__(self):
        return self

    def __exit__(self, exception_type, exception_value, traceback):
        if exception_type:
            self.connection.rollback()
        self.close()


def create_database() -> None:
    config = {key: value for key, value in MYSQL_CONFIG.items() if key != 'database'}
    connection = mysql.connector.connect(**config)
    try:
        cursor = connection.cursor()
        database_name = MYSQL_CONFIG['database'].replace('`', '')
        cursor.execute(f'CREATE DATABASE IF NOT EXISTS `{database_name}`')
        connection.commit()
        cursor.close()
    finally:
        connection.close()


def get_connection() -> DatabaseConnection:
    return DatabaseConnection(mysql.connector.connect(**MYSQL_CONFIG))


def initialize_database() -> None:
    create_database()
    with get_connection() as connection:
        connection.executescript(SCHEMA)
        connection.commit()


def table_counts() -> dict[str, int]:
    table_names = ('students', 'recruiters', 'jobs', 'applications', 'matching_results')
    with get_connection() as connection:
        return {
            table_name: connection.execute(f'SELECT COUNT(*) AS total FROM {table_name}').fetchone()['total']
            for table_name in table_names
        }
