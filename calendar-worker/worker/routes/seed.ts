import { Hono } from 'hono';
import { DatabaseService } from '../services/database-service';
import { createErrorResponse, createSuccessResponse } from '../middleware/error-handler';
import { CALENDAR_ID } from '../utils/constants';

export const seedRouter = new Hono();

// GET /api/seed
seedRouter.get('/api/seed', async (c) => {
  try {
    const userId = c.env.USER_ID || 'demo-user';
    
    const dbService = new DatabaseService(c.env.DB);
    await dbService.seedDemoData(userId, CALENDAR_ID);

    return createSuccessResponse(c, { message: 'Demo data seeded successfully' });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return createErrorResponse(c, 'Failed to seed demo data');
  }
});
