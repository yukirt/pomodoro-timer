import { TimerState, TimerSettings, TimerEventType, TimerEventCallback } from './types';

class TimerController {
  private state: TimerState;
  private settings: TimerSettings;
  private intervalId: number | null = null;
  private eventListeners: Map<TimerEventType, TimerEventCallback[]> = new Map();

  constructor(settings: TimerSettings) {
    this.settings = settings;
    this.state = {
      mode: 'work',
      timeRemaining: settings.workDuration * 60,
      isRunning: false,
      currentCycle: 0
    };
    
    // Initialize event listeners map for all supported events
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    const eventTypes: TimerEventType[] = ['tick', 'modeChange', 'complete', 'start', 'pause', 'reset'];
    eventTypes.forEach(eventType => {
      this.eventListeners.set(eventType, []);
    });
  }

  // 啟動計時器
  start(): void {
    if (!this.state.isRunning) {
      this.state.isRunning = true;
      this.intervalId = (globalThis.setInterval || setInterval)(() => {
        this.tick();
      }, 1000);
      this.emit('start');
    }
  }

  // 暫停計時器
  pause(): void {
    if (this.state.isRunning) {
      this.state.isRunning = false;
      if (this.intervalId) {
        (globalThis.clearInterval || clearInterval)(this.intervalId);
        this.intervalId = null;
      }
      this.emit('pause');
    }
  }

  // 重置計時器
  reset(): void {
    const wasRunning = this.state.isRunning;
    if (wasRunning) {
      this.pause();
    }
    this.state.timeRemaining = this.getDurationForMode(this.state.mode) * 60;
    this.emit('reset');
  }

  // 切換模式（工作/休息）
  switchMode(mode: 'work' | 'shortBreak' | 'longBreak'): void {
    const wasRunning = this.state.isRunning;
    if (wasRunning) {
      this.pause();
    }
    this.state.mode = mode;
    this.state.timeRemaining = this.getDurationForMode(mode) * 60;
    this.emit('modeChange');
  }

  // 獲取當前計時器狀態
  getState(): TimerState {
    return { ...this.state };
  }

  // 訂閱計時器事件
  subscribe(eventType: TimerEventType, callback: TimerEventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      throw new Error(`Unsupported event type: ${eventType}`);
    }
    
    const listeners = this.eventListeners.get(eventType)!;
    listeners.push(callback);
  }

  // 取消訂閱事件
  unsubscribe(eventType: TimerEventType, callback: TimerEventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      return; // Silently ignore unsupported event types for unsubscribe
    }
    
    const listeners = this.eventListeners.get(eventType)!;
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // 取消所有事件訂閱
  unsubscribeAll(eventType?: TimerEventType): void {
    if (eventType) {
      if (this.eventListeners.has(eventType)) {
        this.eventListeners.set(eventType, []);
      }
    } else {
      // Clear all event listeners
      this.eventListeners.forEach((_, key) => {
        this.eventListeners.set(key, []);
      });
    }
  }

  // 獲取事件監聽器數量（用於測試）
  getListenerCount(eventType: TimerEventType): number {
    return this.eventListeners.get(eventType)?.length || 0;
  }

  // 更新設定
  updateSettings(newSettings: TimerSettings): void {
    this.settings = newSettings;
    
    // If timer is not running, update the time remaining for current mode
    if (!this.state.isRunning) {
      this.state.timeRemaining = this.getDurationForMode(this.state.mode) * 60;
      this.emit('tick'); // Emit tick to update UI
    }
  }

  private tick(): void {
    if (this.state.timeRemaining > 0) {
      this.state.timeRemaining--;
      this.emit('tick');
      
      // Check if we've reached zero after decrementing
      if (this.state.timeRemaining === 0) {
        this.handleTimerComplete();
      }
    }
  }

  private handleTimerComplete(): void {
    // Pause the timer first to update isRunning state
    this.pause();
    
    // Increment cycle count after pausing
    if (this.state.mode === 'work') {
      this.state.currentCycle++;
    }
    
    this.emit('complete');
    
    // Auto-switch logic will be implemented in later tasks
  }

  private getDurationForMode(mode: 'work' | 'shortBreak' | 'longBreak'): number {
    switch (mode) {
      case 'work':
        return this.settings.workDuration;
      case 'shortBreak':
        return this.settings.shortBreakDuration;
      case 'longBreak':
        return this.settings.longBreakDuration;
      default:
        return this.settings.workDuration;
    }
  }

  private emit(eventType: TimerEventType): void {
    const listeners = this.eventListeners.get(eventType) || [];
    // Create a copy of the state to prevent external modification
    const stateCopy = { ...this.state };
    
    // Execute callbacks safely, catching any errors to prevent one callback from breaking others
    listeners.forEach(callback => {
      try {
        callback(stateCopy);
      } catch (error) {
        console.error(`Error in ${eventType} event callback:`, error);
      }
    });
  }
}

export default TimerController;