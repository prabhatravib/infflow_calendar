import { useState, useEffect } from 'react';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { DayView } from './DayView';
import { ListView } from './ListView';
import type { Event } from '../../lib/api';
import { getNavigationDates, type View } from '../../lib/date';

interface CalendarProps {
  events: Event[];
  currentView: View;
  currentDate: Date;
  onEventClick?: (event: Event) => void;
  onDateClick?: (date: Date) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onViewChange?: (view: View) => void;
  onDateChange?: (date: Date) => void;
  className?: string;
}

export function Calendar({ 
  events, 
  currentView,
  currentDate,
  onEventClick, 
  onDateClick, 
  onTimeSlotClick, 
  onViewChange,
  onDateChange,
  className = '' 
}: CalendarProps) {
  // Remove internal state - use props from parent instead
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];

  // Set all events directly from props
  useEffect(() => {
    setAllEvents(safeEvents);
  }, [safeEvents]);

  const handleViewChange = (view: View) => {
    // Don't set internal state - let parent handle it
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const { prev, next } = getNavigationDates(currentDate, currentView);
    const newDate = direction === 'prev' ? prev : next;
    
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const handleToday = () => {
    const today = new Date();
    if (onDateChange) {
      onDateChange(today);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'month':
        return (
          <MonthView
            date={currentDate}
            events={allEvents}
            onEventClick={onEventClick}
            onDateClick={onDateClick}
          />
        );
      case 'week':
        return (
          <WeekView
            date={currentDate}
            events={allEvents}
            onEventClick={onEventClick}
            onTimeSlotClick={onTimeSlotClick}
          />
        );
      case 'day':
        return (
          <DayView
            date={currentDate}
            events={allEvents}
            onEventClick={onEventClick}
            onTimeSlotClick={onTimeSlotClick}
          />
        );
      case 'list':
        return (
          <ListView
            events={allEvents}
            onEventClick={onEventClick}
          />
        );
      default:
        return (
          <WeekView
            date={currentDate}
            events={allEvents}
            onEventClick={onEventClick}
            onTimeSlotClick={onTimeSlotClick}
          />
        );
    }
  };

  return (
    <div className={`calendar ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          {/* Left side - View selector */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewChange('week')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'week'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleViewChange('month')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'month'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleViewChange('day')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'day'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => handleViewChange('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              List
            </button>
          </div>

          {/* Center - Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleDateChange('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900">
              {currentView === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {currentView === 'week' && `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              {currentView === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {currentView === 'list' && 'All Events'}
            </h2>
            
            <button
              onClick={() => handleDateChange('next')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Right side - Today button */}
          <div>
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar view */}
        <div className="flex-1 overflow-auto">
          {renderView()}
        </div>
      </div>
    </div>
  );
}
