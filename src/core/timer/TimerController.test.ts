import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import TimerController from './TimerController';
import { TimerSettings, TimerState } from './types';

describe('TimerController - State Management', () => {
  let timerController: TimerController;
  let defaultSettings: TimerSettings;

  beforeEach(() => {
    // Mock timers
    vi.useFakeTimers();
    
    defaultSettings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true,
      notificationsEnabled: true
    };
    
    timerController = new TimerController(defaultSettings);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const state = timerController.getState();
      
      expect(state.mode).toBe('work');
      expect(state.timeRemaining).toBe(25 * 60); // 25 minutes in seconds
      expect(state.isRunning).toBe(false);
      expect(state.currentCycle).toBe(0);
    });

    it('should initialize with work mode duration based on settings', () => {
      const customSettings = { ...defaultSettings, workDuration: 30 };
      const customTimer = new TimerController(customSettings);
      const state = customTimer.getState();
      
      expect(state.timeRemaining).toBe(30 * 60);
    });
  });

  describe('State Immutability', () => {
    it('should return a copy of state, not the original', () => {
      const state1 = timerController.getState();
      const state2 = timerController.getState();
      
      expect(state1).not.toBe(state2); // Different objects
      expect(state1).toEqual(state2); // Same content
    });

    it('should not allow external modification of state', () => {
      const state = timerController.getState();
      state.isRunning = true;
      state.timeRemaining = 0;
      
      const actualState = timerController.getState();
      expect(actualState.isRunning).toBe(false);
      expect(actualState.timeRemaining).toBe(25 * 60);
    });
  });

  describe('Mode Switching', () => {
    it('should switch to short break mode correctly', () => {
      timerController.switchMode('shortBreak');
      const state = timerController.getState();
      
      expect(state.mode).toBe('shortBreak');
      expect(state.timeRemaining).toBe(5 * 60);
      expect(state.isRunning).toBe(false);
    });

    it('should switch to long break mode correctly', () => {
      timerController.switchMode('longBreak');
      const state = timerController.getState();
      
      expect(state.mode).toBe('longBreak');
      expect(state.timeRemaining).toBe(15 * 60);
      expect(state.isRunning).toBe(false);
    });

    it('should switch back to work mode correctly', () => {
      timerController.switchMode('shortBreak');
      timerController.switchMode('work');
      const state = timerController.getState();
      
      expect(state.mode).toBe('work');
      expect(state.timeRemaining).toBe(25 * 60);
      expect(state.isRunning).toBe(false);
    });

    it('should pause timer when switching modes', () => {
      timerController.start();
      expect(timerController.getState().isRunning).toBe(true);
      
      timerController.switchMode('shortBreak');
      expect(timerController.getState().isRunning).toBe(false);
    });
  });

  describe('Timer Control', () => {
    it('should start timer correctly', () => {
      timerController.start();
      const state = timerController.getState();
      
      expect(state.isRunning).toBe(true);
    });

    it('should not start timer if already running', () => {
      timerController.start();
      const initialState = timerController.getState();
      
      timerController.start(); // Try to start again
      const finalState = timerController.getState();
      
      expect(finalState).toEqual(initialState);
    });

    it('should pause timer correctly', () => {
      timerController.start();
      timerController.pause();
      const state = timerController.getState();
      
      expect(state.isRunning).toBe(false);
    });

    it('should not pause timer if not running', () => {
      const initialState = timerController.getState();
      timerController.pause();
      const finalState = timerController.getState();
      
      expect(finalState).toEqual(initialState);
    });

    it('should reset timer to current mode duration', () => {
      timerController.start();
      vi.advanceTimersByTime(5000); // Advance 5 seconds
      
      timerController.reset();
      const state = timerController.getState();
      
      expect(state.timeRemaining).toBe(25 * 60);
      expect(state.isRunning).toBe(false);
    });

    it('should reset timer for different modes', () => {
      timerController.switchMode('shortBreak');
      timerController.start();
      vi.advanceTimersByTime(3000); // Advance 3 seconds
      
      timerController.reset();
      const state = timerController.getState();
      
      expect(state.timeRemaining).toBe(5 * 60);
      expect(state.mode).toBe('shortBreak');
    });
  });

  describe('Timer Countdown', () => {
    it('should decrease time remaining when running', () => {
      timerController.start();
      const initialTime = timerController.getState().timeRemaining;
      
      vi.advanceTimersByTime(1000); // Advance 1 second
      
      const newTime = timerController.getState().timeRemaining;
      expect(newTime).toBe(initialTime - 1);
    });

    it('should not decrease time when paused', () => {
      timerController.start();
      timerController.pause();
      const pausedTime = timerController.getState().timeRemaining;
      
      vi.advanceTimersByTime(5000); // Advance 5 seconds
      
      const finalTime = timerController.getState().timeRemaining;
      expect(finalTime).toBe(pausedTime);
    });

    it('should stop at zero and pause timer', () => {
      timerController.start();
      
      // Fast forward to completion
      vi.advanceTimersByTime(25 * 60 * 1000);
      
      const state = timerController.getState();
      expect(state.timeRemaining).toBe(0);
      expect(state.isRunning).toBe(false);
    });

    it('should increment cycle count when work session completes', () => {
      timerController.start();
      
      // Complete work session
      vi.advanceTimersByTime(25 * 60 * 1000);
      
      const state = timerController.getState();
      expect(state.currentCycle).toBe(1);
    });

    it('should not increment cycle count when break session completes', () => {
      timerController.switchMode('shortBreak');
      timerController.start();
      
      // Complete break session
      vi.advanceTimersByTime(5 * 60 * 1000);
      
      const state = timerController.getState();
      expect(state.currentCycle).toBe(0);
    });
  });

  describe('Settings Integration', () => {
    it('should use custom work duration from settings', () => {
      const customSettings = { ...defaultSettings, workDuration: 45 };
      const customTimer = new TimerController(customSettings);
      
      const state = customTimer.getState();
      expect(state.timeRemaining).toBe(45 * 60);
    });

    it('should use custom break durations from settings', () => {
      const customSettings = { 
        ...defaultSettings, 
        shortBreakDuration: 10,
        longBreakDuration: 30
      };
      const customTimer = new TimerController(customSettings);
      
      customTimer.switchMode('shortBreak');
      expect(customTimer.getState().timeRemaining).toBe(10 * 60);
      
      customTimer.switchMode('longBreak');
      expect(customTimer.getState().timeRemaining).toBe(30 * 60);
    });
  });
});

