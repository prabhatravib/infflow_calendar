import { Fragment } from 'react';
import type { TogglePositions } from './useSleepToggles';

interface SleepToggleBarsProps {
  earlyHoursCollapsed: boolean;
  lateHoursCollapsed: boolean;
  togglePositions: TogglePositions;
  onEarlyHoursToggle: (collapsed: boolean) => void;
  onLateHoursToggle: (collapsed: boolean) => void;
  isWeekView?: boolean;
}

export function SleepToggleBars({
  earlyHoursCollapsed,
  lateHoursCollapsed,
  togglePositions,
  onEarlyHoursToggle,
  onLateHoursToggle,
  isWeekView = false
}: SleepToggleBarsProps) {
  // Early Hours Toggle - rendered at the very top when collapsed
  const renderEarlyToggleTop = () => {
    if (!earlyHoursCollapsed) return null;
    
    return (
      <Fragment key="early-toggle-top">
        {/* Time column cell for toggle */}
        <div 
          className="p-1 text-xs text-gray-500 bg-white text-right pr-2 border-r border-gray-100 border-b border-gray-100 flex items-center justify-end" 
          style={{ height: '30px', minWidth: isWeekView ? '80px' : 'auto' }}
        />
        {/* Toggle bar spanning all columns */}
        <div
          className={`cursor-pointer hover:opacity-80 transition-opacity border-b border-gray-100 ${
            isWeekView ? 'col-span-7' : ''
          }`}
          style={{ 
            height: '30px',
            background: '#6c757d',
            color: 'white',
            border: '1px solid',
            borderColor: '#6c757d',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            fontSize: '13px',
            fontWeight: '500',
            userSelect: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            margin: '2px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => onEarlyHoursToggle(false)}
          title="Show Early Hours (12 AM - 6 AM)"
        >
          Show Early Hours (12 AM - 6 AM)
        </div>
      </Fragment>
    );
  };

  // Early Hours Toggle - only show when expanded (collapsed is handled at top)
  const renderEarlyToggle = (hourIndex: number) => {
    if (earlyHoursCollapsed || togglePositions.earlyToggle !== hourIndex) return null;
    
    return (
      <Fragment key="early-toggle">
        <div 
          className="p-1 text-xs text-gray-500 bg-white text-right pr-2 border-r border-gray-100 border-b border-gray-100 flex items-center justify-end" 
          style={{ height: '30px', minWidth: isWeekView ? '80px' : 'auto' }}
        />
        <div
          className={`cursor-pointer hover:opacity-80 transition-opacity border-b border-gray-100 ${
            isWeekView ? 'col-span-7' : ''
          }`}
          style={{ 
            height: '30px',
            background: 'white',
            color: '#374151',
            border: '1px solid',
            borderColor: '#d1d5db',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            fontSize: '13px',
            fontWeight: '500',
            userSelect: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            margin: '2px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => onEarlyHoursToggle(true)}
          title="Hide Early Hours (12 AM - 6 AM)"
        >
          Hide Early Hours (12 AM - 6 AM)
        </div>
      </Fragment>
    );
  };

  // Late Hours Toggle
  const renderLateToggle = (hourIndex: number) => {
    if (togglePositions.lateToggle !== hourIndex) return null;
    
    return (
      <Fragment key="late-toggle">
        <div 
          className="p-1 text-xs text-gray-500 bg-white text-right pr-2 border-r border-gray-100 border-b border-gray-100 flex items-center justify-end" 
          style={{ height: '30px', minWidth: isWeekView ? '80px' : 'auto' }}
        />
        <div
          className={`cursor-pointer hover:opacity-80 transition-opacity border-b border-gray-100 ${
            isWeekView ? 'col-span-7' : ''
          } ${lateHoursCollapsed ? 'collapsed' : ''}`}
          style={{ 
            height: '30px',
            background: lateHoursCollapsed ? '#f3f4f6' : 'white',
            color: lateHoursCollapsed ? '#6b7280' : '#374151',
            border: '1px solid',
            borderColor: lateHoursCollapsed ? '#d1d5db' : '#d1d5db',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            fontSize: '13px',
            fontWeight: '500',
            userSelect: 'none',
            boxShadow: lateHoursCollapsed ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
            margin: '2px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => onLateHoursToggle(!lateHoursCollapsed)}
          title={lateHoursCollapsed ? "Show Late Hours (10 PM - 12 AM)" : "Hide Late Hours (10 PM - 12 AM)"}
        >
          {lateHoursCollapsed ? 'Show Late Hours (10 PM - 12 AM)' : 'Hide Late Hours (10 PM - 12 AM)'}
        </div>
      </Fragment>
    );
  };

  return {
    renderEarlyToggleTop,
    renderEarlyToggle,
    renderLateToggle
  };
}
