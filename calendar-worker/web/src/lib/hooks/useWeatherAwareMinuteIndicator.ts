import { useState, useEffect, useCallback } from 'react';
import { weatherService } from '../services/weatherService';

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

interface WeatherIndicatorColor {
  color: string;
  opacity: number;
}

export function useWeatherAwareMinuteIndicator(location: string = 'New York') {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [indicatorColor, setIndicatorColor] = useState<WeatherIndicatorColor>({
    color: '#000000',
    opacity: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await weatherService.getWeather(location);
      setWeatherData(data);
      
      // Calculate indicator color based on weather
      const color = calculateWeatherColor(data);
      setIndicatorColor(color);
      
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
      // Fallback to default color
      setIndicatorColor({ color: '#000000', opacity: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  const calculateWeatherColor = (data: WeatherData): WeatherIndicatorColor => {
    if (!data || !data.forecast) {
      return { color: '#000000', opacity: 1 }; // Default black
    }

    // Try to get weather code from daily forecast if available
    const weatherCode = data.forecast?.daily?.weathercode?.[0];
    if (weatherCode !== undefined) {
      // Simple weather-based coloring
      if (weatherCode === 0) {
        return { color: '#fde047', opacity: 1 }; // Yellow for clear weather
      } else if (weatherCode >= 1 && weatherCode <= 3) {
        return { color: '#9ca3af', opacity: 0.9 }; // Gray for cloudy weather
      } else if (weatherCode >= 45) {
        return { color: '#6b7280', opacity: 0.8 }; // Darker gray for fog/rain/snow
      }
    }

    // Default color
    return { color: '#000000', opacity: 1 };
  };



  // Update weather data every 6 hours
  useEffect(() => {
    fetchWeatherData();
    
    const interval = setInterval(fetchWeatherData, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  // Update color when weather data changes
  useEffect(() => {
    if (weatherData) {
      const color = calculateWeatherColor(weatherData);
      setIndicatorColor(color);
    }
  }, [weatherData]);

  return {
    weatherData,
    indicatorColor,
    isLoading,
    error,
    refetch: fetchWeatherData
  };
}
