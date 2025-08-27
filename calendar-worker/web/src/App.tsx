import { useState, useEffect } from 'react';
import { Calendar } from './components/calendar/Calendar';
import { EventModal } from './components/calendar/EventModal';
import { Sidebar, EventFilters } from './components/calendar/Sidebar';
import { LocationProvider } from './lib/contexts/LocationContext';
import { fetchEvents, createEvent, updateEvent, deleteEvent, seedDemoData } from './lib/api';
import type { Event } from './lib/api';
import { useEventFiltering } from './lib/hooks/useEventFiltering';

const DEMO_CALENDAR_ID = '3c414e29-a3c3-4350-a334-5585cb22737a';

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<number | undefined>(undefined);

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

  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];

  // Use the event filtering hook
  const { filteredEvents, updateFilter, getFilterStats } = useEventFiltering(safeEvents);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      
      // Seed demo data first
      await seedDemoData();
      
      // Fetch events for the current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const fetchedEvents = await fetchEvents(
        DEMO_CALENDAR_ID,
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      
      // Ensure fetchedEvents is always an array
      const safeFetchedEvents = Array.isArray(fetchedEvents) ? fetchedEvents : [];
      setEvents(safeFetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      // If calendar doesn't exist yet, create it and try again
      if (error instanceof Error && error.message.includes('Failed to fetch events')) {
        await seedDemoData();
        await loadEvents();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setSelectedDate(date);
    setSelectedHour(hour);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (selectedEvent) {
        // Update existing event
        const updatedEvent = await updateEvent(selectedEvent.id, eventData);
        setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
      } else {
        // Create new event
        const newEvent = await createEvent({
          ...eventData,
          calendar_id: DEMO_CALENDAR_ID
        });
        setEvents(prev => [...prev, newEvent]);
      }
      
      setIsModalOpen(false);
      setSelectedEvent(null);
      setSelectedDate(undefined);
      setSelectedHour(undefined);
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const handleFilterChange = (filters: EventFilters) => {
    // Update individual filters
    Object.entries(filters).forEach(([key, value]) => {
      updateFilter(key as keyof EventFilters, value);
    });
  };

  // Calendar Skeleton Component - Clean single loading animation
  const CalendarSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-8">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        {/* Single elegant loading spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        
        {/* Loading text */}
        <div className="mt-6 text-lg font-medium text-gray-600">
          Loading calendar...
        </div>
        
        {/* Subtle pulse animation for the text */}
        <div className="mt-2 text-sm text-gray-400 animate-pulse">
          Please wait while the calendar loads...
        </div>
      </div>
    </div>
  );

  const filterStats = getFilterStats();

  return (
    <LocationProvider defaultLocation="New York">
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Left Sidebar */}
          <Sidebar onFilterChange={handleFilterChange} />
          
          {/* Main Content Area */}
          <div className="flex-1 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-800">Calendar</h1>
                <button
                  id="import-google-calendar"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  onClick={() => window.location.href = '/oauth/google/start'}
                >
                  <span id="google-calendar-status" className="text-sm">📅</span>
                  <span id="google-calendar-btn-text">Import Google Calendar</span>
                </button>
              </div>
              {!isLoading && (
                <div className="text-sm text-gray-600">
                  Showing {filterStats.visible} of {filterStats.total} events
                  {filterStats.hidden > 0 && ` (${filterStats.hidden} hidden)`}
                </div>
              )}
            </div>
            
            {isLoading ? (
              <CalendarSkeleton />
            ) : (
              <Calendar
                events={filteredEvents}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onTimeSlotClick={handleTimeSlotClick}
              />
            )}
          </div>
        </div>
        
        <EventModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
            setSelectedDate(undefined);
            setSelectedHour(undefined);
          }}
          event={selectedEvent}
          calendarId={DEMO_CALENDAR_ID}
          selectedDate={selectedDate}
          selectedHour={selectedHour}
          onSave={handleSaveEvent}
          onDelete={selectedEvent ? handleDeleteEvent : undefined}
          onEventsRefresh={loadEvents}
        />
      </div>
    </LocationProvider>
  );
}
