// Sleep toggles UI - Core initialization and rendering
// Import utilities
import { 
  findTimeSlotTime, 
  findRowIndexForHour, 
  toggleTimeRangeVisibility,
  updateSleepTogglesStatus,
  getEarlyCollapsed,
  getLateCollapsed
} from './sleep-toggles-utils.js';

// Initialize row-based sleep toggles (12–6 AM and 10–12 PM)
export function initializeSleepToggles(calendar) {
  if (!calendar) return;

  const setup = () => {
    // Only apply to time grid views
    const viewType = calendar.view && calendar.view.type;
    if (!viewType || !viewType.startsWith('timeGrid')) {
  return;
    }
    // Classify slots and insert the toggle rows near 6am/10pm
    try {
      classifyTimeSlots();
      insertSleepToggles(calendar);
    } catch (e) {
      console.warn('Sleep toggles setup failed:', e);
    }
  };

  // Initial
  setTimeout(setup, 150);

  // Re-run on view mount or date changes
  calendar.on('viewDidMount', () => setTimeout(setup, 150));
  calendar.on('datesSet', () => setTimeout(setup, 150));
}

function classifyTimeSlots() {
  // Add classes to time slots to identify early and late hours
  const timeSlots = document.querySelectorAll('.fc-timegrid-slot');
  
  console.log(`🎯 classifyTimeSlots: Found ${timeSlots.length} time slots to classify`);
  
  if (timeSlots.length === 0) {
    console.warn('⚠️ No time slots found - calendar might not be fully rendered yet');
    return;
  }
  
  // Log all time slots for debugging
  timeSlots.forEach((slot, index) => {
    const timeAttr = slot.getAttribute('data-time');
    const ariaLabel = slot.getAttribute('aria-label');
    const textContent = slot.textContent.trim();
    const classList = Array.from(slot.classList);
    
    console.log(`🎯 Slot ${index}:`, {
      timeAttr,
      ariaLabel,
      textContent,
      classList: classList.filter(cls => cls.includes('fc-timegrid-slot-')),
      element: slot
    });
  });
  
  let earlyCount = 0;
  let lateCount = 0;
  
  timeSlots.forEach((slot, index) => {
    const hour = findTimeSlotTime(slot);
    
    if (hour !== null && !isNaN(hour)) {
      // Remove existing classes
      slot.classList.remove('early-hours', 'late-hours');
      
      // Classify early hours (12 AM - 6 AM)
      if (hour >= 0 && hour < 6) {
        slot.classList.add('early-hours');
        earlyCount++;
        console.log(`✅ Slot ${index} classified as early hours: ${hour}:00`);
      }
      // Classify late hours (10 PM - 12 AM)
      else if (hour >= 22 || hour === 0) {
        slot.classList.add('late-hours');
        lateCount++;
        console.log(`✅ Slot ${index} classified as late hours: ${hour}:00`);
      }
    } else {
      console.warn(`⚠️ Slot ${index} could not be classified - hour: ${hour}`);
    }
  });
  
  console.log(`🎯 Time slot classification complete: ${earlyCount} early hours, ${lateCount} late hours`);
  
  // Update status
  if (earlyCount === 0 && lateCount === 0) {
    updateSleepTogglesStatus('No time slots classified - check calendar view', 'warning');
  } else {
    updateSleepTogglesStatus(`Classified: ${earlyCount} early, ${lateCount} late slots`, 'info');
  }
}

function applySleepStates(calendar) {
  if (!calendar || !calendar.view) return;

  // Don't hide time ranges completely - just style them differently
  // This allows our toggle buttons to remain visible
  console.log('Applying sleep states:', { earlyCollapsed: getEarlyCollapsed(), lateCollapsed: getLateCollapsed() });
  
  // We'll handle the visual hiding through CSS instead of hiding the slots completely
}

