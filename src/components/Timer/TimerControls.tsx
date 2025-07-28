import React, { useEffect, useCallback } from 'react';

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  enableKeyboardShortcuts?: boolean;
}

const TimerControls: React.FC<TimerControlsProps> = React.memo(({ 
  isRunning, 
  onStart, 
  onPause, 
  onReset,
  enableKeyboardShortcuts = true
}) => {
  const handleStartPause = useCallback(() => {
    if (isRunning) {
      onPause();
    } else {
      onStart();
    }
  }, [isRunning, onStart, onPause]);

  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  // Keyboard shortcut handler
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Only handle shortcuts if enabled and not typing in an input
    if (!enableKeyboardShortcuts || 
        event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Prevent default behavior for our shortcuts
    switch (event.key.toLowerCase()) {
      case ' ': // Spacebar for start/pause
      case 'enter': // Enter for start/pause
        event.preventDefault();
        handleStartPause();
        break;
      case 'r': // R for reset
        if (event.ctrlKey || event.metaKey) {
          // Don't interfere with browser refresh
          return;
        }
        event.preventDefault();
        handleReset();
        break;
      case 'escape': // Escape for reset
        event.preventDefault();
        handleReset();
        break;
    }
  }, [enableKeyboardShortcuts, handleStartPause, handleReset]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (enableKeyboardShortcuts) {
      document.addEventListener('keydown', handleKeyPress);
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [enableKeyboardShortcuts, handleKeyPress]);

  return (
    <div className="timer-controls">
      <div className="control-buttons">
        <button 
          className="control-button primary theme-transition theme-focus"
          onClick={handleStartPause}
          title={`${isRunning ? '暫停' : '開始'} (空格鍵或Enter)`}
          aria-label={`${isRunning ? '暫停計時器' : '開始計時器'}`}
        >
          <span className="button-icon">
            {isRunning ? '⏸️' : '▶️'}
          </span>
          <span className="button-text">
            {isRunning ? '暫停' : '開始'}
          </span>
        </button>
        
        <button 
          className="control-button secondary theme-transition theme-focus"
          onClick={handleReset}
          title="重置 (R鍵或Esc)"
          aria-label="重置計時器"
        >
          <span className="button-icon">
            🔄
          </span>
          <span className="button-text">
            重置
          </span>
        </button>
      </div>
      
      {enableKeyboardShortcuts && (
        <div className="keyboard-shortcuts-hint">
          <small>
            快捷鍵: 空格鍵/Enter = 開始/暫停, R/Esc = 重置
          </small>
        </div>
      )}
    </div>
  );
});

export default TimerControls;