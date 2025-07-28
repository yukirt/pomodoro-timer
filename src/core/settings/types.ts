// Settings types - reusing from timer types for consistency
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