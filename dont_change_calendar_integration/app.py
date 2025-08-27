"""
Calendar Integration Flask App
This module creates and exports the Flask app instance for the router to import.
"""





# Import the Flask app from main.py
from main import _flask_app as app

if __name__ == "__main__":
    # For local development
    import os
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True') == 'True'
    
    print(f"Starting calendar integration service on {host}:{port}")
    app.run(host=host, port=port, debug=debug)