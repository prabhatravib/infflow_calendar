import { useEffect, useRef, useState } from 'react';
import { useWeatherAwareMinuteIndicator } from '../../lib/hooks/useWeatherAwareMinuteIndicator';
import { useLocation } from '../../lib/contexts/LocationContext';

interface CurrentTimeLineProps {
  isWeekView?: boolean;
}

export function CurrentTimeLine({ isWeekView = false }: CurrentTimeLineProps) {
  const [position, setPosition] = useState({ top: 0, left: 80 });
  const lineRef = useRef<HTMLDivElement>(null);

  // Get location from context
  const { location } = useLocation();

  // Use weather-aware hook for indicator colors
  const { indicatorColor } = useWeatherAwareMinuteIndicator(location);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // For week view, use the EXACT same vertical positioning logic as MinuteIndicator
      let topPosition = 0;
      let leftPosition = 80; // Start after time column
      
      if (isWeekView) {
        const calendarContainer = document.querySelector('.calendar-week-view');
        if (!calendarContainer) {
          return;
        }

        const calendarGrid = calendarContainer.querySelector('.grid');
        if (!calendarGrid) {
          return;
        }

        // Find time labels using the same selector as MinuteIndicator
        let timeLabels = calendarGrid.querySelectorAll('div[class*="text-sm text-gray-600"]');
        if (timeLabels.length === 0) {
          // Try alternative selectors
          const altLabels = calendarGrid.querySelectorAll('div.text-sm, div[style*="height: 60px"]');
          if (altLabels.length === 0) {
            return;
          }
          timeLabels = altLabels;
        }

        // Find the current hour label (same logic as MinuteIndicator)
        let currentHourLabel = null;
        for (const label of timeLabels) {
          const text = label.textContent?.trim();
          // Look for time format like "14:00", "2:00", "2:00 PM", etc.
          if (text && (
            text === `${currentHour.toString().padStart(2, '0')}:00` || 
            text === `${currentHour}:00` ||
            text.includes(`${currentHour}:00`) ||
            text.includes(`${currentHour.toString().padStart(2, '0')}:00`) ||
            text.includes(`${currentHour}:00 AM`) ||
            text.includes(`${currentHour}:00 PM`)
          )) {
            currentHourLabel = label;
            break;
          }
        }

        if (!currentHourLabel) {
          return;
        }

        // Calculate top position using EXACT same logic as MinuteIndicator
        const calendarRect = calendarGrid.getBoundingClientRect();
        const labelRect = currentHourLabel.getBoundingClientRect();
        
        const hourHeight = 60; // Each hour is 60px
        const minuteOffset = (currentMinute / 60) * hourHeight;
        topPosition = (labelRect.top - calendarRect.top) + minuteOffset;
        
        // Get the current day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = now.getDay();
        
        // Convert to Monday-first calendar (Monday = 0, Sunday = 6)
        // JavaScript: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
        // Calendar: 0=Monday, 1=Tuesday, 2=Wednesday, ..., 6=Sunday
        let calendarDayIndex;
        if (dayOfWeek === 0) { // Sunday
          calendarDayIndex = 6; // Last column (index 6)
        } else {
          calendarDayIndex = dayOfWeek - 1; // Monday=0, Tuesday=1, etc.
        }
        
        // Calculate the width of each day column
        const gridWidth = calendarGrid.clientWidth;
        const availableWidth = gridWidth - 80; // Subtract time column width
        const columnWidth = availableWidth / 7;
        leftPosition = 80 + (calendarDayIndex * columnWidth);
      } else {
        // For day view, use simple calculation
        const totalMinutes = currentHour * 60 + currentMinute;
        topPosition = totalMinutes;
      }
      
      setPosition({ top: topPosition, left: leftPosition });
    };

    // Initial update
    updatePosition();

    // Update every minute
    const interval = setInterval(updatePosition, 60000);
    
    // Update on window resize
    window.addEventListener('resize', updatePosition);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isWeekView]);

  // Calculate width based on view type
  const getLineWidth = () => {
    if (isWeekView) {
      // For week view, the line should span only one day column
      return 'calc((100% - 80px) / 7)';
    } else {
      // For day view, span the full width minus time column
      return 'calc(100% - 80px)';
    }
  };

  return (
    <div
      ref={lineRef}
      className="current-time-line"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: getLineWidth(),
        height: '2px',
        backgroundColor: indicatorColor.color,
        borderRadius: '1px',
        transform: 'translateY(-50%)',
        zIndex: 8,
        opacity: indicatorColor.opacity,
        transition: 'background-color 0.3s ease, opacity 0.3s ease, left 0.3s ease'
      }}
    />
  );
}
