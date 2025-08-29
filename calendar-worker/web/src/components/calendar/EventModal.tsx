import React, { useState, useEffect } from 'react';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../../lib/api';
import { ErrorBoundary } from '../ErrorBoundary';
import { EchoTab } from './EchoTab';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  calendarId: string;
  selectedDate?: Date;
  selectedHour?: number;
  onSave: (eventData: CreateEventRequest | UpdateEventRequest) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

export function EventModal({ 
  isOpen, 
  onClose, 
  event, 
  calendarId, 
  selectedDate, 
  selectedHour,
  onSave, 
  onDelete
}: EventModalProps) {
  const [localEvent, setLocalEvent] = useState<Event | null>(event || null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [eventType, setEventType] = useState<'work' | 'fun' | 'other'>('other');
  const [isLoading, setIsLoading] = useState(false);
  
  // Echo-related state
  const [activeTab, setActiveTab] = useState<'details' | 'echo'>('details');
  const [hasEcho, setHasEcho] = useState(false);
  const [isGeneratingEcho, setIsGeneratingEcho] = useState(false);

  // Function to reset form to default values
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setTimezone('America/New_York');
    setEventType('other');
    setActiveTab('details');
    setHasEcho(false);
    setIsGeneratingEcho(false);
  };

  useEffect(() => {
    if (event) {
      // Update local event when prop changes
      setLocalEvent(event);
      
      // Editing existing event
      setTitle(event.title);
      setDescription(event.description || '');
      setEventType(event.eventType || 'other');
      
      const start = new Date(event.start);
      const end = new Date(event.end);
      
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
      setTimezone(event.tz);
      
      // Check if event has echo data
      if (event.flowchart) {
        setHasEcho(true);
      }
    } else if (selectedDate) {
      // Creating new event - reset form first, then set date/time
      resetForm();
      
      const date = selectedDate.toISOString().split('T')[0];
      setStartDate(date);
      setEndDate(date);
      
      if (selectedHour !== undefined) {
        setStartTime(`${selectedHour.toString().padStart(2, '0')}:00`);
        setEndTime(`${(selectedHour + 1).toString().padStart(2, '0')}:00`);
      } else {
        setStartTime('09:00');
        setEndTime('10:00');
      }
    } else {
      // Modal opened without event or date - reset to defaults
      resetForm();
    }
  }, [event, selectedDate, selectedHour]);

  // Cleanup effect to reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      resetForm();
    }
  }, [isOpen]);

  // Custom close handler that ensures form is reset
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsLoading(true);
    
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (startDateTime >= endDateTime) {
        alert('End time must be after start time');
        return;
      }

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        tz: timezone,
        eventType: eventType,
        ...(localEvent ? {} : { calendar_id: calendarId })
      };

      await onSave(eventData);
      handleClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!localEvent || !onDelete) return;
    
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    setIsLoading(true);
    
    try {
      await onDelete(localEvent.id);
      handleClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEchoGeneration = async () => {
    if (!localEvent?.id) return;
    
    setIsGeneratingEcho(true);
    try {
      console.log('Generating echo for event:', localEvent.id);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`/api/events/${localEvent.id}/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'demo-user' }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Echo API response status:', response.status);
      console.log('Echo API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Echo API response data:', data);
        
        // Validate the response data
        if (!data || typeof data.mermaid !== 'string') {
          console.error('Invalid response format:', { data, mermaidType: typeof data?.mermaid });
          throw new Error(`Invalid response format from Echo API. Expected string, got: ${typeof data?.mermaid}`);
        }
        
        // Update echo state
        setHasEcho(true);
        
        // Only refresh the current event data to get the updated flowchart
        // Don't refresh all events to avoid calendar re-rendering
        if (localEvent?.id) {
          try {
            const response = await fetch(`/api/events/${localEvent.id}`);
            if (response.ok) {
              const responseData = await response.json();
              console.log('Updated event data:', responseData);
              
              // Extract the event from the response
              const updatedEvent = responseData.event;
              
              // Update the local event state with the new flowchart
              if (updatedEvent && updatedEvent.flowchart) {
                console.log('Setting localEvent to:', updatedEvent);
                setLocalEvent(updatedEvent); // Update the local event state with new data
                setHasEcho(true);
                console.log('Event data refreshed with new flowchart');
              } else {
                console.log('No flowchart found in updated event:', updatedEvent);
              }
            }
          } catch (fetchError) {
            console.warn('Failed to fetch updated event:', fetchError);
            // Don't fail the entire operation for this
          }
        }
      } else {
        const errorText = await response.text();
        console.error('Echo API error response:', errorText);
        throw new Error(`Failed to generate echo: ${response.status} ${errorText}`);
      }
    } catch (error: unknown) {
      console.error('Error generating echo:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          alert('Echo generation timed out. Please try again.');
        } else if (error.message.includes('Invalid response format')) {
          alert('Received invalid data from server. Please try again.');
        } else {
          alert(`Failed to generate echo events: ${error.message}`);
        }
      } else {
        alert('Failed to generate echo events: Unknown error occurred');
      }
      
      // Reset state to safe values
      setHasEcho(false);
    } finally {
      setIsGeneratingEcho(false);
    }
  };

  const handleEchoReset = () => {
    // Clear echo state when echo is reset
    setHasEcho(false);
    
    // Update local event to remove flowchart
    if (localEvent) {
      const updatedEvent = { ...localEvent, flowchart: undefined };
      setLocalEvent(updatedEvent);
    }
  };

  if (!isOpen) return null;

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {event ? 'Edit Event' : 'New Event'}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-100">
            <div className="flex">
              <button
                className={`px-4 py-1.5 text-sm font-medium border-b-2 ${
                  activeTab === 'details' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={`px-4 py-1.5 text-sm font-medium border-b-2 flex items-center space-x-1 ${
                  activeTab === 'echo' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('echo')}
              >
                <span>Echo</span>
                {hasEcho && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>
            </div>
          </div>
          
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="px-4 py-2">
              <div className="space-y-2">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Event title"
                    required
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Event description"
                    rows={2}
                  />
                </div>
                
                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as 'work' | 'fun' | 'other')}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="work">Work</option>
                    <option value="fun">Fun</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {/* Start Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                {/* End Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="UTC">UTC</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex space-x-2">
                  {localEvent && onDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                  {/* Echo generation button only shows for existing events */}
                  {localEvent && (
                    <button
                      type="button"
                      onClick={handleEchoGeneration}
                      disabled={isGeneratingEcho || isLoading}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50"
                    >
                      {isGeneratingEcho ? 'Generating...' : '🎯 Generate Echo Events'}
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : (event ? 'Update' : 'Create')}
                  </button>
                </div>
              </div>
            </form>
          )}
          
          {activeTab === 'echo' && (
            <EchoTab 
              event={localEvent || null} 
              onBackToDetails={() => setActiveTab('details')}
              onEchoReset={handleEchoReset}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
