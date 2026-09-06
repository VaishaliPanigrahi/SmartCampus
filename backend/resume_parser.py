from pathlib import Path
import re


def extract_text_from_pdf(file_path: Path) -> str:
    import pymupdf

    document = pymupdf.open(file_path)
    try:
        pages = [page.get_text('text') for page in document]
    finally:
        document.close()

    return '\n'.join(pages).strip()


def analyze_resume(text: str, student) -> dict:
    normalized_text = text.lower()
    ai_ml_terms = ('python', 'sql', 'machine learning', 'deep learning', 'nlp', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'data analysis', 'statistics')
    ai_ml_signals = [term for term in ai_ml_terms if term in normalized_text]
    sections = {
        'contact': bool(re.search(r'@[a-z0-9.-]+\.[a-z]{2,}', normalized_text) and re.search(r'\+?\d[\d ()-]{7,}', normalized_text)),
        'education': bool(re.search(r'education|university|college|degree|b\.sc|bachelor|master', normalized_text)),
        'skills': bool(re.search(r'skills|technical skills|technologies', normalized_text)),
        'projects': bool(re.search(r'projects|portfolio', normalized_text)),
        'experience': bool(re.search(r'experience|internship|employment|work history', normalized_text)),
    }
    profile_terms = set()
    for field in ('skills', 'programming_languages', 'projects', 'certifications', 'preferred_role'):
        profile_terms.update(re.findall(r'[a-z0-9+#.]+', str(student[field] or '').lower()))
    matched_terms = sorted(term for term in profile_terms if len(term) > 1 and term in normalized_text)
    missing_sections = [name.title() for name, present in sections.items() if not present]
    section_score = sum(sections.values()) / len(sections) * 100
    keyword_score = (len(matched_terms) / len(profile_terms) * 100) if profile_terms else 0
    length_score = 100 if 300 <= len(text) <= 6000 else (50 if text else 0)
    ats_score = round((section_score * 0.4) + (keyword_score * 0.4) + (length_score * 0.2))
    suggestions = [f'Consider adding a {section.lower()} section.' for section in missing_sections]
    if len(text.split()) < 100:
        suggestions.append('Add more detail about your projects, impact, and technical experience.')
    if not suggestions:
        suggestions.append('Your resume contains the main sections and profile keywords checked by this prototype.')
    return {
        'ats_score': ats_score,
        'score_label': 'Prototype heuristic, not a commercial ATS score',
        'word_count': len(text.split()),
        'character_count': len(text),
        'sections': sections,
        'matched_profile_keywords': matched_terms,
        'ai_ml_signals': ai_ml_signals,
        'profile_alignment': round(keyword_score),
        'nlp_ready': len(text.split()) >= 50,
        'suggestions': suggestions,
    }
