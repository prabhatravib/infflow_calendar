import { useState, useEffect } from 'react';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { DayView } from './DayView';
import { ListView } from './ListView';
import type { Event } from '../../lib/api';
import { getNavigationDates, type View } from '../../lib/date';

interface CalendarProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onDateClick?: (date: Date) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  className?: string;
}

export function Calendar({ events, onEventClick, onDateClick, onTimeSlotClick, className = '' }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];

  // Set all events directly from props
  useEffect(() => {
    setAllEvents(safeEvents);
  }, [safeEvents]);

  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const { prev, next } = getNavigationDates(currentDate, currentView);
    setCurrentDate(direction === 'prev' ? prev : next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Handle Google Calendar import
  const handleGoogleCalendarImport = () => {
    // Start OAuth flow by redirecting to the worker
    // No need to pass user_id - it's handled by the environment
    window.location.href = '/oauth/google/start';
  };

  // Check for Google Calendar import success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google_import') === 'success') {
      // Update button state to show success
      const btn = document.getElementById('import-google-calendar') as HTMLButtonElement;
      const status = document.getElementById('google-calendar-status') as HTMLSpanElement;
      const text = document.getElementById('google-calendar-btn-text') as HTMLSpanElement;
      
      if (btn && status && text) {
        status.textContent = '✓';
        status.style.color = 'green';
        status.style.fontWeight = 'bold';
        text.textContent = 'Google Calendar Connected';
        btn.disabled = true;
        btn.className = 'px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-md cursor-not-allowed flex items-center space-x-2';
      }
      
      // Show success notification
      const notif = document.createElement('div');
      notif.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      notif.textContent = 'Google Calendar imported successfully!';
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 3500);
    }
  }, []);

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
        return null;
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

          {/* Right side - Today button and Google Calendar import */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Today
            </button>
            
            {/* Google Calendar Import Button */}
            <button
              id="import-google-calendar"
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              onClick={handleGoogleCalendarImport}
            >
              <span id="google-calendar-status" className="text-sm">📅</span>
              <span id="google-calendar-btn-text">Import Google Calendar</span>
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
