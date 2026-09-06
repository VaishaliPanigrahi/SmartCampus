from pathlib import Path

import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score

try:
    from backend.database import get_connection
    from backend.ml.eligibility import check_eligibility
    from backend.ml.matching import calculate_match
except ImportError:
    from database import get_connection
    from ml.eligibility import check_eligibility
    from ml.matching import calculate_match


LABELS_PATH = Path(__file__).resolve().parent / 'labelled_matches.csv'


def evaluate_labelled_data(labels_path: Path = LABELS_PATH) -> dict:
    if not labels_path.exists():
        return {
            'available': False,
            'message': 'Evaluation requires manually labelled student-job suitability data.',
        }

    labels = pd.read_csv(labels_path)
    required_columns = {'student_id', 'job_id', 'label'}
    if not required_columns.issubset(labels.columns):
        return {'available': False, 'message': 'Labels CSV must contain student_id, job_id, and label columns.'}

    predictions = []
    actual = []
    tfidf_scores = []
    semantic_scores = []
    with get_connection() as connection:
        for _, label in labels.iterrows():
            student = connection.execute('SELECT * FROM students WHERE id = ?', (int(label['student_id']),)).fetchone()
            job = connection.execute('SELECT * FROM jobs WHERE id = ?', (int(label['job_id']),)).fetchone()
            if student is None or job is None:
                continue
            eligible, _ = check_eligibility(student, job)
            match = calculate_match(student, job)
            predictions.append(int(eligible and match['final_score'] >= 50))
            actual.append(int(label['label']))
            tfidf_scores.append(match['tfidf_score'])
            semantic_scores.append(match['semantic_score'])

    if not actual:
        return {'available': False, 'message': 'No valid labelled student-job pairs were found.'}
    return {
        'available': True,
        'sample_count': len(actual),
        'average_tfidf_similarity': round(sum(tfidf_scores) / len(tfidf_scores), 2),
        'average_semantic_similarity': round(sum(semantic_scores) / len(semantic_scores), 2),
        'precision': round(precision_score(actual, predictions, zero_division=0), 4),
        'recall': round(recall_score(actual, predictions, zero_division=0), 4),
        'f1_score': round(f1_score(actual, predictions, zero_division=0), 4),
        'threshold_percent': 50,
    }


if __name__ == '__main__':
    print(evaluate_labelled_data())
