from functools import lru_cache


@lru_cache(maxsize=1)
def load_sentence_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer('all-MiniLM-L6-v2')


def calculate_semantic_similarity(student_text: str, job_text: str) -> tuple[float, str]:
    if not student_text.strip() or not job_text.strip():
        return 0.0, 'empty-text'

    try:
        model = load_sentence_model()
        embeddings = model.encode([student_text, job_text], normalize_embeddings=True)
        score = float(embeddings[0] @ embeddings[1])
        return max(0.0, min(1.0, score)), 'sentence-transformer'
    except (ImportError, OSError, RuntimeError):
        # Keeps local demos usable when the transformer package/model is unavailable.
        try:
            from .tfidf_model import calculate_tfidf_similarity
        except ImportError:
            from ml.tfidf_model import calculate_tfidf_similarity

        return calculate_tfidf_similarity(student_text, job_text), 'tfidf-fallback'
