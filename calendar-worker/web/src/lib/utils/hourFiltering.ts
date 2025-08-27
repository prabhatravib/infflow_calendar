/**
 * Utility functions for filtering hours based on sleep toggle states
 */

/**
 * Check if a given hour is considered "early hours" (12 AM - 6 AM)
 */
export function isEarlyHour(hour: number): boolean {
  try {
    if (typeof hour !== 'number' || isNaN(hour) || hour < 0 || hour > 23) {
      console.warn('Invalid hour passed to isEarlyHour:', hour);
      return false;
    }
    return hour >= 0 && hour < 6;
  } catch (error) {
    console.error('Error in isEarlyHour:', error);
    return false;
  }
}

/**
 * Check if a given hour is considered "late hours" (10 PM - 12 AM)
 */
export function isLateHour(hour: number): boolean {
  try {
    if (typeof hour !== 'number' || isNaN(hour) || hour < 0 || hour > 23) {
      console.warn('Invalid hour passed to isLateHour:', hour);
      return false;
    }
    return hour >= 22; // Only 22 (10 PM) and 23 (11 PM)
  } catch (error) {
    console.error('Error in isLateHour:', error);
    return false;
  }
}

/**
 * Filter hours based on sleep toggle states
 */
export function filterHoursBySleepToggles(
  hours: Date[],
  earlyHoursCollapsed: boolean,
  lateHoursCollapsed: boolean
): Date[] {
  try {
    // Validate inputs
    if (!Array.isArray(hours)) {
      console.warn('Invalid hours array passed to filterHoursBySleepToggles');
      return [];
    }
    
    if (typeof earlyHoursCollapsed !== 'boolean' || typeof lateHoursCollapsed !== 'boolean') {
      console.warn('Invalid boolean values passed to filterHoursBySleepToggles');
      return hours;
    }
    
    if (!earlyHoursCollapsed && !lateHoursCollapsed) {
      return hours; // No filtering needed
    }

    return hours.filter(hour => {
      if (!hour || !(hour instanceof Date) || isNaN(hour.getTime())) {
        console.warn('Invalid hour object in filterHoursBySleepToggles:', hour);
        return false;
      }
      
      const hourValue = hour.getHours();
      
      // Hide early hours if collapsed
      if (earlyHoursCollapsed && isEarlyHour(hourValue)) {
        return false;
      }
      
      // Hide late hours if collapsed
      if (lateHoursCollapsed && isLateHour(hourValue)) {
        return false;
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error in filterHoursBySleepToggles:', error);
    return [];
  }
}

/**
 * Get the effective time range based on sleep toggle states
 */
export function getEffectiveTimeRange(
  earlyHoursCollapsed: boolean,
  lateHoursCollapsed: boolean
): { startHour: number; endHour: number } {
  try {
    // Validate inputs
    if (typeof earlyHoursCollapsed !== 'boolean' || typeof lateHoursCollapsed !== 'boolean') {
      console.warn('Invalid boolean values passed to getEffectiveTimeRange');
      return { startHour: 0, endHour: 24 };
    }
    
    let startHour = 0;
    let endHour = 24;
    
    if (earlyHoursCollapsed) {
      startHour = 6; // Start from 6 AM instead of 12 AM
    }
    
    if (lateHoursCollapsed) {
      endHour = 22; // End at 10 PM instead of 12 AM
    }
    
    return { startHour, endHour };
  } catch (error) {
    console.error('Error in getEffectiveTimeRange:', error);
    return { startHour: 0, endHour: 24 };
  }
}
