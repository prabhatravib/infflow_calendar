import { useState, useEffect, useRef } from 'react';
import { sessionManager } from '../utils/sessionManager';
import type { Event } from '../lib/api';

interface CalendarData {
  events: Event[];
  weatherData?: any;
  location?: string;
}

interface HexaWorkerProps {
  calendarData: CalendarData;
  hexaWorkerUrl?: string;
}

/**
 * Format calendar data as a human-readable summary for the voice worker
 */
function formatCalendarSummary(calendarData: CalendarData): string {
  const { events, weatherData, location } = calendarData;
  
  let summary = `# Calendar Summary for ${location || 'Unknown Location'}\n\n`;
  summary += `Total Events: ${events.length}\n\n`;
  
  // Group events by date
  const eventsByDate: Record<string, Event[]> = {};
  events.forEach(event => {
    const date = new Date(event.start).toLocaleDateString();
    if (!eventsByDate[date]) {
      eventsByDate[date] = [];
    }
    eventsByDate[date].push(event);
  });
  
  // Add events section
  summary += `## Events\n\n`;
  Object.keys(eventsByDate).sort().forEach(date => {
    summary += `### ${date}\n`;
    eventsByDate[date].forEach(event => {
      const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      summary += `- **${event.title}** (${startTime} - ${endTime})`;
      if (event.description) {
        summary += `: ${event.description}`;
      }
      if (event.eventType) {
        summary += ` [${event.eventType}]`;
      }
      summary += `\n`;
    });
    summary += `\n`;
  });
  
  // Add weather section if available
  if (weatherData && weatherData.current_weather) {
    summary += `## Weather\n\n`;
    summary += `Current Temperature: ${weatherData.current_weather.temperature}°F\n`;
    
    if (weatherData.daily) {
      summary += `\n### 7-Day Forecast\n`;
      for (let i = 0; i < Math.min(7, weatherData.daily.time?.length || 0); i++) {
        const date = weatherData.daily.time[i];
        const tempMax = weatherData.daily.temperature_2m_max?.[i];
        const tempMin = weatherData.daily.temperature_2m_min?.[i];
        const precip = weatherData.daily.precipitation_probability_max?.[i];
        
        summary += `- ${date}: ${tempMin}°F - ${tempMax}°F`;
        if (precip > 30) {
          summary += ` (${precip}% rain)`;
        }
        summary += `\n`;
      }
    }
  }
  
  return summary;
}

