// Minimal pub-sub
const listeners = {};
function emit(eventName, payload) {
  (listeners[eventName] || []).forEach(fn => fn(payload));
}
function on(eventName, handler) {
  listeners[eventName] = listeners[eventName] || [];
  listeners[eventName].push(handler);
}

export function toastError(err) {
  console.error(err);
  alert(err.message || 'An error occurred');
}

export function openEventModal(defaults = {}) {
  console.log('🔍 openEventModal called with defaults:', defaults);
  
  const modal = document.getElementById('event-modal');
  const form = document.getElementById('event-form');
  const echoBtn = document.getElementById('echo-event-btn');
  const resetBtn = document.getElementById('echo-reset-btn');
  const flowchartDiv = document.getElementById('echo-flowchart');
  const echoIndicator = document.getElementById('echo-indicator');

  console.log('🔍 Modal elements found:', {
    modal: !!modal,
    form: !!form,
    echoBtn: !!echoBtn,
    resetBtn: !!resetBtn,
    flowchartDiv: !!flowchartDiv,
    echoIndicator: !!echoIndicator
  });

  if (!modal || !form) {
    console.error('Modal or form not found:', { modal: !!modal, form: !!form });
    alert('Event modal could not be loaded. Please refresh the page and try again.');
    return;
  }

  // Reset form and modal state
  form.reset();
  if (flowchartDiv) flowchartDiv.innerHTML = '';
  if (echoIndicator) echoIndicator.classList.remove('active');
  
  // Check if event has existing echo data
  const existingFlowchart = defaults.flowchart;
  const hasExistingEcho = existingFlowchart && existingFlowchart.trim();
  
  console.log('🔍 Event echo data check:', {
    hasExistingEcho: !!hasExistingEcho,
    flowchartLength: existingFlowchart ? existingFlowchart.length : 0
  });

  // If event has existing flowchart, display it immediately
  if (hasExistingEcho && flowchartDiv) {
    console.log('🔍 Displaying existing flowchart');
    try {
      // Render the existing flowchart
      if (typeof window.mermaid !== 'undefined' && window.mermaid.render) {
        window.mermaid.render('existing-echo-' + Date.now(), existingFlowchart).then(({ svg }) => {
          flowchartDiv.innerHTML = svg;
          if (echoIndicator) echoIndicator.classList.add('active');
        }).catch((error) => {
          console.error('Error rendering existing Mermaid flowchart:', error);
          flowchartDiv.innerHTML = '<div style="color: #dc3545; padding: 20px; text-align: center;">Error displaying existing flowchart</div>';
        });
      } else {
        flowchartDiv.innerHTML = '<div style="color: #dc3545; padding: 20px; text-align: center;">Mermaid library not loaded</div>';
      }
    } catch (error) {
      console.error('Error displaying existing flowchart:', error);
      flowchartDiv.innerHTML = '<div style="color: #dc3545; padding: 20px; text-align: center;">Error displaying existing flowchart</div>';
    }
  }
  
  // Populate form with defaults
  Object.entries(defaults).forEach(([key, value]) => {
    const input = form.querySelector(`[name="${key}"]`);
    if (input && value !== undefined) {
      if (key === 'start_time' && value) {
        // Convert to local datetime-local format
        const date = new Date(value);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        input.value = localDate.toISOString().slice(0, 16);
      } else if (key === 'duration_minutes' && value) {
        input.value = value;
      } else if (key !== 'flowchart' && key !== 'echo_event_ids') { // Skip echo-related fields
        input.value = value;
      }
    }
  });

  // Show modal
  modal.showModal();

  // Set up echo button functionality
  if (echoBtn && !defaults.type) {
    console.log('🔍 Setting up echo button for non-echo event');
    echoBtn.style.display = 'inline-block';
    echoBtn.textContent = 'Echo this!';
    echoBtn.disabled = false;
    echoBtn.onclick = async () => {
      echoBtn.disabled = true;
      echoBtn.textContent = 'Generating...';
      try {
        // Use a hardcoded user ID since the meta tag doesn't exist
        const userId = 'default_user';
        console.log('🔍 Making echo API call for user:', userId);
        
        const res = await fetch(`/calendar/events/${defaults.event_id}/echo?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });
        console.log('🔍 Echo API response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('🔍 Echo API error response:', errorText);
          throw new Error(`Failed to generate echo: ${res.status} ${errorText}`);
        }
        
        const data = await res.json();
        console.log('🔍 Echo response received:', data);
        
        if (data.data && data.data.mermaid) {
          console.log('🔍 Mermaid data found, rendering flowchart...');
          
          // Switch to echo tab to show the flowchart
          const echoTab = document.querySelector('[data-tab="echo"]');
          if (echoTab) {
            echoTab.click();
          }
          
          // Clean and render the Mermaid flowchart
          const cleaned = data.data.mermaid
            .replace(/\n\s*click\s+D[0-9]+\s+"[^"]*"/g, '')
            .replace(/\n\s*class\s+D\d+\s+[^\n]*/g, '');
          
          if (typeof window.mermaid !== 'undefined' && window.mermaid.render) {
            const { svg } = await window.mermaid.render('new-echo-' + Date.now(), cleaned);
            flowchartDiv.innerHTML = svg;
            console.log('🔍 Flowchart rendered successfully');
          } else {
            console.error('🔍 Mermaid library not available');
            flowchartDiv.innerHTML = '<div style="color: #dc3545; padding: 20px; text-align: center;">Mermaid library not loaded</div>';
          }
          
          // Show echo indicator
          if (echoIndicator) echoIndicator.classList.add('active');
          
          // Hide echo button since echo was generated
          echoBtn.style.display = 'none';
          
          // Refresh calendar events to show new follow-up events
          if (window.loadEvents && window.calendar) {
            console.log('🔍 Refreshing calendar events...');
            await window.loadEvents(window.calendar, userId);
          }
          
          console.log('🔍 Echo generation completed successfully');
        } else {
          console.error('🔍 No Mermaid data in response:', data);
          flowchartDiv.innerHTML = '<div style="color: #dc3545; padding: 20px; text-align: center;">No flowchart data received</div>';
        }
        
        echoBtn.disabled = false;
        echoBtn.textContent = 'Echo this!';
      } catch (err) {
        console.error('🔍 Echo generation error:', err);
        alert('Failed to generate follow-ups: ' + (err.message || err));
        echoBtn.disabled = false;
        echoBtn.textContent = 'Echo this!';
      }
    };
  } else {
    console.log('🔍 Event is echo type, hiding echo button');
    echoBtn.style.display = 'none';
    if (flowchartDiv && !hasExistingEcho) flowchartDiv.innerHTML = '';
  }

  // Set up reset button functionality
  if (resetBtn && defaults.event_id && hasExistingEcho) {
    console.log('🔍 Setting up reset button for event with flowchart');
    resetBtn.style.display = 'inline-block';
    resetBtn.onclick = async () => {
      if (confirm('Are you sure you want to reset the echo flowchart? This will remove all follow-up events.')) {
        try {
          const userId = 'default_user';
          const res = await fetch(`/calendar/events/${defaults.event_id}/echo/reset?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });
          if (!res.ok) throw new Error('Failed to reset echo');
          
          // Refresh events and close modal
          if (window.loadEvents && window.calendar) {
            await window.loadEvents(window.calendar, userId);
          }
          modal.close();
        } catch (err) {
          console.error('Reset error:', err);
          alert('Failed to reset echo: ' + (err.message || err));
        }
      }
    };
  } else if (resetBtn) {
    console.log('🔍 Hiding reset button - no flowchart or event_id');
    resetBtn.style.display = 'none';
  }

  // Set up form submission
  form.onsubmit = e => {
    e.preventDefault();
    const submitBtn = modal.querySelector('[type="submit"]');
    if (submitBtn && submitBtn.disabled) return;
    const payload = Object.fromEntries(new FormData(form));
    payload.duration_minutes = Number(payload.duration_minutes);
    if (form.eventType) payload.eventType = form.eventType.value;
    if (!payload.eventType) payload.eventType = 'other';
    if (payload.eventType === 'fun') {
      const start = new Date(payload.start_time);
      const end = new Date(start.getTime() + payload.duration_minutes * 60000);
      const duration = (end - start) / (1000 * 60 * 60);
      if (duration > 8) {
        alert('Fun activity duration cannot be more than 8 hours');
        return false;
      }
    }
    if (payload.eventType === 'fun') payload.color = '#e91e63';
    else if (payload.eventType === 'work') payload.color = '#2196f3';
    else payload.color = '#43a047';
    emit('event:saved', payload);
  };

  // Set up delete button
  const delBtn = modal.querySelector('.delete');
  delBtn.style.display = defaults.event_id ? 'inline-block' : 'none';
  delBtn.onclick = () => { emit('event:deleted', defaults.event_id); modal.close(); };

  // Set up modal close on outside click
  function outside(e) { if (e.target === modal) modal.close(); }
  modal.addEventListener('click', outside);

  // Set up tabs
  (function setupTabs(){
    const btns = modal.querySelectorAll('.tab-btn');
    btns.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        btns.forEach(b=>b.classList.toggle('active', b===btn));
        modal.querySelectorAll('.tab-pane').forEach(p=>{
          p.classList.toggle('active', p.id === 'tab-'+btn.dataset.tab);
        });
      });
    });
  })();
}

export const ui = { on, openEventModal, toastError };
window.ui = ui;