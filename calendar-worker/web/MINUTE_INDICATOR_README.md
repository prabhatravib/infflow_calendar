# Minute Indicator Implementation

## Overview

The Minute Indicator is a feature that displays the current minute on the timeline in day and week views of the calendar. It shows a small vertical bar with the current minute number (e.g., "45") positioned at the current time on the right edge of the time axis.

## Features

- **Real-time Updates**: Updates every 15 seconds to show the current minute
- **Visual Indicator**: Small vertical blue bar with minute label
- **Responsive Positioning**: Automatically adjusts position when scrolling or resizing
- **Theme Support**: Adapts to light/dark themes
- **Mobile Responsive**: Optimized for different screen sizes

## Implementation Details

### Components

1. **MinuteIndicator.tsx** - React component that renders the indicator
2. **MinuteIndicator.css** - Styling for the indicator

### Integration

The minute indicator is integrated into:
- **DayView.tsx** - Shows current minute in day view
- **WeekView.tsx** - Shows current minute in week view

### Positioning Logic

The indicator calculates its position by:
1. Finding the current hour label in the calendar grid
2. Calculating the minute offset within the current hour
3. Positioning the indicator at the right edge of the time axis column

### Update Frequency

- **Minute Updates**: Every 15 seconds (15000ms)
- **Position Updates**: On scroll, resize, and calendar view changes

## CSS Classes

- `.minute-indicator-container` - Main container for the indicator
- `.minute-indicator-line` - Vertical line indicator
- `.minute-indicator-minute` - Minute number label

## Styling

- **Line**: 2px wide, 14px tall, blue color with subtle shadow
- **Label**: 12px font, bold weight, with background and shadow
- **Colors**: Blue (#3b82f6) for light theme, lighter blue (#60a5fa) for dark theme
- **Positioning**: Absolute positioning with high z-index (1000)

## Browser Support

- Modern browsers with CSS Grid support
- Responsive design for mobile devices
- Dark mode support via `prefers-color-scheme`

## Usage

The minute indicator is automatically displayed when viewing day or week views. No additional configuration is required.

## Customization

To customize the indicator:
1. Modify `MinuteIndicator.css` for styling changes
2. Update `MinuteIndicator.tsx` for behavior changes
3. Adjust positioning values in CSS for different layouts

## Troubleshooting

If the indicator is not visible:
1. Check browser console for positioning logs
2. Verify calendar grid structure matches expected selectors
3. Ensure CSS is properly imported
4. Check z-index values for overlapping issues