export const HexaWorker: React.FC<HexaWorkerProps> = ({ 
  calendarData,
  hexaWorkerUrl = 'https://hexa-worker.prabhatravib.workers.dev'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSentDataRef = useRef<string | null>(null);

  // Subscribe to session changes
  useEffect(() => {
    const unsubscribe = sessionManager.onSessionChange((newSessionId) => {
      setSessionId(newSessionId);
      console.log('🆔 HexaWorker received session ID:', newSessionId);
    });
    const currentSessionId = sessionManager.getSessionId();
    if (currentSessionId) setSessionId(currentSessionId);
    return unsubscribe;
  }, []);

  // Send calendar data to voice worker when it changes
  useEffect(() => {
    if (!calendarData.events || calendarData.events.length === 0) {
      console.log('⏭️ Skipping empty calendar data send');
      return;
    }

    const dataHash = JSON.stringify({
      eventsCount: calendarData.events.length,
      location: calendarData.location,
      sessionId: sessionId || 'default',
    });

    // Deduplicate: skip if data hasn't changed
    if (dataHash === lastSentDataRef.current) {
      console.log('⏭️ Skipping duplicate calendar data send');
      return;
    }

    lastSentDataRef.current = dataHash;
    setIsLoading(true);

    // Format calendar data as a text summary for the voice worker
    const calendarSummary = formatCalendarSummary(calendarData);

    // Send calendar events and weather data to voice worker
    // Format matches the diagram data format from the reference implementation
    const payload = {
      mermaidCode: calendarSummary, // Use mermaidCode field like diagram data
      diagramImage: '', // Not applicable for calendar data
      prompt: `Calendar data for ${calendarData.location} with ${calendarData.events.length} events`,
      type: 'calendar',
      sessionId: sessionId || 'default',
      // Additional calendar-specific data
      calendarData: {
        events: calendarData.events,
        weatherData: calendarData.weatherData,
        location: calendarData.location,
      }
    };

    console.log('📤 Sending calendar data to voice worker:', {
      url: `${hexaWorkerUrl}/api/external-data`,
      eventsCount: calendarData.events.length,
      location: calendarData.location,
      sessionId: sessionId || 'default'
    });

    fetch(`${hexaWorkerUrl}/api/external-data`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload)
    })
      .then(async response => {
        setIsLoading(false);
        const responseText = await response.text();
        
        if (!response.ok) {
          console.error('❌ Failed to send calendar data:', {
            status: response.status,
            statusText: response.statusText,
            response: responseText
          });
          lastSentDataRef.current = null;
        } else {
          console.log('✅ Calendar data sent successfully:', responseText);
        }
      })
      .catch(error => {
        setIsLoading(false);
        console.error('❌ Error sending calendar data:', {
          message: error.message,
          error: error
        });
        lastSentDataRef.current = null;
      });
  }, [calendarData.events, calendarData.weatherData, calendarData.location, sessionId, hexaWorkerUrl]);

  // Handle voice worker initialization
  const handleExpandToggle = () => {
    if (!isExpanded) {
      // Generate session ID when opening voice worker
      if (!sessionId) {
        const newSessionId = sessionManager.generateSessionId();
        console.log('🎙️ Voice worker opened with session:', newSessionId);
      }
    }
    setIsExpanded(!isExpanded);
  };

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from the hexagon worker domain
      if (!event.origin.includes('prabhatravib.workers.dev')) {
        return;
      }

      console.log('📨 Received message from voice worker:', event.data);

      // Handle different message types
      switch (event.data.type) {
        case 'transcription':
          console.log('🎤 Transcription:', event.data.text);
          break;
        case 'response_text_delta':
          console.log('💬 Response:', event.data.text);
          break;
        case 'error':
          console.error('❌ Voice worker error:', event.data.error);
          break;
        default:
          console.log('📨 Unknown message type:', event.data.type);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      {/* Floating Voice Worker Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={handleExpandToggle}
          className={`
            group relative flex items-center justify-center
            w-14 h-14 rounded-full shadow-lg
            transition-all duration-300 ease-in-out
            ${isExpanded 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
            }
            ${isLoading ? 'animate-pulse' : ''}
          `}
          title={isExpanded ? 'Close Voice Assistant' : 'Open Voice Assistant'}
        >
          {isExpanded ? (
            // Close icon
            <svg 
              className="w-6 h-6 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          ) : (
            // Microphone icon
            <svg 
              className="w-6 h-6 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
              />
            </svg>
          )}
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {isExpanded ? 'Close Voice Assistant' : 'Open Voice Assistant'}
          </div>
        </button>

        {/* Loading indicator */}
        {isLoading && !isExpanded && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
        )}
      </div>

      {/* Expandable Voice Worker Panel */}
      {isExpanded && (
        <div className="fixed bottom-24 left-6 z-40 bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-in-out">
          <div className="w-96 h-[32rem]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                  />
                </svg>
                <h3 className="font-semibold">Voice Assistant</h3>
              </div>
              <div className="flex items-center gap-2 text-xs opacity-90">
                {calendarData.events.length} events loaded
              </div>
            </div>

            {/* iframe Container */}
            <div className="w-full h-[calc(100%-3rem)] bg-gray-50">
              {sessionId ? (
                <iframe
                  ref={iframeRef}
                  src={`${hexaWorkerUrl}/?sessionId=${sessionId}&iframe=true`}
                  className="w-full h-full border-0"
                  allow="microphone; camera"
                  title="Voice Assistant"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Initializing voice assistant...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

