
import { formatTime } from '../../lib/date';
import type { Event as EventType } from '../../lib/api';

interface EventProps {
  event: EventType;
  isSelected?: boolean;
  onClick?: (event: EventType) => void;
  className?: string;
}

export function Event({ event, isSelected, onClick, className = '' }: EventProps) {
  const handleClick = () => {
    onClick?.(event);
  };

  const startTime = new Date(event.start);
  const endTime = new Date(event.end);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes

  // Get event type styling based on eventType
  const getEventTypeStyling = () => {
    const eventType = event.eventType?.toLowerCase() || 'other';
    
    switch (eventType) {
      case 'fun':
        return {
          bg: 'bg-pink-100',
          border: 'border-pink-300',
          text: 'text-pink-800',
          hover: 'hover:bg-pink-50'
        };
      case 'work':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-300',
          text: 'text-blue-800',
          hover: 'hover:bg-blue-50'
        };
      case 'other':
      default:
        return {
          bg: 'bg-green-100',
          border: 'border-green-300',
          text: 'text-green-800',
          hover: 'hover:bg-green-50'
        };
    }
  };

  const eventStyling = getEventTypeStyling();

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-2 text-xs rounded border cursor-pointer transition-colors
        ${isSelected 
          ? 'bg-blue-100 border-blue-300 text-blue-800' 
          : `${eventStyling.bg} ${eventStyling.border} ${eventStyling.text} ${eventStyling.hover}`
        }
        ${duration <= 30 ? 'flex items-center' : 'flex-col'}
        ${className}
      `}
      style={{
        minHeight: `${Math.max(20, duration)}px`,
      }}
    >
      <div className="font-medium truncate">{event.title}</div>
      
      {duration > 30 && event.description && (
        <div className="text-gray-600 truncate mt-1">
          {event.description}
        </div>
      )}
      
      <div className="text-gray-500 mt-1">
        {formatTime(startTime)} - {formatTime(endTime)}
      </div>
    </div>
  );
}
