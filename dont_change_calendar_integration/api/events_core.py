"""
Core calendar pages and assets (keeps blueprint name 'events' for compatibility).
"""

from __future__ import annotations

import os
from flask import Blueprint, render_template, send_from_directory

from calendar_integration.utils.logger import get_logger

events_bp = Blueprint("events", __name__)
logger = get_logger(__name__)


@events_bp.get("/")
def index():
    """Main calendar page."""
    logger.info("Calendar index page requested")
    return render_template('calendar.html')


@events_bp.get("/favicon.ico")
def favicon():
    """Serve favicon."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    static_folder = os.path.join(os.path.dirname(current_dir), 'static')
    return send_from_directory(static_folder, 'favicon.ico')


