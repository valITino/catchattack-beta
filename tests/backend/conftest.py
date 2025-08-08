import sys
from pathlib import Path

# Ensure backend package is on sys.path for tests
backend_path = Path(__file__).resolve().parents[2] / 'backend'
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))
