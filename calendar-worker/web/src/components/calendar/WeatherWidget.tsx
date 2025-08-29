import { useState, useEffect } from 'react';
import { updateWeatherLocation } from '../../lib/api';
import { mockUpdateWeatherLocation } from '../../lib/mock-weather';
import { useLocation } from '../../lib/contexts/LocationContext';
import { useWeather } from '../../lib/hooks/useWeather';

interface WeatherWidgetProps {
  className?: string;
  useMockData?: boolean;
}

export function WeatherWidget({ className = '', useMockData = false }: WeatherWidgetProps) {
  const { location, setLocation } = useLocation();
  const { weatherData, isLoading, error: weatherError, refreshWeather } = useWeather(location);
  const [locationInput, setLocationInput] = useState(location);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local input when context location changes
  useEffect(() => {
    setLocationInput(location);
  }, [location]);

  // Combine errors from weather hook and local state
  const displayError = weatherError || error;

  const handleLocationUpdate = async () => {
    if (locationInput.trim() && locationInput !== location) {
      setIsUpdating(true);
      try {
        setError(null);
        
        if (useMockData) {
          await mockUpdateWeatherLocation(locationInput.trim());
        } else {
          try {
            await updateWeatherLocation(locationInput.trim());
          } catch (apiError) {
            console.warn('Weather API failed, falling back to mock data:', apiError);
            await mockUpdateWeatherLocation(locationInput.trim());
          }
        }
        
        await setLocation(locationInput.trim());
        await refreshWeather();
      } catch (err) {
        setError('Failed to update location');
        console.error('Location update error:', err);
      } finally {
        setIsUpdating(false);
      }
    }
  };



  const handleCurrentLocation = async () => {
    setIsUpdating(true);
    try {
      setError(null);
      await setLocation(location); // Set location to current location
      await refreshWeather();
    } catch (err) {
      setError('Failed to set current location');
      console.error('Current location error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSmartLocationAction = async () => {
    if (locationInput.trim() && locationInput !== location) {
      // If there's a new location input, update to that location
      await handleLocationUpdate();
    } else {
      // If input is same as current location, refresh current location data
      await handleCurrentLocation();
    }
  };

  const getWeatherIcon = (weatherCode: number) => {
    // Simple weather icon mapping based on WMO codes
    if (weatherCode >= 0 && weatherCode <= 3) return '☀️'; // Clear/Cloudy
    if (weatherCode >= 45 && weatherCode <= 48) return '🌫️'; // Fog
    if (weatherCode >= 51 && weatherCode <= 67) return '🌧️'; // Rain
    if (weatherCode >= 71 && weatherCode <= 86) return '❄️'; // Snow
    if (weatherCode >= 95 && weatherCode <= 99) return '⛈️'; // Thunderstorm
    return '🌤️'; // Default
  };

  return (
    <div className={`weather-widget bg-white border border-gray-100 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Weather</h3>
      </div>

      {/* Location Input */}
      <div className="mb-4">
        <input
          type="text"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSmartLocationAction()}
          placeholder="Enter city name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
        />
        <button
          onClick={handleSmartLocationAction}
          disabled={isUpdating}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : (locationInput.trim() && locationInput !== location ? 'Update' : 'Refresh')}
        </button>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {displayError}
        </div>
      )}

      {/* Weather Display */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading weather...</p>
        </div>
      ) : weatherData ? (
        <div className="space-y-3">
          {/* Location Display */}
          <div className="text-center p-3">
            <h4 className="font-medium text-gray-900">{weatherData.location}</h4>
          </div>

          {/* Forecast Preview */}
          {weatherData.forecast && weatherData.forecast.daily && (
            <div className="p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">3-Day Forecast</h4>
              <div className="space-y-2">
                {weatherData.forecast.daily.time.slice(0, 3).map((date: string, index: number) => {
                  const tempMax = weatherData.forecast.daily.temperature_2m_max?.[index];
                  const tempMin = weatherData.forecast.daily.temperature_2m_min?.[index];
                  const weatherCode = weatherData.forecast.daily.weathercode?.[index];
                  
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{getWeatherIcon(weatherCode)}</span>
                        <span className="text-gray-700">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        {tempMax && tempMin ? `${Math.round(tempMax)}°F / ${Math.round(tempMin)}°F` : 'N/A'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No weather data available</p>
        </div>
      )}
    </div>
  );
}
