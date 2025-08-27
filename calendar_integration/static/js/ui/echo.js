import { emit } from '../utils/pubsub.js';

function cleanMermaid(code) {
  return code
    .replace(/```mermaid[\s\S]*?%%/i, '%%')
    .replace(/```$/m, '')
    .replace(/click D[0-9]+ "javascript:[^"]*"/g, '')
    .replace(/\n\s*class\s+D\d+\s+[^\n]*/g, '')
    .trim();
}

export function attachEchoHandlers({ modal, defaults, flowchartDiv, echoBtn, updateIndicator }) {
  if (!echoBtn) return;

  // Reset initial state
  echoBtn.style.display = 'none';
  echoBtn.disabled = false;
  echoBtn.textContent = 'Echo this!';

  const hasExisting = !!(defaults.flowchart && defaults.flowchart.trim().length > 0);
  if (defaults.event_id && !hasExisting && defaults.type !== 'echo') {
    echoBtn.style.display = 'inline-block';
  }

  echoBtn.onclick = async () => {
    if (!defaults.event_id) return;
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
      if (mermaidCode && flowchartDiv) {
        const cleaned = cleanMermaid(mermaidCode)
          .replace(/\n\s*click\s+D[0-9]+\s+"[^"]*"/g, '')
          .replace(/\n\s*class\s+D\d+\s+[^\n]*/g, '');
        document.querySelector('[data-tab="echo"]').click();
        try {
          if (typeof window.mermaid !== 'undefined' && window.mermaid.render) {
            const { svg } = await window.mermaid.render('new-echo-' + Date.now(), cleaned);
            flowchartDiv.innerHTML = svg;
          }
        } catch (_) {}
      }

      updateIndicator(true);
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

  const resetBtn = document.getElementById('echo-reset-btn');
  if (resetBtn) {
    resetBtn.onclick = async () => {
      const userId = (document.querySelector('meta[name="user-id"]').content || 'default_user');
      const targetEventId = defaults.event_id || null;
      if (!targetEventId) {
        if (flowchartDiv) flowchartDiv.innerHTML = '';
        updateIndicator(false);
        document.querySelector('[data-tab="details"]').click();
        return;
      }
      try {
        await fetch(`/calendar/events/${encodeURIComponent(targetEventId)}/echo/reset?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });
        if (flowchartDiv) flowchartDiv.innerHTML = '';
        updateIndicator(false);
        document.querySelector('[data-tab="details"]').click();
        if (window.loadEvents && window.calendar) {
          await window.loadEvents(window.calendar, userId);
        }
      } catch (err) {
        console.warn('Echo reset failed:', err);
      }
    };
  }
}


