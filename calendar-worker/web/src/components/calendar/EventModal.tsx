import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import mermaid from 'mermaid';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../../lib/api';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  calendarId: string;
  selectedDate?: Date;
  selectedHour?: number;
  onSave: (eventData: CreateEventRequest | UpdateEventRequest) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  onEventsRefresh?: () => Promise<void>;
}

export function EventModal({ 
  isOpen, 
  onClose, 
  event, 
  calendarId, 
  selectedDate, 
  selectedHour,
  onSave, 
  onDelete,
  onEventsRefresh
}: EventModalProps) {
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
  const [isGeneratingEcho, setIsGeneratingEcho] = useState(false);
  const [flowchart, setFlowchart] = useState<string>('');
  const [hasEcho, setHasEcho] = useState(false);

  useEffect(() => {
    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    if (event) {
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
        setFlowchart(event.flowchart);
        setHasEcho(true);
      }
    } else if (selectedDate) {
      // Creating new event
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
    }
    
    // Reset echo state when modal opens
    setActiveTab('details');
    setHasEcho(false);
  }, [event, selectedDate, selectedHour]);

  // Effect to render Mermaid flowchart when it changes
  useEffect(() => {
    if (flowchart && activeTab === 'echo') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        try {
          mermaid.render('mermaid-flowchart', flowchart).then(({ svg }) => {
            const mermaidDiv = document.querySelector('.mermaid');
            if (mermaidDiv) {
              mermaidDiv.innerHTML = svg;
            }
          });
        } catch (error) {
          console.error('Error rendering Mermaid flowchart:', error);
        }
      }, 100);
    }
  }, [flowchart, activeTab]);

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
        ...(event ? {} : { calendar_id: calendarId })
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    setIsLoading(true);
    
    try {
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    } finally {
      setIsLoading(false);
    }
  };
=======
import { Event } from '../../types';
import { EventDetailsForm } from './EventDetailsForm';
import { EchoFlowchartTab } from './EchoFlowchartTab';

interface EventModalProps {
  isOpen: boolean;
  event?: Event | null;
  selectedDate?: Date;
  selectedHour?: number;
  onClose: () => void;
  onSave: (eventData: Partial<Event>) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  calendarId: string;
  onEventsRefresh?: () => Promise<void>;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  selectedDate,
  selectedHour,
  onClose,
  onSave,
  onDelete,
  calendarId,
  onEventsRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'echo'>('details');
  const [flowchart, setFlowchart] = useState<string>('');
  const [hasEcho, setHasEcho] = useState(false);
  const [isGeneratingEcho, setIsGeneratingEcho] = useState(false);

  // Determine if this is editing an existing event or creating a new one
  const isEditing = !!event;
  const modalTitle = isEditing ? 'Edit Event' : 'Create Event';

  // Check if event has echo/flowchart
  useEffect(() => {
    if (event?.flowchart) {
      setFlowchart(event.flowchart);
      setHasEcho(true);
    } else {
      setFlowchart('');
      setHasEcho(false);
    }
  }, [event]);
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837

  const handleEchoGeneration = async () => {
    if (!event?.id) return;
    
    setIsGeneratingEcho(true);
    try {
      const response = await fetch(`/api/events/${event.id}/echo`, {
        method: 'POST',
<<<<<<< HEAD
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'demo-user' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFlowchart(data.mermaid);
        setHasEcho(true);
        setActiveTab('echo');
        
        // Refresh events list in the background instead of reloading the page
        if (onEventsRefresh) {
          await onEventsRefresh();
        }
      } else {
        throw new Error('Failed to generate echo');
      }
    } catch (error) {
      console.error('Error generating echo:', error);
      alert('Failed to generate echo events');
=======
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: 'default_user' })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Echo API response data:', data);
        
        if (data.data?.mermaid) {
          console.log('🔗 Mermaid flowchart code:', data.data.mermaid);
          setFlowchart(data.data.mermaid);
          setHasEcho(true);
        }
      } else {
        console.error('❌ Echo generation failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Error generating echo:', error);
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
    } finally {
      setIsGeneratingEcho(false);
    }
  };

<<<<<<< HEAD
  const handleEchoReset = async () => {
    if (!event?.id) return;
    
    try {
      const response = await fetch(`/api/events/${event.id}/echo/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'demo-user' })
      });
      
      if (response.ok) {
        setFlowchart('');
        setHasEcho(false);
        setActiveTab('details');
        
        // Refresh events list in the background instead of reloading the page
        if (onEventsRefresh) {
          await onEventsRefresh();
        }
      }
    } catch (error) {
      console.error('Error resetting echo:', error);
      alert('Failed to reset echo');
    }
  };

=======
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<<<<<<< HEAD
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {event ? 'Edit Event' : 'New Event'}
=======
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {modalTitle}
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
            </h2>
            <button
              type="button"
              onClick={onClose}
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
            {hasEcho && (
              <button
                className={`px-4 py-1.5 text-sm font-medium border-b-2 ${
                  activeTab === 'echo' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('echo')}
              >
                Echo Flowchart
              </button>
            )}
          </div>
        </div>
        
<<<<<<< HEAD
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
                {event && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
              
              <div className="flex space-x-2">
                {/* Echo Generation Button */}
                {(!event || (event && event.type !== 'echo' && !hasEcho)) && (
                  <button
                    type="button"
                    onClick={handleEchoGeneration}
                    disabled={isGeneratingEcho}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingEcho ? 'Generating Echo Events...' : '🎯 Generate Echo Events'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
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
          <div className="px-4 py-2">
            <div className="mb-2">
              <h3 className="text-lg font-medium text-gray-900 mb-1">Event Echo Flowchart</h3>
              <p className="text-sm text-gray-600">
                This flowchart shows the sequence of events including follow-ups generated by AI.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-2 mb-2">
              {flowchart ? (
                <div className="mermaid" id="mermaid-flowchart">
                  {/* Mermaid will render the flowchart here */}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No flowchart available</p>
              )}
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back to Details
              </button>
              
              <button
                type="button"
                onClick={handleEchoReset}
                className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50"
              >
                Reset Echo
              </button>
            </div>
          </div>
=======
        {/* Tab Content */}
        {activeTab === 'details' && (
          <EventDetailsForm
            event={event}
            selectedDate={selectedDate}
            selectedHour={selectedHour}
            onSave={onSave}
            onDelete={onDelete}
            onClose={onClose}
            onGenerateEcho={handleEchoGeneration}
            isGeneratingEcho={isGeneratingEcho}
            hasEcho={hasEcho}
            calendarId={calendarId}
            onEventsRefresh={onEventsRefresh}
          />
        )}
        
        {activeTab === 'echo' && (
          <EchoFlowchartTab
            flowchart={flowchart}
            onBackToDetails={() => setActiveTab('details')}
            onResetEcho={() => {
              setFlowchart('');
              setHasEcho(false);
            }}
          />
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
        )}
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
};
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
