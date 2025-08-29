import { Event, CreateEventRequest, UpdateEventRequest } from '../types';
import { generateUUID, getCurrentTimestamp } from '../utils/helpers';

export class DatabaseService {
  constructor(private db: any) {}

  async getEvents(calendarId: string, from: string, to: string): Promise<Event[]> {
    const result = await this.db.prepare(`
      SELECT * FROM events 
      WHERE calendar_id = ? AND start >= ? AND start <= ?
      ORDER BY start ASC
    `).bind(calendarId, from, to).all();
    
    return (result.results as Event[]) || [];
  }

  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    const id = generateUUID();
    const now = getCurrentTimestamp();

    await this.db.prepare(`
      INSERT INTO events (id, calendar_id, title, description, start, end, tz, eventType, location, type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'regular', ?, ?)
    `).bind(
      id, 
      eventData.calendar_id, 
      eventData.title, 
      eventData.description || '', 
      eventData.start, 
      eventData.end, 
      eventData.tz, 
      eventData.eventType || 'other', 
      eventData.location || '', 
      now, 
      now
    ).run();

    return {
      id,
      calendar_id: eventData.calendar_id,
      title: eventData.title,
      description: eventData.description,
      start: eventData.start,
      end: eventData.end,
      tz: eventData.tz,
      eventType: eventData.eventType || 'other',
      location: eventData.location,
      type: 'regular',
      created_at: now,
      updated_at: now
    };
  }

  async updateEvent(id: string, updateData: UpdateEventRequest): Promise<Event | null> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updateData.title !== undefined) {
      updateFields.push('title = ?');
      values.push(updateData.title);
    }
    if (updateData.description !== undefined) {
      updateFields.push('description = ?');
      values.push(updateData.description);
    }
    if (updateData.start !== undefined) {
      updateFields.push('start = ?');
      values.push(updateData.start);
    }
    if (updateData.end !== undefined) {
      updateFields.push('end = ?');
      values.push(updateData.end);
    }
    if (updateData.tz !== undefined) {
      updateFields.push('tz = ?');
      values.push(updateData.tz);
    }
    if (updateData.eventType !== undefined) {
      updateFields.push('eventType = ?');
      values.push(updateData.eventType);
    }
    if (updateData.location !== undefined) {
      updateFields.push('location = ?');
      values.push(updateData.location);
    }

    if (updateFields.length === 0) {
      return null;
    }

    updateFields.push('updated_at = ?');
    values.push(getCurrentTimestamp());
    values.push(id);

    await this.db.prepare(`
      UPDATE events 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    return this.getEventById(id);
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
    return result.changes > 0;
  }

  async getEventById(id: string): Promise<Event | null> {
    const result = await this.db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
    return (result as Event) || null;
  }

  async createEchoEvents(parentEvent: Event, followups: any[], mermaidCode: string, userId: string): Promise<any[]> {
    const createdEvents = [];
    
    for (const followup of followups) {
      const followupId = generateUUID();
      const now = getCurrentTimestamp();
      
      await this.db.prepare(`
        INSERT INTO events (id, calendar_id, title, description, start, end, tz, 
                          type, flowchart, parent_event_id, user_id, eventType, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'echo', ?, ?, ?, 'other', ?, ?)
      `).bind(
        followupId, 
        parentEvent.calendar_id, 
        followup.title, 
        followup.description,
        followup.start, 
        followup.end, 
        parentEvent.tz, 
        mermaidCode, 
        parentEvent.id, 
        userId, 
        now, 
        now
      ).run();
      
      createdEvents.push({ id: followupId, ...followup });
    }

    return createdEvents;
  }

  async updateEventFlowchart(eventId: string, flowchart: string, echoEventIds: string[]): Promise<void> {
    const now = getCurrentTimestamp();
    await this.db.prepare(`
      UPDATE events 
      SET flowchart = ?, echo_event_ids = ?, updated_at = ?
      WHERE id = ?
    `).bind(flowchart, JSON.stringify(echoEventIds), now, eventId).run();
  }

  async resetEchoEvents(eventId: string): Promise<void> {
    const now = getCurrentTimestamp();
    
    // Clear flowchart and echo relationships
    await this.db.prepare(`
      UPDATE events 
      SET flowchart = NULL, echo_event_ids = NULL, updated_at = ?
      WHERE id = ?
    `).bind(now, eventId).run();
    
    // Clear child echo events
    await this.db.prepare(`
      UPDATE events 
      SET flowchart = NULL, parent_event_id = NULL, updated_at = ?
      WHERE parent_event_id = ?
    `).bind(now, eventId).run();
  }

  async getUserEvents(userId: string): Promise<(Event & { calendar_name: string })[]> {
    const result = await this.db.prepare(`
      SELECT e.*, c.name as calendar_name
      FROM events e
      JOIN calendars c ON e.calendar_id = c.id
      WHERE c.user_id = ?
      ORDER BY e.start ASC
    `).bind(userId).all();
    
    return (result.results as (Event & { calendar_name: string })[]) || [];
  }

  async seedDemoData(userId: string, calendarId: string): Promise<void> {
    // Check if user exists
    let user = await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    
    if (!user) {
      await this.db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').bind(userId, `${userId}@example.com`).run();
    }

    // Check if calendar exists
    let calendar = await this.db.prepare('SELECT * FROM calendars WHERE user_id = ?').bind(userId).first();
    
    if (!calendar) {
      await this.db.prepare('INSERT INTO calendars (id, user_id, name) VALUES (?, ?, ?)').bind(calendarId, userId, 'My Calendar').run();
    }

    // Check if events exist
    const eventCount = await this.db.prepare('SELECT COUNT(*) as count FROM events WHERE calendar_id = ?').bind(calendarId).first();
    
    if (eventCount && (eventCount as { count: number }).count === 0) {
      await this.createDemoEvents(calendarId);
    }
  }

  private async createDemoEvents(calendarId: string): Promise<void> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

    const demoEvents = [
      {
        id: generateUUID(),
        calendar_id: calendarId,
        title: 'doctor appointment',
        description: 'Annual checkup and consultation',
        start: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        end: new Date(tomorrow.getTime() + 15 * 60 * 60 * 1000).toISOString(),
        tz: 'America/New_York',
        eventType: 'other',
        location: 'Medical Center'
      },
      {
        id: generateUUID(),
        calendar_id: calendarId,
        title: 'Team Meeting',
        description: 'Weekly team sync',
        start: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000).toISOString(),
        end: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000).toISOString(),
        tz: 'America/New_York',
        eventType: 'work'
      },
      {
        id: generateUUID(),
        calendar_id: calendarId,
        title: 'Lunch with Client',
        description: 'Discuss project requirements',
        start: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000).toISOString(),
        end: new Date(tomorrow.getTime() + 13 * 60 * 60 * 1000).toISOString(),
        tz: 'America/New_York',
        eventType: 'work'
      },
      {
        id: generateUUID(),
        calendar_id: calendarId,
        title: 'Product Review',
        description: 'Review new features',
        start: new Date(dayAfter.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        end: new Date(dayAfter.getTime() + 15 * 60 * 60 * 1000).toISOString(),
        tz: 'America/New_York',
        eventType: 'work'
      }
    ];

    for (const event of demoEvents) {
      await this.db.prepare(`
        INSERT INTO events (id, calendar_id, title, description, start, end, tz, eventType, location, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(event.id, event.calendar_id, event.title, event.description, event.start, event.end, event.tz, event.eventType, event.location || null, now.toISOString(), now.toISOString()).run();
    }
  }
}
