import { useState, useEffect, useCallback, useMemo } from 'react';
import { TimerDisplay, TimerControls } from './components/Timer';
import { SettingsPanel } from './components/Settings';
import StatsPanel from './components/Stats/StatsPanel';
import TaskPanel from './components/Tasks/TaskPanel';
import MobileNavigation from './components/Layout/MobileNavigation';
import TimerController from './core/timer/TimerController';
import { TimerState, TimerSettings } from './core/timer/types';
import { Task } from './core/task/types';
import { ThemeProvider, useTheme } from './core/theme';
import { performanceMonitor } from './utils/performanceMonitor';
import settingsManager from './core/settings/SettingsManager';
import './App.css';
import './core/theme/theme.css';

function AppContent() {
  const [currentSettings, setCurrentSettings] = useState<TimerSettings>(() => settingsManager.getSettings());
  const [timerController] = useState(() => new TimerController(currentSettings));
  const [timerState, setTimerState] = useState<TimerState>(timerController.getState());
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { setTheme } = useTheme();

  // Memoize total time calculation for current mode
  const totalTimeForMode = useMemo(() => {
    switch (timerState.mode) {
      case 'work':
        return currentSettings.workDuration * 60;
      case 'shortBreak':
        return currentSettings.shortBreakDuration * 60;
      case 'longBreak':
        return currentSettings.longBreakDuration * 60;
      default:
        return currentSettings.workDuration * 60;
    }
  }, [timerState.mode, currentSettings]);

  // Memoize timer event handler to prevent unnecessary re-subscriptions
  const handleTimerUpdate = useCallback((state: TimerState) => {
    const endTiming = performanceMonitor.timeComponentRender('TimerUpdate');
    setTimerState(state);
    // Update theme based on timer mode
    setTheme(state.mode);
    endTiming();
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

  // Memoize event handlers to prevent unnecessary re-renders
  const handleStart = useCallback(() => {
    const endTiming = performanceMonitor.startTiming('timer_start');
    timerController.start();
    endTiming();
  }, [timerController]);

  const handlePause = useCallback(() => {
    const endTiming = performanceMonitor.startTiming('timer_pause');
    timerController.pause();
    endTiming();
  }, [timerController]);

  const handleReset = useCallback(() => {
    const endTiming = performanceMonitor.startTiming('timer_reset');
    timerController.reset();
    endTiming();
  }, [timerController]);

  const handleTaskSelect = useCallback((task: Task) => {
    const endTiming = performanceMonitor.startTiming('task_select');
    setSelectedTask(task);
    // TODO: Associate timer with selected task
    endTiming();
  }, []);

  const handleSettingsChange = useCallback((settings: TimerSettings) => {
    setCurrentSettings(settings);
    timerController.updateSettings(settings);
  }, [timerController]);

  // Memoize panel toggle handlers
  const handleToggleTasks = useCallback(() => setShowTasks(!showTasks), [showTasks]);
  const handleToggleStats = useCallback(() => setShowStats(!showStats), [showStats]);
  const handleToggleSettings = useCallback(() => setShowSettings(!showSettings), [showSettings]);
  
  // Memoize panel close handlers
  const handleCloseTasks = useCallback(() => setShowTasks(false), []);
  const handleCloseStats = useCallback(() => setShowStats(false), []);

  return (
    <div className="app theme-transition">
      <header className="app-header theme-transition">
        <h1>番茄鐘</h1>
        
        {/* Desktop Navigation */}
        <nav className="app-nav desktop-nav">
          <button 
            className={`nav-button ${showTasks ? 'active' : ''}`}
            onClick={handleToggleTasks}
          >
            任務
          </button>
          <button 
            className={`nav-button ${showStats ? 'active' : ''}`}
            onClick={handleToggleStats}
          >
            統計
          </button>
          <button 
            className={`nav-button ${showSettings ? 'active' : ''}`}
            onClick={handleToggleSettings}
          >
            設定
          </button>
        </nav>

        {/* Mobile Navigation */}
        <div className="mobile-nav">
          <MobileNavigation
            showTasks={showTasks}
            showStats={showStats}
            showSettings={showSettings}
            onToggleTasks={handleToggleTasks}
            onToggleStats={handleToggleStats}
            onToggleSettings={handleToggleSettings}
          />
        </div>
      </header>

      <main className="app-main">
        {/* Desktop Layout */}
        <div className="desktop-layout">
          {/* Left Sidebar - Tasks */}
          <aside className={`sidebar sidebar-left ${showTasks ? 'visible' : ''}`}>
            <TaskPanel
              onClose={handleCloseTasks}
              onTaskSelect={handleTaskSelect}
              selectedTaskId={selectedTask?.id}
            />
          </aside>

          {/* Center - Timer */}
          <section className="timer-section">
            {selectedTask && (
              <div className="current-task-display">
                <h3>當前任務</h3>
                <div className="task-info">
                  <div className="task-title">{selectedTask.title}</div>
                  <div className="task-progress">
                    {selectedTask.completedPomodoros} / {selectedTask.estimatedPomodoros} 番茄鐘
                  </div>
                </div>
              </div>
            )}
            
            <TimerDisplay
              timeRemaining={timerState.timeRemaining}
              mode={timerState.mode}
              isRunning={timerState.isRunning}
              totalTime={totalTimeForMode}
            />
            <TimerControls
              isRunning={timerState.isRunning}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
            />
          </section>

          {/* Right Sidebar - Stats or Settings */}
          <aside className={`sidebar sidebar-right ${showStats ? 'visible' : ''}`}>
            <StatsPanel onClose={handleCloseStats} />
          </aside>
          
          {/* Settings Panel for Desktop */}
          {showSettings && (
            <aside className="sidebar sidebar-settings visible" data-testid="desktop-settings-panel">
              <SettingsPanel 
                onClose={() => setShowSettings(false)}
                onSettingsChange={handleSettingsChange}
              />
            </aside>
          )}
        </div>

        {/* Mobile/Tablet Layout - Modal Overlays */}
        <div className="mobile-layout">
          <div className="timer-section">
            {selectedTask && (
              <div className="current-task-display">
                <h3>當前任務</h3>
                <div className="task-info">
                  <div className="task-title">{selectedTask.title}</div>
                  <div className="task-progress">
                    {selectedTask.completedPomodoros} / {selectedTask.estimatedPomodoros} 番茄鐘
                  </div>
                </div>
              </div>
            )}
            
            <TimerDisplay
              timeRemaining={timerState.timeRemaining}
              mode={timerState.mode}
              isRunning={timerState.isRunning}
              totalTime={totalTimeForMode}
            />
            <TimerControls
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
                <TaskPanel
                  onClose={handleCloseTasks}
                  onTaskSelect={handleTaskSelect}
                  selectedTaskId={selectedTask?.id}
                />
              </div>
            </div>
          )}

          {showStats && (
            <div className="modal-overlay">
              <div className="modal-content">
                <StatsPanel onClose={handleCloseStats} />
              </div>
            </div>
          )}

          {showSettings && (
            <div className="modal-overlay" data-testid="mobile-settings-modal">
              <div className="modal-content">
                <SettingsPanel 
                  onClose={() => setShowSettings(false)}
                  onSettingsChange={handleSettingsChange}
                />
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