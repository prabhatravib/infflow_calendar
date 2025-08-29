"""
CRUD endpoints for calendar events.
"""

from __future__ import annotations

from flask import Blueprint, request, make_response

from calendar_integration.api._helpers import ok, err, parse_json
from calendar_integration.services.calendar_client import CalendarClient
from calendar_integration.utils.logger import get_logger

events_crud_bp = Blueprint("events_crud", __name__)
logger = get_logger(__name__)

client = CalendarClient()


@events_crud_bp.get("/events/<string:event_id>")
def get_event(event_id: str):
    """Get a specific event by ID (requires user_id query param)."""
    user_id = request.args.get("user_id")
    logger.info(f"Fetching event {event_id} for user: {user_id}")
    if not isinstance(user_id, str) or not user_id:
        logger.error("user_id is required and must be a non-empty string")
        resp, status = err("user_id is required and must be a non-empty string", 400)
        return make_response(resp, status)
    try:
        events = client.fetch_events(user_id)
        if isinstance(events, dict) and "error" in events:
            logger.error(f"Error fetching events: {events.get('error')}")
            resp, status = err(events.get("error", "Unknown error"), 500)
            return make_response(resp, status)
        if not isinstance(events, list):
            logger.error("Invalid events data format")
            resp, status = err("Invalid events data format", 500)
            return make_response(resp, status)

        for event in events:
            if isinstance(event, dict):
                event_id_from_data = event.get('id') or event.get('event_id')
                if str(event_id_from_data) == str(event_id):
                    logger.info(f"Successfully found event {event_id}")
                    resp, status = ok(event)
                    return make_response(resp, status)

        logger.warning(f"Event {event_id} not found for user: {user_id}")
        resp, status = err("Event not found", 404)
        return make_response(resp, status)
    except Exception as e:
        logger.error(f"Unexpected error in get_event: {str(e)}")
        resp, status = err("Internal server error", 500)
        return make_response(resp, status)


@events_crud_bp.post("/events")
def create_event():
    """Create a new event."""
    logger.info("=== CREATE EVENT REQUEST START ===")

    # Optional CSRF check
    try:
        from flask_wtf.csrf import validate_csrf
        csrf_token = request.headers.get('X-CSRFToken')
        if csrf_token:
            validate_csrf(csrf_token)
            logger.info("CSRF token validation passed")
        else:
            logger.warning("No CSRF token provided in request")
    except Exception as e:
        logger.warning(f"CSRF token validation failed: {e}")

    payload = parse_json(request)
    logger.info(f"Request body: {payload}")

    user_id = payload.get('user_id')
    logger.info(f"User ID from request: {user_id}")
    if not user_id or not user_id.strip():
        logger.warning("Invalid or missing user_id in create_event request body")
        return err("user_id is required in request body and must not be empty", 400)

    logger.info(f"Creating new event: {payload.get('title', 'Untitled')} for user: {user_id}")

    ev_type = payload.get("eventType", "other").strip().lower()
    if ev_type not in {"work", "fun", "other"}:
        ev_type = "other"
    payload["eventType"] = ev_type
    logger.info(f"Normalized eventType to: {ev_type}")

    if 'eventType' not in payload or not payload['eventType']:
        payload['eventType'] = 'other'

    try:
        from calendar_integration.utils.validators import validate_event_data
        validate_event_data(payload, is_creation=True)

        from calendar_integration.utils.datetime import parse_datetime
        if isinstance(payload.get('start_time'), str):
            payload['start_time'] = parse_datetime(payload['start_time'])
            logger.info(f"Parsed start_time: {payload['start_time']}")
        if isinstance(payload.get('end_time'), str):
            payload['end_time'] = parse_datetime(payload['end_time'])
            logger.info(f"Parsed end_time: {payload['end_time']}")

        event = CalendarClient().create_event(payload)
        if isinstance(event, dict) and "error" in event:
            logger.error(f"Error creating event: {event['error']}")
            return err(event["error"], 400)

        if isinstance(event, dict):
            if 'id' not in event and 'event_id' in event:
                event['id'] = event['event_id']
            elif 'event_id' not in event and 'id' in event:
                event['event_id'] = event['id']

        logger.info(f"Successfully created event: {event.get('event_id')}")
        logger.info("=== CREATE EVENT REQUEST END ===")
        resp, status = ok(event, 201)
        return make_response(resp, status)
    except ValueError as e:
        logger.error(f"Validation error creating event: {str(e)}")
        return err(f"Validation error: {str(e)}", 400)
    except Exception as e:
        logger.error(f"Unexpected error in create_event: {str(e)}")
        return err("Internal server error", 500)


