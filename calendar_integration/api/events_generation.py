"""
AI-assisted event generation endpoints.
"""

from __future__ import annotations

from flask import Blueprint, request, make_response

from calendar_integration.api._helpers import ok, err, parse_json
from calendar_integration.services.event_generator import EventGenerator
from calendar_integration.services.calendar_client import CalendarClient
from calendar_integration.utils.logger import get_logger

events_generation_bp = Blueprint("events_generation", __name__)
logger = get_logger(__name__)

event_generator = EventGenerator()


@events_generation_bp.post("/generate-events")
def generate_events():
    """Generate events using AI and persist them."""
    try:
        from flask_wtf.csrf import validate_csrf
        csrf_token = request.headers.get('X-CSRFToken')
        if csrf_token:
            validate_csrf(csrf_token)
        else:
            logger.warning("No CSRF token provided in request")
    except Exception as e:
        logger.warning(f"CSRF token validation failed: {e}")

    user_data = parse_json(request)
    if not user_data:
        logger.warning("Missing request body in generate_events")
        return err("Request body is required", 400)

    logger.info("Generating events using AI")
    try:
        generated_events = event_generator.generate(user_data)
        if isinstance(generated_events, dict) and "error" in generated_events:
            logger.error(f"Error generating events: {generated_events['error']}")
            return err(generated_events["error"], 400)
        if not isinstance(generated_events, list):
            logger.error("Invalid response from event generator")
            return err("Invalid response from event generator", 500)
        if not generated_events:
            logger.warning("No events were generated")
            return err("No events were generated", 400)

        created_events = CalendarClient().batch_create_events(generated_events)
        logger.info("Successfully generated and created events")
        resp, status = ok(created_events, 201)
        return make_response(resp, status)
    except Exception as e:
        logger.error(f"Unexpected error in generate_events: {str(e)}")
        return err("Internal server error", 500)


