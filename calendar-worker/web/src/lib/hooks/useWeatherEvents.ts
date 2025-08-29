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
      console.log('Loading cached weather events on mount:', cachedEvents.length);
      setWeatherEvents(cachedEvents);
    }
  }, []);

  const loadWeatherEvents = useCallback(async () => {
    if (!location) {
      console.log('No location provided to useWeatherEvents');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading weather events for location:', location);
      const weatherData = await weatherService.getWeather(location);
      console.log('Weather data received from service:', weatherData);
      
      if (!weatherData) {
        console.log('No weather data received from service');
        setWeatherEvents([]);
        return;
      }
      
      const events = weatherService.generateWeatherEvents(weatherData);
      console.log('Weather events generated:', events);
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
      console.log('Refreshed weather data:', weatherData);
      const events = weatherService.generateWeatherEvents(weatherData);
      console.log('Generated weather events after refresh:', events);
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
