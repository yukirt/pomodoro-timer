import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeManager } from './ThemeManager';
import { ThemeMode } from './types';

// Mock DOM methods
Object.defineProperty(document, 'documentElement', {
  value: {
    style: {
      setProperty: vi.fn()
    }
  },
  writable: true
});

Object.defineProperty(document, 'body', {
  value: {
    className: '',
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  },
  writable: true
});

describe('ThemeManager', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    themeManager = new ThemeManager();
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('應該以工作模式主題初始化', () => {
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme.mode).toBe('work');
      expect(currentTheme.name).toBe('work');
      expect(currentTheme.displayName).toBe('工作模式');
    });

    it('應該包含所有三種主題模式', () => {
      const themes = themeManager.getAllThemes();
      expect(themes).toHaveProperty('work');
      expect(themes).toHaveProperty('shortBreak');
      expect(themes).toHaveProperty('longBreak');
    });
  });

  describe('主題切換', () => {
    it('應該能夠切換到短休息模式', () => {
      themeManager.setTheme('shortBreak');
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme.mode).toBe('shortBreak');
      expect(currentTheme.displayName).toBe('短休息模式');
    });

    it('應該能夠切換到長休息模式', () => {
      themeManager.setTheme('longBreak');
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme.mode).toBe('longBreak');
      expect(currentTheme.displayName).toBe('長休息模式');
    });

    it('切換主題時應該應用到 DOM', () => {
      const setPropertySpy = vi.spyOn(document.documentElement.style, 'setProperty');
      const addClassSpy = vi.spyOn(document.body.classList, 'add');

      themeManager.setTheme('shortBreak');

      expect(setPropertySpy).toHaveBeenCalledWith('--theme-primary', '#4caf50');
      expect(setPropertySpy).toHaveBeenCalledWith('--theme-background', '#e8f5e8');
      expect(addClassSpy).toHaveBeenCalledWith('theme-shortBreak');
    });

    it('切換到相同主題時不應該觸發變更', () => {
      const callback = vi.fn();
      themeManager.subscribe(callback);
      
      themeManager.setTheme('work'); // 已經是工作模式
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('主題顏色', () => {
    it('工作模式應該使用紅色主題', () => {
      const workTheme = themeManager.getTheme('work');
      expect(workTheme.colors.primary).toBe('#f44336');
      expect(workTheme.colors.background).toBe('#ffebee');
    });

    it('短休息模式應該使用綠色主題', () => {
      const shortBreakTheme = themeManager.getTheme('shortBreak');
      expect(shortBreakTheme.colors.primary).toBe('#4caf50');
      expect(shortBreakTheme.colors.background).toBe('#e8f5e8');
    });

    it('長休息模式應該使用藍色主題', () => {
      const longBreakTheme = themeManager.getTheme('longBreak');
      expect(longBreakTheme.colors.primary).toBe('#2196f3');
      expect(longBreakTheme.colors.background).toBe('#e3f2fd');
    });
  });

  describe('事件訂閱', () => {
    it('應該能夠訂閱主題變更事件', () => {
      const callback = vi.fn();
      const unsubscribe = themeManager.subscribe(callback);

      themeManager.setTheme('shortBreak');
      expect(callback).toHaveBeenCalledWith(themeManager.getCurrentTheme());

      unsubscribe();
      themeManager.setTheme('longBreak');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('應該能夠取消訂閱', () => {
      const callback = vi.fn();
      const unsubscribe = themeManager.subscribe(callback);

      unsubscribe();
      themeManager.setTheme('shortBreak');
      expect(callback).not.toHaveBeenCalled();
    });

    it('應該支持多個訂閱者', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      themeManager.subscribe(callback1);
      themeManager.subscribe(callback2);

      themeManager.setTheme('shortBreak');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('DOM 應用', () => {
    it('初始化時應該應用主題到 DOM', () => {
      const setPropertySpy = vi.spyOn(document.documentElement.style, 'setProperty');
      const addClassSpy = vi.spyOn(document.body.classList, 'add');

      themeManager.initialize();

      expect(setPropertySpy).toHaveBeenCalledWith('--theme-primary', '#f44336');
      expect(addClassSpy).toHaveBeenCalledWith('theme-work');
    });

    it('應該設置所有必要的 CSS 自定義屬性', () => {
      const setPropertySpy = vi.spyOn(document.documentElement.style, 'setProperty');
      
      themeManager.setTheme('shortBreak');

      const expectedProperties = [
        '--theme-primary',
        '--theme-primary-light',
        '--theme-primary-dark',
        '--theme-secondary',
        '--theme-background',
        '--theme-surface',
        '--theme-text',
        '--theme-text-secondary',
        '--theme-border',
        '--theme-shadow',
        '--theme-success',
        '--theme-warning',
        '--theme-error'
      ];

      expectedProperties.forEach(property => {
        expect(setPropertySpy).toHaveBeenCalledWith(property, expect.any(String));
      });
    });
  });

  describe('主題一致性', () => {
    it('所有主題都應該有相同的顏色屬性結構', () => {
      const themes = themeManager.getAllThemes();
      const colorKeys = Object.keys(themes.work.colors);

      Object.values(themes).forEach(theme => {
        expect(Object.keys(theme.colors)).toEqual(colorKeys);
      });
    });

    it('所有主題都應該有必要的元數據', () => {
      const themes = themeManager.getAllThemes();

      Object.values(themes).forEach(theme => {
        expect(theme).toHaveProperty('mode');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('displayName');
        expect(theme).toHaveProperty('colors');
      });
    });
  });
});