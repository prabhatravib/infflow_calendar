// Lightweight pub-sub used by UI modules

const listeners = {};

export function on(evt, fn) {
  listeners[evt] = listeners[evt] || [];
  listeners[evt].push(fn);
}

export function emit(evt, payload) {
  (listeners[evt] || []).forEach(fn => {
    try { fn(payload); } catch (e) { console.error('Listener error', e); }
  });
}


