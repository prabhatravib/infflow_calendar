
import { useMemo, Fragment } from 'react';
import { isSameDay, formatTime } from '../../lib/date';
import { MinuteIndicator } from './MinuteIndicator';
import { CurrentTimeLine } from './CurrentTimeLine';
import { isEarlyHour, isLateHour } from '../../lib/utils';
import { useSleepToggles } from './useSleepToggles';
import { SleepToggleBars } from './SleepToggleBars';
import { useWeatherEvents } from '../../lib/hooks/useWeatherEvents';
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
  
  // Get weather events
  const { weatherEvents } = useWeatherEvents();
  
  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];

  // Combine regular events with weather events
  const allEvents = useMemo(() => {
    const combined = [...safeEvents];
    
    // Add weather events
    weatherEvents.forEach(weatherEvent => {
      const convertedEvent = {
        id: weatherEvent.id,
        title: weatherEvent.title,
        start: weatherEvent.start,
        end: weatherEvent.end,
        all_day: weatherEvent.allDay,
        backgroundColor: weatherEvent.backgroundColor,
        borderColor: weatherEvent.borderColor,
        textColor: weatherEvent.textColor,
        type: weatherEvent.type,
        eventType: 'other', // Use 'other' since weather isn't in the allowed types
        calendar_id: 'weather',
        tz: 'UTC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Event;
      
      combined.push(convertedEvent);
    });
    
    return combined;
  }, [safeEvents, weatherEvents]);

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
    if (!Array.isArray(allEvents)) {
      return [];
    }
    
    return allEvents.filter(event => {
      if (!event || !event.start) {
        return false;
      }
      
      try {
        const eventDate = new Date(event.start);
        if (isNaN(eventDate.getTime())) {
          return false;
        }
        
        // Exclude all-day events (like weather) from hourly grid
        // They will only appear in the all-day section above
        if (event.all_day) {
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
      return 'weather-event';
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
      {/* All-day events section (including weather) */}
      {(() => {
        const allDayEvents = allEvents.filter(event => {
          if (!event || !event.start) return false;
          try {
            const eventDate = new Date(event.start);
            return isSameDay(eventDate, date) && event.all_day;
          } catch (error) {
            return false;
          }
        });
        
        if (allDayEvents.length === 0) return null;
        
        return (
          <div className="all-day-events-section mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">All-day Events</div>
            <div className="space-y-2">
              {allDayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`text-sm p-2 rounded cursor-pointer hover:opacity-80 transition-opacity border ${getEventTypeColor(event)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getEventTypeIcon(event)}</span>
                    <span className="truncate">{event.title || 'Untitled Event'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Time grid - restructured for perfect alignment */}
      <div className="grid" style={{ gridTemplateColumns: '80px 1fr' }}>
        {/* Minute Indicator */}
        <MinuteIndicator />
        
        {/* Current Time Line - horizontal line across the calendar at current time */}
        <CurrentTimeLine isWeekView={false} />
        
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
              {/* Timeline column - hour label - positioned directly on the line */}
              <div
                className={`text-sm text-black border-r border-gray-200 relative ${
                  isEarly ? 'time-slot-early-hours' : ''
                } ${
                  isLate ? 'time-slot-late-hours' : ''
                }`}
                style={{ height: '60px', color: 'black', backgroundColor: 'white' }}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gray-200"></div>
                <div className="absolute top-0 right-2 transform -translate-y-1/2 bg-white px-1">
                  {formatTime(hour, 'HH:mm')}
                </div>
              </div>

              {/* Events column - event content */}
              <div
                className={`p-2 border-t border-gray-200 border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
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
