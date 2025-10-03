import { useState, useEffect, useCallback } from 'react';
import { weatherService } from '../services/weatherService';
import { useLocation } from '../contexts/LocationContext';

export function useWeatherEvents() {
  const { location } = useLocation();
  const [weatherEvents, setWeatherEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cached weather events immediately on mount
  useEffect(() => {
    const cachedEvents = weatherService.getCachedWeatherEvents();
    if (cachedEvents.length > 0) {
      setWeatherEvents(cachedEvents);
    }
  }, []);

  const loadWeatherEvents = useCallback(async () => {
    if (!location) {
      return;
    }

    try {
      setIsLoading(true);
      const weatherData = await weatherService.getWeather(location);
      
      if (!weatherData) {
        setWeatherEvents([]);
        return;
      }
      
      const events = weatherService.generateWeatherEvents(weatherData);
      setWeatherEvents(events);
    } catch (error) {
      console.error('Error loading weather events:', error);
      setWeatherEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  const refreshWeatherEvents = useCallback(async () => {
    if (!location) return;

    try {
      setIsLoading(true);
      const weatherData = await weatherService.refreshWeather(location);
      const events = weatherService.generateWeatherEvents(weatherData);
      setWeatherEvents(events);
    } catch (error) {
      console.error('Error refreshing weather events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  // Load weather events when location changes
  useEffect(() => {
    loadWeatherEvents();
  }, [loadWeatherEvents]);

  return {
    weatherEvents,
    isLoading,
    refreshWeatherEvents,
    loadWeatherEvents
  };
}
