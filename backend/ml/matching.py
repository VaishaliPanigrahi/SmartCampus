import re

try:
    from .sentence_model import calculate_semantic_similarity
    from .tfidf_model import calculate_tfidf_similarity
except ImportError:
    from ml.sentence_model import calculate_semantic_similarity
    from ml.tfidf_model import calculate_tfidf_similarity

TFIDF_WEIGHT = 0.30
SEMANTIC_WEIGHT = 0.70


def student_text(student) -> str:
    values = [
        student['skills'],
        student['programming_languages'],
        student['projects'],
        student['certifications'],
        student['preferred_role'],
        student['preferred_location'],
        student['resume_text'],
    ]
    return ' '.join(str(value or '') for value in values)


def job_text(job) -> str:
    return ' '.join(str(job[key] or '') for key in ('job_title', 'description', 'required_skills', 'location'))


def normalized_terms(value: str) -> set[str]:
    return {term for term in re.findall(r'[a-z0-9+#.]+', value.lower()) if len(term) > 1}


def matched_skills(student, job) -> list[str]:
    student_terms = normalized_terms(student_text(student))
    return [skill.strip() for skill in (job['required_skills'] or '').split(',') if normalized_terms(skill) <= student_terms]


def calculate_match(student, job) -> dict:
    tfidf_score = calculate_tfidf_similarity(student_text(student), job_text(job))
    semantic_score, semantic_model = calculate_semantic_similarity(student_text(student), job_text(job))
    final_score = (SEMANTIC_WEIGHT * semantic_score) + (TFIDF_WEIGHT * tfidf_score)
    return {
        'tfidf_score': round(tfidf_score * 100, 2),
        'semantic_score': round(semantic_score * 100, 2),
        'final_score': round(final_score * 100, 2),
        'matched_skills': matched_skills(student, job),
        'semantic_model': semantic_model,
        'weights': {'tfidf': TFIDF_WEIGHT, 'semantic': SEMANTIC_WEIGHT},
    }
