import { Hono } from 'hono';
import { DatabaseService } from '../services/database-service';
import { createErrorResponse, createSuccessResponse } from '../middleware/error-handler';
import { generateFollowupEvents, generateMermaidFlowchart } from '../services/ai-service';

export const echoRouter = new Hono();

// POST /api/events/:id/echo
echoRouter.post('/api/events/:id/echo', async (c) => {
  try {
    const eventId = c.req.param('id');
    const { user_id } = await c.req.json();
    
    console.log('Echo request received for event:', eventId, 'user:', user_id);
    
    if (!eventId || !user_id) {
      return createErrorResponse(c, 'Missing required parameters', 400);
    }

    const dbService = new DatabaseService(c.env.DB);
    
    // Get the parent event
    const parentEvent = await dbService.getEventById(eventId);
    console.log('Parent event found:', parentEvent);
    
    if (!parentEvent) {
      return createErrorResponse(c, 'Event not found', 404);
    }

    // Generate follow-ups using AI
    console.log('Generating followup events...');
    const followups = await generateFollowupEvents(parentEvent, c.env.OPENAI_API_KEY);
    console.log('Followups generated:', followups);
    
    // Generate Mermaid flowchart
    console.log('Generating Mermaid flowchart...');
    const mermaidCode = generateMermaidFlowchart(parentEvent, followups);
    console.log('Mermaid code generated:', mermaidCode);
    
    // Create follow-up events
    console.log('Creating echo events in database...');
    const createdEvents = await dbService.createEchoEvents(parentEvent, followups, mermaidCode, user_id);
    console.log('Echo events created:', createdEvents);

    // Update parent event with flowchart and echo event IDs
    const echoIds = createdEvents.map(e => e.id);
    await dbService.updateEventFlowchart(eventId, mermaidCode, echoIds);
    console.log('Parent event updated with flowchart');

    return createSuccessResponse(c, {
      mermaid: mermaidCode,
      events: createdEvents
    }, 201);
  } catch (error) {
    console.error('Error creating echo:', error);
    return createErrorResponse(c, 'Failed to create echo');
  }
});

// POST /api/events/:id/echo/reset
echoRouter.post('/api/events/:id/echo/reset', async (c) => {
  try {
    const eventId = c.req.param('id');
    const { user_id } = await c.req.json();
    
    const dbService = new DatabaseService(c.env.DB);
    await dbService.resetEchoEvents(eventId);
    
    return createSuccessResponse(c, { message: 'Echo reset successfully' });
  } catch (error) {
    console.error('Error resetting echo:', error);
    return createErrorResponse(c, 'Failed to reset echo');
  }
});
