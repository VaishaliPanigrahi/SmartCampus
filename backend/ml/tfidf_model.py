from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def calculate_tfidf_similarity(student_text: str, job_text: str) -> float:
    if not student_text.strip() or not job_text.strip():
        return 0.0

    vectorizer = TfidfVectorizer(stop_words='english')
    vectors = vectorizer.fit_transform([student_text, job_text])
    return float(cosine_similarity(vectors[0:1], vectors[1:2])[0][0])
