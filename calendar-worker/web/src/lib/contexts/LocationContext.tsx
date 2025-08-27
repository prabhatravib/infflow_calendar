import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
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

export function LocationProvider({ children, defaultLocation = 'New York' }: LocationProviderProps) {
  const [location, setLocation] = useState(defaultLocation);

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