function insertSleepToggles(calendar) {
  // Render a non-intrusive overlay aligned with the 6 AM separator so it does not
  // consume a real time slot or affect event hit-testing.
  setTimeout(() => {
    const slotsTable = document.querySelector('.fc-timegrid-slots table');
    const slotsContainer = document.querySelector('.fc-timegrid-slots');
    if (!slotsTable || !slotsContainer) {
      updateSleepTogglesStatus('Slots container not found', 'error');
      return;
    }

    // Cleanup any previous artifacts
    document.querySelectorAll('.sleep-toggle-row').forEach(r => r.remove());
    document.querySelectorAll('.sleep-toggle-axis-row').forEach(r => r.remove());
    document.querySelectorAll('.sleep-toggle-overlay').forEach(r => r.remove());

    const sixIndex = findRowIndexForHour(6);
    const tbody = slotsTable.tBodies?.[0] || slotsTable.querySelector('tbody');
    if (!tbody || sixIndex === -1) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const sixRow = rows[sixIndex];
    if (!sixRow) return;

    // Create overlay
    const overlayHeight = 16; // thin overlay purely visual
    const overlay = document.createElement('div');
    overlay.className = 'sleep-toggle-overlay sleep-toggle-early-overlay';
    overlay.style.cssText = `
      position: absolute; left: 0; right: 0; height: ${overlayHeight}px; z-index: 7;
      display: flex; align-items: center; justify-content: center; pointer-events: none;
      margin: 0; padding: 0; background: transparent;
    `;
    overlay.style.willChange = 'top, transform';

    const earlyToggle = createToggleContainer('🌅 Hide Early Hours (12 AM - 6 AM)', 'early', () => {
      // Use our tracked state instead of DOM classes so it works with slotMinTime
      toggleTimeRangeVisibility('early', !getEarlyCollapsed());
    });
    earlyToggle.style.pointerEvents = 'auto';
    earlyToggle.style.width = '100%';
    earlyToggle.style.height = `${overlayHeight}px`;
    earlyToggle.style.borderRadius = '12px';
    earlyToggle.style.lineHeight = `${overlayHeight}px`;
    overlay.appendChild(earlyToggle);

    // Place overlay centered on the 6 AM separator
    const positionOverlay = () => {
      // Re-locate the 6 AM row each time because the DOM layout changes when rows
      // are hidden/shown.
      const minTime = (window.calendar && window.calendar.getOption('slotMinTime')) || '00:00:00';
      if (minTime === '06:00:00') {
        // Collapsed: keep the bar visible at the very top of the grid
        overlay.style.top = '0px';
        overlay.style.transform = '';
        return;
      }
      const freshIndex = findRowIndexForHour(6);
      const freshRow = (tbody.querySelectorAll('tr') || [])[freshIndex];
      const targetRow = freshRow || sixRow;
      if (!targetRow) return;
      // Place the bar ABOVE the 6:00 AM separator (top edge of the 6 AM row)
      const topEdge = targetRow.offsetTop; // 6:00 AM line
      const desiredTop = Math.max(0, Math.round(topEdge - overlayHeight - 2));
      overlay.style.top = `${desiredTop}px`;
      overlay.style.transform = '';
    };
    positionOverlay();

    // Ensure the container is positioned
    if (getComputedStyle(slotsContainer).position === 'static') {
      slotsContainer.style.position = 'relative';
    }
    slotsContainer.appendChild(overlay);


    // Reposition on resize and expose a global hook for state changes
    window.addEventListener('resize', positionOverlay);
    window.repositionEarlyToggle = positionOverlay;

    // Apply initial state
    toggleTimeRangeVisibility('early', getEarlyCollapsed());
    updateSleepTogglesStatus('Ready', 'success');

    // ===== LATE HOURS (10 PM - 12 AM) TOGGLE =====
    // Build late overlay
    const lateOverlay = document.createElement('div');
    lateOverlay.className = 'sleep-toggle-overlay sleep-toggle-late-overlay';
    lateOverlay.style.cssText = `
      position: absolute; left: 0; right: 0; height: ${overlayHeight}px; z-index: 7;
      display: flex; align-items: center; justify-content: center; pointer-events: none;
      margin: 0; padding: 0; background: transparent;
    `;
    lateOverlay.style.willChange = 'top, bottom, transform';

    const lateToggle = createToggleContainer('🌙 Hide Late Hours (10 PM - 12 AM)', 'late', () => {
      toggleTimeRangeVisibility('late', !getLateCollapsed());
    });
    // late visual: match early (green) to avoid double-layer orange/green look
    lateToggle.style.background = '#28a745';
    lateToggle.style.borderColor = '#218838';
    lateToggle.style.color = 'white';
    lateToggle.style.pointerEvents = 'auto';
    lateToggle.style.width = '100%';
    lateToggle.style.height = `${overlayHeight}px`;
    lateToggle.style.borderRadius = '12px';
    lateToggle.style.lineHeight = `${overlayHeight}px`;
    lateOverlay.appendChild(lateToggle);

    const positionLateOverlay = () => {
      const maxTime = (window.calendar && window.calendar.getOption('slotMaxTime')) || '24:00:00';
      if (maxTime === '22:00:00') {
        // Collapsed: anchor to bottom of grid and keep inside (appears just above 10 PM line)
        lateOverlay.style.top = '';
        lateOverlay.style.bottom = '0px';
        lateOverlay.style.transform = 'translateY(0)';
        return;
      }
      // Expanded: place just BELOW the 10 PM line (top edge of the 10–11 PM row)
      const tbody = slotsTable.tBodies?.[0] || slotsTable.querySelector('tbody');
      if (!tbody) return;
      // Find the 9–10 PM row to compute the 10 PM separator, then place below it
      const nineIndex = findRowIndexForHour(21);
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const nineRow = nineIndex !== -1 ? rows[nineIndex] : null;
      if (!nineRow) return;
      const tenPmSeparator = nineRow.offsetTop + nineRow.offsetHeight; // 10 PM separator
      const desiredTop = Math.max(0, Math.round(tenPmSeparator + 2));
      lateOverlay.style.bottom = '';
      lateOverlay.style.top = `${desiredTop}px`;
    };

    slotsContainer.appendChild(lateOverlay);
    window.addEventListener('resize', positionLateOverlay);
    window.repositionLateToggle = positionLateOverlay;
    positionLateOverlay();

    // Apply initial state for late hours
    toggleTimeRangeVisibility('late', getLateCollapsed());
  }, 150);
}

function createToggleContainer(text, className, onClick) {
  const container = document.createElement('div');
  container.className = `sleep-toggle-container sleep-toggle-${className}`;
  container.style.cssText = `
    position: relative;
    width: 100%;
    height: 30px;
    background: #28a745;
    color: white;
    border: 2px solid #218838;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    font-size: 14px;
    font-weight: 600;
    user-select: none;
    transition: all 0.2s ease;
    box-sizing: border-box;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  // Add hover effects
  container.addEventListener('mouseenter', () => {
    container.style.background = '#218838';
    container.style.transform = 'translateY(-1px)';
    container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  });
  
  container.addEventListener('mouseleave', () => {
    container.style.background = '#28a745';
    container.style.transform = 'translateY(0)';
    container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  });
  
  container.textContent = text;
  container.addEventListener('click', onClick);
  
  console.log(`🎯 Created ${className} toggle container:`, container);
  return container;
}

