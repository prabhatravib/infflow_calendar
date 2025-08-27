import { useState, useCallback } from 'react';
<<<<<<< HEAD

=======
//comment
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837
export interface TogglePositions {
  earlyToggle: number | null;
  lateToggle: number | null;
}

export function useSleepToggles() {
<<<<<<< HEAD
  const [lateHoursCollapsed, setLateHoursCollapsed] = useState(false);
  const [earlyHoursCollapsed, setEarlyHoursCollapsed] = useState(false);
=======
  const [lateHoursCollapsed, setLateHoursCollapsed] = useState(true);
  const [earlyHoursCollapsed, setEarlyHoursCollapsed] = useState(true);
>>>>>>> 7d9f3f4f91a2b718269f0ce8a4d10767a45ef837

  // Filter hours based on sleep toggle states
  const filterHoursByToggles = useCallback((allHours: Date[]) => {
    try {
      // Always generate all 24 hours first if not provided
      const hours = allHours.length > 0 ? allHours : [];
      
      // Then filter based on sleep toggle states
      const filteredHours = hours.filter(hour => {
        if (!hour || !(hour instanceof Date) || isNaN(hour.getTime())) {
          return false;
        }
        
        const hourValue = hour.getHours();
        const minuteValue = hour.getMinutes();
        const totalMinutes = hourValue * 60 + minuteValue;
        
        // Hide late hours if collapsed (times from 10:00 PM = 1320 minutes onwards)
        if (lateHoursCollapsed && totalMinutes >= 1320) {
          return false;
        }
        
        // Hide early hours if collapsed (times from 12:00 AM to 5:59 AM = 0 to 359 minutes)
        if (earlyHoursCollapsed && totalMinutes < 360) {
          return false;
        }
        
        return true;
      });
      
      return filteredHours;
    } catch (error) {
      console.error('Error filtering hours:', error);
      return allHours;
    }
  }, [lateHoursCollapsed, earlyHoursCollapsed]);

  // Calculate toggle positions based on actual time values, not array indices
  const calculateTogglePositions = useCallback((hours: Date[]): TogglePositions => {
    const positions: TogglePositions = {
      earlyToggle: null,
      lateToggle: null
    };
    
    if (Array.isArray(hours)) {
      // Early toggle: find the hour that comes before 6:00 AM
      const earlyBoundaryHour = hours.find(hour => hour.getHours() === 6);
      if (earlyBoundaryHour) {
        if (earlyHoursCollapsed) {
          // When collapsed: we want the toggle to appear BEFORE 6:00 AM
          // Since 6:00 AM is at index 0, we need to position it at a special location
          // Use a negative value to indicate "render at the very top, before all hours"
          positions.earlyToggle = -1;
        } else {
          // When expanded: find the hour that comes before 6:00 AM
          const earlyIndex = hours.findIndex(hour => hour.getHours() === 5);
          if (earlyIndex !== -1) {
            positions.earlyToggle = earlyIndex;
          } else {
            // Fallback: position at the beginning
            positions.earlyToggle = 0;
          }
        }
      } else {
        // If 6:00 AM doesn't exist (collapsed), position at the very beginning
        positions.earlyToggle = 0;
      }
      
      // Late toggle: always find a position regardless of collapsed state
      if (lateHoursCollapsed) {
        // When collapsed: find the last visible hour and position after it
        const lastVisibleHour = hours[hours.length - 1];
        if (lastVisibleHour) {
          positions.lateToggle = hours.length - 1;
        }
      } else {
        // When expanded: find the hour that comes BEFORE 10:00 PM (hour 22)
        // We want the toggle to appear BEFORE the 10:00 PM slot so users can compress it
        const lateBoundaryHour = hours.find(hour => hour.getHours() === 21); // 9:00 PM
        if (lateBoundaryHour) {
          const lateIndex = hours.findIndex(hour => hour.getHours() === 21);
          if (lateIndex !== -1) {
            positions.lateToggle = lateIndex;
          }
        }
      }
    }
    
    return positions;
  }, [earlyHoursCollapsed, lateHoursCollapsed]);

  const handleEarlyHoursToggle = useCallback((collapsed: boolean) => {
    setEarlyHoursCollapsed(collapsed);
  }, []);

  const handleLateHoursToggle = useCallback((collapsed: boolean) => {
    setLateHoursCollapsed(collapsed);
  }, []);

  return {
    earlyHoursCollapsed,
    lateHoursCollapsed,
    filterHoursByToggles,
    calculateTogglePositions,
    handleEarlyHoursToggle,
    handleLateHoursToggle
  };
}
