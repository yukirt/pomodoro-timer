import { TimerSettings } from './types';

type SettingsChangeListener = (settings: TimerSettings) => void;

export class SettingsManager {
  private static readonly STORAGE_KEY = 'pomodoro-timer-settings';
  private listeners: SettingsChangeListener[] = [];
  
  private defaultSettings: TimerSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    notificationsEnabled: true
  };

  // 獲取設定
  getSettings(): TimerSettings {
    try {
      const stored = localStorage.getItem(SettingsManager.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.defaultSettings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return { ...this.defaultSettings };
  }

  // 保存設定
  saveSettings(settings: TimerSettings): void {
    try {
      localStorage.setItem(SettingsManager.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  // 重置為預設設定
  resetToDefaults(): TimerSettings {
    try {
      localStorage.removeItem(SettingsManager.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear settings from localStorage:', error);
    }
    return { ...this.defaultSettings };
  }

  // 驗證設定值
  private validateSettings(settings: Partial<TimerSettings>): boolean {
    if (settings.workDuration !== undefined && (settings.workDuration < 1 || settings.workDuration > 120)) {
      return false;
    }
    if (settings.shortBreakDuration !== undefined && (settings.shortBreakDuration < 1 || settings.shortBreakDuration > 60)) {
      return false;
    }
    if (settings.longBreakDuration !== undefined && (settings.longBreakDuration < 1 || settings.longBreakDuration > 120)) {
      return false;
    }
    if (settings.longBreakInterval !== undefined && (settings.longBreakInterval < 1 || settings.longBreakInterval > 10)) {
      return false;
    }
    return true;
  }

  // 更新特定設定項目
  updateSetting<K extends keyof TimerSettings>(
    key: K, 
    value: TimerSettings[K]
  ): TimerSettings {
    const testSettings = { [key]: value };
    if (!this.validateSettings(testSettings)) {
      throw new Error(`Invalid value for setting ${String(key)}: ${value}`);
    }
    
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, [key]: value };
    this.saveSettings(updatedSettings);
    this.notifyListeners(updatedSettings);
    return updatedSettings;
  }

  // 更新多個設定項目
  updateSettings(updates: Partial<TimerSettings>): TimerSettings {
    if (!this.validateSettings(updates)) {
      throw new Error('Invalid settings values provided');
    }
    
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...updates };
    this.saveSettings(updatedSettings);
    this.notifyListeners(updatedSettings);
    return updatedSettings;
  }

  // 訂閱設定變更事件
  subscribe(listener: SettingsChangeListener): () => void {
    this.listeners.push(listener);
    
    // 返回取消訂閱函數
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 通知所有監聽器設定已變更
  private notifyListeners(settings: TimerSettings): void {
    this.listeners.forEach(listener => {
      try {
        listener(settings);
      } catch (error) {
        console.error('Error in settings change listener:', error);
      }
    });
  }
}

// Create and export a singleton instance
const settingsManager = new SettingsManager();
export default settingsManager;