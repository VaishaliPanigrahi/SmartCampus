# 🎓 Smart Campus Recruitment

AI-based student–job matching platform built as a college research project.

The system helps students find suitable jobs and allows recruiters to discover eligible candidates using **NLP-based matching and explainable recommendations**.

## 🚀 Features

* Student & recruiter registration/login
* Student profile management
* PDF resume upload & text extraction
* ATS-style resume analysis
* Eligibility filtering by CGPA, department & graduation year
* TF-IDF + Cosine Similarity job matching
* Optional Sentence Transformer semantic matching
* Explainable job recommendations
* Job applications & application tracking
* Recruiter dashboard & candidate ranking
* Candidate shortlisting
* CSV import for Google Forms/Sheets data

## 🛠️ Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Lucide React
**Backend:** Flask, Python
**Database:** MySQL
**AI/NLP:** TF-IDF, Cosine Similarity, Sentence Transformers
**Data Processing:** Pandas, NumPy, PyMuPDF

## 📂 Data Flow

```text
Google Form → Google Sheet → CSV → MySQL → NLP Matching → Recommendations
```

## ⚙️ Setup

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
python backend\app.py
```

Backend: `http://127.0.0.1:5000`

### MySQL

Configure your database credentials using `.env` or environment variables:

```text
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=smart_campus
```

The database and tables are created automatically.

## 🔬 Project Goal

To explore how **NLP and eligibility-based filtering can improve student–job matching** while keeping recommendations understandable and explainable.

**Status:** Active Research Prototype
