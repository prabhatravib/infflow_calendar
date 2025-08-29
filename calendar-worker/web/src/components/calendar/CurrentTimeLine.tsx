import { useEffect, useRef, useState, useCallback } from 'react';
import { useWeatherAwareMinuteIndicator } from '../../lib/hooks/useWeatherAwareMinuteIndicator';
import { useLocation } from '../../lib/contexts/LocationContext';

interface CurrentTimeLineProps {
  isWeekView?: boolean;
}

export function CurrentTimeLine({ isWeekView = false }: CurrentTimeLineProps) {
  const [position, setPosition] = useState({ top: 0, left: 80 });
  const [isVisible, setIsVisible] = useState(false);
  const lineRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 10;

  // Get location from context
  const { location } = useLocation();

  // Use weather-aware hook for indicator colors
  const { indicatorColor } = useWeatherAwareMinuteIndicator(location);

  const updatePosition = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    let topPosition = 0;
    let leftPosition = 80; // Start after time column
    
    if (isWeekView) {
      const calendarContainer = document.querySelector('.calendar-week-view');
      if (!calendarContainer) {
        // Retry if container not found
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          setTimeout(updatePosition, 100);
        }
        setIsVisible(false);
        return;
      }

      const calendarGrid = calendarContainer.querySelector('.grid');
      if (!calendarGrid) {
        // Retry if grid not found
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          setTimeout(updatePosition, 100);
        }
        setIsVisible(false);
        return;
      }

      // Find time labels
      let timeLabels = calendarGrid.querySelectorAll('div[class*="text-sm text-gray-600"]');
      if (timeLabels.length === 0) {
        // Try alternative selectors
        const allDivs = calendarGrid.querySelectorAll('div');
        const potentialLabels: Element[] = [];
        allDivs.forEach(div => {
          const text = div.textContent?.trim();
          if (text && /^\d{1,2}:\d{2}(\s*(AM|PM))?$/.test(text)) {
            potentialLabels.push(div);
          }
        });
        if (potentialLabels.length > 0) {
          timeLabels = potentialLabels as unknown as NodeListOf<Element>;
        }
      }

      if (timeLabels.length === 0) {
        // Retry if no labels found
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          setTimeout(updatePosition, 100);
        }
        setIsVisible(false);
        return;
      }

      // Find the current hour label
      let currentHourLabel = null;
      for (const label of timeLabels) {
        const text = label.textContent?.trim();
        if (!text) continue;
        
        // Check various time formats
        const hour12 = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
        const ampm = currentHour < 12 ? 'AM' : 'PM';
        
        if (
          text === `${currentHour.toString().padStart(2, '0')}:00` || 
          text === `${currentHour}:00` ||
          text === `${hour12}:00 ${ampm}` ||
          text === `${hour12}:00 ${ampm.toLowerCase()}` ||
          text.includes(`${currentHour}:00`) ||
          text.includes(`${currentHour.toString().padStart(2, '0')}:00`)
        ) {
          currentHourLabel = label;
          break;
        }
      }

      if (!currentHourLabel) {
        // Retry if current hour not found
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          setTimeout(updatePosition, 100);
        }
        setIsVisible(false);
        return;
      }

      // Success - reset retry count
      retryCountRef.current = 0;

      const calendarRect = calendarGrid.getBoundingClientRect();
      const labelRect = currentHourLabel.getBoundingClientRect();
      
      const hourHeight = 60; // Each hour is 60px
      const minuteOffset = (currentMinute / 60) * hourHeight;
      topPosition = (labelRect.top - calendarRect.top) + minuteOffset;
      
      // Get the current day of week for week view
      const dayOfWeek = now.getDay();
      let calendarDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const gridWidth = calendarGrid.clientWidth;
      const availableWidth = gridWidth - 80;
      const columnWidth = availableWidth / 7;
      leftPosition = 80 + (calendarDayIndex * columnWidth);
    } else {
      // For day view
      const totalMinutes = currentHour * 60 + currentMinute;
      topPosition = totalMinutes;
    }
    
    setPosition({ top: topPosition, left: leftPosition });
    setIsVisible(true);
  }, [isWeekView]);

  useEffect(() => {
    // Initial update with proper timing
    requestAnimationFrame(() => {
      setTimeout(() => {
        updatePosition();
      }, 50);
    });

    // Update every minute
    const interval = setInterval(updatePosition, 60000);
    
    // Update on window resize
    const handleResize = () => {
      requestAnimationFrame(updatePosition);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Observe DOM changes
    const calendarContainer = document.querySelector('.calendar-week-view, .calendar-day-view');
    if (calendarContainer) {
      const observer = new MutationObserver(() => {
        requestAnimationFrame(updatePosition);
      });
      
      observer.observe(calendarContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });

      return () => {
        clearInterval(interval);
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [updatePosition]);

  // Calculate width based on view type
  const getLineWidth = () => {
    if (isWeekView) {
      return 'calc((100% - 80px) / 7)';
    } else {
      return 'calc(100% - 80px)';
    }
  };

  if (!isVisible) return null;

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
