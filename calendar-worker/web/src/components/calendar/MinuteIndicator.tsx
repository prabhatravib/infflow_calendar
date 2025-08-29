import { useEffect, useRef, useState, useCallback } from 'react';
import { useWeatherAwareMinuteIndicator } from '../../lib/hooks/useWeatherAwareMinuteIndicator';
import { useLocation } from '../../lib/contexts/LocationContext';

interface MinuteIndicatorProps {
  className?: string;
}

export function MinuteIndicator({ className = '' }: MinuteIndicatorProps) {
  const [currentMinute, setCurrentMinute] = useState<string>('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const lineRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 10;

  // Get location from context
  const { location } = useLocation();

  // Use weather-aware hook for indicator colors
  const { indicatorColor, weatherData } = useWeatherAwareMinuteIndicator(location);

  const updateMinute = useCallback(() => {
    const now = new Date();
    const minute = now.getMinutes().toString().padStart(2, '0');
    setCurrentMinute(minute);
  }, []);

  const updatePosition = useCallback(() => {
    // Find the calendar container
    const calendarContainer = document.querySelector('.calendar-week-view, .calendar-day-view');
    if (!calendarContainer) {
      // Retry if container not found and we haven't exceeded max retries
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        setTimeout(updatePosition, 100); // Retry after 100ms
      }
      setIsVisible(false);
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Find the calendar grid
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

    // Find time labels - try multiple selectors
    let timeLabels = calendarGrid.querySelectorAll('div[class*="text-sm text-gray-600"]');
    if (timeLabels.length === 0) {
      // Try alternative selectors
      timeLabels = calendarGrid.querySelectorAll('div.text-sm');
      if (timeLabels.length === 0) {
        // Try finding by content pattern
        const allDivs = calendarGrid.querySelectorAll('div');
        const potentialLabels: Element[] = [];
        allDivs.forEach(div => {
          const text = div.textContent?.trim();
          if (text && /^\d{1,2}:\d{2}(\s*(AM|PM))?$/.test(text)) {
            potentialLabels.push(div);
          }
        });
        // Use potentialLabels directly for iteration
        if (potentialLabels.length > 0) {
          timeLabels = potentialLabels as unknown as NodeListOf<Element>;
        }
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
    
    // Calculate top position based on current hour + minute offset
    const hourHeight = 60; // Each hour is 60px
    const minuteOffset = (currentMinute / 60) * hourHeight;
    const topPosition = (labelRect.top - calendarRect.top) + minuteOffset;
    
    // Position on the right edge of the time axis column
    const leftPosition = 78; // 80px width - 2px margin

    setPosition({
      top: topPosition,
      left: leftPosition
    });
    
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Initial update with a small delay to ensure DOM is ready
    updateMinute();
    
    // Use requestAnimationFrame to ensure browser has painted
    requestAnimationFrame(() => {
      // Add a small additional delay for complex layouts
      setTimeout(() => {
        updatePosition();
      }, 50);
    });

    // Update every 15 seconds
    const minuteInterval = setInterval(updateMinute, 15000);
    const positionInterval = setInterval(() => {
      updatePosition();
    }, 15000);

    // Update position on scroll and resize
    const handleScroll = () => {
      requestAnimationFrame(updatePosition);
    };
    const handleResize = () => {
      requestAnimationFrame(updatePosition);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Update position when calendar view changes
    const calendarContainer = document.querySelector('.calendar-week-view, .calendar-day-view');
    if (calendarContainer) {
      calendarContainer.addEventListener('scroll', handleScroll, { passive: true });
      
      // Also observe for DOM changes in case calendar rerenders
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
        clearInterval(minuteInterval);
        clearInterval(positionInterval);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        calendarContainer.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }

    return () => {
      clearInterval(minuteInterval);
      clearInterval(positionInterval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateMinute, updatePosition]);

  // Update indicator color when weather changes
  useEffect(() => {
    if (lineRef.current && labelRef.current) {
      lineRef.current.style.backgroundColor = indicatorColor.color;
      lineRef.current.style.opacity = indicatorColor.opacity.toString();
      labelRef.current.style.color = indicatorColor.color;
      labelRef.current.style.opacity = indicatorColor.opacity.toString();
    }
  }, [indicatorColor]);

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className={`minute-indicator-container ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      {/* Vertical line indicator */}
      <div
        ref={lineRef}
        className="minute-indicator-line"
        style={{
          position: 'absolute',
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: '2px',
          height: '14px',
          backgroundColor: indicatorColor.color,
          borderRadius: '2px',
          transform: 'translateY(-50%)',
          zIndex: 9,
          opacity: indicatorColor.opacity,
          transition: 'background-color 0.3s ease, opacity 0.3s ease'
        }}
      />
      
      {/* Minute label */}
      <div
        ref={labelRef}
        className="minute-indicator-minute"
        style={{
          position: 'absolute',
          top: `${position.top}px`,
          left: `${position.left - 10}px`,
          fontSize: '12px',
          fontWeight: 600,
          lineHeight: 1,
          color: indicatorColor.color,
          transform: 'translate(-100%, -50%)',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: indicatorColor.opacity,
          transition: 'color 0.3s ease, opacity 0.3s ease'
        }}
      >
        {currentMinute}
        {weatherData && (
          <span 
            className="ml-1 text-xs opacity-75"
            style={{ color: indicatorColor.color }}
          >
            {weatherData.forecast?.daily?.weathercode?.[0] === 0 ? '☀️' : '☁️'}
          </span>
        )}
      </div>
    </div>
  );
}
