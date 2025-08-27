import { Hono } from 'hono';
import { DatabaseService } from '../services/database-service';
import { createErrorResponse } from '../middleware/error-handler';
import { formatDateForICS, escapeICSField } from '../utils/helpers';

export const icsRouter = new Hono();

// GET /api/ics/:user
icsRouter.get('/api/ics/:user', async (c) => {
  try {
    const userId = c.req.param('user');
    
    if (!userId) {
      return createErrorResponse(c, 'User ID is required', 400);
    }

    const dbService = new DatabaseService(c.env.DB);
    const events = await dbService.getUserEvents(userId);

    if (events.length === 0) {
      return createErrorResponse(c, 'No events found for user', 404);
    }

    // Generate ICS content
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//Calendar Worker//EN\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';

    for (const event of events) {
      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `UID:${event.id}\r\n`;
      icsContent += `DTSTAMP:${formatDateForICS(new Date().toISOString())}Z\r\n`;
      icsContent += `DTSTART;TZID=${event.tz}:${formatDateForICS(event.start)}\r\n`;
      icsContent += `DTEND;TZID=${event.tz}:${formatDateForICS(event.end)}\r\n`;
      icsContent += `SUMMARY:${escapeICSField(event.title)}\r\n`;
      if (event.description) {
        icsContent += `DESCRIPTION:${escapeICSField(event.description)}\r\n`;
      }
      icsContent += `END:VEVENT\r\n`;
    }

    icsContent += 'END:VCALENDAR\r\n';

    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="calendar-${userId}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating ICS:', error);
    return createErrorResponse(c, 'Failed to generate ICS');
  }
});
