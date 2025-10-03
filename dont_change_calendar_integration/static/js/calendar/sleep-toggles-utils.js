// Sleep toggles utilities - Helper functions for DOM manipulation and state management

// Sleep toggle state
// Start expanded so hours are visible until user collapses
let earlyCollapsed = false;
let lateCollapsed = false;

// Export state getters/setters
export function getEarlyCollapsed() { return earlyCollapsed; }
export function setEarlyCollapsed(value) { earlyCollapsed = value; }
export function getLateCollapsed() { return lateCollapsed; }
export function setLateCollapsed(value) { lateCollapsed = value; }

export function createToggleRow(toggleElement, className) {
  const row = document.createElement('tr');
  row.className = `sleep-toggle-row sleep-toggle-${className}-row`;
  row.style.cssText = `
    height: 30px !important;
    min-height: 30px !important;
    max-height: 30px !important;
    display: table-row !important;
    background: ${className === 'early' ? '#d4edda' : '#fff3cd'} !important;
    border: 2px solid ${className === 'early' ? '#28a745' : '#ffc107'} !important;
    z-index: 1000 !important;
    position: relative !important;
  `;
  
  const cell = document.createElement('td');
  cell.colSpan = 1000; // Span all columns
  cell.style.cssText = `
    padding: 0 !important;
    height: 30px !important;
    vertical-align: middle !important;
    background: transparent !important;
    position: relative !important;
  `;
  // Maintain the horizontal grid line between this toggle row and the next slot
  // FullCalendar draws lines via the slot row bottom borders, so add a bottom
  // border on the toggle row to continue the grid.
  cell.style.borderBottom = '1px solid var(--gray-200)';
  
  // Append the ORIGINAL element so its click handlers remain attached
  cell.appendChild(toggleElement);
  row.appendChild(cell);
  
  return row;
}

export function findTimeSlotTime(slot) {
  // Extract the time from a time slot element
  let hour = null;
  
  // Method 1: Check data-time attribute
  const timeAttr = slot.getAttribute('data-time');
  if (timeAttr) {
    hour = parseInt(timeAttr.split(':')[0]);
    console.log(`🎯 Method 1 (data-time): ${timeAttr} → hour ${hour}`);
  }
  
  // Method 2: Check aria-label for time
  if (hour === null || isNaN(hour)) {
    const ariaLabel = slot.getAttribute('aria-label');
    if (ariaLabel) {
      const timeMatch = ariaLabel.match(/(\d{1,2}):\d{2}/);
      if (timeMatch) {
        hour = parseInt(timeMatch[1]);
        console.log(`🎯 Method 2 (aria-label): ${ariaLabel} → hour ${hour}`);
      }
    }
  }
  
  // Method 3: Check text content for time
  if (hour === null || isNaN(hour)) {
    const textContent = slot.textContent.trim();
    const timeMatch = textContent.match(/(\d{1,2})(?::\d{2})?\s*(am|pm)/i);
    if (timeMatch) {
      let hourValue = parseInt(timeMatch[1]);
      const period = timeMatch[2].toLowerCase();
      
      // Convert to 24-hour format
      if (period === 'pm' && hourValue !== 12) {
        hourValue += 12;
      } else if (period === 'am' && hourValue === 12) {
        hourValue = 0;
      }
      hour = hourValue;
      console.log(`🎯 Method 3 (textContent): ${textContent} → hour ${hourValue} (${period}) → final hour ${hour}`);
    }
  }
  
  // Method 4: Check for specific time patterns in class names or other attributes
  if (hour === null || isNaN(hour)) {
    const classList = Array.from(slot.classList);
    for (const className of classList) {
      if (className.includes('fc-timegrid-slot-')) {
        const timeMatch = className.match(/fc-timegrid-slot-(\d{1,2})/);
        if (timeMatch) {
          hour = parseInt(timeMatch[1]);
          console.log(`🎯 Method 4 (classList): ${className} → hour ${hour}`);
          break;
        }
      }
    }
  }
  
  console.log(`🎯 Final hour extracted: ${hour}`);
  return hour;
}

export function findTimeSlot(slotsTable, targetHour) {
  // Find a time slot that matches the target hour
  const timeSlots = slotsTable.querySelectorAll('.fc-timegrid-slot');
  console.log(`🎯 findTimeSlot: Looking for hour ${targetHour}, found ${timeSlots.length} time slots`);
  
  for (const slot of timeSlots) {
    const hour = findTimeSlotTime(slot);
    console.log(`🎯 Slot hour: ${hour}, target: ${targetHour}`);
    
    if (hour === targetHour) {
      console.log(`✅ Found matching slot for hour ${targetHour}`);
      return slot;
    }
  }
  
  console.log(`❌ No slot found for hour ${targetHour}`);
  return null;
}

// Helpers to work with the timegrid DOM
export function getTimegridTBodies() {
  const slotsTable = document.querySelector('.fc-timegrid-slots table');
  const axisTable = document.querySelector('.fc-timegrid-axis table');
  const slotsTbody = slotsTable?.tBodies?.[0] || slotsTable?.querySelector('tbody') || null;
  const axisTbody = axisTable ? (axisTable.tBodies?.[0] || axisTable.querySelector('tbody')) : null;
  return { slotsTbody, axisTbody };
}

