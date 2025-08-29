# Weather-Aware Minute Indicator

This feature implements a minute indicator (vertical bar) that changes color based on current weather conditions, similar to the calendar integration repo.

## Overview

The minute indicator is a thin vertical bar that shows the current time position in the calendar grid. It automatically changes color based on:

- **Night time (Black)**: When it's dark outside (before sunrise or after sunset)
- **Sunny weather (Yellow)**: During daytime with clear skies
- **Bad weather (Gray)**: During daytime with cloudy, rainy, or stormy conditions

## Implementation Details

### 1. Weather Service (`worker/services/weather-service.ts`)

- Fetches weather data from Open-Meteo API
- Geocodes location names to coordinates
- Determines weather color based on:
  - Sunrise/sunset times for day/night detection
  - Weather codes for condition classification
  - Current weather status

### 2. Weather-Aware Hook (`web/src/lib/hooks/useWeatherAwareMinuteIndicator.ts`)

- React hook that manages weather data fetching
- Updates every 30 minutes automatically
- Provides weather-based color calculations
- Handles API errors gracefully

### 3. Location Context (`web/src/lib/contexts/LocationContext.tsx`)

- React context for sharing location across components
- Allows WeatherWidget and MinuteIndicator to stay in sync
- Default location: "New York"

### 4. Enhanced MinuteIndicator Component

- Uses weather data to determine colors
- Applies smooth transitions between color changes
- Shows weather emoji (☀️ for clear, ☁️ for cloudy)
- Includes weather tooltip on hover

## Weather Color Logic

```typescript
// Night time detection
if (now < sunrise || now >= sunset) {
  return { color: '#000000', opacity: 1 }; // Black
}

// Daytime weather classification
const isBadWeather = isDimWeather(weatherCode);
if (isBadWeather) {
  return { color: '#9ca3af', opacity: 0.9 }; // Gray
} else {
  return { color: '#fde047', opacity: 1 }; // Yellow
}
```

## Weather Codes

The system classifies weather conditions as "dim" (bad) if they include:

- **Cloudy**: Codes 1, 2, 3
- **Fog**: Codes 45, 48
- **Precipitation**: Codes 51-57, 61-67, 71-77, 80-82, 85-86
- **Storms**: Codes 95, 96, 99

## API Endpoints

The worker provides these weather endpoints:

- `GET /api/weather?location=<city>` - Fetch current weather
- `POST /api/weather/location` - Update location
- `POST /api/weather/refresh` - Refresh weather data

## Usage

1. **Location Setup**: Use the WeatherWidget to set your location
2. **Automatic Updates**: Weather data refreshes every 30 minutes
3. **Visual Feedback**: Minute indicator color changes automatically
4. **Hover Info**: Hover over the indicator to see weather details

## Styling

The CSS includes:

- Smooth color transitions (0.3s ease)
- Weather-specific color classes
- Dark theme support
- Responsive design
- Hover effects and tooltips

## Dependencies

- Open-Meteo API (free weather service)
- Geocoding API (location to coordinates)
- React Context API (state management)
- CSS transitions (smooth color changes)

## Error Handling

- Falls back to default black color if weather API fails
- Graceful degradation when location can't be geocoded
- Console logging for debugging
- User-friendly error messages

## Future Enhancements

- Weather forecast integration
- Multiple location support
- Custom color schemes
- Weather alerts integration
- Offline weather data caching