describe('TimerController - Control Functions', () => {
  let timerController: TimerController;
  let defaultSettings: TimerSettings;

  beforeEach(() => {
    vi.useFakeTimers();
    
    defaultSettings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true,
      notificationsEnabled: true
    };
    
    timerController = new TimerController(defaultSettings);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Start Function', () => {
    it('should emit start event when timer starts', () => {
      const startCallback = vi.fn();
      timerController.subscribe('start', startCallback);
      
      timerController.start();
      
      expect(startCallback).toHaveBeenCalledWith(timerController.getState());
    });

    it('should not emit start event if already running', () => {
      const startCallback = vi.fn();
      timerController.subscribe('start', startCallback);
      
      timerController.start();
      startCallback.mockClear();
      timerController.start(); // Try to start again
      
      expect(startCallback).not.toHaveBeenCalled();
    });

    it('should start countdown immediately after start', () => {
      timerController.start();
      const initialTime = timerController.getState().timeRemaining;
      
      vi.advanceTimersByTime(1000);
      
      const newTime = timerController.getState().timeRemaining;
      expect(newTime).toBe(initialTime - 1);
    });
  });

  describe('Pause Function', () => {
    it('should emit pause event when timer pauses', () => {
      const pauseCallback = vi.fn();
      timerController.subscribe('pause', pauseCallback);
      
      timerController.start();
      timerController.pause();
      
      expect(pauseCallback).toHaveBeenCalledWith(timerController.getState());
    });

    it('should not emit pause event if not running', () => {
      const pauseCallback = vi.fn();
      timerController.subscribe('pause', pauseCallback);
      
      timerController.pause(); // Try to pause when not running
      
      expect(pauseCallback).not.toHaveBeenCalled();
    });

    it('should stop countdown after pause', () => {
      timerController.start();
      vi.advanceTimersByTime(2000); // Run for 2 seconds
      
      timerController.pause();
      const pausedTime = timerController.getState().timeRemaining;
      
      vi.advanceTimersByTime(5000); // Advance 5 more seconds
      
      const finalTime = timerController.getState().timeRemaining;
      expect(finalTime).toBe(pausedTime);
    });
  });

  describe('Reset Function', () => {
    it('should emit reset event when timer resets', () => {
      const resetCallback = vi.fn();
      timerController.subscribe('reset', resetCallback);
      
      timerController.start();
      vi.advanceTimersByTime(5000);
      timerController.reset();
      
      expect(resetCallback).toHaveBeenCalledWith(timerController.getState());
    });

    it('should reset to original duration for current mode', () => {
      timerController.start();
      vi.advanceTimersByTime(10000); // Run for 10 seconds
      
      timerController.reset();
      const state = timerController.getState();
      
      expect(state.timeRemaining).toBe(25 * 60);
      expect(state.isRunning).toBe(false);
    });

    it('should reset to correct duration after mode switch', () => {
      timerController.switchMode('shortBreak');
      timerController.start();
      vi.advanceTimersByTime(3000); // Run for 3 seconds
      
      timerController.reset();
      const state = timerController.getState();
      
      expect(state.timeRemaining).toBe(5 * 60);
      expect(state.mode).toBe('shortBreak');
    });

    it('should pause timer before resetting', () => {
      timerController.start();
      expect(timerController.getState().isRunning).toBe(true);
      
      timerController.reset();
      expect(timerController.getState().isRunning).toBe(false);
    });
  });

  describe('Mode Switching Logic', () => {
    it('should emit modeChange event when switching modes', () => {
      const modeChangeCallback = vi.fn();
      timerController.subscribe('modeChange', modeChangeCallback);
      
      timerController.switchMode('shortBreak');
      
      expect(modeChangeCallback).toHaveBeenCalledWith(timerController.getState());
    });

    it('should switch from work to short break', () => {
      timerController.switchMode('shortBreak');
      const state = timerController.getState();
      
      expect(state.mode).toBe('shortBreak');
      expect(state.timeRemaining).toBe(5 * 60);
    });

    it('should switch from work to long break', () => {
      timerController.switchMode('longBreak');
      const state = timerController.getState();
      
      expect(state.mode).toBe('longBreak');
      expect(state.timeRemaining).toBe(15 * 60);
    });

    it('should switch from break back to work', () => {
      timerController.switchMode('shortBreak');
      timerController.switchMode('work');
      const state = timerController.getState();
      
      expect(state.mode).toBe('work');
      expect(state.timeRemaining).toBe(25 * 60);
    });

    it('should pause timer when switching modes during countdown', () => {
      timerController.start();
      expect(timerController.getState().isRunning).toBe(true);
      
      timerController.switchMode('shortBreak');
      expect(timerController.getState().isRunning).toBe(false);
    });

    it('should preserve cycle count when switching modes', () => {
      // Complete a work session to increment cycle
      timerController.start();
      vi.advanceTimersByTime(25 * 60 * 1000);
      
      const cycleCount = timerController.getState().currentCycle;
      timerController.switchMode('shortBreak');
      
      expect(timerController.getState().currentCycle).toBe(cycleCount);
    });
  });

  describe('Timer Completion Handling', () => {
    it('should emit complete event when timer reaches zero', () => {
      const completeCallback = vi.fn();
      timerController.subscribe('complete', completeCallback);
      
      timerController.start();
      vi.advanceTimersByTime(25 * 60 * 1000); // Complete work session
      
      expect(completeCallback).toHaveBeenCalledWith(timerController.getState());
    });

    it('should automatically pause when timer completes', () => {
      timerController.start();
      vi.advanceTimersByTime(25 * 60 * 1000); // Complete work session
      
      const state = timerController.getState();
      expect(state.isRunning).toBe(false);
      expect(state.timeRemaining).toBe(0);
    });

    it('should increment cycle only for completed work sessions', () => {
      // Complete work session
      timerController.start();
      vi.advanceTimersByTime(25 * 60 * 1000);
      expect(timerController.getState().currentCycle).toBe(1);
      
      // Complete break session - should not increment
      timerController.switchMode('shortBreak');
      timerController.start();
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(timerController.getState().currentCycle).toBe(1);
    });

    it('should handle multiple work session completions', () => {
      // Complete first work session
      timerController.start();
      vi.advanceTimersByTime(25 * 60 * 1000);
      expect(timerController.getState().currentCycle).toBe(1);
      
      // Reset and complete second work session
      timerController.switchMode('work');
      timerController.start();
      vi.advanceTimersByTime(25 * 60 * 1000);
      expect(timerController.getState().currentCycle).toBe(2);
    });
  });

  describe('Event System Integration', () => {
    it('should emit tick events during countdown', () => {
      const tickCallback = vi.fn();
      timerController.subscribe('tick', tickCallback);
      
      timerController.start();
      vi.advanceTimersByTime(3000); // 3 seconds
      
      expect(tickCallback).toHaveBeenCalledTimes(3);
    });

    it('should emit events in correct order during normal operation', () => {
      const events: string[] = [];
      
      timerController.subscribe('start', () => events.push('start'));
      timerController.subscribe('tick', () => events.push('tick'));
      timerController.subscribe('pause', () => events.push('pause'));
      timerController.subscribe('reset', () => events.push('reset'));
      
      timerController.start();
      vi.advanceTimersByTime(2000);
      timerController.pause();
      timerController.reset();
      
      expect(events).toEqual(['start', 'tick', 'tick', 'pause', 'reset']);
    });

    it('should emit events in correct order during completion', () => {
      const events: string[] = [];
      
      timerController.subscribe('start', () => events.push('start'));
      timerController.subscribe('complete', () => events.push('complete'));
      timerController.subscribe('pause', () => events.push('pause'));
      
      timerController.start();
      vi.advanceTimersByTime(25 * 60 * 1000); // Complete session
      
      expect(events).toContain('start');
      expect(events).toContain('complete');
      expect(events).toContain('pause');
      
      // Pause should come before complete (since pause is called first in handleTimerComplete)
      const completeIndex = events.indexOf('complete');
      const pauseIndex = events.indexOf('pause');
      expect(pauseIndex).toBeLessThan(completeIndex);
    });
  });
});

