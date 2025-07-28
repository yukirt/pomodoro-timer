import React, { memo, useMemo } from 'react';
import { useRenderPerformance } from '../../utils/performance';

interface TimerDisplayProps {
  timeRemaining: number;
  mode: 'work' | 'shortBreak' | 'longBreak';
  isRunning: boolean;
  totalTime?: number; // Total time for the current mode to calculate progress
}

// Memoized time formatter to prevent recreation
const formatTime = (seconds: number): string => {
  // Handle negative time by showing 00:00
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Static mode text mapping to prevent object recreation
const MODE_TEXT_MAP = {
  work: '工作時間',
  shortBreak: '短休息',
  longBreak: '長休息'
} as const;

// Static mode color mapping
const MODE_COLOR_MAP = {
  work: '#f44336',
  shortBreak: '#4caf50',
  longBreak: '#2196f3'
} as const;

// Memoized progress circle component
const ProgressCircle = memo(({ progress }: { progress: number }) => {
  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
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
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 100 100)"
        className="progress-circle"
      />
    </svg>
  );
});

ProgressCircle.displayName = 'ProgressCircle';

// Memoized status indicator component
const StatusIndicator = memo(({ isRunning }: { isRunning: boolean }) => (
  <div className="status-indicator">
    <span className={`status-text ${isRunning ? 'running' : 'paused'}`}>
      {isRunning ? '運行中' : '已暫停'}
    </span>
  </div>
));

StatusIndicator.displayName = 'StatusIndicator';

const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  timeRemaining, 
  mode, 
  isRunning, 
  totalTime 
}) => {
  const trackRender = useRenderPerformance('TimerDisplay');

  // Memoize formatted time to prevent recalculation
  const formattedTime = useMemo(() => formatTime(timeRemaining), [timeRemaining]);

  // Memoize mode text
  const modeText = useMemo(() => MODE_TEXT_MAP[mode] || '番茄鐘', [mode]);

  // Memoize progress calculation
  const progress = useMemo(() => {
    if (!totalTime || totalTime === 0) return 0;
    const elapsed = totalTime - timeRemaining;
    return Math.max(0, Math.min(100, (elapsed / totalTime) * 100));
  }, [timeRemaining, totalTime]);

  // Track render performance
  React.useEffect(() => {
    trackRender();
  });

  return (
    <div className={`timer-display ${mode} theme-transition`}>
      <div className="mode-indicator">
        {modeText}
      </div>
      
      <div className="timer-circle-container">
        <ProgressCircle progress={progress} />
        
        <div className="time-display">
          {formattedTime}
        </div>
      </div>
      
      <StatusIndicator isRunning={isRunning} />
    </div>
  );
};

// Export memoized component with custom comparison
export default memo(TimerDisplay, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.timeRemaining === nextProps.timeRemaining &&
    prevProps.mode === nextProps.mode &&
    prevProps.isRunning === nextProps.isRunning &&
    prevProps.totalTime === nextProps.totalTime
  );
});