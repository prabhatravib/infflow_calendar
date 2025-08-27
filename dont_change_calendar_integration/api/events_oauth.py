"""
OAuth helpers (session user) and Google Calendar merge in list endpoint.
"""

from __future__ import annotations

import os
from datetime import datetime
from flask import Blueprint, request, make_response

from calendar_integration.api._helpers import ok, err, parse_json, require_args
from calendar_integration.services.calendar_client import CalendarClient
from calendar_integration.utils.logger import get_logger

events_oauth_bp = Blueprint("events_oauth", __name__)
logger = get_logger(__name__)

client = CalendarClient()


@events_oauth_bp.post("/set-session-user")
def set_session_user():
    """Set user_id in session for OAuth flow."""
    from flask import session
    data = parse_json(request)
    user_id = data.get('user_id')
    if user_id:
        session['user_id'] = user_id
        session.modified = True
        logger.info(f"Set session user_id: {user_id}")
        return ok({"status": "success"})
    return err("No user_id provided", 400)


@events_oauth_bp.get("/events")
@require_args("user_id")
def list_events():
    """Get all events for a user (optionally merging Google Calendar)."""
    user_id = request.args.get("user_id")
    logger.info(f"Fetching events for user: {user_id}")

    token_path = os.path.join(os.path.dirname(__file__), '..', 'google_tokens.json')
    token_data = {}
    actual_token_user = None

    try:
        with open(token_path, 'r') as f:
            import json
            token_data = json.load(f)
            logger.info(f"Available tokens for users: {list(token_data.keys())}")
            logger.info(f"Requested user_id: '{user_id}'")
            if user_id in token_data:
                actual_token_user = user_id
            elif 'demo_user' in token_data:
                actual_token_user = 'demo_user'
            elif token_data:
                actual_token_user = list(token_data.keys())[0]
            logger.info(f"Will use token for user: {actual_token_user}")
    except Exception as e:
        logger.warning(f"Could not read token file: {e}")

    if actual_token_user and token_data.get(actual_token_user):
        logger.info(
            f"Found Google token, using GoogleCalendarClient with token from user: {actual_token_user}"
        )
        try:
            from calendar_integration.services.google_calendar_client import GoogleCalendarClient
            google_client = GoogleCalendarClient()
            events = google_client.fetch_events(actual_token_user)
            logger.info(f"Fetched {len(events)} events from Google Calendar")

            formatted_events = []
            for event in events:
                formatted_events.append({
                    'event_id': event.get('id'),
                    'title': event.get('summary', 'Untitled'),
                    'description': event.get('description', ''),
                    'location': event.get('location', ''),
                    'start_time': event.get('start', {}).get('dateTime', event.get('start', {}).get('date')),
                    'end_time': event.get('end', {}).get('dateTime', event.get('end', {}).get('date')),
                    'all_day': 'date' in event.get('start', {}),
                    'source': 'google',
                    'user_id': user_id,
                    'eventType': 'other',
                })

            local_events = client.fetch_events(user_id or "default_user")
            if isinstance(local_events, list):
                for ev in local_events:
                    ev['source'] = 'local'
                formatted_events.extend(local_events)

            logger.info(
                f"Successfully fetched {len(formatted_events)} total events (Google + local) for user: {user_id}"
            )
            resp, status = ok(formatted_events)
            return make_response(resp, status)
        except Exception as e:
            logger.error(f"Error fetching Google Calendar events: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            logger.info("Falling back to local calendar only")

    # Local only
    if not isinstance(user_id, str) or not user_id:
        resp, status = err("user_id is required and must be a non-empty string", 400)
        return make_response(resp, status)

    events = client.fetch_events(user_id)
    if isinstance(events, dict) and "error" in events:
        logger.error(f"Error fetching events: {events.get('error')}")
        resp, status = err(events.get("error", "Unknown error"), 500)
        return make_response(resp, status)
    if not isinstance(events, list):
        logger.error("Invalid events data format")
        resp, status = err("Invalid events data format", 500)
        return make_response(resp, status)

    for ev in events:
        ev['source'] = 'local'

    logger.info(f"Successfully fetched {len(events)} local events for user: {user_id}")
    resp, status = ok(events)
    return make_response(resp, status)


