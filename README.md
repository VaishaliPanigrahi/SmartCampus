# Smart Campus Recruitment

AI-based student-job matching prototype for a college research project. The project uses React, Flask, MySQL, and NLP similarity models to make student-job recommendations explainable.

## Current Phase

Phase 10 provides:

- Vite + React frontend
- Tailwind CSS styling
- Lucide React icons
- Flask backend
- API health endpoint at `/api/health`
- Frontend development proxy for `/api`
- MySQL schema for students, recruiters, jobs, applications, and matching results
- Dynamic student and recruiter registration
- Student and recruiter login with signed prototype tokens
- Protected `/api/me` endpoint
- Responsive React login page at `/login`
- Protected student profile read and update endpoints
- Student profile form at `/student/profile`
- PDF resume upload and text extraction with PyMuPDF
- ATS-style resume analysis with profile keyword and section checks
- Resume analysis page at `/student/resume`
- Eligibility filtering by CGPA, department, and graduation year
- TF-IDF and cosine similarity matching
- Optional Sentence Transformer semantic matching
- Ranked student recommendations at `/student/recommendations`
- Job detail pages with explainable match signals
- Eligibility-aware job applications
- Student application history at `/student/applications`
- Recruiter dashboard at `/recruiter/dashboard`
- Recruiter job posting at `/recruiter/post-job`
- Eligibility-first candidate ranking
- Database-backed student dashboard at `/student/dashboard`
- MySQL CSV import utility for Google Forms exports
- Client-side role guards for student and recruiter routes
- Research navigation from the landing page

Students, recruiters, jobs, resumes, applications, and matching results are created dynamically through the application or CSV import.

## Requirements

- Node.js 20 or newer
- Python 3.10 or newer
- PowerShell or another terminal

## Run the Frontend

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Run the Backend

Create and activate a virtual environment from the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
python backend\app.py
```

The API runs at `http://127.0.0.1:5000`.

The backend expects MySQL on `127.0.0.1:3306` by default. Configure `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` before starting the backend. The database and tables are created automatically.

Copy `.env.example` to `.env` and replace `your-mysql-password`, or set the variables directly in PowerShell:

```powershell
$env:MYSQL_HOST = '127.0.0.1'
$env:MYSQL_PORT = '3306'
$env:MYSQL_USER = 'root'
$env:MYSQL_PASSWORD = 'your-mysql-password'
$env:MYSQL_DATABASE = 'smart_campus'
```

Install and start MySQL Server locally, or use an existing MySQL server. Verify it is listening before starting Flask:

```powershell
Test-NetConnection 127.0.0.1 -Port 3306
```

The result should show `TcpTestSucceeded : True`.

The optional `SMART_CAMPUS_SECRET` environment variable can replace the development token-signing fallback when needed. No `.env` file is required for local demonstration.

## Authentication API

```text
POST /api/register
POST /api/login
GET  /api/me
GET  /api/student/profile
PUT  /api/student/profile
GET  /api/student/resume
POST /api/student/resume
GET  /api/student/recommendations
GET  /api/jobs
GET  /api/jobs/<id>
POST /api/jobs/<id>/apply
GET  /api/student/applications
POST /api/jobs
GET  /api/recruiter/jobs
GET  /api/jobs/<id>/candidates
POST /api/jobs/<id>/candidates/<student_id>/shortlist
```

The login request accepts `role`, `identifier`, and `password`. Students may use either their email or student ID; recruiters use their email. The returned Bearer token is stored by the frontend and attached to later API requests.

## Initialize the Database

After creating the virtual environment, installing backend dependencies, and starting MySQL, start the backend:

```powershell
\.\.venv\Scripts\python.exe backend\app.py
```

The backend creates the configured MySQL database and tables automatically. Create your own student or recruiter account from `/register`, or import real CSV data with the importer.

Health check:

```text
http://127.0.0.1:5000/api/health
```

Expected response:

```json
{
  "service": "smart-campus-api",
  "status": "ok"
}
```

## Build the Frontend

```powershell
Set-Location frontend
npm run build
```

If npm reports a Windows `ComSpec` error, the machine's `ComSpec` environment variable may point to an invalid path. For the current terminal session only, use:

```powershell
$env:ComSpec = 'C:\Windows\System32\cmd.exe'
npm run build
```

## Research Data Flow

```text
Google Form -> Google Sheet -> CSV export -> cleaning -> MySQL import -> NLP matching
```

The website does not claim to connect directly to Google Forms. Export the Google Sheet as CSV and use the local importer.

## Database Interaction

Application data is read from and written to MySQL through Flask APIs. Registration, login, profiles, resumes, jobs, applications, recommendations, recruiter rankings, and dashboard metrics are not hardcoded in React. There is no seed-data module; create records through the application or import real CSV data.

Recruiters can shortlist an applicant from the candidate ranking page. The action updates the MySQL application status to `Shortlisted`, and the student sees that status in the Applications page.

## CSV Import

Import cleaned student and job CSV files into MySQL:

```powershell
.\.venv\Scripts\python.exe backend\import_data.py path\to\students.csv path\to\jobs.csv
```

