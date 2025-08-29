# Current Time Line Feature

## Overview

The Current Time Line feature displays a horizontal line across the calendar grid that indicates the current time position. This line extends from the time axis column to the right edge of the calendar, providing a visual reference for the current time.

## Components

### CurrentTimeLine.tsx

The main component that renders the horizontal current time line. It:

- Calculates the current time position based on the current hour and minute
- Positions the line horizontally across the calendar grid
- Updates every 15 seconds to stay synchronized with the current time
- Responds to scroll and resize events to maintain correct positioning
- Uses weather-aware colors (inherited from the MinuteIndicator system)

## Integration

The `CurrentTimeLine` component is integrated into:

1. **WeekView** - Shows the line across the weekly calendar grid
2. **DayView** - Shows the line across the daily calendar grid

## Features

- **Real-time updates**: Updates every 15 seconds to show current time
- **Responsive positioning**: Automatically adjusts when scrolling or resizing
- **Weather-aware colors**: Changes color based on weather conditions
- **Non-intrusive**: Uses `pointerEvents: 'none'` so it doesn't interfere with calendar interactions
- **High z-index**: Positioned above calendar content but below modals

## Technical Details

### Positioning Logic

The component calculates the line position by:

1. Finding the current hour label in the calendar grid
2. Calculating the minute offset within the current hour
3. Positioning the line at the calculated vertical position
4. Extending horizontally from the time axis (80px) to the right edge

### CSS Classes

- `.current-time-line-container` - Main container with absolute positioning
- `.current-time-line` - The actual horizontal line element

### Dependencies

- `useWeatherAwareMinuteIndicator` hook for weather-based colors
- `useLocation` context for location-based weather data

## Usage

The component is automatically included in time-based calendar views and requires no additional configuration. It will:

- Show when the calendar is visible
- Hide when the calendar grid cannot be found
- Update automatically as time progresses
- Maintain correct positioning during user interactions

## Styling

The line uses:
- 2px height for visibility
- Weather-aware colors for visual consistency
- Smooth transitions for color changes
- Rounded corners for a polished appearance
