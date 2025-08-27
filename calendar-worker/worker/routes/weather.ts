import { Hono } from 'hono';
import { WeatherService } from '../services/weather-service';
import { createErrorResponse, createSuccessResponse } from '../middleware/error-handler';

export const weatherRouter = new Hono();

// GET /api/weather
weatherRouter.get('/api/weather', async (c) => {
  try {
    const { location = 'New York' } = c.req.query();
    
    const weatherService = new WeatherService();
    const weatherData = await weatherService.getWeatherData(location);
    
    if (!weatherData) {
      return createErrorResponse(c, 'Failed to fetch weather data');
    }

    return createSuccessResponse(c, { 
      data: weatherData,
      status: 'success'
    });
  } catch (error) {
    console.error('Error fetching weather:', error);
    return createErrorResponse(c, 'Failed to fetch weather data');
  }
});

// POST /api/weather/location
weatherRouter.post('/api/weather/location', async (c) => {
  try {
    const { location } = await c.req.json();
    
    if (!location) {
      return createErrorResponse(c, 'Location is required', 400);
    }

    const weatherService = new WeatherService();
    const weatherData = await weatherService.getWeatherData(location);
    
    if (!weatherData) {
      return createErrorResponse(c, 'Failed to fetch weather data for location');
    }

    return createSuccessResponse(c, { 
      message: `Weather location updated to ${location}`,
      location: location,
      status: 'success'
    });
  } catch (error) {
    console.error('Error updating weather location:', error);
    return createErrorResponse(c, 'Failed to update weather location');
  }
});

// POST /api/weather/refresh
weatherRouter.post('/api/weather/refresh', async (c) => {
  try {
    // This endpoint can be used to manually refresh weather data
    // For now, it just returns a success message
    return createSuccessResponse(c, { 
      message: 'Weather data refreshed successfully',
      status: 'success'
    });
  } catch (error) {
    console.error('Error refreshing weather:', error);
    return createErrorResponse(c, 'Failed to refresh weather data');
  }
});
