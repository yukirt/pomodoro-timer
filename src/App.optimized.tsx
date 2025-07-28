import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { TimerDisplay, TimerControls } from './components/Timer';
import { SettingsPanel } from './components/Settings';
import StatsPanel from './components/Stats/StatsPanel';
import TaskPanel from './components/Tasks/TaskPanel';
import MobileNavigation from './components/Layout/MobileNavigation';
import TimerController from './core/timer/TimerController';
import { TimerState, TimerSettings } from './core/timer/types';
import { Task } from './core/task/types';
import { ThemeProvider, useTheme } from './core/theme';
import './App.css';
import './core/theme/theme.css';

// Default settings - moved outside component to prevent recreation
const defaultSettings: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  notificationsEnabled: true
};

// Memoized components to prevent unnecessary re-renders
const MemoizedTimerDisplay = memo(TimerDisplay);
const MemoizedTimerControls = memo(TimerControls);
const MemoizedSettingsPanel = memo(SettingsPanel);
const MemoizedStatsPanel = memo(StatsPanel);
const MemoizedTaskPanel = memo(TaskPanel);
const MemoizedMobileNavigation = memo(MobileNavigation);

// Memoized current task display component
const CurrentTaskDisplay = memo(({ task }: { task: Task | null }) => {
  if (!task) return null;
  
  return (
    <div className="current-task-display">
      <h3>當前任務</h3>
      <div className="task-info">
        <div className="task-title">{task.title}</div>
        <div className="task-progress">
          {task.completedPomodoros} / {task.estimatedPomodoros} 番茄鐘
        </div>
      </div>
    </div>
  );
});

CurrentTaskDisplay.displayName = 'CurrentTaskDisplay';

function AppContent() {
  const [timerController] = useState(() => new TimerController(defaultSettings));
  const [timerState, setTimerState] = useState<TimerState>(timerController.getState());
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { setTheme } = useTheme();

  // Memoize total time calculation to prevent recalculation on every render
  const totalTime = useMemo(() => {
    switch (timerState.mode) {
      case 'work':
        return defaultSettings.workDuration * 60;
      case 'shortBreak':
        return defaultSettings.shortBreakDuration * 60;
      case 'longBreak':
        return defaultSettings.longBreakDuration * 60;
      default:
        return defaultSettings.workDuration * 60;
    }
  }, [timerState.mode]);

  // Memoized timer event handler to prevent recreation on every render
  const handleTimerUpdate = useCallback((state: TimerState) => {
    setTimerState(state);
    // Update theme based on timer mode
    setTheme(state.mode);
  }, [setTheme]);

  useEffect(() => {
    // Subscribe to timer events
    timerController.subscribe('tick', handleTimerUpdate);
    timerController.subscribe('start', handleTimerUpdate);
    timerController.subscribe('pause', handleTimerUpdate);
    timerController.subscribe('reset', handleTimerUpdate);
    timerController.subscribe('modeChange', handleTimerUpdate);

    return () => {
      // Cleanup subscriptions
      timerController.unsubscribe('tick', handleTimerUpdate);
      timerController.unsubscribe('start', handleTimerUpdate);
      timerController.unsubscribe('pause', handleTimerUpdate);
      timerController.unsubscribe('reset', handleTimerUpdate);
      timerController.unsubscribe('modeChange', handleTimerUpdate);
    };
  }, [timerController, handleTimerUpdate]);

  // Memoized timer control handlers
  const handleStart = useCallback(() => {
    timerController.start();
  }, [timerController]);

  const handlePause = useCallback(() => {
    timerController.pause();
  }, [timerController]);

  const handleReset = useCallback(() => {
    timerController.reset();
  }, [timerController]);

  // Memoized task selection handler
  const handleTaskSelect = useCallback((task: Task) => {
    setSelectedTask(task);
    // TODO: Associate timer with selected task
  }, []);

  // Memoized panel toggle handlers
  const toggleTasks = useCallback(() => setShowTasks(prev => !prev), []);
  const toggleStats = useCallback(() => setShowStats(prev => !prev), []);
  const toggleSettings = useCallback(() => setShowSettings(prev => !prev), []);

  // Memoized close handlers
  const closeTasks = useCallback(() => setShowTasks(false), []);
  const closeStats = useCallback(() => setShowStats(false), []);

  // Memoized mobile navigation props
  const mobileNavProps = useMemo(() => ({
    showTasks,
    showStats,
    showSettings,
    onToggleTasks: toggleTasks,
    onToggleStats: toggleStats,
    onToggleSettings: toggleSettings,
  }), [showTasks, showStats, showSettings, toggleTasks, toggleStats, toggleSettings]);

  return (
    <div className="app theme-transition">
      <header className="app-header theme-transition">
        <h1>番茄鐘</h1>
        
        {/* Desktop Navigation */}
        <nav className="app-nav desktop-nav">
          <button 
            className={`nav-button ${showTasks ? 'active' : ''}`}
            onClick={toggleTasks}
          >
            任務
          </button>
          <button 
            className={`nav-button ${showStats ? 'active' : ''}`}
            onClick={toggleStats}
          >
            統計
          </button>
          <button 
            className={`nav-button ${showSettings ? 'active' : ''}`}
            onClick={toggleSettings}
          >
            設定
          </button>
        </nav>

        {/* Mobile Navigation */}
        <div className="mobile-nav">
          <MemoizedMobileNavigation {...mobileNavProps} />
        </div>
      </header>

      <main className="app-main">
        {/* Desktop Layout */}
        <div className="desktop-layout">
          {/* Left Sidebar - Tasks */}
          <aside className={`sidebar sidebar-left ${showTasks ? 'visible' : ''}`}>
            <MemoizedTaskPanel
              onClose={closeTasks}
              onTaskSelect={handleTaskSelect}
              selectedTaskId={selectedTask?.id}
            />
          </aside>

          {/* Center - Timer */}
          <section className="timer-section">
            <CurrentTaskDisplay task={selectedTask} />
            
            <MemoizedTimerDisplay
              timeRemaining={timerState.timeRemaining}
              mode={timerState.mode}
              isRunning={timerState.isRunning}
              totalTime={totalTime}
            />
            <MemoizedTimerControls
              isRunning={timerState.isRunning}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
            />
          </section>

          {/* Right Sidebar - Stats */}
          <aside className={`sidebar sidebar-right ${showStats ? 'visible' : ''}`}>
            <MemoizedStatsPanel onClose={closeStats} />
          </aside>
        </div>

        {/* Mobile/Tablet Layout - Modal Overlays */}
        <div className="mobile-layout">
          <div className="timer-section">
            <CurrentTaskDisplay task={selectedTask} />
            
            <MemoizedTimerDisplay
              timeRemaining={timerState.timeRemaining}
              mode={timerState.mode}
              isRunning={timerState.isRunning}
              totalTime={totalTime}
            />
            <MemoizedTimerControls
              isRunning={timerState.isRunning}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
            />
          </div>

          {/* Modal Overlays for Mobile */}
          {showTasks && (
            <div className="modal-overlay">
              <div className="modal-content">
                <MemoizedTaskPanel
                  onClose={closeTasks}
                  onTaskSelect={handleTaskSelect}
                  selectedTaskId={selectedTask?.id}
                />
              </div>
            </div>
          )}

          {showStats && (
            <div className="modal-overlay">
              <div className="modal-content">
                <MemoizedStatsPanel onClose={closeStats} />
              </div>
            </div>
          )}

          {showSettings && (
            <div className="modal-overlay">
              <div className="modal-content">
                <MemoizedSettingsPanel />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;