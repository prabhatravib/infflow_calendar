# Sleep Toggles for Calendar Worker

This document explains the sleep toggles functionality that has been added to the calendar worker repository, adapted from the calendar integration repo.

## Overview

The sleep toggles provide users with the ability to hide/show early hours (12 AM - 6 AM) and late hours (10 PM - 12 AM) in the calendar views. This is particularly useful for focusing on business hours and reducing visual clutter.

## Features

### Early Hours Toggle (🌅)
- **Default State**: Visible (12 AM - 6 AM)
- **Collapsed State**: Hidden (starts from 6 AM)
- **Button Text**: "Hide Early Hours" / "Show Early Hours"

### Late Hours Toggle (🌙)
- **Default State**: Visible (10 PM - 12 AM)
- **Collapsed State**: Hidden (ends at 10 PM)
- **Button Text**: "Hide Late Hours" / "Show Late Hours"

## Components

### SleepToggles Component
Located at: `src/components/calendar/SleepToggles.tsx`

A React component that renders two toggle buttons for controlling early and late hour visibility.

**Props:**
- `onEarlyHoursToggle?: (collapsed: boolean) => void` - Callback when early hours toggle changes
- `onLateHoursToggle?: (collapsed: boolean) => void` - Callback when late hours toggle changes
- `className?: string` - Additional CSS classes

### CSS Styles
Located at: `src/components/calendar/SleepToggles.css`

Provides styling for the toggle buttons, including:
- Button appearance and hover effects
- Responsive design for mobile devices
- Dark theme support
- Collapsed state styling

## Integration

### WeekView Component
The sleep toggles are integrated into the WeekView component, allowing users to:
- Hide early hours (12 AM - 6 AM) to focus on business hours
- Hide late hours (10 PM - 12 AM) to focus on daytime activities
- Toggle visibility independently for each time range

### DayView Component
The sleep toggles are also integrated into the DayView component, providing the same functionality for single-day views.

## Utility Functions

### Hour Filtering Utilities
Located at: `src/lib/utils/hourFiltering.ts`

**Functions:**
- `isEarlyHour(hour: number): boolean` - Check if hour is early (12 AM - 6 AM)
- `isLateHour(hour: number): boolean` - Check if hour is late (10 PM - 12 AM)
- `filterHoursBySleepToggles(hours: Date[], earlyCollapsed: boolean, lateCollapsed: boolean): Date[]` - Filter hours based on toggle states
- `getEffectiveTimeRange(earlyCollapsed: boolean, lateCollapsed: boolean): { startHour: number, endHour: number }` - Get effective time range

### Custom Hook
Located at: `src/lib/hooks/useSleepToggles.ts`

A React hook that manages sleep toggle state:

```typescript
const {
  earlyHoursCollapsed,
  lateHoursCollapsed,
  toggleEarlyHours,
  toggleLateHours,
  setEarlyHoursCollapsed,
  setLateHoursCollapsed,
  resetToggles,
} = useSleepToggles();
```

## Usage Example

```typescript
import { SleepToggles } from './SleepToggles';

function CalendarView() {
  const [earlyHoursCollapsed, setEarlyHoursCollapsed] = useState(false);
  const [lateHoursCollapsed, setLateHoursCollapsed] = useState(false);

  const handleEarlyHoursToggle = (collapsed: boolean) => {
    setEarlyHoursCollapsed(collapsed);
  };

  const handleLateHoursToggle = (collapsed: boolean) => {
    setLateHoursCollapsed(collapsed);
  };

  return (
    <div className="calendar-view">
      <SleepToggles
        onEarlyHoursToggle={handleEarlyHoursToggle}
        onLateHoursToggle={handleLateHoursToggle}
      />
      {/* Calendar content */}
    </div>
  );
}
```

## Styling

The sleep toggles use Tailwind CSS classes and custom CSS for:
- Button positioning (absolute positioning in top-right corner)
- Responsive design (smaller buttons on mobile)
- Hover effects and transitions
- Dark theme support via `prefers-color-scheme` media query

## Browser Support

The sleep toggles work in all modern browsers and include:
- CSS Grid and Flexbox for layout
- CSS transitions for smooth animations
- Media queries for responsive design
- CSS custom properties for theming

## Deployment

To deploy the calendar worker with sleep toggles:

1. Build the project: `npm run build`
2. Deploy using the existing deployment scripts
3. The sleep toggles will be automatically included in the built bundle

## Future Enhancements

Potential improvements for the sleep toggles:
- Persist toggle state in localStorage
- Add keyboard shortcuts for toggling
- Integrate with user preferences
- Add animation for smooth hour transitions
- Support for custom time ranges
