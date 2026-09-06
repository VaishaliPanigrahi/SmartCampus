import sys
from pathlib import Path

from flask import Blueprint, jsonify

try:
    from ..research.evaluation import evaluate_labelled_data
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from research.evaluation import evaluate_labelled_data


research_bp = Blueprint('research', __name__, url_prefix='/api/research')


@research_bp.get('/evaluation')
def evaluation():
    return jsonify(evaluate_labelled_data())
