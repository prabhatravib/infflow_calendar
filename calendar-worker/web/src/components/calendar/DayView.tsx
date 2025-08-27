
import { useMemo, Fragment } from 'react';
import { isSameDay, formatTime } from '../../lib/date';
import { MinuteIndicator } from './MinuteIndicator';
import { isEarlyHour, isLateHour } from '../../lib/utils';
import { useSleepToggles } from './useSleepToggles';
import { SleepToggleBars } from './SleepToggleBars';
import type { Event } from '../../lib/api';

interface DayViewProps {
  date: Date;
  events: Event[];
  onEventClick?: (event: Event) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

export function DayView({ date, events, onEventClick, onTimeSlotClick }: DayViewProps) {
  // Use shared sleep toggle logic
  const {
    earlyHoursCollapsed,
    lateHoursCollapsed,
    filterHoursByToggles,
    calculateTogglePositions,
    handleEarlyHoursToggle,
    handleLateHoursToggle
  } = useSleepToggles();
  
  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];

  // Generate all 24 hours for timeline (always visible)
  const timelineHours = useMemo(() => {
    const allHours = [];
    for (let hour = 0; hour < 24; hour++) {
      allHours.push(new Date(1970, 0, 1, hour));
    }
    return allHours;
  }, []);

  // Filter hours based on sleep toggle states (for event rows only)
  const hours = useMemo(() => {
    try {
      return filterHoursByToggles(timelineHours);
    } catch (error) {
      console.error('Error filtering hours array:', error);
      return timelineHours; // Fallback to showing all hours
    }
  }, [filterHoursByToggles, timelineHours]);

  const getEventsForHour = (hour: number) => {
    if (!Array.isArray(safeEvents)) {
      return [];
    }
    
    return safeEvents.filter(event => {
      if (!event || !event.start) {
        return false;
      }
      
      try {
        const eventDate = new Date(event.start);
        if (isNaN(eventDate.getTime())) {
          return false;
        }
        
        const eventHour = eventDate.getHours();
        return isSameDay(eventDate, date) && eventHour === hour;
      } catch (error) {
        console.error('Error processing event:', event, error);
        return false;
      }
    });
  };

  const getEventTypeColor = (event: Event) => {
    if (event.type === 'weather-warning') {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    
    const eventType = event.eventType || 'other';
    switch (eventType) {
      case 'work':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'fun':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'other':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEventTypeIcon = (event: Event) => {
    if (event.type === 'weather-warning') return '⛈️';
    
    const eventType = event.eventType || 'other';
    switch (eventType) {
      case 'work': return '💼';
      case 'fun': return '🎉';
      case 'other': return '📅';
      default: return '📅';
    }
  };

  // Calculate toggle positions using shared logic
  const togglePositions = useMemo(() => {
    return calculateTogglePositions(hours);
  }, [hours, calculateTogglePositions]);

  return (
    <div className="calendar-day-view relative">
      {/* Time grid - restructured for perfect alignment */}
      <div className="grid" style={{ gridTemplateColumns: '80px 1fr' }}>
        {/* Minute Indicator */}
        <MinuteIndicator />
        
        {/* Early Hours Toggle - rendered at the very top when collapsed */}
        {(() => {
          const { renderEarlyToggleTop } = SleepToggleBars({
            earlyHoursCollapsed,
            lateHoursCollapsed,
            togglePositions,
            onEarlyHoursToggle: handleEarlyHoursToggle,
            onLateHoursToggle: handleLateHoursToggle,
            isWeekView: false
          });
          return renderEarlyToggleTop();
        })()}
        
        {/* Render each hour as a single row spanning both columns */}
        {Array.isArray(hours) && hours.map((hour, hourIndex) => {
          if (!hour || !(hour instanceof Date) || isNaN(hour.getTime())) {
            console.warn('Invalid hour in render:', hour);
            return null;
          }
          
          const hourValue = hour.getHours();
          const isEarly = isEarlyHour(hourValue);
          const isLate = isLateHour(hourValue);
          const hourEvents = getEventsForHour(hourValue);
          
          return (
            <Fragment key={hourIndex}>
              {/* Timeline column - hour label */}
              <div
                className={`p-2 text-sm text-black border-b border-gray-200 border-r border-gray-200 ${
                  isEarly ? 'time-slot-early-hours' : ''
                } ${
                  isLate ? 'time-slot-late-hours' : ''
                }`}
                style={{ height: '60px', color: 'black', backgroundColor: 'white' }}
              >
                {formatTime(hour, 'HH:mm')}
              </div>

              {/* Events column - event content */}
              <div
                className={`p-2 border-b border-gray-200 border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isEarly ? 'time-slot-early-hours' : ''
                } ${
                  isLate ? 'time-slot-late-hours' : ''
                }`}
                style={{ height: '60px' }}
                onClick={() => onTimeSlotClick?.(date, hourValue)}
              >
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 transition-opacity border ${getEventTypeColor(event)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{getEventTypeIcon(event)}</span>
                      <span className="truncate">{event.title}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Insert toggle bars at specific time positions */}
              
              {/* Early Hours Toggle - only show when expanded (collapsed is handled at top) */}
              {(() => {
                const { renderEarlyToggle } = SleepToggleBars({
                  earlyHoursCollapsed,
                  lateHoursCollapsed,
                  togglePositions,
                  onEarlyHoursToggle: handleEarlyHoursToggle,
                  onLateHoursToggle: handleLateHoursToggle,
                  isWeekView: false
                });
                return renderEarlyToggle(hourIndex);
              })()}
              
              {/* Late Hours Toggle */}
              {(() => {
                const { renderLateToggle } = SleepToggleBars({
                  earlyHoursCollapsed,
                  lateHoursCollapsed,
                  togglePositions,
                  onEarlyHoursToggle: handleEarlyHoursToggle,
                  onLateHoursToggle: handleLateHoursToggle,
                  isWeekView: false
                });
                return renderLateToggle(hourIndex);
              })()}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
