import { useEffect, useRef, useState } from 'react';
import { useWeatherAwareMinuteIndicator } from '../../lib/hooks/useWeatherAwareMinuteIndicator';
import { useLocation } from '../../lib/contexts/LocationContext';

interface CurrentTimeLineProps {
  isWeekView?: boolean;
}

export function CurrentTimeLine({ isWeekView = false }: CurrentTimeLineProps) {
  const [position, setPosition] = useState({ top: 0 });
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
      
      // Calculate position: each hour is 60px, each minute is 1px
      const totalMinutes = currentHour * 60 + currentMinute;
      const topPosition = totalMinutes;
      
      setPosition({ top: topPosition });
    };

    // Initial update
    updatePosition();

    // Update every minute
    const interval = setInterval(updatePosition, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={lineRef}
      className="current-time-line"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: '80px',
        width: isWeekView ? 'calc(100% / 7)' : 'calc(100% - 80px)',
        height: '2px',
        backgroundColor: indicatorColor.color,
        borderRadius: '1px',
        transform: 'translateY(-50%)',
        zIndex: 8,
        opacity: indicatorColor.opacity,
        transition: 'background-color 0.3s ease, opacity 0.3s ease'
      }}
    />
  );
}
