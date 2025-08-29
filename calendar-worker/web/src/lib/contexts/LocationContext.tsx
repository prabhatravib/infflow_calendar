import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { weatherService } from '../services/weatherService';

interface LocationContextType {
  location: string;
  setLocation: (location: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
  defaultLocation?: string;
}

const LOCATION_STORAGE_KEY = 'calendar_location';

export function LocationProvider({ children, defaultLocation = 'New York' }: LocationProviderProps) {
  // Initialize location from localStorage or use default
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      return saved || defaultLocation;
    } catch (error) {
      console.error('Error loading location from localStorage:', error);
      return defaultLocation;
    }
  });

  // Save location to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, location);
      console.log('Location saved to localStorage:', location);
    } catch (error) {
      console.error('Error saving location to localStorage:', error);
    }
  }, [location]);

  const handleLocationChange = useCallback((newLocation: string) => {
    setLocation(newLocation);
    // Refresh weather data when location changes
    weatherService.refreshWeather(newLocation);
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation: handleLocationChange }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
