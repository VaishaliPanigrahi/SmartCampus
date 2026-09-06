# Dataset workflow

1. Collect student responses in Google Forms.
2. Export the linked Google Sheet as CSV.
3. Clean the CSV columns if needed.
4. Run `python backend\import_data.py path\to\students.csv path\to\jobs.csv`.

Student CSV columns accepted by the importer include `student_id`, `name`, `email`, `department`, `cgpa`, `graduation_year`, `skills`, `programming_languages`, `projects`, `certifications`, `preferred_role`, and `preferred_location`. Common title-case Google Form headers are also accepted.
