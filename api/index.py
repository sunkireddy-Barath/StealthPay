import sys
import os

# Make the backend package importable from this Vercel serverless function.
# At runtime: __file__ = /var/task/api/index.py  →  ../backend = /var/task/backend/
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app import create_app

# Vercel's Python runtime detects `app` as the WSGI entry point (Flask).
app = create_app()
