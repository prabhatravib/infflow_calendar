import { useState, useCallback } from 'react';
import type { Event } from '../lib/api';

interface UseEchoGenerationProps {
  localEvent: Event | null;
  setLocalEvent: (event: Event | null) => void;
}

export function useEchoGeneration({ localEvent, setLocalEvent }: UseEchoGenerationProps) {
  const [hasEcho, setHasEcho] = useState(false);
  const [isGeneratingEcho, setIsGeneratingEcho] = useState(false);

  const handleEchoGeneration = useCallback(async () => {
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
  }, [localEvent, setLocalEvent]);

  const handleEchoReset = useCallback(() => {
    // Clear echo state when echo is reset
    setHasEcho(false);
    
    // Update local event to remove flowchart
    if (localEvent) {
      const updatedEvent = { ...localEvent, flowchart: undefined };
      setLocalEvent(updatedEvent);
    }
  }, [localEvent, setLocalEvent]);

  const initializeEchoState = useCallback((event: Event | null) => {
    if (event?.flowchart) {
      setHasEcho(true);
    } else {
      setHasEcho(false);
    }
  }, []);

  return {
    hasEcho,
    isGeneratingEcho,
    handleEchoGeneration,
    handleEchoReset,
    initializeEchoState
  };
}
