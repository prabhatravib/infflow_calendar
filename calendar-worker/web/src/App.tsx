import { useState, useEffect, useCallback } from 'react';
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
    loadEvents();
  }, []);

  // Handle view/date changes after initial load
  useEffect(() => {
    // Skip the first render to avoid duplicate loading
    if (currentView && currentDate) {
      // Only reload if this is not the initial load
      const isInitialLoad = currentView === 'week' && 
        currentDate.toDateString() === new Date().toDateString();
      
      if (!isInitialLoad) {
        loadEvents();
      }
    }
  }, [currentView, currentDate]);

  // Load events based on current view and date
  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use currentDate instead of always using current time
      const baseDate = currentDate || new Date();
      let startDate: Date;
      let endDate: Date;
      
      // Calculate date range based on current view
      switch (currentView) {
        case 'week':
          // Get the week containing the current date
          const weekStart = new Date(baseDate);
          weekStart.setDate(baseDate.getDate() - baseDate.getDay()); // Start of week (Sunday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
          
          startDate = weekStart;
          endDate = weekEnd;
          break;
          
        case 'month':
          // Get the month containing the specified date
          startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
          endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
          break;
          
        case 'day':
          // Get the day
          startDate = new Date(baseDate);
          endDate = new Date(baseDate);
          break;
          
        default:
          // Default to current week
          startDate = new Date(baseDate);
          endDate = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      
      const fetchedEvents = await fetchEvents(
        DEMO_CALENDAR_ID,
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      setEvents(fetchedEvents);
      
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentView, currentDate]);



  // Function to load events for a specific date (avoids state update timing issues)
  const loadEventsForDate = useCallback(async (date: Date) => {
    try {
      setIsLoading(true);
      
      let startDate: Date;
      let endDate: Date;
      
      // Calculate date range based on current view
      switch (currentView) {
        case 'week':
          // Get the week containing the specified date
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
          
          startDate = weekStart;
          endDate = weekEnd;
          break;
          
        case 'month':
          // Get the month containing the specified date
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          break;
          
        case 'day':
          // Get the specified day
          startDate = new Date(date);
          endDate = new Date(date);
          break;
          
        default:
          // Default to week view
          const defaultWeekStart = new Date(date);
          defaultWeekStart.setDate(date.getDate() - date.getDay());
          const defaultWeekEnd = new Date(defaultWeekStart);
          defaultWeekEnd.setDate(defaultWeekStart.getDate() + 6);
          
          startDate = defaultWeekStart;
          endDate = defaultWeekEnd;
      }
      
      const fetchedEvents = await fetchEvents(
        DEMO_CALENDAR_ID,
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      setEvents(fetchedEvents);
      
    } catch (error) {
      console.error('Error loading events for date:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentView]);

  // Global navigation function for Echo flowchart clicks
  const gotoDateWithTitle = useCallback((dateStr: string, eventTitle?: string) => {
    try {
      // Parse the date string
      const targetDate = new Date(dateStr);
      
      if (isNaN(targetDate.getTime())) {
        console.error('Invalid date string:', dateStr);
        return;
      }

      console.log('Navigating to date:', targetDate, 'for event:', eventTitle);
      
      // Close the modal first
      setIsModalOpen(false);
      setSelectedEvent(null);
      setSelectedDate(undefined);
      setSelectedHour(undefined);
      
      // Navigate to the target date
      setCurrentDate(targetDate);
      
      // Load events for the new date
      loadEventsForDate(targetDate);
      
    } catch (error) {
      console.error('Error navigating to date:', error);
    }
  }, [loadEventsForDate]);

  // Expose the navigation function globally for Echo flowchart clicks
  useEffect(() => {
    (window as any).gotoDateWithTitle = gotoDateWithTitle;
    
    // Cleanup function to remove the global function
    return () => {
      delete (window as any).gotoDateWithTitle;
    };
  }, [gotoDateWithTitle]);

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
      
      // Don't call loadEvents() as it clears the events array
      // The events are already updated above
      
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
      // Remove the deleted event from local state
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
                currentView={currentView}
                currentDate={currentDate}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onTimeSlotClick={handleTimeSlotClick}
                onViewChange={(view) => {
                  setCurrentView(view);
                  // Pass the current date to avoid state update timing issues
                  loadEventsForDate(currentDate);
                }}
                onDateChange={(date) => {
                  setCurrentDate(date);
                  // Pass the new date directly to avoid state update timing issues
                  loadEventsForDate(date);
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
