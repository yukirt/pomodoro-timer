import React, { useMemo } from 'react';

interface TimerDisplayProps {
  timeRemaining: number;
  mode: 'work' | 'shortBreak' | 'longBreak';
  isRunning: boolean;
  totalTime?: number; // Total time for the current mode to calculate progress
}

const TimerDisplay: React.FC<TimerDisplayProps> = React.memo(({ 
  timeRemaining, 
  mode, 
  isRunning, 
  totalTime 
}) => {
  const formatTime = (seconds: number): string => {
    // Handle negative time by showing 00:00
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getModeText = (mode: string): string => {
    switch (mode) {
      case 'work':
        return '工作時間';
      case 'shortBreak':
        return '短休息';
      case 'longBreak':
        return '長休息';
      default:
        return '番茄鐘';
    }
  };

  const getModeColor = (mode: string): string => {
    switch (mode) {
      case 'work':
        return '#f44336';
      case 'shortBreak':
        return '#4caf50';
      case 'longBreak':
        return '#2196f3';
      default:
        return '#666';
    }
  };

  // Memoize expensive calculations
  const formattedTime = useMemo(() => formatTime(timeRemaining), [timeRemaining]);
  const modeText = useMemo(() => getModeText(mode), [mode]);
  const modeColor = useMemo(() => getModeColor(mode), [mode]);
  
  // Calculate progress percentage with memoization
  const { progress, strokeDashoffset } = useMemo(() => {
    const getProgress = (): number => {
      if (!totalTime || totalTime === 0) return 0;
      const elapsed = totalTime - timeRemaining;
      return Math.max(0, Math.min(100, (elapsed / totalTime) * 100));
    };

    const prog = getProgress();
    const circumference = 2 * Math.PI * 90; // radius = 90
    const offset = circumference - (prog / 100) * circumference;
    
    return { progress: prog, strokeDashoffset: offset };
  }, [timeRemaining, totalTime]);
  
  const statusText = useMemo(() => isRunning ? '運行中' : '已暫停', [isRunning]);

  return (
    <div className={`timer-display ${mode} theme-transition`}>
      <div className="mode-indicator">
        {modeText}
      </div>
      
      <div className="timer-circle-container">
        <svg className="timer-circle" width="200" height="200" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="var(--theme-border)"
            strokeWidth="8"
            className="progress-circle-background"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="var(--theme-primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 90}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
            className="progress-circle"
          />
        </svg>
        
        <div className="time-display">
          {formattedTime}
        </div>
      </div>
      
      <div className="status-indicator">
        <span className={`status-text ${isRunning ? 'running' : 'paused'}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
});

export default TimerDisplay;