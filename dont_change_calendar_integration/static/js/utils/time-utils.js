// Utilities related to time calculations for the calendar UI

/**
 * Compute an initial scrollTime so the now-line is near center on first load
 * @param {HTMLElement} calendarEl
 * @returns {string} HH:MM:SS
 */
export function computeInitialScrollTime(calendarEl) {
  try {
    const tz = calendarEl?.getAttribute('data-tz') || 'America/New_York';
    const nowLocal = new Date();
    const nowET = new Date(nowLocal.toLocaleString('en-US', { timeZone: tz }));
    const hours = nowET.getHours();
    const minutes = nowET.getMinutes();
    // Heuristic: subtract ~6 hours so "now" lands around the middle of a ~12h viewport
    const subtractMinutes = 6 * 60;
    let total = hours * 60 + minutes - subtractMinutes;
    if (total < 0) total = 0;
    if (total > (24 * 60 - 1)) total = 24 * 60 - 1;
    const hh = String(Math.floor(total / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}:00`;
  } catch (_) {
    return '08:00:00';
  }
}


