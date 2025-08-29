import { useLocation } from '../../lib/contexts/LocationContext';
import { useWeather } from '../../lib/hooks/useWeather';

interface DayWeatherProps {
  date: Date;
  className?: string;
}

export function DayWeather({ date, className = '' }: DayWeatherProps) {
  const { location } = useLocation();
  const { weatherData, isLoading } = useWeather(location);

  const getWeatherIcon = (weatherCode: number) => {
    if (weatherCode >= 0 && weatherCode <= 3) return '☀️'; // Clear/Cloudy
    if (weatherCode >= 45 && weatherCode <= 48) return '🌫️'; // Fog
    if (weatherCode >= 51 && weatherCode <= 67) return '🌧️'; // Rain
    if (weatherCode >= 71 && weatherCode <= 86) return '❄️'; // Snow
    if (weatherCode >= 95 && weatherCode <= 99) return '⛈️'; // Thunderstorm
    return '🌤️'; // Default
  };

  const getDayWeather = () => {
    if (!weatherData || !weatherData.forecast || !weatherData.forecast.daily) {
      return null;
    }

    const targetDate = date.toISOString().split('T')[0];
    const dayIndex = weatherData.forecast.daily.time.findIndex((time: string) => time === targetDate);
    
    if (dayIndex === -1) {
      return null;
    }

    return {
      tempMax: weatherData.forecast.daily.temperature_2m_max?.[dayIndex],
      tempMin: weatherData.forecast.daily.temperature_2m_min?.[dayIndex],
      weatherCode: weatherData.forecast.daily.weathercode?.[dayIndex],
      precipitation: weatherData.forecast.daily.precipitation_probability_max?.[dayIndex]
    };
  };

  const dayWeather = getDayWeather();

  if (isLoading) {
    return (
      <div className={`day-weather ${className}`}>
        <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
      </div>
    );
  }

  if (!dayWeather) {
    return null;
  }

  return (
    <div className={`day-weather text-center ${className}`}>
      <div className="flex flex-col items-center space-y-1">
        {/* Weather Icon */}
        <div className="text-lg">
          {getWeatherIcon(dayWeather.weatherCode || 0)}
        </div>
        
        {/* Temperature */}
        <div className="text-xs text-gray-600 font-medium">
          {dayWeather.tempMax && dayWeather.tempMin 
            ? `${Math.round(dayWeather.tempMax)}°/${Math.round(dayWeather.tempMin)}°`
            : 'N/A'
          }
        </div>
        
        {/* Precipitation Probability */}
        {dayWeather.precipitation !== undefined && dayWeather.precipitation > 0 && (
          <div className="text-xs text-blue-600">
            {dayWeather.precipitation}%
          </div>
        )}
      </div>
    </div>
  );
}
