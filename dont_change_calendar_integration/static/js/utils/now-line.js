// Utilities for centering the current time indicator within the timeGrid view

/**
 * Find the correct scroller element for the timeGrid body
 * @param {HTMLElement} rootEl
 * @returns {HTMLElement|null}
 */
export function getBodyScroller(rootEl) {
  const harness = rootEl.querySelector('.fc-timegrid-body .fc-scroller-harness');
  if (harness && (harness.scrollHeight > harness.clientHeight)) return harness;
  const inner = rootEl.querySelector('.fc-timegrid-body .fc-scroller-harness .fc-scroller');
  if (inner && inner.parentElement && inner.parentElement.classList.contains('fc-scroller-harness')) {
    const parent = inner.parentElement;
    if (parent.scrollHeight > parent.clientHeight) return parent;
  }
  const bodyScroller = rootEl.querySelector('.fc-timegrid-body .fc-scroller');
  if (bodyScroller && (bodyScroller.scrollHeight > bodyScroller.clientHeight)) return bodyScroller;
  const slots = rootEl.querySelector('.fc-timegrid-body .fc-timegrid-slots');
  if (slots && (slots.scrollHeight > slots.clientHeight)) return slots;
  return harness || bodyScroller || slots || null;
}

/**
 * Center the now line within the viewport of the timeGrid scroller
 * @param {import('@fullcalendar/core').Calendar} calendar
 * @param {number} attempt
 */
export function centerNowLine(calendar, attempt = 0) {
  try {
    const viewType = calendar.view?.type || '';
    if (!/timeGrid/.test(viewType)) return;

    const scroller = getBodyScroller(calendar.el);
    const nowLine = calendar.el.querySelector('.fc-timegrid-now-indicator-line');
    if (!scroller) {
      if (attempt < 20) setTimeout(() => centerNowLine(calendar, attempt + 1), 150);
      return;
    }

    if (!nowLine || !nowLine.offsetParent) {
      const now = calendar.getOption('now')?.() || new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const slots = calendar.el.querySelector('.fc-timegrid-slots');
      const contentHeight = slots ? slots.scrollHeight : scroller.scrollHeight;
      const targetTop = Math.max(0, (minutes / (24 * 60)) * contentHeight - (scroller.clientHeight / 2));
      scroller.scrollTo({ top: Math.round(targetTop), behavior: 'auto' });
      if (attempt < 20) setTimeout(() => centerNowLine(calendar, attempt + 1), 150);
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const lineRect = nowLine.getBoundingClientRect();
    const offsetWithinScroller = lineRect.top - scrollerRect.top;
    const desiredTop = Math.max(0, scroller.scrollTop + offsetWithinScroller - (scroller.clientHeight / 2));
    if (typeof scroller.scrollTo === 'function') {
      scroller.scrollTo({ top: Math.round(desiredTop), behavior: 'auto' });
    } else {
      scroller.scrollTop = Math.round(desiredTop);
    }
  } catch (_) {
    /* no-op */
  }
}

/**
 * Observe DOM for now line and center once it appears
 * @param {import('@fullcalendar/core').Calendar} calendar
 */
export function observeNowLineOnce(calendar) {
  const root = calendar.el;
  if (!root) return;
  let done = false;
  const obs = new MutationObserver(() => {
    if (done) return;
    const el = root.querySelector('.fc-timegrid-now-indicator-line');
    if (el && el.offsetParent) {
      done = true;
      try { centerNowLine(calendar, 0); } catch (_) {}
      setTimeout(() => { try { centerNowLine(calendar, 1); } catch(_) {} }, 150);
      obs.disconnect();
    }
  });
  obs.observe(root, { childList: true, subtree: true });
  setTimeout(() => { if (!done) centerNowLine(calendar, 0); }, 600);
}