export function findRowIndexForHour(targetHour) {
  const { slotsTbody } = getTimegridTBodies();
  if (!slotsTbody) return -1;
  const rows = Array.from(slotsTbody.querySelectorAll('tr'));
  for (let i = 0; i < rows.length; i++) {
    const slot = rows[i].querySelector('.fc-timegrid-slot');
    if (!slot) continue;
    const hour = findTimeSlotTime(slot);
    if (hour === targetHour) return i;
  }
  return -1;
}

export function moveToggleRowToIndex(range, targetIndex, position) {
  const { slotsTbody, axisTbody } = getTimegridTBodies();
  if (!slotsTbody) return;
  const toggleRow = document.querySelector(`.sleep-toggle-${range}-row`);
  const toggleAxisRow = document.querySelector(`.sleep-toggle-${range}-axis-row`);
  if (!toggleRow) return;

  const rows = Array.from(slotsTbody.querySelectorAll('tr'));
  const refRow = rows[targetIndex] || null;
  const refNode = position === 'after' && refRow ? refRow.nextSibling : refRow;
  slotsTbody.insertBefore(toggleRow, refNode);

  if (axisTbody && toggleAxisRow) {
    const axisRows = Array.from(axisTbody.querySelectorAll('tr'));
    const axisRef = axisRows[targetIndex] || null;
    const axisRefNode = position === 'after' && axisRef ? axisRef.nextSibling : axisRef;
    axisTbody.insertBefore(toggleAxisRow, axisRefNode);
  }
}

// Update: hide/show corresponding axis rows too
export function toggleTimeRangeVisibility(range, isCollapsed) {
  console.log(`🎯 toggleTimeRangeVisibility: ${range} hours, collapsed: ${isCollapsed}`);

  // Persist state
  if (range === 'early') {
    setEarlyCollapsed(isCollapsed);
  } else {
    setLateCollapsed(isCollapsed);
  }

  const calendarInstance = window.calendar || null;
  const newCollapsedState = isCollapsed;
  const toggleButton = document.querySelector(`.sleep-toggle-${range}`);
  if (toggleButton) {
    toggleButton.textContent = newCollapsedState
      ? (range === 'early' ? '🌅 Show Early Hours (12 AM - 6 AM)' : '🌙 Show Late Hours (10 PM - 12 AM)')
      : (range === 'early' ? '🌅 Hide Early Hours (12 AM - 6 AM)' : '🌙 Hide Late Hours (10 PM - 12 AM)');
  }

  // Switch FullCalendar view window instead of manually hiding rows to avoid
  // coordinate misalignment. This preserves correct hit-testing for selections.
  if (calendarInstance && range === 'early') {
    try {
      calendarInstance.setOption('slotMinTime', newCollapsedState ? '06:00:00' : '00:00:00');
      // Allow layout to settle, then reposition the overlay
      setTimeout(() => {
        if (typeof window.repositionEarlyToggle === 'function') {
          window.repositionEarlyToggle();
        }
      }, 0);
    } catch (e) {
      console.warn('Failed to update slotMinTime:', e);
    }
  }

  if (calendarInstance && range === 'late') {
    try {
      calendarInstance.setOption('slotMaxTime', newCollapsedState ? '22:00:00' : '24:00:00');
      setTimeout(() => {
        if (typeof window.repositionLateToggle === 'function') {
          window.repositionLateToggle();
        }
      }, 0);
    } catch (e) {
      console.warn('Failed to update slotMaxTime:', e);
    }
  }

  // Subtle feedback on the button inside the spacer row
  if (toggleButton) {
    if (newCollapsedState) {
      toggleButton.style.background = '#6c757d';
      toggleButton.style.borderColor = '#6c757d';
    } else {
      // Use the same solid green style for both early and late bars when expanded
      toggleButton.style.background = '#28a745';
      toggleButton.style.borderColor = '#218838';
      toggleButton.style.color = 'white';
    }
  }

  updateSleepTogglesStatus(`${range === 'early' ? 'Early' : 'Late'} hours: ${newCollapsedState ? 'Hidden' : 'Visible'}`, 'success');

  // Make sure the overlay stays anchored to the 6 AM separator after layout changes
  if (range === 'early' && typeof window.repositionEarlyToggle === 'function') {
    // Defer to allow layout to settle
    setTimeout(() => {
      try { window.repositionEarlyToggle(); } catch (_) {}
    }, 0);
  }

  // Keep the 6 AM overlay bar visible at all times so users can toggle back
  // (do not hide it when early hours are collapsed)
}

// Add status update function
export function updateSleepTogglesStatus(message, type = 'info') {
  const statusElement = document.getElementById('sleep-toggles-status');
  if (statusElement) {
    statusElement.textContent = `Sleep Toggles: ${message}`;
    
    // Update styling based on type
    statusElement.style.background = type === 'error' ? '#f8d7da' : 
                                   type === 'success' ? '#d4edda' : 
                                   type === 'warning' ? '#fff3cd' : '#f8f9fa';
    statusElement.style.color = type === 'error' ? '#721c24' : 
                               type === 'success' ? '#155724' : 
                               type === 'warning' ? '#856404' : '#6c757d';
    statusElement.style.border = type === 'error' ? '1px solid #f5c6cb' : 
                                type === 'success' ? '1px solid #c3e6cb' : 
                                type === 'warning' ? '1px solid #ffeaa7' : '1px solid #dee2e6';
  }
}

