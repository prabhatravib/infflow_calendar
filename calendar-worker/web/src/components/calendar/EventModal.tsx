import React, { useState, useEffect } from 'react';
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

  const handleEchoGeneration = async () => {
    if (!event?.id) return;
    
    setIsGeneratingEcho(true);
    try {
      const response = await fetch(`/api/events/${event.id}/echo`, {
        method: 'POST',
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
    } finally {
      setIsGeneratingEcho(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {modalTitle}
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
        )}
      </div>
    </div>
  );
};
