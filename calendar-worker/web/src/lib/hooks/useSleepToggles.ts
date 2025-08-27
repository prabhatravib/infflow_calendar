import { useState, useCallback } from 'react';

interface UseSleepTogglesReturn {
  earlyHoursCollapsed: boolean;
  lateHoursCollapsed: boolean;
  toggleEarlyHours: () => void;
  toggleLateHours: () => void;
  setEarlyHoursCollapsed: (collapsed: boolean) => void;
  setLateHoursCollapsed: (collapsed: boolean) => void;
  resetToggles: () => void;
}

export function useSleepToggles(): UseSleepTogglesReturn {
  const [earlyHoursCollapsed, setEarlyHoursCollapsed] = useState(false);
  const [lateHoursCollapsed, setLateHoursCollapsed] = useState(false);

  const toggleEarlyHours = useCallback(() => {
    setEarlyHoursCollapsed(prev => !prev);
  }, []);

  const toggleLateHours = useCallback(() => {
    setLateHoursCollapsed(prev => !prev);
  }, []);

  const resetToggles = useCallback(() => {
    setEarlyHoursCollapsed(false);
    setLateHoursCollapsed(false);
  }, []);

  return {
    earlyHoursCollapsed,
    lateHoursCollapsed,
    toggleEarlyHours,
    toggleLateHours,
    setEarlyHoursCollapsed,
    setLateHoursCollapsed,
    resetToggles,
  };
}
