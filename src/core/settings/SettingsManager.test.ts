import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsManager } from './SettingsManager';
import { TimerSettings } from './types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('SettingsManager', () => {
  let settingsManager: SettingsManager;
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

  beforeEach(() => {
    settingsManager = new SettingsManager();
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return default settings when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const settings = settingsManager.getSettings();
      
      expect(settings).toEqual(defaultSettings);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('pomodoro-timer-settings');
    });

    it('should return merged settings when localStorage has data', () => {
      const storedSettings = {
        workDuration: 30,
        soundEnabled: false
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedSettings));
      
      const settings = settingsManager.getSettings();
      
      expect(settings).toEqual({
        ...defaultSettings,
        workDuration: 30,
        soundEnabled: false
      });
    });

    it('should return default settings when localStorage data is invalid', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const settings = settingsManager.getSettings();
      
      expect(settings).toEqual(defaultSettings);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load settings from localStorage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('saveSettings', () => {
    it('should save settings to localStorage', () => {
      const newSettings: TimerSettings = {
        ...defaultSettings,
        workDuration: 30
      };
      
      settingsManager.saveSettings(newSettings);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pomodoro-timer-settings',
        JSON.stringify(newSettings)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        settingsManager.saveSettings(defaultSettings);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save settings to localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('resetToDefaults', () => {
    it('should remove settings from localStorage and return defaults', () => {
      const result = settingsManager.resetToDefaults();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pomodoro-timer-settings');
      expect(result).toEqual(defaultSettings);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Failed to remove');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = settingsManager.resetToDefaults();
      
      expect(result).toEqual(defaultSettings);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear settings from localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('updateSetting', () => {
    it('should update a single setting and save to localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      
      const result = settingsManager.updateSetting('workDuration', 30);
      
      expect(result.workDuration).toBe(30);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pomodoro-timer-settings',
        JSON.stringify({ ...defaultSettings, workDuration: 30 })
      );
    });

    it('should validate setting values', () => {
      expect(() => {
        settingsManager.updateSetting('workDuration', 0);
      }).toThrow('Invalid value for setting workDuration: 0');

      expect(() => {
        settingsManager.updateSetting('workDuration', 150);
      }).toThrow('Invalid value for setting workDuration: 150');

      expect(() => {
        settingsManager.updateSetting('longBreakInterval', 15);
      }).toThrow('Invalid value for setting longBreakInterval: 15');
    });
  });

  describe('updateSettings', () => {
    it('should update multiple settings and save to localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      
      const updates = {
        workDuration: 30,
        shortBreakDuration: 10,
        soundEnabled: false
      };
      
      const result = settingsManager.updateSettings(updates);
      
      expect(result).toEqual({ ...defaultSettings, ...updates });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pomodoro-timer-settings',
        JSON.stringify({ ...defaultSettings, ...updates })
      );
    });

    it('should validate all setting values', () => {
      expect(() => {
        settingsManager.updateSettings({
          workDuration: 30,
          shortBreakDuration: 0 // Invalid
        });
      }).toThrow('Invalid settings values provided');
    });
  });

  describe('validation', () => {
    it('should accept valid duration values', () => {
      expect(() => {
        settingsManager.updateSetting('workDuration', 25);
        settingsManager.updateSetting('shortBreakDuration', 5);
        settingsManager.updateSetting('longBreakDuration', 15);
        settingsManager.updateSetting('longBreakInterval', 4);
      }).not.toThrow();
    });

    it('should accept valid boolean values', () => {
      expect(() => {
        settingsManager.updateSetting('autoStartBreaks', true);
        settingsManager.updateSetting('autoStartWork', false);
        settingsManager.updateSetting('soundEnabled', true);
        settingsManager.updateSetting('notificationsEnabled', false);
      }).not.toThrow();
    });
  });

  describe('event system', () => {
    it('should notify listeners when settings are updated via updateSetting', () => {
      const listener = vi.fn();
      const unsubscribe = settingsManager.subscribe(listener);
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      
      const result = settingsManager.updateSetting('workDuration', 30);
      
      expect(listener).toHaveBeenCalledWith(result);
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
    });

    it('should notify listeners when settings are updated via updateSettings', () => {
      const listener = vi.fn();
      const unsubscribe = settingsManager.subscribe(listener);
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      
      const updates = { workDuration: 30, soundEnabled: false };
      const result = settingsManager.updateSettings(updates);
      
      expect(listener).toHaveBeenCalledWith(result);
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      const unsubscribe1 = settingsManager.subscribe(listener1);
      const unsubscribe2 = settingsManager.subscribe(listener2);
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      
      const result = settingsManager.updateSetting('workDuration', 30);
      
      expect(listener1).toHaveBeenCalledWith(result);
      expect(listener2).toHaveBeenCalledWith(result);
      
      unsubscribe1();
      unsubscribe2();
    });

    it('should allow unsubscribing listeners', () => {
      const listener = vi.fn();
      const unsubscribe = settingsManager.subscribe(listener);
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      
      // First update should trigger listener
      settingsManager.updateSetting('workDuration', 30);
      expect(listener).toHaveBeenCalledTimes(1);
      
      // Unsubscribe
      unsubscribe();
      
      // Second update should not trigger listener
      settingsManager.updateSetting('workDuration', 35);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      settingsManager.subscribe(errorListener);
      settingsManager.subscribe(normalListener);
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      
      const result = settingsManager.updateSetting('workDuration', 30);
      
      expect(errorListener).toHaveBeenCalledWith(result);
      expect(normalListener).toHaveBeenCalledWith(result);
      expect(consoleSpy).toHaveBeenCalledWith('Error in settings change listener:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});