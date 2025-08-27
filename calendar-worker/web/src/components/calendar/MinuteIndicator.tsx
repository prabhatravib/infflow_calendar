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
      // Find the current time position in the calendar
      const calendarGrid = document.querySelector('.calendar-week-view .grid, .calendar-day-view .grid');
      if (!calendarGrid) {
        setIsVisible(false);
        return;
      }

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Find time labels to determine actual positions
      const timeLabels = calendarGrid.querySelectorAll('div[class*="text-xs text-gray-500"], div[class*="text-sm text-gray-600"]');
      if (timeLabels.length === 0) {
        setIsVisible(false);
        return;
      }

      // Find the current hour label
      let currentHourLabel = null;
      for (const label of timeLabels) {
        const text = label.textContent?.trim();
        if (text === `${currentHour.toString().padStart(2, '0')}:00` || text === `${currentHour}:00`) {
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
      
      // Calculate left position (right edge of the time axis)
      const leftPosition = 80; // Width of time axis column

      console.log('Minute indicator positioning:', {
        currentHour,
        currentMinute,
        hourHeight,
        minuteOffset,
        topPosition,
        leftPosition,
        labelRect: labelRect.top - calendarRect.top
      });

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
    const calendarGrid = document.querySelector('.calendar-week-view .grid, .calendar-day-view .grid');
    if (calendarGrid) {
      calendarGrid.addEventListener('scroll', handleScroll);
    }

    return () => {
      clearInterval(minuteInterval);
      clearInterval(positionInterval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (calendarGrid) {
        calendarGrid.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Update indicator color when weather changes
  useEffect(() => {
    if (lineRef.current && labelRef.current) {
      // Apply weather-based color to both line and label
      lineRef.current.style.backgroundColor = indicatorColor.color;
      lineRef.current.style.opacity = indicatorColor.opacity.toString();
      labelRef.current.style.color = indicatorColor.color;
      labelRef.current.style.opacity = indicatorColor.opacity.toString();
    }
  }, [indicatorColor]);

  if (!isVisible) return null;

  // Get weather description for tooltip
  const weatherDescription = weatherData?.forecast?.daily?.weathercode?.[0]
    ? `Weather: ${weatherData.forecast.daily.weathercode[0] === 0 ? 'Clear' : 'Cloudy/Rainy'}`
    : '';

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
      title={weatherDescription}
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

             {/* Weather info tooltip */}
       {weatherData && (
         <div
           style={{
             position: 'absolute',
             top: `${position.top + 20}px`,
             left: `${position.left - 50}px`,
             fontSize: '10px',
             color: indicatorColor.color,
             opacity: 0.7,
             pointerEvents: 'none',
             userSelect: 'none',
             zIndex: 1000,
             background: 'rgba(255, 255, 255, 0.9)',
             padding: '2px 4px',
             borderRadius: '3px'
           }}
         >
           <div>Weather: {weatherData.forecast?.daily?.weathercode?.[0] === 0 ? 'Clear' : 'Cloudy'}</div>
         </div>
       )}
    </div>
  );
}
