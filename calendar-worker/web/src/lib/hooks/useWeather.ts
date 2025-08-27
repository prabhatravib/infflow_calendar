import { useState, useEffect, useCallback } from 'react';
import { weatherService } from '../services/weatherService';
import type { WeatherData } from '../api';

export function useWeather(location: string) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async () => {
    if (!location) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await weatherService.getWeather(location);
      setWeatherData(data);
    } catch (err) {
      console.error('Error loading weather:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  const refreshWeather = useCallback(async () => {
    if (!location) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const data = await weatherService.refreshWeather(location);
      setWeatherData(data);
    } catch (err) {
      console.error('Error refreshing weather:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh weather');
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  // Load weather when location changes
  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  return {
    weatherData,
    isLoading,
    error,
    refreshWeather,
    loadWeather
  };
}
