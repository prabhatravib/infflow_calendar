// Mock weather service for development
// This provides sample weather data when the real weather API is not available

export interface MockWeatherData {
  location: string;
  forecast: any;
  weather_events: any[];
  message: string;
}

export function generateMockWeatherData(location: string): MockWeatherData {
  const today = new Date();
  const weatherEvents = [];
  
  // Generate some sample weather warnings for the next few days
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Randomly generate weather warnings
    if (Math.random() > 0.6) {
      weatherEvents.push({
        id: `weather-${date.toISOString().split('T')[0]}`,
        title: '⛈️ Bad Weather (Rain 65%)',
        start: date.toISOString().split('T')[0],
        end: date.toISOString().split('T')[0],
        all_day: true,
        type: 'weather-warning',
        backgroundColor: '#ffb3b3',
        borderColor: '#ff8080',
        textColor: '#d00000'
      });
    }
  }

  return {
    location,
    forecast: {
      daily: {
        time: [
          today.toISOString().split('T')[0],
          new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        ],
        temperature_2m_max: [72, 68, 75],
        temperature_2m_min: [55, 52, 58],
        precipitation_probability_max: [20, 65, 15],
        windspeed_10m_max: [12, 18, 10],
        weathercode: [1, 61, 2]
      }
    },
    weather_events: weatherEvents,
    message: 'Mock weather data generated successfully'
  };
}

export async function mockFetchWeatherData(location: string): Promise<MockWeatherData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return generateMockWeatherData(location);
}

export async function mockUpdateWeatherLocation(location: string): Promise<{ message: string; location: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    message: `Weather location updated to ${location}`,
    location
  };
}

export async function mockRefreshWeatherData(): Promise<{ message: string }> {
  await new Promise(resolve => setTimeout(resolve, 400));
  return {
    message: 'Weather data refreshed successfully'
  };
}
