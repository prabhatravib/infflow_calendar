/**
 * Dynamic slot height adjustment utility
 * Measures actual FullCalendar slot height and updates CSS variable accordingly
 */

/**
 * Adjust the slot height CSS variable based on FullCalendar's actual rendering
 * @param {Object} calendar - FullCalendar instance
 */
export function adjustSlotHeight(calendar) {
  if (!calendar) return;
  
  // Wait for the calendar to be fully rendered
  setTimeout(() => {
    const slotElement = calendar.el.querySelector('.fc-timegrid-slot');
    if (!slotElement) return;
    
    // Get the actual computed height of a slot
    const computedHeight = slotElement.offsetHeight;
    
    if (computedHeight && computedHeight > 0) {
      // Update the CSS variables to match the actual height
      document.documentElement.style.setProperty('--fc-slot-h', `${computedHeight}px`);
      document.documentElement.style.setProperty('--fc-slot-min-height', `${computedHeight}px`);

      console.log(`Adjusted slot height to ${computedHeight}px`);
    }
  }, 100); // Small delay to ensure rendering is complete
}

/**
 * Initialize slot height adjustment with event listeners
 * @param {Object} calendar - FullCalendar instance
 */
export function initializeSlotHeightAdjustment(calendar) {
  if (!calendar) return;
  
  // Adjust on initial load
  adjustSlotHeight(calendar);
  fixTimelineDrift(calendar);
  
  // Adjust when view changes
  calendar.on('datesSet', () => {
    adjustSlotHeight(calendar);
    fixTimelineDrift(calendar);
  });
  
  // Adjust when window resizes
  window.addEventListener('resize', () => {
    adjustSlotHeight(calendar);
    fixTimelineDrift(calendar);
  });
  
  // Adjust when theme changes (if applicable)
  const observer = new MutationObserver(() => {
    adjustSlotHeight(calendar);
    fixTimelineDrift(calendar);
  });
  
  // Observe changes to the calendar element
  observer.observe(calendar.el, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: true
  });
}

/**
 * Reset slot height to default value
 */
export function resetSlotHeight() {
  // Keep defaults in sync with base CSS (65px)
  document.documentElement.style.setProperty('--fc-slot-h', '65px');
  document.documentElement.style.setProperty('--fc-slot-min-height', '65px');
}

/**
 * Set slot height to a specific value
 * @param {number} height - Height in pixels
 */
export function setSlotHeight(height) {
  document.documentElement.style.setProperty('--fc-slot-h', `${height}px`);
  document.documentElement.style.setProperty('--fc-slot-min-height', `${height}px`);
}

/**
 * Fix timeline drift by syncing axis height with grid height
 */
export function fixTimelineDrift(calendar) {
  if (!calendar) return;
  
  setTimeout(() => {
    const gridContainer = calendar.el.querySelector('.fc-timegrid-slots');
    const axisContainer = calendar.el.querySelector('.fc-timegrid-axis');
    
    if (gridContainer && axisContainer) {
      const gridHeight = gridContainer.scrollHeight;
      const axisChunk = axisContainer.querySelector('.fc-timegrid-axis-chunk');
      if (axisChunk) {
        axisChunk.style.height = `${gridHeight}px`;
      }
    }
  }, 500);
} 