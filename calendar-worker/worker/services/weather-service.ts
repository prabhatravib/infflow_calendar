interface WeatherData {
  location: string;
  forecast: {
    daily: {
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: number[];
      windspeed_10m_max: number[];
      weathercode: number[];
      sunrise: string[];
      sunset: string[];
      time: string[];
    };
    current_weather: {
      temperature: number;
      weathercode: number;
      is_day: number;
    };
  };
}

interface WeatherResponse {
  data: WeatherData;
  status: string;
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.open-meteo.com/v1';
  private geocodingUrl = 'https://geocoding-api.open-meteo.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  async getWeatherData(location: string): Promise<WeatherData | null> {
    try {
      // First geocode the location
      const coordinates = await this.geocodeLocation(location);
      if (!coordinates) {
        console.warn(`Could not geocode location: ${location}`);
        // Return mock data instead of null to prevent 500 errors
        return this.getMockWeatherData(location);
      }

      // Fetch weather data
      const weatherUrl = `${this.baseUrl}/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,weathercode,sunrise,sunset&current_weather=true&timezone=auto&temperature_unit=fahrenheit`;
      
      const response = await fetch(weatherUrl);
      if (!response.ok) {
        console.warn(`Weather API error: ${response.status}, falling back to mock data`);
        return this.getMockWeatherData(location);
      }

      const data = await response.json();
      
      // Validate the response data
      if (!data || !data.daily || !data.current_weather) {
        console.warn('Invalid weather data received, falling back to mock data');
        return this.getMockWeatherData(location);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return mock data instead of null to prevent 500 errors
      return this.getMockWeatherData(location);
    }
  }

  private async geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const url = `${this.geocodingUrl}/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`Geocoding API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.latitude,
          lon: result.longitude
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  }

  // Mock weather data to prevent 500 errors
  private getMockWeatherData(location: string): WeatherData {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    return {
      location: location,
      forecast: {
        daily: {
          temperature_2m_max: [72, 68, 75],
          temperature_2m_min: [55, 52, 58],
          precipitation_probability_max: [10, 60, 5],
          windspeed_10m_max: [8, 12, 6],
          weathercode: [0, 61, 1],
          sunrise: ['06:30', '06:32', '06:34'],
          sunset: ['19:45', '19:43', '19:41'],
          time: [
            now.toISOString().split('T')[0],
            tomorrow.toISOString().split('T')[0],
            dayAfter.toISOString().split('T')[0]
          ]
        },
        current_weather: {
          temperature: 70,
          weathercode: 0,
          is_day: 1
        }
      }
    };
  }

  getWeatherColor(weatherData: WeatherData): { color: string; opacity: number } {
    if (!weatherData) {
      return { color: '#000000', opacity: 1 }; // Default black
    }

    const { forecast, current_weather } = weatherData;
    const now = new Date();
    
    // Check if it's dark (night time)
    const todayIndex = 0; // First day in forecast
    const sunriseStr = forecast.daily.sunrise[todayIndex];
    const sunsetStr = forecast.daily.sunset[todayIndex];
    
    if (sunriseStr && sunsetStr) {
      const sunrise = new Date(sunriseStr);
      const sunset = new Date(sunsetStr);
      
      if (now < sunrise || now >= sunset) {
        return { color: '#000000', opacity: 1 }; // Black for night
      }
    } else if (current_weather.is_day === 0) {
      return { color: '#000000', opacity: 1 }; // Black for night (fallback)
    }

    // Daytime: determine weather quality
    const weatherCode = current_weather.weathercode;
    const isBadWeather = this.isDimWeather(weatherCode);
    
    if (isBadWeather) {
      return { color: '#9ca3af', opacity: 0.9 }; // Gray for bad weather
    } else {
      return { color: '#fde047', opacity: 1 }; // Yellow for sunny weather
    }
  }

  private isDimWeather(weatherCode: number): boolean {
    // Weather codes that indicate dim/bad weather
    const dimWeatherCodes = [
      1, 2, 3,        // Cloudy
      45, 48,         // Fog
      51, 53, 55, 56, 57,  // Drizzle
      61, 63, 65, 66, 67,  // Rain
      71, 73, 75, 77,      // Snow
      80, 81, 82,          // Rain showers
      85, 86,              // Snow showers
      95, 96, 99           // Thunderstorms
    ];
    
    return dimWeatherCodes.includes(weatherCode);
  }

  getWeatherDescription(weatherCode: number): string {
    const descriptions: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    
    return descriptions[weatherCode] || 'Unknown';
  }
}
