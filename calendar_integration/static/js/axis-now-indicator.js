// Axis Now Indicator
// Renders a thin vertical bar on the right edge of the time axis with the current minute label.

class AxisNowIndicator {
  constructor() {
    this.container = null;
    this.lineEl = null;
    this.labelEl = null;
    this.tickInterval = null;
    this.boundReposition = () => this.reposition();
    this.scrollEls = [];
  }

  init() {
    // Only for timeGrid views
    const axisContainer = document.querySelector('.fc-timegrid-axis');
    const fcRoot = document.querySelector('.fc');
    if (!axisContainer || !fcRoot) return;
    // Use the calendar root as the overlay container to avoid clipping
    this.container = fcRoot;

    // Ensure positioned container for absolute children
    const cs = getComputedStyle(this.container);
    if (cs.position === 'static') {
      this.container.style.position = 'relative';
    }

    // Create elements
    const line = document.createElement('div');
    line.className = 'axis-now-indicator-line';
    line.style.cssText = [
      'position:absolute',
      'right:0',
      'width:2px',
      'height:14px',
      'background:currentColor',
      'border-radius:2px',
      'z-index:9',
      'pointer-events:none'
    ].join(';');
    this.lineEl = line;

    const label = document.createElement('div');
    label.className = 'axis-now-indicator-minute';
    label.style.cssText = [
      'position:absolute',
      'transform:translate(-100%, -50%)',
      'font-size:12px',
      'font-weight:600',
      'line-height:1',
      'color:currentColor',
      'pointer-events:none',
      'user-select:none',
      'z-index:1000',
      'background:transparent',
      'white-space:nowrap'
    ].join(';');
    this.labelEl = label;

    this.container.appendChild(line);
    this.container.appendChild(label);

    // Update frequently enough to track minutes and minor scroll/resize
    window.addEventListener('resize', this.boundReposition);
    // Watch all internal scrollers to keep Y position synced
    this.scrollEls = Array.from(document.querySelectorAll('.fc-scroller'));
    this.scrollEls.forEach(el => el.addEventListener('scroll', this.boundReposition));
    document.addEventListener('visibilitychange', this.boundReposition);

    this.reposition();
    // Tick every 15s to keep minutes fresh without excess
    this.tickInterval = setInterval(() => this.reposition(), 15000);
  }

  destroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.scrollEls.forEach(el => el.removeEventListener('scroll', this.boundReposition));
    window.removeEventListener('resize', this.boundReposition);
    if (this.lineEl && this.lineEl.parentNode) this.lineEl.parentNode.removeChild(this.lineEl);
    if (this.labelEl && this.labelEl.parentNode) this.labelEl.parentNode.removeChild(this.labelEl);
  }

  reposition() {
    if (!this.container || !this.lineEl || !this.labelEl) return;

    // Find the horizontal now line to sync Y and color
    const nowLine = document.querySelector('.fc-timegrid-now-indicator-line');
    if (!nowLine || !nowLine.offsetParent) {
      this.lineEl.style.display = 'none';
      this.labelEl.style.display = 'none';
      return;
    }

    const fcRect = this.container.getBoundingClientRect();
    const axisRect = (document.querySelector('.fc-timegrid-axis') || this.container).getBoundingClientRect();
    const lineRect = nowLine.getBoundingClientRect();
    const top = Math.max(0, Math.round(lineRect.top - fcRect.top));

    // Position with a small half-height offset so the 14px line centers on the now line
    const half = 7;
    this.lineEl.style.top = `${top - half}px`;
    this.labelEl.style.top = `${top}px`;
    // Position near the right edge of the axis column
    const barLeft = Math.round(axisRect.right - fcRect.left - 2); // 2px bar inside edge
    this.lineEl.style.left = `${barLeft}px`;
    const labelAnchor = Math.round(axisRect.right - fcRect.left - 4); // 4px padding from edge
    this.labelEl.style.left = `${labelAnchor}px`;
    this.labelEl.style.transform = 'translate(-100%, -50%)';

    // Minute label (two digits)
    const now = new Date();
    const minute = now.getMinutes().toString().padStart(2, '0');
    this.labelEl.textContent = minute;

    // Color: match the calendar now line (border color)
    const cs = getComputedStyle(nowLine);
    const color = cs.borderTopColor || cs.borderColor || '#000';
    this.container.style.setProperty('--axis-now-color', color);
    this.lineEl.style.color = color;
    this.lineEl.style.background = 'currentColor';
    this.labelEl.style.color = color;

    this.lineEl.style.display = 'block';
    this.labelEl.style.display = 'block';
    this.lineEl.style.visibility = 'visible';
    this.labelEl.style.visibility = 'visible';
  }
}

export function initializeAxisNowIndicator() {
  const indicator = new AxisNowIndicator();
  indicator.init();

  // Expose for debugging
  window.axisNowIndicator = indicator;
  return indicator;
}

// Fallback init when loaded directly
document.addEventListener('DOMContentLoaded', () => {
  try { new AxisNowIndicator().init(); } catch (_) {}
});


