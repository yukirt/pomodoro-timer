// Timer types and interfaces
export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export interface TimerState {
  mode: TimerMode;
  timeRemaining: number; // 以秒為單位
  isRunning: boolean;
  currentCycle: number; // 當前完成的工作週期數
}

export interface TimerSettings {
  workDuration: number; // 工作時間（分鐘）
  shortBreakDuration: number; // 短休息時間（分鐘）
  longBreakDuration: number; // 長休息時間（分鐘）
  longBreakInterval: number; // 多少個工作週期後進行長休息
  autoStartBreaks: boolean; // 是否自動開始休息
  autoStartWork: boolean; // 是否自動開始工作
  soundEnabled: boolean; // 是否啟用聲音
  notificationsEnabled: boolean; // 是否啟用通知
}

export type TimerEventType = 'tick' | 'modeChange' | 'complete' | 'start' | 'pause' | 'reset';

export interface TimerEventCallback {
  (state: TimerState): void;
}