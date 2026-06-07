# Voice Worker Integration

## Overview

This document describes the integration of the hexagon voice worker into the calendar application. The voice worker provides voice-based interaction with calendar events and weather data.

## Architecture

### Components

1. **SessionManager** (`src/utils/sessionManager.ts`)
   - Manages session IDs across view changes
   - Sessions persist when switching between day/week/month views
   - Sessions do NOT persist across page reloads

2. **HexaWorker Component** (`src/components/HexaWorker.tsx`)
   - Floating button in bottom-left corner
   - Expandable panel with embedded iframe
   - Sends calendar events and weather data to voice worker
   - Handles real-time communication via postMessage

3. **App Integration** (`src/App.tsx`)
   - Wrapped in LocationProvider for location context
   - Loads weather data alongside calendar events
   - Passes data to HexaWorker component

## Features

### User Experience

- **Floating Button**: Blue microphone icon in bottom-left corner
- **Expandable Panel**: Click to expand voice worker interface (384px x 512px)
- **Visual Feedback**: 
  - Pulsing animation when sending data
  - Loading indicator during initialization
  - Tooltip on hover

### Data Synchronization

- **Automatic Updates**: Calendar events and weather data sent automatically
- **Deduplication**: Prevents sending duplicate data
- **Session Persistence**: Maintains conversation context across view changes

### Communication Flow

1. User clicks microphone button
2. SessionManager generates unique session ID
3. HexaWorker sends calendar + weather data to API endpoint
4. iframe loads with session ID parameter
5. Voice worker has access to all calendar context

## Configuration

### Hexagon Worker URL

Default: `https://hexa-worker.prabhatravib.workers.dev`

To customize, pass the `hexaWorkerUrl` prop to HexaWorker:

```tsx
<HexaWorker
  calendarData={{ events, weatherData, location }}
  hexaWorkerUrl="https://your-custom-worker.workers.dev"
/>
```

### API Endpoint

The worker expects a POST endpoint at:
```
{hexaWorkerUrl}/api/external-data
```

#### Request Format
```json
{
  "events": [...],           // Array of Event objects
  "weatherData": {...},      // Weather data from weatherService
  "location": "New York",    // Current location string
  "type": "calendar",        // Data type identifier
  "sessionId": "uuid-v4"     // Session identifier
}
```

#### Response Format
```json
{
  "success": true
}
```

## Event Data Structure

Events sent to voice worker include:

```typescript
interface Event {
  id: string;
  calendar_id: string;
  title: string;
  description?: string;
  start: string;           // ISO 8601 datetime
  end: string;             // ISO 8601 datetime
  tz: string;
  eventType?: 'work' | 'fun' | 'other';
  location?: string;
  type?: string;           // e.g., 'weather-warning'
}
```

## Weather Data Structure

Weather data from Open-Meteo API:

```typescript
interface WeatherData {
  current_weather: {
    temperature: number;
    weathercode: number;
    // ... other fields
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
    weathercode: number[];
  };
}
```

## Usage Examples

### Basic Integration

Already integrated in App.tsx:

```tsx
<HexaWorker
  calendarData={{
    events: safeEvents,
    weatherData: weatherData,
    location: location
  }}
/>
```

### Custom Styling

Modify button position in HexaWorker.tsx:

```tsx
// Change from bottom-left to bottom-right
<div className="fixed bottom-6 right-6 z-50">
```

### Session Management

Access session programmatically:

```typescript
import { sessionManager } from './utils/sessionManager';

// Get current session
const sessionId = sessionManager.getSessionId();

// Listen for changes
const unsubscribe = sessionManager.onSessionChange((newSessionId) => {
  console.log('Session changed:', newSessionId);
});

// Clear session
sessionManager.clearSession();
```

## Security Considerations

### iframe Sandbox

The iframe includes sandbox attributes:
- `allow-same-origin`: Allow cookies and localStorage
- `allow-scripts`: Allow JavaScript execution
- `allow-forms`: Allow form submission
- `allow-popups`: Allow popups for OAuth

### Message Origin Validation

Only messages from `prabhatravib.workers.dev` are accepted:

```typescript
if (!event.origin.includes('prabhatravib.workers.dev')) {
  return;
}
```

### CORS Configuration

Ensure your hexagon worker has appropriate CORS headers:

```typescript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}
```

## Troubleshooting

### Voice Worker Not Loading

1. Check browser console for errors
2. Verify hexaWorkerUrl is correct
3. Check network tab for failed requests
4. Ensure CORS is properly configured

### Data Not Sending

1. Check that events array is not empty
2. Verify sessionId is generated
3. Look for deduplication logs ("Skipping duplicate...")
4. Check API endpoint response

### Session Issues

1. Session clears on page reload (expected behavior)
2. Check sessionManager logs in console
3. Verify session ID in iframe URL

### Performance Issues

1. Data sends only when changed (deduplication)
2. Weather data cached for 6 hours
3. iframe only loads when expanded

## Future Enhancements

- [ ] Add voice command feedback in UI
- [ ] Display transcriptions in calendar
- [ ] Support for event creation via voice
- [ ] Session persistence across page reloads
- [ ] Offline support with service workers
- [ ] Multiple voice worker instances
- [ ] Custom voice worker themes

## Support

For issues with:
- **Calendar Integration**: Check this file and App.tsx
- **Hexagon Worker**: Check the hexagon worker repository
- **Session Management**: Check sessionManager.ts

## Version History

- **v1.0.0** (2025-10-03): Initial implementation
  - Basic voice worker integration
  - Session management
  - Calendar and weather data sync

