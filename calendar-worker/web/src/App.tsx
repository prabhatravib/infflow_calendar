import { useState, useEffect } from 'react';
import { Calendar } from './components/calendar/Calendar';
import { EventModal } from './components/calendar/EventModal';
import { Sidebar, EventFilters } from './components/calendar/Sidebar';
import { LocationProvider } from './lib/contexts/LocationContext';
import { useEventFiltering } from './lib/hooks/useEventFiltering';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from './lib/api';
import type { Event } from './lib/api';
import type { View } from './lib/date';

const DEMO_CALENDAR_ID = '3c414e29-a3c3-4350-a334-5585cb22737a';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState<number | undefined>();
  const [currentView, setCurrentView] = useState<View>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];

  // Use the event filtering hook
  const { filteredEvents, updateFilter, getFilterStats } = useEventFiltering(safeEvents);

  useEffect(() => {
    // Initialize with default values and load events
    const initialView: View = 'week';
    const initialDate = new Date();
    setCurrentView(initialView);
    setCurrentDate(initialDate);
    
    // Load events with initial parameters
    loadEvents(initialView, initialDate);
  }, []);

  // Handle view/date changes after initial load
  useEffect(() => {
    // Skip the first render to avoid duplicate loading
    if (currentView && currentDate) {
      // Only reload if this is not the initial load
      const isInitialLoad = currentView === 'week' && 
        currentDate.toDateString() === new Date().toDateString();
      
      if (!isInitialLoad) {
        loadEvents(currentView, currentDate);
      }
    }
  }, [currentView, currentDate]);

  // Load events based on current view and date
  const loadEvents = async (view: View = 'week', date: Date = new Date()) => {
    try {
      setIsLoading(true);
      
      // Don't load any events - just set empty array
      setEvents([]);
      
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reload events when calendar view/date changes
  const reloadEvents = (view: View, date: Date) => {
    loadEvents(view, date);
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
      
      // Reload events to ensure all events are up to date
      await loadEvents(currentView, currentDate);
      
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Calendar</h1>
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
                onViewChange={(view) => {
                  setCurrentView(view);
                  reloadEvents(view, currentDate);
                }}
                onDateChange={(date) => {
                  setCurrentDate(date);
                  reloadEvents(currentView, date);
                }}
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
        />
      </div>
    </LocationProvider>
  );
}

export default App;
