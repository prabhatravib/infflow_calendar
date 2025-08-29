import { Hono } from 'hono';
import { DatabaseService } from '../services/database-service';
import { createErrorResponse, createSuccessResponse } from '../middleware/error-handler';
import { CALENDAR_ID } from '../utils/constants';
import { CreateEventRequest, UpdateEventRequest } from '../types';
import { validateDateRange } from '../utils/helpers';

export const eventsRouter = new Hono();

// GET /api/events
eventsRouter.get('/api/events', async (c) => {
  try {
    const calendarId = c.req.query('calendarId') ?? CALENDAR_ID;
    const from = c.req.query('from');
    const to = c.req.query('to');
    
    if (!from || !to) {
      return createErrorResponse(c, 'Missing required parameters: from, to', 400);
    }

    // Parse dates safely using milliseconds to avoid timezone issues
    if (!validateDateRange(from, to)) {
      return createErrorResponse(c, 'Invalid date format', 400);
    }

    const dbService = new DatabaseService(c.env.DB);
    const events = await dbService.getEvents(calendarId, from, to);

    return createSuccessResponse(c, { events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return createErrorResponse(c, 'Failed to fetch events');
  }
});

// GET /api/events/:id
eventsRouter.get('/api/events/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return createErrorResponse(c, 'Event ID is required', 400);
    }

    const dbService = new DatabaseService(c.env.DB);
    const event = await dbService.getEventById(id);
    
    if (!event) {
      return createErrorResponse(c, 'Event not found', 404);
    }

    return createSuccessResponse(c, { event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return createErrorResponse(c, 'Failed to fetch event');
  }
});

// POST /api/events
eventsRouter.post('/api/events', async (c) => {
  try {
    const body: CreateEventRequest = await c.req.json();
    
    if (!body.calendar_id || !body.title || !body.start || !body.end || !body.tz) {
      return createErrorResponse(c, 'Missing required fields', 400);
    }

    const dbService = new DatabaseService(c.env.DB);
    const event = await dbService.createEvent(body);

    return createSuccessResponse(c, { event }, 201);
  } catch (error) {
    console.error('Error creating event:', error);
    return createErrorResponse(c, 'Failed to create event');
  }
});

// PATCH /api/events/:id
eventsRouter.patch('/api/events/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body: UpdateEventRequest = await c.req.json();
    
    if (!id) {
      return createErrorResponse(c, 'Event ID is required', 400);
    }

    const dbService = new DatabaseService(c.env.DB);
    const event = await dbService.updateEvent(id, body);
    
    if (!event) {
      return createErrorResponse(c, 'Event not found', 404);
    }

    return createSuccessResponse(c, { event });
  } catch (error) {
    console.error('Error updating event:', error);
    return createErrorResponse(c, 'Failed to update event');
  }
});

// DELETE /api/events/:id
eventsRouter.delete('/api/events/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return createErrorResponse(c, 'Event ID is required', 400);
    }

    const dbService = new DatabaseService(c.env.DB);
    const deleted = await dbService.deleteEvent(id);
    
    if (!deleted) {
      return createErrorResponse(c, 'Event not found', 404);
    }

    return createSuccessResponse(c, { message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return createErrorResponse(c, 'Failed to delete event');
  }
});

// DELETE /api/events - Clear all events for a calendar
eventsRouter.delete('/api/events', async (c) => {
  try {
    const calendarId = c.req.query('calendarId') ?? CALENDAR_ID;
    
    const dbService = new DatabaseService(c.env.DB);
    await dbService.clearAllEvents(calendarId);

    return createSuccessResponse(c, { message: 'All events cleared successfully' });
  } catch (error) {
    console.error('Error clearing events:', error);
    return createErrorResponse(c, 'Failed to clear events');
  }
});
