import { useEffect, useRef, useState } from 'react';
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

  // Get location from context
  const { location } = useLocation();

  // Use weather-aware hook for indicator colors
  const { indicatorColor, weatherData } = useWeatherAwareMinuteIndicator(location);

  useEffect(() => {
    const updateMinute = () => {
      const now = new Date();
      const minute = now.getMinutes().toString().padStart(2, '0');
      setCurrentMinute(minute);
    };

    const updatePosition = () => {
      // Find the calendar container
      const calendarContainer = document.querySelector('.calendar-week-view, .calendar-day-view');
      if (!calendarContainer) {
        setIsVisible(false);
        return;
      }

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Find the calendar grid
      const calendarGrid = calendarContainer.querySelector('.grid');
      if (!calendarGrid) {
        setIsVisible(false);
        return;
      }

      // Find time labels using the same selector as CurrentTimeLine
      let timeLabels = calendarGrid.querySelectorAll('div[class*="text-sm text-gray-600"]');
      if (timeLabels.length === 0) {
        // Try alternative selectors
        const altLabels = calendarGrid.querySelectorAll('div.text-sm, div[style*="height: 60px"]');
        if (altLabels.length === 0) {
          setIsVisible(false);
          return;
        }
        timeLabels = altLabels;
      }

      // Find the current hour label
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
        setIsVisible(false);
        return;
      }

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
    };

    // Initial update
    updateMinute();
    updatePosition();

    // Update every 15 seconds
    const minuteInterval = setInterval(updateMinute, 15000);
    const positionInterval = setInterval(updatePosition, 15000);

    // Update position on scroll and resize
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Update position when calendar view changes
    const calendarContainer = document.querySelector('.calendar-week-view, .calendar-day-view');
    if (calendarContainer) {
      calendarContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      clearInterval(minuteInterval);
      clearInterval(positionInterval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (calendarContainer) {
        calendarContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

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