@events_crud_bp.put("/events/<string:event_id>")
def update_event(event_id: str):
    """Update an existing event."""
    try:
        from flask_wtf.csrf import validate_csrf
        csrf_token = request.headers.get('X-CSRFToken')
        if csrf_token:
            validate_csrf(csrf_token)
        else:
            logger.warning("No CSRF token provided in request")
    except Exception as e:
        logger.warning(f"CSRF token validation failed: {e}")

    payload = parse_json(request)
    user_id = request.args.get('user_id')
    if not user_id or not user_id.strip():
        logger.warning("Invalid or missing user_id in update_event request")
        return err("user_id is required and must not be empty", 400)
    if not event_id:
        logger.warning("Missing event_id in update_event request")
        return err("event_id is required", 400)

    logger.info(f"Updating event {event_id} for user: {user_id}")
    try:
        from calendar_integration.utils.validators import validate_event_data
        validate_event_data(payload)

        from calendar_integration.utils.datetime import parse_datetime
        if isinstance(payload.get('start_time'), str):
            payload['start_time'] = parse_datetime(payload['start_time'])
        if isinstance(payload.get('end_time'), str):
            payload['end_time'] = parse_datetime(payload['end_time'])

        updated_event = CalendarClient().update_event(event_id, payload)
        if isinstance(updated_event, dict) and "error" in updated_event:
            logger.error(f"Error updating event: {updated_event['error']}")
            return err(updated_event["error"], 404)

        logger.info(f"Successfully updated event: {event_id}")
        resp, status = ok(updated_event)
        return make_response(resp, status)
    except ValueError as e:
        logger.error(f"Validation error updating event: {str(e)}")
        return err(f"Validation error: {str(e)}", 400)
    except Exception as e:
        logger.error(f"Unexpected error in update_event: {str(e)}")
        return err("Internal server error", 500)


@events_crud_bp.delete("/events/<string:event_id>")
def delete_event(event_id: str):
    """Delete an event."""
    try:
        from flask_wtf.csrf import validate_csrf
        csrf_token = request.headers.get('X-CSRFToken')
        if csrf_token:
            validate_csrf(csrf_token)
        else:
            logger.warning("No CSRF token provided in request")
    except Exception as e:
        logger.warning(f"CSRF token validation failed: {e}")

    user_id = request.args.get('user_id')
    if not user_id or not user_id.strip():
        logger.warning("Invalid or missing user_id in delete_event request")
        return err("user_id is required and must not be empty", 400)
    if not event_id:
        logger.warning("Missing event_id in delete_event request")
        return err("event_id is required", 400)

    logger.info(f"Deleting event {event_id} for user: {user_id}")
    try:
        result = CalendarClient().delete_event(event_id)
        if isinstance(result, dict) and "error" in result:
            logger.error(f"Error deleting event: {result['error']}")
            return err(result["error"], 404)
        logger.info(f"Successfully deleted event: {event_id}")
        resp, status = ok(result)
        return make_response(resp, status)
    except Exception as e:
        logger.error(f"Unexpected error in delete_event: {str(e)}")
        return err("Internal server error", 500)


