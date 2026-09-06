def check_eligibility(student, job) -> tuple[bool, list[str]]:
    reasons = []
    if float(student['cgpa']) < float(job['minimum_cgpa']):
        reasons.append(f"CGPA {student['cgpa']} is below the {job['minimum_cgpa']} minimum")

    eligible_department = (job['department'] or 'All').strip().lower()
    if eligible_department not in {'all', student['department'].strip().lower()}:
        reasons.append(f"Department must be {job['department']}")

    if job['graduation_year'] and int(student['graduation_year']) != int(job['graduation_year']):
        reasons.append(f"Graduation year must be {job['graduation_year']}")

    return not reasons, reasons
