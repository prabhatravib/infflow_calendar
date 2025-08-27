"""
Health, CSRF, and test/debug endpoints for calendar API.
"""

from __future__ import annotations

from datetime import datetime
from flask import Blueprint, request, make_response, send_from_directory

from calendar_integration.api._helpers import ok, err, parse_json
from calendar_integration.services.event_generator import EventGenerator
from calendar_integration.utils.logger import get_logger

events_health_bp = Blueprint("events_health", __name__)
logger = get_logger(__name__)

event_generator = EventGenerator()


@events_health_bp.get("/health")
def health_check():
    logger.info("Health check requested")
    return ok({
        "calendar_client_initialized": True,
        "event_generator_initialized": event_generator.initialized,
        "timestamp": datetime.utcnow().isoformat(),
    })


@events_health_bp.get("/csrf-token")
def get_csrf_token():
    """Get CSRF token for calendar operations."""
    try:
        import secrets
        csrf_token = secrets.token_urlsafe(32)
        logger.info("Generated simple CSRF token")
        return ok({"csrf_token": csrf_token})
    except Exception as e:
        logger.error(f"Failed to generate CSRF token: {str(e)}")
        return err("Failed to generate CSRF token", 500)


@events_health_bp.get("/test-static")
def test_static():
    logger.info("Testing static file serving")
    return ok({
        "message": "Static file test endpoint",
        "static_url": "/static/css/calendar.css",
        "favicon_url": "/favicon.ico",
    })


@events_health_bp.get("/test")
def test_endpoint():
    logger.info("Test endpoint requested")
    return ok({
        "message": "Calendar service is working",
        "timestamp": datetime.utcnow().isoformat(),
        "calendar_client_initialized": True,
        "event_generator_initialized": event_generator.initialized,
    })


@events_health_bp.get("/test-sleep-toggles")
def test_sleep_toggles():
    logger.info("Sleep toggles test page requested - removed")
    return ok({"message": "test_sleep_toggles removed"}, 410)


@events_health_bp.get("/debug-sleep-toggles")
def debug_sleep_toggles():
    logger.info("Sleep toggles debug page requested - removed")
    return ok({"message": "debug_sleep_toggles removed"}, 410)


@events_health_bp.get("/test-filtering")
def test_filtering():
    logger.info("Filtering test page requested")
    return send_from_directory('.', 'test_filtering.html')