describe('TimerController - Event System', () => {
  let timerController: TimerController;
  let defaultSettings: TimerSettings;

  beforeEach(() => {
    vi.useFakeTimers();
    
    defaultSettings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true,
      notificationsEnabled: true
    };
    
    timerController = new TimerController(defaultSettings);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Event Subscription', () => {
    it('should allow subscribing to tick events', () => {
      const callback = vi.fn();
      timerController.subscribe('tick', callback);
      
      expect(timerController.getListenerCount('tick')).toBe(1);
    });

    it('should allow subscribing to modeChange events', () => {
      const callback = vi.fn();
      timerController.subscribe('modeChange', callback);
      
      expect(timerController.getListenerCount('modeChange')).toBe(1);
    });

    it('should allow subscribing to complete events', () => {
      const callback = vi.fn();
      timerController.subscribe('complete', callback);
      
      expect(timerController.getListenerCount('complete')).toBe(1);
    });

    it('should allow subscribing to start events', () => {
      const callback = vi.fn();
      timerController.subscribe('start', callback);
      
      expect(timerController.getListenerCount('start')).toBe(1);
    });

    it('should allow subscribing to pause events', () => {
      const callback = vi.fn();
      timerController.subscribe('pause', callback);
      
      expect(timerController.getListenerCount('pause')).toBe(1);
    });

    it('should allow subscribing to reset events', () => {
      const callback = vi.fn();
      timerController.subscribe('reset', callback);
      
      expect(timerController.getListenerCount('reset')).toBe(1);
    });

    it('should allow multiple subscribers to the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();
      
      timerController.subscribe('tick', callback1);
      timerController.subscribe('tick', callback2);
      timerController.subscribe('tick', callback3);
      
      expect(timerController.getListenerCount('tick')).toBe(3);
    });

    it('should throw error for unsupported event types', () => {
      const callback = vi.fn();
      
      expect(() => {
        timerController.subscribe('unsupported' as TimerEventType, callback);
      }).toThrow('Unsupported event type: unsupported');
    });
  });

  describe('Event Unsubscription', () => {
    it('should allow unsubscribing from events', () => {
      const callback = vi.fn();
      timerController.subscribe('tick', callback);
      expect(timerController.getListenerCount('tick')).toBe(1);
      
      timerController.unsubscribe('tick', callback);
      expect(timerController.getListenerCount('tick')).toBe(0);
    });

    it('should only remove the specific callback', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      timerController.subscribe('tick', callback1);
      timerController.subscribe('tick', callback2);
      expect(timerController.getListenerCount('tick')).toBe(2);
      
      timerController.unsubscribe('tick', callback1);
      expect(timerController.getListenerCount('tick')).toBe(1);
    });

    it('should handle unsubscribing non-existent callback gracefully', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      timerController.subscribe('tick', callback1);
      expect(timerController.getListenerCount('tick')).toBe(1);
      
      // Try to unsubscribe a callback that was never subscribed
      timerController.unsubscribe('tick', callback2);
      expect(timerController.getListenerCount('tick')).toBe(1);
    });

    it('should handle unsubscribing from unsupported event types gracefully', () => {
      const callback = vi.fn();
      
      expect(() => {
        timerController.unsubscribe('unsupported' as TimerEventType, callback);
      }).not.toThrow();
    });

    it('should clear all listeners for specific event type', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();
      
      timerController.subscribe('tick', callback1);
      timerController.subscribe('tick', callback2);
      timerController.subscribe('start', callback3);
      
      expect(timerController.getListenerCount('tick')).toBe(2);
      expect(timerController.getListenerCount('start')).toBe(1);
      
      timerController.unsubscribeAll('tick');
      
      expect(timerController.getListenerCount('tick')).toBe(0);
      expect(timerController.getListenerCount('start')).toBe(1);
    });

    it('should clear all listeners for all event types', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();
      
      timerController.subscribe('tick', callback1);
      timerController.subscribe('start', callback2);
      timerController.subscribe('complete', callback3);
      
      expect(timerController.getListenerCount('tick')).toBe(1);
      expect(timerController.getListenerCount('start')).toBe(1);
      expect(timerController.getListenerCount('complete')).toBe(1);
      
      timerController.unsubscribeAll();
      
      expect(timerController.getListenerCount('tick')).toBe(0);
      expect(timerController.getListenerCount('start')).toBe(0);
      expect(timerController.getListenerCount('complete')).toBe(0);
    });
  });

  describe('Tick Events', () => {
    it('should emit tick events every second when running', () => {
      const tickCallback = vi.fn();
      timerController.subscribe('tick', tickCallback);
      
      timerController.start();
      vi.advanceTimersByTime(5000); // 5 seconds
      
      expect(tickCallback).toHaveBeenCalledTimes(5);
    });

    it('should not emit tick events when paused', () => {
      const tickCallback = vi.fn();
      timerController.subscribe('tick', tickCallback);
      
      timerController.start();
      vi.advanceTimersByTime(2000); // 2 seconds
      timerController.pause();
      tickCallback.mockClear();
      
      vi.advanceTimersByTime(3000); // 3 more seconds
      
      expect(tickCallback).not.toHaveBeenCalled();
    });

    it('should pass current state to tick event callbacks', () => {
      const tickCallback = vi.fn();
      timerController.subscribe('tick', tickCallback);
      
      timerController.start();
      vi.advanceTimersByTime(1000); // 1 second
      
      expect(tickCallback).toHaveBeenCalledWith({
        mode: 'work',
        timeRemaining: (25 * 60) - 1, // 1 second elapsed
        isRunning: true,
        currentCycle: 0
      });
    });

    it('should emit tick events for different modes', () => {
      const tickCallback = vi.fn();
      timerController.subscribe('tick', tickCallback);
      
      timerController.switchMode('shortBreak');
      timerController.start();
      vi.advanceTimersByTime(2000); // 2 seconds
      
      expect(tickCallback).toHaveBeenCalledTimes(2);
      expect(tickCallback).toHaveBeenLastCalledWith({
        mode: 'shortBreak',
        timeRemaining: (5 * 60) - 2, // 2 seconds elapsed
        isRunning: true,
        currentCycle: 0
      });
    });
  });

  describe('Mode Change Events', () => {
    it('should emit modeChange event when switching to short break', () => {
      const modeChangeCallback = vi.fn();
      timerController.subscribe('modeChange', modeChangeCallback);
      
      timerController.switchMode('shortBreak');
      
      expect(modeChangeCallback).toHaveBeenCalledWith({
        mode: 'shortBreak',
        timeRemaining: 5 * 60,
        isRunning: false,
        currentCycle: 0
      });
    });

    it('should emit modeChange event when switching to long break', () => {
      const modeChangeCallback = vi.fn();
      timerController.subscribe('modeChange', modeChangeCallback);
      
      timerController.switchMode('longBreak');
      
      expect(modeChangeCallback).toHaveBeenCalledWith({
        mode: 'longBreak',
        timeRemaining: 15 * 60,
        isRunning: false,
        currentCycle: 0
      });
    });

    it('should emit modeChange event when switching back to work', () => {
      const modeChangeCallback = vi.fn();
      timerController.subscribe('modeChange', modeChangeCallback);
      
      timerController.switchMode('shortBreak');
      modeChangeCallback.mockClear();
      
      timerController.switchMode('work');
      
      expect(modeChangeCallback).toHaveBeenCalledWith({
        mode: 'work',
        timeRemaining: 25 * 60,
        isRunning: false,
        currentCycle: 0
      });
    });

    it('should pause timer before emitting modeChange event when running', () => {
      const events: string[] = [];
      
      timerController.subscribe('pause', () => events.push('pause'));
      timerController.subscribe('modeChange', () => events.push('modeChange'));
      
      timerController.start();
      timerController.switchMode('shortBreak');
      
      expect(events).toEqual(['pause', 'modeChange']);
    });

    it('should not emit pause event when switching modes if not running', () => {
      const events: string[] = [];
      
      timerController.subscribe('pause', () => events.push('pause'));
      timerController.subscribe('modeChange', () => events.push('modeChange'));
      
      // Don't start timer, just switch mode
      timerController.switchMode('shortBreak');
      
      expect(events).toEqual(['modeChange']);
    });
  });

  describe('Complete Events', () => {
    it('should emit complete event when work session finishes', () => {
      const completeCallback = vi.fn();
      timerController.subscribe('complete', completeCallback);
      
      timerController.start();
      vi.advanceTimersByTime(25 * 60 * 1000); // Complete work session
      
      expect(completeCallback).toHaveBeenCalledWith({
        mode: 'work',
        timeRemaining: 0,
        isRunning: false,
        currentCycle: 1
      });
    });

    it('should emit complete event when break session finishes', () => {
      const completeCallback = vi.fn();
      timerController.subscribe('complete', completeCallback);
      
      timerController.switchMode('shortBreak');
      timerController.start();
      vi.advanceTimersByTime(5 * 60 * 1000); // Complete break session
      
      expect(completeCallback).toHaveBeenCalledWith({
        mode: 'shortBreak',
        timeRemaining: 0,
        isRunning: false,
        currentCycle: 0 // Break sessions don't increment cycle
      });
    });

    it('should emit pause event before complete event', () => {
      const events: string[] = [];
      
      timerController.subscribe('complete', () => events.push('complete'));
      timerController.subscribe('pause', () => events.push('pause'));
      
      timerController.start();
      vi.advanceTimersByTime(25 * 60 * 1000); // Complete work session
      
      expect(events).toEqual(['pause', 'complete']);
    });
  });

  describe('Start Events', () => {
    it('should emit start event when timer starts', () => {
      const startCallback = vi.fn();
      timerController.subscribe('start', startCallback);
      
      timerController.start();
      
      expect(startCallback).toHaveBeenCalledWith({
        mode: 'work',
        timeRemaining: 25 * 60,
        isRunning: true,
        currentCycle: 0
      });
    });

    it('should not emit start event if already running', () => {
      const startCallback = vi.fn();
      timerController.subscribe('start', startCallback);
      
      timerController.start();
      startCallback.mockClear();
      
      timerController.start(); // Try to start again
      
      expect(startCallback).not.toHaveBeenCalled();
    });

    it('should emit start event for different modes', () => {
      const startCallback = vi.fn();
      timerController.subscribe('start', startCallback);
      
      timerController.switchMode('shortBreak');
      timerController.start();
      
      expect(startCallback).toHaveBeenCalledWith({
        mode: 'shortBreak',
        timeRemaining: 5 * 60,
        isRunning: true,
        currentCycle: 0
      });
    });
  });

  describe('Pause Events', () => {
    it('should emit pause event when timer pauses', () => {
      const pauseCallback = vi.fn();
      timerController.subscribe('pause', pauseCallback);
      
      timerController.start();
      timerController.pause();
      
      expect(pauseCallback).toHaveBeenCalledWith({
        mode: 'work',
        timeRemaining: 25 * 60,
        isRunning: false,
        currentCycle: 0
      });
    });

    it('should not emit pause event if not running', () => {
      const pauseCallback = vi.fn();
      timerController.subscribe('pause', pauseCallback);
      
      timerController.pause(); // Try to pause when not running
      
      expect(pauseCallback).not.toHaveBeenCalled();
    });

    it('should emit pause event with correct remaining time', () => {
      const pauseCallback = vi.fn();
      timerController.subscribe('pause', pauseCallback);
      
      timerController.start();
      vi.advanceTimersByTime(10000); // Run for 10 seconds
      timerController.pause();
      
      expect(pauseCallback).toHaveBeenCalledWith({
        mode: 'work',
        timeRemaining: (25 * 60) - 10,
        isRunning: false,
        currentCycle: 0
      });
    });
  });

  describe('Reset Events', () => {
    it('should emit reset event when timer resets', () => {
      const resetCallback = vi.fn();
      timerController.subscribe('reset', resetCallback);
      
      timerController.start();
      vi.advanceTimersByTime(5000); // Run for 5 seconds
      timerController.reset();
      
      expect(resetCallback).toHaveBeenCalledWith({
        mode: 'work',
        timeRemaining: 25 * 60, // Reset to original duration
        isRunning: false,
        currentCycle: 0
      });
    });

    it('should emit reset event for different modes', () => {
      const resetCallback = vi.fn();
      timerController.subscribe('reset', resetCallback);
      
      timerController.switchMode('shortBreak');
      timerController.start();
      vi.advanceTimersByTime(2000); // Run for 2 seconds
      timerController.reset();
      
      expect(resetCallback).toHaveBeenCalledWith({
        mode: 'shortBreak',
        timeRemaining: 5 * 60, // Reset to short break duration
        isRunning: false,
        currentCycle: 0
      });
    });

    it('should emit pause event before reset event', () => {
      const events: string[] = [];
      
      timerController.subscribe('pause', () => events.push('pause'));
      timerController.subscribe('reset', () => events.push('reset'));
      
      timerController.start();
      timerController.reset();
      
      expect(events).toEqual(['pause', 'reset']);
    });
  });

  describe('Event Safety and Error Handling', () => {
    it('should provide immutable state copies to event callbacks', () => {
      const tickCallback = vi.fn();
      timerController.subscribe('tick', tickCallback);
      
      timerController.start();
      vi.advanceTimersByTime(1000);
      
      const receivedState = tickCallback.mock.calls[0][0];
      const originalTimeRemaining = receivedState.timeRemaining;
      
      // Try to modify the received state
      receivedState.timeRemaining = 0;
      receivedState.isRunning = false;
      
      // Verify the actual timer state is unchanged
      const actualState = timerController.getState();
      expect(actualState.timeRemaining).toBe(originalTimeRemaining);
      expect(actualState.isRunning).toBe(true);
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();
      
      // Mock console.error to verify error handling
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      timerController.subscribe('tick', errorCallback);
      timerController.subscribe('tick', normalCallback);
      
      timerController.start();
      vi.advanceTimersByTime(1000);
      
      // Both callbacks should have been called despite the error
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error in tick event callback:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should continue timer operation even if event callbacks fail', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      
      // Mock console.error to suppress error output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      timerController.subscribe('tick', errorCallback);
      
      timerController.start();
      vi.advanceTimersByTime(3000); // 3 seconds
      
      // Timer should continue working despite callback errors
      const state = timerController.getState();
      expect(state.timeRemaining).toBe((25 * 60) - 3);
      expect(state.isRunning).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Event Integration with Timer Operations', () => {
    it('should emit events in correct sequence during normal operation', () => {
      const events: string[] = [];
      
      timerController.subscribe('start', () => events.push('start'));
      timerController.subscribe('tick', () => events.push('tick'));
      timerController.subscribe('pause', () => events.push('pause'));
      timerController.subscribe('reset', () => events.push('reset'));
      timerController.subscribe('modeChange', () => events.push('modeChange'));
      
      timerController.start();
      vi.advanceTimersByTime(2000); // 2 ticks
      timerController.pause();
      timerController.reset();
      timerController.switchMode('shortBreak');
      
      expect(events).toEqual([
        'start',
        'tick',
        'tick',
        'pause',
        'reset', // Reset doesn't emit pause if already paused
        'modeChange' // Mode switch doesn't call pause if not running
      ]);
    });

    it('should emit events in correct sequence during completion', () => {
      const events: string[] = [];
      
      timerController.subscribe('start', () => events.push('start'));
      timerController.subscribe('complete', () => events.push('complete'));
      timerController.subscribe('pause', () => events.push('pause'));
      
      timerController.start();
      vi.advanceTimersByTime(25 * 60 * 1000); // Complete work session
      
      expect(events).toContain('start');
      expect(events).toContain('complete');
      expect(events).toContain('pause');
      
      // Verify pause comes before complete
      const completeIndex = events.indexOf('complete');
      const pauseIndex = events.indexOf('pause');
      expect(pauseIndex).toBeLessThan(completeIndex);
    });

    it('should handle rapid event subscriptions and unsubscriptions', () => {
      const callbacks = Array.from({ length: 10 }, () => vi.fn());
      
      // Subscribe all callbacks
      callbacks.forEach(callback => {
        timerController.subscribe('tick', callback);
      });
      
      expect(timerController.getListenerCount('tick')).toBe(10);
      
      // Unsubscribe half of them
      callbacks.slice(0, 5).forEach(callback => {
        timerController.unsubscribe('tick', callback);
      });
      
      expect(timerController.getListenerCount('tick')).toBe(5);
      
      // Test that remaining callbacks still work
      timerController.start();
      vi.advanceTimersByTime(1000);
      
      callbacks.slice(0, 5).forEach(callback => {
        expect(callback).not.toHaveBeenCalled();
      });
      
      callbacks.slice(5).forEach(callback => {
        expect(callback).toHaveBeenCalled();
      });
    });
  });
});