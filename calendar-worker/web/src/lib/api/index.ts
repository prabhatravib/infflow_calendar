export interface Event {
  id: string;
  calendar_id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  tz: string;
  created_at: string;
  updated_at: string;
  // New fields for enhanced functionality
  eventType?: 'work' | 'fun' | 'other';
  location?: string;
  all_day?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  type?: string; // For weather events and echo events
  
  // Event Echo fields
  flowchart?: string;
  echo_event_ids?: string;
  parent_event_id?: string;
  user_id?: string;
}

export interface CreateEventRequest {
  calendar_id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  tz: string;
  eventType?: 'work' | 'fun' | 'other';
  location?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  tz?: string;
  eventType?: 'work' | 'fun' | 'other';
  location?: string;
}

const API_BASE = '/api';

export async function fetchEvents(calendarId: string, from: string, to: string): Promise<Event[]> {
  try {
    const response = await fetch(
      `${API_BASE}/events?calendarId=${encodeURIComponent(calendarId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    const data = await response.json();
    // Ensure we always return an array, even if the response is malformed
    return Array.isArray(data.events) ? data.events : [];
  } catch (error) {
    console.error('Error fetching events:', error);
    // Return empty array instead of throwing to prevent crashes
    return [];
  }
}

export async function createEvent(eventData: CreateEventRequest): Promise<Event> {
  try {
    const response = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

export async function updateEvent(eventId: string, eventData: UpdateEventRequest): Promise<Event> {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
<<<<<<< HEAD
      throw new Error(`Failed to delete event: ${response.statusText}`);
=======
      const errorText = response.statusText || `HTTP ${response.status}`;
      throw new Error(`Failed to delete event: ${errorText}`);
    }
    
    // Try to parse the response to see if we got a success message
    try {
      const data = await response.json();
      if (data.message && data.message.includes('deleted successfully')) {
        console.log('Event deleted successfully:', data.message);
      }
    } catch (parseError) {
      // If we can't parse the response, that's okay - the status code is what matters
      console.log('Delete response received (status OK)');
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

export async function downloadICS(userId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/ics/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download ICS: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-${userId}.ics`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading ICS:', error);
    throw error;
  }
}

export async function seedDemoData(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/seed`);
    
    if (!response.ok) {
      throw new Error(`Failed to seed demo data: ${response.statusText}`);
    }
    
    console.log('Demo data seeded successfully');
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

// Weather API functions
export interface WeatherData {
  location: string;
  forecast: any;
  weather_events: Event[];
  message: string;
}

export async function fetchWeatherData(location: string): Promise<WeatherData> {
  try {
    const response = await fetch(
      `${API_BASE}/weather?location=${encodeURIComponent(location)}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch weather: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
}

export async function updateWeatherLocation(location: string): Promise<{ message: string; location: string }> {
  try {
    const response = await fetch(`${API_BASE}/weather/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ location }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update location: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

export async function refreshWeatherData(): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE}/weather/refresh`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh weather: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error refreshing weather:', error);
    throw error;
  }
}
