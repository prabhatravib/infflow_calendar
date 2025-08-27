/* global FullCalendar */

let allLoadedEvents = [];

// Import slot height adjuster for global access
let slotHeightAdjuster = null;
import('./utils/slot-height-adjuster.js').then(module => {
  slotHeightAdjuster = module;
}).catch(error => {
  console.warn('⚠️ Failed to load slot height adjuster:', error);
});

import { computeInitialScrollTime } from './utils/time-utils.js';
import { centerNowLine, observeNowLineOnce } from './utils/now-line.js';

/* Fixed Calendar Initialization - Proper async loading order */

document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) {
    console.error('Calendar element not found!');
    return;
  }

  console.log('Calendar element found:', calendarEl);

  // Runtime context
  let userId = document.querySelector('meta[name="user-id"]')?.content ?? 'default_user';
  window.currentUserId = userId;

  // Set up calendar container with proper dimensions
  console.log('Setting up calendar container...');
  calendarEl.style.minHeight = '600px';
  calendarEl.style.width = '100%';
  
  // FIXED: Load UI module FIRST, then initialize calendar
  initializeCalendarWithUI();

  async function initializeCalendarWithUI() {
    console.log('Loading UI module first...');
    
    try {
      // Load UI module before creating calendar
      const uiModule = await import('./ui.js');
      console.log('✅ UI module loaded successfully');
      
      // Now create calendar with proper event handlers
      initializeCalendar();
      
    } catch (error) {
      console.error('❌ Failed to load UI module:', error);
      // Create fallback UI and still initialize calendar
      window.ui = {
        openEventModal: function(defaults) {
          alert('Event modal not available. Please refresh the page.');
          console.error('UI module failed to load properly');
        }
      };
      initializeCalendar();
    }
  }

  function initializeCalendar() {
    console.log('Initializing FullCalendar...');
    
    // FIXED: Ensure UI is available before creating event handlers
    if (!window.ui || !window.ui.openEventModal) {
      console.error('UI module not properly loaded, using fallback');
      window.ui = {
        openEventModal: function(defaults) {
          alert('Event modal not available. Please refresh the page.');
        }
      };
    }
    
    const initialScrollTime = computeInitialScrollTime(calendarEl);

    // Create calendar with simplified, reliable configuration
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'timeGridWeek',
        nowIndicator: true,
      expandRows: true,      // let FC stretch rows to fill any extra space
      dayMaxEvents: true,
      firstDay: 1,
      timeZone: 'America/New_York',
      now: function() {
        // Return current time as a Date object (FullCalendar handles timezone conversion)
        return new Date();
      },
      slotDuration: '01:00:00',
      slotLabelInterval: '01:00',
      snapDuration: '00:30:00',
      allDaySlot: true,
      allDayText: 'all-day',
      defaultTimedEventDuration: '00:30:00',
      forceEventDuration: true,
      
      slotMinTime: '06:00:00',
      slotMaxTime: '24:00:00',
      // Start near the current time; additional centering logic will refine after render
      scrollTime: initialScrollTime,
      scrollTimeReset: true,
      
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridWeek,timeGridDay,dayGridMonth,listWeek'
      },

      // FIXED: Improved event handlers with better error handling
      dateClick(info) {
        console.log('Date clicked:', info.dateStr);
        console.log('UI available:', !!window.ui, 'openEventModal available:', !!(window.ui && window.ui.openEventModal));
        
        if (!window.ui || !window.ui.openEventModal) {
          console.error('UI not available for date click');
          alert('Calendar is still loading. Please wait a moment and try again.');
          return;
        }
        
        try {
          const date = info.date;
          const pad = n => n.toString().padStart(2, '0');
          const formatted = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
          
          console.log('Opening event modal with start_time:', formatted);
          window.ui.openEventModal({ 
            start_time: formatted,
            duration_minutes: 30
          });
        } catch (error) {
          console.error('Error in dateClick handler:', error);
          alert('Error opening event modal. Please try again.');
        }
      },

      select(info) {
        console.log('Date range selected:', info.startStr, 'to', info.endStr);
        
        if (!window.ui || !window.ui.openEventModal) {
          console.error('UI not available for select');
          alert('Calendar is still loading. Please wait a moment and try again.');
          return;
        }
        
        try {
          // User selected a date/time range
          const start = info.start;
          const end = info.end;
          const duration = Math.round((end - start) / 60000); // duration in minutes
          
          // Format start time for datetime-local input
          const pad = n => n.toString().padStart(2, '0');
          const formatted = `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`;
          
          console.log('Opening event modal for selection with start_time:', formatted, 'duration:', duration);
          
          // Open modal with selected range
          window.ui.openEventModal({
            start_time: formatted,
            duration_minutes: duration,
            eventType: 'work' // default to work for new events
          });
          
          // Clear the selection after opening modal
          info.view.calendar.unselect();
        } catch (error) {
          console.error('Error in select handler:', error);
          alert('Error opening event modal. Please try again.');
        }
      },

      eventClick(info) {
        console.log('Event clicked:', info.event.title);
        console.log('🔍 Event extendedProps:', info.event.extendedProps);
        
        // Ignore clicks on weather events
        if (info.event.extendedProps.type === 'weather-warning') {
          info.jsEvent.preventDefault();
          return;
        }
        
        if (!window.ui || !window.ui.openEventModal) {
          console.error('UI not available for event click');
          alert('Calendar is still loading. Please wait a moment and try again.');
          return;
        }
        
        try {
          const event = info.event;
          const start = event.start;
          const end = event.end;
          const pad = n => n.toString().padStart(2, '0');
          const formatted = `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`;
          const duration = Math.round((end - start) / (1000 * 60));
          
          const modalData = { 
            event_id: event.id,
            title: event.title,
            description: event.extendedProps.description || '',
            location: event.extendedProps.location || '',
            start_time: formatted,
            duration_minutes: duration,
            eventType: event.extendedProps.eventType || 'other',
            // Persist echo context for modal logic
            type: event.extendedProps.type,
            flowchart: event.extendedProps.flowchart,
            echo_event_ids: event.extendedProps.echo_event_ids
          };
          
          console.log('🔍 Opening event modal with data:', modalData);
          console.log('🔍 Flowchart data:', {
            hasFlowchart: !!event.extendedProps.flowchart,
            flowchartLength: event.extendedProps.flowchart ? event.extendedProps.flowchart.length : 0,
            flowchartPreview: event.extendedProps.flowchart ? event.extendedProps.flowchart.substring(0, 100) + '...' : 'none'
          });
          
          window.ui.openEventModal(modalData);
        } catch (error) {
          console.error('Error in eventClick handler:', error);
          alert('Error opening event modal. Please try again.');
        }
      },
      
      editable: true,
      eventDurationEditable: true,
      eventStartEditable: true,
      selectable: true,
      selectMirror: true,
      selectAllow: ({ start, end }) => {
        // end is exclusive → subtract 1 ms so 8-9 AM shows same day
        const endAdj = new Date(end.getTime() - 1);
        return start.getFullYear() === endAdj.getFullYear() &&
               start.getMonth() === endAdj.getMonth() &&
               start.getDate() === endAdj.getDate();
      }
    });

    // Expose calendar globally
    window.calendar = calendar;

    // Helper: center the current time horizontal line within the scroller viewport

    // Debug timezone information
    console.log('Calendar timezone:', calendar.getOption('timeZone'));
    console.log('Current time in Eastern:', new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    console.log('Browser local time:', new Date().toString());
    console.log('Calendar now function result:', calendar.getOption('now')());
    
    // Test timezone conversion
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    console.log('Timezone conversion test - Original:', now, 'Eastern:', easternTime);

    // Add view change handler for debugging
    calendar.on('viewDidMount', () => {
      console.log('🎯 Calendar view mounted:', {
        viewType: calendar.view.type,
        viewTitle: calendar.view.title,
        slotMinTime: calendar.getOption('slotMinTime'),
        slotMaxTime: calendar.getOption('slotMaxTime')
      });
      
      setTimeout(() => {
        if (slotHeightAdjuster && slotHeightAdjuster.initializeSlotHeightAdjustment) {
          console.log('🔄 Reinitializing slot height adjustment for new view');
          slotHeightAdjuster.initializeSlotHeightAdjustment(calendar);
        }
      }, 500);

      // Center the now line shortly after the view mounts
        setTimeout(() => centerNowLine(calendar, 0), 50);
        setTimeout(() => centerNowLine(calendar, 1), 400);
        setTimeout(() => centerNowLine(calendar, 2), 1000);
        observeNowLineOnce(calendar);
    });

    // Also re-center on date range changes (navigations or view switches)
    calendar.on('datesSet', () => {
      setTimeout(() => centerNowLine(calendar, 0), 50);
      setTimeout(() => centerNowLine(calendar, 1), 300);
      observeNowLineOnce(calendar);
    });

    try {
      calendar.render();
      console.log('✅ Calendar rendered successfully');
      
      // Initialize other features after calendar is confirmed working
      initializeCalendarFeatures();

      // Final pass to center the now line after ancillary modules tweak layout
      setTimeout(() => centerNowLine(calendar, 0), 250);
      setTimeout(() => centerNowLine(calendar, 1), 800);
      
      // Remove manual sleep toggle checks
      
      // Initialize early/late hour toggle bar (row insertion at 6 AM)
      import('./calendar/sleep-toggles.js').then(m => {
        if (m.initializeSleepToggles) {
          try {
            m.initializeSleepToggles(calendar);
            console.log('✅ Sleep toggles initialized');
          } catch (e) {
            console.warn('⚠️ Sleep toggles init failed:', e);
          }
        }
      }).catch(() => {});
      
    } catch (error) {
      console.error('❌ Error during calendar.render():', error);
      alert('Error rendering calendar. Please refresh the page.');
    }
  }

  // Initialize other features after calendar and UI are both ready
  function initializeCalendarFeatures() {
    console.log('Initializing calendar features...');
    
    // Load event handlers (UI already loaded)
    import('./handlers/event-handlers.js').then(handlersModule => {
      console.log('✅ Event handlers loaded');
      if (handlersModule.setupEventHandlers && window.calendar) {
        handlersModule.setupEventHandlers(window.calendar, userId);
        console.log('✅ Event handlers initialized');
      }
    }).catch(error => {
      console.warn('⚠️ Failed to load event handlers:', error);
    });
    
    // Load initial events via shared module
    import('./calendar/events.js').then(eventsModule => {
      if (eventsModule.loadEvents && window.calendar) {
        window.loadEvents = eventsModule.loadEvents; // expose globally for compatibility
        eventsModule.loadEvents(window.calendar, userId);
        console.log('✅ Events loaded via shared module');
      }
    }).catch(error => {
      console.warn('⚠️ Failed to load events module, using fallback loader:', error);
      // Minimal fallback to ensure calendar still shows events
      (async () => {
        try {
          // Define a minimal global loader for downstream calls
          window.loadEvents = async function(cal, uid) {
            try {
              const resp = await fetch(`/calendar/events?user_id=${encodeURIComponent(uid || userId)}`);
              if (!resp.ok) return;
              const d = await resp.json();
              const evs = d.data || d || [];
              window.allLoadedEvents = evs.map(event => ({
                ...event,
                eventType: event.eventType || 'other'
              }));
              if (cal) {
                cal.removeAllEvents();
                if (window.filterAndRenderEvents) {
                  window.filterAndRenderEvents();
                } else {
                  window.allLoadedEvents.forEach(ev => {
                    try {
                      cal.addEvent({
                        id: ev.event_id || ev.id,
                        title: ev.title,
                        start: ev.start_time || ev.start,
                        end: ev.end_time || ev.end,
                        allDay: ev.all_day || false,
                        backgroundColor: ev.color || ((ev.eventType || '').toLowerCase() === 'fun' ? '#e91e63' : (ev.eventType || '').toLowerCase() === 'other' || !ev.eventType ? '#4caf50' : '#2196f3'),
                        extendedProps: {
                          description: ev.description || '',
                          location: ev.location || '',
                          eventType: ev.eventType || 'other',
                          type: ev.type,
                          flowchart: ev.flowchart,
                          echo_event_ids: ev.echo_event_ids
                        }
                      });
                    } catch (_) {}
                  });
                }
              }
            } catch (_) {}
          };

          const response = await fetch(`/calendar/events?user_id=${encodeURIComponent(userId)}`);
          if (!response.ok) return;
          const data = await response.json();
          const events = data.data || data || [];
          window.allLoadedEvents = events.map(event => ({
            ...event,
            eventType: event.eventType || 'other'
          }));
          if (window.calendar) {
            window.calendar.removeAllEvents();
            if (window.filterAndRenderEvents) {
              window.filterAndRenderEvents();
            } else {
              window.allLoadedEvents.forEach(ev => {
                try {
                  window.calendar.addEvent({
                    id: ev.event_id || ev.id,
                    title: ev.title,
                    start: ev.start_time || ev.start,
                    end: ev.end_time || ev.end,
                    allDay: ev.all_day || false,
                    backgroundColor: ev.color || ((ev.eventType || '').toLowerCase() === 'fun' ? '#e91e63' : (ev.eventType || '').toLowerCase() === 'other' || !ev.eventType ? '#4caf50' : '#2196f3'),
                    extendedProps: {
                      description: ev.description || '',
                      location: ev.location || '',
                      eventType: ev.eventType || 'other',
                      type: ev.type,
                      flowchart: ev.flowchart,
                      echo_event_ids: ev.echo_event_ids
                    }
                  });
                } catch (_) {}
              });
            }
            console.log('✅ Events loaded via fallback');
          }
        } catch (_) {
          console.warn('⚠️ Fallback event load failed');
        }
      })();
    });
    
    // Sleep toggles removed
    
    // Initialize slot height adjustment
    import('./utils/slot-height-adjuster.js').then(slotAdjusterModule => {
      if (slotAdjusterModule.initializeSlotHeightAdjustment && window.calendar) {
        slotAdjusterModule.initializeSlotHeightAdjustment(window.calendar);
        console.log('✅ Slot height adjustment initialized');
      }
    }).catch(error => {
      console.warn('⚠️ Failed to load slot height adjuster:', error);
    });
    
    // Initialize filters
    import('./calendar/filters.js').then(filtersModule => {
      console.log('✅ Filters module loaded');
      if (filtersModule.wireExistingCheckboxes) {
        filtersModule.wireExistingCheckboxes();
        console.log('✅ Sidebar filters wired up');
      }
    }).catch(error => {
      console.warn('⚠️ Failed to load filters:', error);
    });
    
      // Load other modules but don't block on them
      Promise.all([
        import('./weather.js').catch(() => null),
        import('./weather-now-indicator.js').catch(() => null),
        import('./axis-now-indicator.js').catch(() => null),
      ]).then(([weatherModule, nowIndicatorModule, axisIndicatorModule]) => {
      console.log('✅ Additional modules loaded');
      
      // Initialize weather if available
      if (weatherModule && weatherModule.initializeWeather) {
        try {
          weatherModule.initializeWeather();
          console.log('✅ Weather initialized');
        } catch (e) {
          console.warn('⚠️ Weather init failed:', e);
        }
      }

        // Initialize weather-aware now indicator if available
        if (nowIndicatorModule && nowIndicatorModule.initializeWeatherNowIndicator) {
          try {
            nowIndicatorModule.initializeWeatherNowIndicator(window.calendar);
            console.log('✅ Weather now indicator initialized');
          } catch (e) {
            console.warn('⚠️ Weather now indicator init failed:', e);
          }
        }
        // Initialize axis minute indicator (matches now line color)
        if (axisIndicatorModule && axisIndicatorModule.initializeAxisNowIndicator) {
          try {
            axisIndicatorModule.initializeAxisNowIndicator();
            console.log('✅ Axis now indicator initialized');
          } catch (e) {
            console.warn('⚠️ Axis now indicator init failed:', e);
          }
        }
        // Recenter after indicators are inserted, in case heights changed subtly
        setTimeout(() => {
          try { centerNowLine(calendar, 0); } catch (_) {}
        }, 300);
    }).catch(error => {
      console.warn('⚠️ Some modules failed to load:', error);
    });
  }

});