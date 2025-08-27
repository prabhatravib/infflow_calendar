import { Context, Next } from 'hono';

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('Unhandled error:', error);
    return c.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
};

export const createErrorResponse = (c: Context, message: string, status: number = 500) => {
  console.error(`Error: ${message}`);
  return c.json({ error: message }, status);
};

export const createSuccessResponse = (c: Context, data: any, status: number = 200) => {
  return c.json(data, status);
};
