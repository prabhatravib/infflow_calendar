import React, { useState, useEffect } from 'react';
import { Event, CreateEventRequest, UpdateEventRequest } from '../../types';

interface EventDetailsFormProps {
  event?: Event | null;
  selectedDate?: Date;
  selectedHour?: number;
  onSave: (eventData: CreateEventRequest | UpdateEventRequest) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  onClose: () => void;
  onGenerateEcho: () => void;
  isGeneratingEcho: boolean;
  hasEcho: boolean;
  calendarId: string;
  onEventsRefresh?: () => Promise<void>;
}

export const EventDetailsForm: React.FC<EventDetailsFormProps> = ({
  event,
  selectedDate,
  selectedHour,
  onSave,
  onDelete,
  onClose,
  onGenerateEcho,
  isGeneratingEcho,
  hasEcho,
  calendarId,
  onEventsRefresh
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [eventType, setEventType] = useState<'work' | 'fun' | 'other'>('other');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form when event or selectedDate/selectedHour changes
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
    } else {
      // Creating new event - clear form and set defaults
      setTitle('');
      setDescription('');
      setEventType('other');
      
      if (selectedDate) {
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
    }
  }, [event, selectedDate, selectedHour]);

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
        calendar_id: calendarId,
        ...(event ? {} : { calendar_id: 'default' })
      };

      await onSave(eventData);
      if (onEventsRefresh) {
        await onEventsRefresh();
      }
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
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!event || !onDelete) return;
    
    setIsDeleting(true);
    
    try {
      await onDelete(event.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Event
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{title}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {/* Echo Generation Button - Only show for existing events without echo */}
            {event && !hasEcho && (
              <button
                type="button"
                onClick={onGenerateEcho}
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
    </>
  );
};
