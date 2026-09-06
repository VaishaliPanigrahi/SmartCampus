from pathlib import Path
import sys
import secrets

import pandas as pd
from werkzeug.security import generate_password_hash

try:
    from .database import get_connection, initialize_database
except ImportError:
    from database import get_connection, initialize_database


ROOT_DIR = Path(__file__).resolve().parent.parent


def value(row, *names, default=''):
    for name in names:
        if name in row.index and pd.notna(row[name]):
            return str(row[name]).strip()
    return default


def import_students(csv_path: Path) -> int:
    frame = pd.read_csv(csv_path).fillna('')
    imported = 0
    with get_connection() as connection:
        for _, row in frame.iterrows():
            student_id = value(row, 'student_id', 'Student ID', 'StudentID')
            email = value(row, 'email', 'Email')
            if not student_id or not email:
                continue
            source_password = value(row, 'password', 'Password') or secrets.token_urlsafe(24)
            connection.execute(
                """
                INSERT INTO students (
                    student_id, name, email, password, department, cgpa,
                    graduation_year, skills, programming_languages, projects,
                    certifications, preferred_role, preferred_location
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name), email = VALUES(email), department = VALUES(department),
                    cgpa = VALUES(cgpa), graduation_year = VALUES(graduation_year), skills = VALUES(skills),
                    programming_languages = VALUES(programming_languages), projects = VALUES(projects),
                    certifications = VALUES(certifications), preferred_role = VALUES(preferred_role),
                    preferred_location = VALUES(preferred_location)
                """,
                (student_id, value(row, 'name', 'Name'), email, generate_password_hash(source_password),
                 value(row, 'department', 'Department'), float(value(row, 'cgpa', 'CGPA', default=0) or 0),
                 int(float(value(row, 'graduation_year', 'Graduation Year', default=0) or 0)),
                 value(row, 'skills', 'Skills'), value(row, 'programming_languages', 'Programming Languages'),
                 value(row, 'projects', 'Projects'), value(row, 'certifications', 'Certifications'),
                 value(row, 'preferred_role', 'Preferred Job Role'), value(row, 'preferred_location', 'Preferred Location')),
            )
            imported += 1
        connection.commit()
    return imported


def import_jobs(csv_path: Path) -> int:
    frame = pd.read_csv(csv_path).fillna('')
    imported = 0
    with get_connection() as connection:
        default_recruiter = connection.execute('SELECT id FROM recruiters ORDER BY id LIMIT 1').fetchone()
        if default_recruiter is None:
            raise ValueError('Register at least one recruiter before importing jobs.')
        for _, row in frame.iterrows():
            title = value(row, 'job_title', 'Job Title', 'title')
            company = value(row, 'company', 'Company')
            if not title or not company:
                continue
            recruiter_id = int(float(value(row, 'recruiter_id', 'Recruiter ID', default=default_recruiter['id'])))
            connection.execute(
                """
                INSERT INTO jobs (
                    recruiter_id, job_title, company, description, required_skills,
                    minimum_cgpa, department, graduation_year, location
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    description = VALUES(description), required_skills = VALUES(required_skills),
                    minimum_cgpa = VALUES(minimum_cgpa), department = VALUES(department),
                    graduation_year = VALUES(graduation_year), location = VALUES(location)
                """,
                (recruiter_id, title, company, value(row, 'description', 'Description'),
                 value(row, 'required_skills', 'Required Skills', 'skills'),
                 float(value(row, 'minimum_cgpa', 'Minimum CGPA', default=0) or 0),
                 value(row, 'department', 'Department', default='All') or 'All',
                 int(float(value(row, 'graduation_year', 'Graduation Year', default=0) or 0)) or None,
                 value(row, 'location', 'Location')),
            )
            imported += 1
        connection.commit()
    return imported


def main() -> None:
    students_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT_DIR / 'dataset' / 'students.csv'
    jobs_path = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT_DIR / 'dataset' / 'jobs.csv'
    initialize_database()
    counts = {'students': import_students(students_path), 'jobs': import_jobs(jobs_path)}
    print(f"Imported {counts['students']} students and {counts['jobs']} jobs.")


if __name__ == '__main__':
    main()
