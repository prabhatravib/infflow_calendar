import { WeatherService } from './weather-service';

// Simple test to verify weather service functionality
describe('WeatherService', () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
  });

  test('should create weather service instance', () => {
    expect(weatherService).toBeInstanceOf(WeatherService);
  });

  test('should classify weather codes correctly', () => {
    // Test sunny weather (code 0)
    const sunnyColor = weatherService.getWeatherColor({
      location: 'Test',
      forecast: {
        daily: {
          temperature_2m_max: [75],
          temperature_2m_min: [60],
          precipitation_probability_max: [20],
          windspeed_10m_max: [15],
          weathercode: [0],
          sunrise: ['2024-01-01T06:00:00'],
          sunset: ['2024-01-01T18:00:00'],
          time: ['2024-01-01']
        },
        current_weather: {
          temperature: 70,
          weathercode: 0,
          is_day: 1
        }
      }
    });

    expect(sunnyColor.color).toBe('#fde047'); // Yellow for sunny
    expect(sunnyColor.opacity).toBe(1);

    // Test cloudy weather (code 3)
    const cloudyColor = weatherService.getWeatherColor({
      location: 'Test',
      forecast: {
        daily: {
          temperature_2m_max: [75],
          temperature_2m_min: [60],
          precipitation_probability_max: [20],
          windspeed_10m_max: [15],
          weathercode: [3],
          sunrise: ['2024-01-01T06:00:00'],
          sunset: ['2024-01-01T18:00:00'],
          time: ['2024-01-01']
        },
        current_weather: {
          temperature: 70,
          weathercode: 3,
          is_day: 1
        }
      }
    });

    expect(cloudyColor.color).toBe('#9ca3af'); // Gray for cloudy
    expect(cloudyColor.opacity).toBe(0.9);
  });

  test('should get weather descriptions', () => {
    expect(weatherService.getWeatherDescription(0)).toBe('Clear sky');
    expect(weatherService.getWeatherDescription(3)).toBe('Overcast');
    expect(weatherService.getWeatherDescription(95)).toBe('Thunderstorm');
    expect(weatherService.getWeatherDescription(999)).toBe('Unknown');
  });
});
