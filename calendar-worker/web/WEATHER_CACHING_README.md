# Weather Caching System

## Overview
The calendar application now uses a centralized weather service with intelligent caching to prevent multiple unnecessary weather API calls.

## How It Works

### Before (Problem)
- **Multiple API calls**: Each `DayWeather` component made separate weather API calls
- **No caching**: Weather data was fetched every time components mounted
- **Frequent updates**: Weather data was refreshed every 30 minutes
- **Inefficient**: 7+ weather API calls on every calendar load

### After (Solution)
- **Single API call**: Weather data is fetched once and shared across all components
- **6-hour caching**: Weather data is cached for 6 hours to reduce API calls
- **Smart refresh**: Only refreshes when location changes or cache expires
- **Efficient**: Maximum 1 weather API call every 6 hours

## Components Updated

### 1. WeatherService (`/src/lib/services/weatherService.ts`)
- Centralized weather data management
- 6-hour cache duration
- Prevents duplicate API calls during concurrent requests
- Automatic fallback to stale cache if API fails

### 2. useWeather Hook (`/src/lib/hooks/useWeather.ts`)
- React hook that uses the centralized service
- Provides loading states and error handling
- Automatically refreshes when location changes

### 3. DayWeather Component
- Now uses `useWeather` hook instead of making direct API calls
- Shares weather data with other components
- No more individual API calls

### 4. MinuteIndicator Component
- Updated to use centralized service
- Weather refresh interval changed from 30 minutes to 6 hours

### 5. LocationContext
- Automatically triggers weather refresh when location changes
- Ensures fresh data for new locations

## Cache Behavior

- **Cache Duration**: 6 hours (configurable in `WeatherService.CACHE_DURATION`)
- **Cache Invalidation**: 
  - Location changes
  - Cache expiration
  - Manual refresh
- **Fallback**: Uses stale cache if API fails (graceful degradation)

## Benefits

1. **Reduced API Calls**: From 7+ calls per load to 1 call per 6 hours
2. **Better Performance**: Faster calendar loading, no duplicate requests
3. **Cost Savings**: Reduced weather API usage
4. **Better UX**: Consistent weather data across all components
5. **Reliability**: Graceful fallback to cached data if API fails

## Configuration

To change the cache duration, modify the `CACHE_DURATION` constant in `WeatherService`:

```typescript
private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
```

## Debugging

The weather service logs cache operations to the console:
- "Using cached weather data for: [location]"
- "Fetching fresh weather data for: [location]"
- "Weather data cached successfully for: [location]"

Use `weatherService.getCacheStatus()` to check cache state programmatically.
