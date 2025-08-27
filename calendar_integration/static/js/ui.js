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
  const modal = document.getElementById('event-modal');
  const form  = modal?.querySelector('form');
  const echoIndicator = document.getElementById('echo-indicator');
  const echoBtn = modal?.querySelector('#echo-event-btn');

  if (!modal || !form) {
    console.error('Modal or form not found:', { modal: !!modal, form: !!form });
    alert('Event modal could not be loaded. Please refresh the page and try again.');
    return;
  }

  const updateEchoIndicator = (hasEcho) => {
    if (echoIndicator) {
      if (hasEcho) echoIndicator.classList.add('active');
      else echoIndicator.classList.remove('active');
    }
  };

  form.reset();
  if (form.event_id) form.event_id.value = defaults.event_id ?? '';
  if (form.title) form.title.value = defaults.title ?? '';
  if (form.description) form.description.value = defaults.description ?? '';
  if (form.location) form.location.value = defaults.location ?? '';
  if (form.start_time) form.start_time.value = defaults.start_time ?? '';
  if (form.duration_minutes) form.duration_minutes.value = defaults.duration_minutes ?? 30;
  if (form.eventType) form.eventType.value = defaults.eventType || 'other';

  const flowchartDiv = document.getElementById('echo-flowchart');
  if (flowchartDiv) flowchartDiv.innerHTML = '';

  const detailsTab = document.querySelector('[data-tab="details"]');
  if (detailsTab) detailsTab.click();

  modal.showModal();

  setTimeout(() => {
    const modalRect = modal.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    if (Math.abs(modalRect.left + modalRect.width / 2 - viewportWidth / 2) > 10 ||
        Math.abs(modalRect.top + modalRect.height / 2 - viewportHeight / 2) > 10) {
      modal.style.position = 'fixed';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.margin = '0';
    }
  }, 10);

  function outside(e) { if (e.target === modal) close(); }
  function close() { modal.removeEventListener('click', outside); modal.close(); }
  modal.addEventListener('click', outside);

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

  const delBtn = modal.querySelector('.delete');
  delBtn.style.display = defaults.event_id ? 'inline-block' : 'none';
  delBtn.onclick = () => { emit('event:deleted', defaults.event_id); close(); };

  const existingFlowchart = (() => {
    if (!defaults.event_id) return null;
    if (defaults.flowchart && defaults.flowchart.trim().length > 0) return defaults.flowchart;
    if ((defaults.type === 'echo' || (defaults.echo_event_ids && defaults.echo_event_ids.length)) && window.calendar) {
      const allEvents = window.calendar.getEvents();
      for (const ev of allEvents) {
        const props = ev.extendedProps;
        if (props.flowchart && props.flowchart.trim().length > 0 && props.echo_event_ids && props.echo_event_ids.includes(defaults.event_id)) {
          return props.flowchart;
        }
      }
    }
    return null;
  })();

  updateEchoIndicator(existingFlowchart && existingFlowchart.trim().length > 0);

  if (existingFlowchart && flowchartDiv) {
    (async () => {
      try {
        const cleanedCode = existingFlowchart
          .replace(/```mermaid[\s\S]*?%%/i, '%%')
          .replace(/```$/m, '')
          .replace(/click D[0-9]+ "javascript:[^"]*"/g, '')
          .replace(/\n\s*class\s+D\d+\s+[^\n]*/g, '')
          .trim();
        if (typeof window.mermaid !== 'undefined' && window.mermaid.render) {
          const { svg } = await window.mermaid.render('existing-echo-' + Date.now(), cleanedCode);
          flowchartDiv.innerHTML = svg;
        }
      } catch (err) { console.error('Failed to auto-render existing flowchart:', err); }
    })();
  }

  if (defaults.event_id) {
    if (existingFlowchart) {
      echoBtn.style.display = 'none';
    } else if (defaults.type !== 'echo') {
      echoBtn.style.display = 'inline-block';
      echoBtn.disabled = false;
      echoBtn.textContent = 'Echo this!';
      echoBtn.onclick = async () => {
        echoBtn.disabled = true;
        echoBtn.textContent = 'Generating...';
        try {
          const userId = document.querySelector('meta[name="user-id"]').content || 'default_user';
          const res = await fetch(`/calendar/events/${defaults.event_id}/echo?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });
          if (!res.ok) throw new Error('Failed to generate follow-ups');
          const data = await res.json();
          if (window.loadEvents && window.calendar) {
            await window.loadEvents(window.calendar, userId);
          }
          let mermaidCode = data.data?.mermaid || '';
          if (mermaidCode) {
            const cleaned = mermaidCode
              .replace(/```mermaid[\s\S]*?%%/i, '%%')
              .replace(/```$/m, '')
              .replace(/click D[0-9]+ "javascript:[^"]*"/g, '')
              .trim();
            window.gotoDateWithTitle = function(dateStr, eventTitle) {
              if (window.calendar) {
                try {
                  const date = new Date(dateStr);
                  window.calendar.gotoDate(date);
                  const allEvents = window.calendar.getEvents();
                  let foundEvent = null;
                  for (const event of allEvents) {
                    const eventDate = event.start;
                    if (eventDate && eventDate.toISOString().startsWith(dateStr)) {
                      if (eventTitle && event.title === eventTitle) { foundEvent = event; break; }
                      else if (!eventTitle && !foundEvent) { foundEvent = event; }
                    }
                  }
                  if (foundEvent) {
                    const eventClickInfo = { event: foundEvent, el: null, jsEvent: null, view: window.calendar.view };
                    const eventClickHandler = window.calendar.getOption('eventClick');
                    if (eventClickHandler) { eventClickHandler(eventClickInfo); }
                  }
                } catch (e) { console.error('Invalid date or event lookup:', e); }
              }
            };
            window.gotoDate = function(dateStr) { window.gotoDateWithTitle(dateStr, null); };
            document.querySelector('[data-tab="echo"]').click();
            try {
              const finalCode = cleaned
                .replace(/\n\s*click\s+D[0-9]+\s+"[^"]*"/g, '')
                .replace(/\n\s*class\s+D\d+\s+[^\n]*/g, '');
              if (typeof window.mermaid !== 'undefined' && window.mermaid.render) {
                const { svg } = await window.mermaid.render('new-echo-' + Date.now(), finalCode);
                flowchartDiv.innerHTML = svg;
              }
            } catch (mermaidError) {
              console.error('Mermaid render failed:', mermaidError);
              flowchartDiv.innerHTML = '<div style="color: #dc3545; padding: 20px; text-align: center;">Flowchart rendering error - please try again.</div>';
            }
          }
          updateEchoIndicator(true);
          echoBtn.textContent = 'Echo this!';
          echoBtn.disabled = false;
          echoBtn.style.display = 'none';
        } catch (err) {
          console.error('Echo generation error:', err);
          alert('Failed to generate follow-ups: ' + (err.message || err));
          echoBtn.disabled = false;
          echoBtn.textContent = 'Echo this!';
        }
      };
    } else {
      echoBtn.style.display = 'none';
      if (flowchartDiv) flowchartDiv.innerHTML = '';
    }
  }

  (function setupTabs(){
    const modal = document.getElementById('event-modal');
    const btns  = modal.querySelectorAll('.tab-btn');
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