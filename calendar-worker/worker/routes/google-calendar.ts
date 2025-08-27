import { Hono } from 'hono';
import { GoogleCalendarService } from '../services/google-calendar-service';
import { GoogleOAuthService } from '../services/google-oauth-service';
import { DatabaseService } from '../services/database-service';
import { createErrorResponse, createSuccessResponse } from '../middleware/error-handler';
import { Env } from '../types';

export const googleCalendarRouter = new Hono<{ Bindings: Env }>();

// GET /api/google-calendar/events - Import and merge Google Calendar events
googleCalendarRouter.get('/api/google-calendar/events', async (c) => {
  try {
    const from = c.req.query('from');
    const to = c.req.query('to');
    
    if (!from || !to) {
      return createErrorResponse(c, 'Missing required parameters: from, to', 400);
    }
    
    // Check if we have valid OAuth tokens
    const oauthService = new GoogleOAuthService(c.env.DB);
    const tokens = await oauthService.getTokens('default');
    
    if (!tokens || oauthService.isTokenExpired(tokens)) {
      return createErrorResponse(c, 'Google Calendar not connected. Please authenticate first.', 401);
    }
    
    // Import events from Google Calendar
    const googleService = new GoogleCalendarService(c.env);
    const googleEvents = await googleService.fetchEvents(tokens, from, to);
    
    // Convert Google events to our format and store them
    const dbService = new DatabaseService(c.env.DB);
    const importedEvents = [];
    
    for (const googleEvent of googleEvents) {
      // Check if event already exists (by Google event ID or title + time)
      const existingEvent = await dbService.getEventById(googleEvent.id) || 
                           await dbService.getEventsBySource('default', 'google')
                             .then(events => events.find(e => 
                               e.title === googleEvent.title && 
                               e.start === googleEvent.start
                             ));
      
      if (!existingEvent) {
        // Create new event
        const newEvent = await dbService.createEvent({
          calendar_id: 'default',
          title: googleEvent.title,
          description: googleEvent.description || '',
          start: googleEvent.start,
          end: googleEvent.end,
          tz: googleEvent.tz || 'UTC',
          eventType: 'google',
          location: googleEvent.location || '',
          source: 'google'
        });
        importedEvents.push(newEvent);
      }
    }
    
    return createSuccessResponse(c, {
      message: `Successfully imported ${importedEvents.length} events from Google Calendar`,
      imported_count: importedEvents.length,
      events: importedEvents
    });
  } catch (error) {
    console.error('Error importing Google Calendar events:', error);
    return createErrorResponse(c, 'Failed to import Google Calendar events', 500);
  }
});

// POST /api/google-calendar/sync - Force sync with Google Calendar
googleCalendarRouter.post('/api/google-calendar/sync', async (c) => {
  try {
    const userId = c.env.USER_ID;
    
    // Check if user has valid OAuth tokens
    const oauthService = new GoogleOAuthService(c.env.DB);
    const hasValidTokens = await oauthService.hasValidTokens(userId);
    
    if (!hasValidTokens) {
      return createErrorResponse(c, 'Google Calendar not connected', 401);
    }

    // Get OAuth tokens
    const tokens = await oauthService.getTokens(userId);
    if (!tokens) {
      return createErrorResponse(c, 'No OAuth tokens found', 401);
    }

    // Refresh token if needed
    const googleService = new GoogleCalendarService(c.env);
    if (googleService.isTokenExpired(tokens)) {
      if (!tokens.refresh_token) {
        return createErrorResponse(c, 'Access token expired and no refresh token available', 401);
      }
      
      const newTokens = await googleService.refreshAccessToken(tokens.refresh_token);
      await oauthService.updateTokens(userId, newTokens);
      tokens.access_token = newTokens.access_token;
    }

    // Sync events for the next 30 days
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const googleEvents = await googleService.fetchEvents(tokens.access_token, from, to);
    const convertedEvents = googleEvents.map(event => 
      googleService.convertGoogleEventToEvent(event, userId)
    );

    // Update existing Google events and add new ones
    const dbService = new DatabaseService(c.env.DB);
    let updated = 0;
    let created = 0;

    for (const event of convertedEvents) {
      try {
        // Check if event already exists
        const existingEvent = await dbService.getEventById(event.id);
        if (existingEvent) {
          // Update existing event
          await dbService.updateEvent(event.id, {
            title: event.title,
            description: event.description,
            start: event.start,
            end: event.end,
            location: event.location,
            updated_at: new Date().toISOString()
          });
          updated++;
        } else {
          // Create new event
          await dbService.createEvent(event);
          created++;
        }
      } catch (error) {
        console.error(`Failed to sync Google event ${event.id}:`, error);
      }
    }

    return createSuccessResponse(c, {
      message: 'Google Calendar sync completed',
      created,
      updated,
      total: googleEvents.length
    });
  } catch (error) {
    console.error('Error syncing Google Calendar:', error);
    return createErrorResponse(c, 'Failed to sync Google Calendar');
  }
});

// GET /api/google-calendar/status - Get sync status and last sync time
googleCalendarRouter.get('/api/google-calendar/status', async (c) => {
  try {
    const userId = c.env.USER_ID;
    
    const oauthService = new GoogleOAuthService(c.env.DB);
    const hasValidTokens = await oauthService.hasValidTokens(userId);
    
    if (!hasValidTokens) {
      return createSuccessResponse(c, {
        connected: false,
        message: 'Google Calendar not connected'
      });
    }

    // Get OAuth tokens to check expiry
    const tokens = await oauthService.getTokens(userId);
    const isExpired = tokens ? new Date(tokens.expiry || 0) <= new Date() : true;
    
    // Count Google Calendar events
    const dbService = new DatabaseService(c.env.DB);
    const googleEvents = await dbService.getEventsBySource('primary', 'google');
    
    return createSuccessResponse(c, {
      connected: true,
      tokenExpired: isExpired,
      eventCount: googleEvents.length,
      message: `Connected to Google Calendar with ${googleEvents.length} events`
    });
  } catch (error) {
    console.error('Error getting Google Calendar status:', error);
    return createErrorResponse(c, 'Failed to get Google Calendar status');
  }
});
