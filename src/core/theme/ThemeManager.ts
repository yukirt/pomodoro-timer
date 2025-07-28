import { Theme, ThemeMode, ThemeColors } from './types';

// Work mode theme - Red color scheme
const workTheme: Theme = {
  mode: 'work',
  name: 'work',
  displayName: '工作模式',
  colors: {
    primary: '#f44336',
    primaryLight: '#ffcdd2',
    primaryDark: '#d32f2f',
    secondary: '#ff5722',
    background: '#ffebee',
    surface: '#ffffff',
    text: '#212121',
    textSecondary: '#757575',
    border: '#e0e0e0',
    shadow: 'rgba(244, 67, 54, 0.2)',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336'
  }
};

// Short break mode theme - Green color scheme
const shortBreakTheme: Theme = {
  mode: 'shortBreak',
  name: 'shortBreak',
  displayName: '短休息模式',
  colors: {
    primary: '#4caf50',
    primaryLight: '#c8e6c9',
    primaryDark: '#388e3c',
    secondary: '#8bc34a',
    background: '#e8f5e8',
    surface: '#ffffff',
    text: '#212121',
    textSecondary: '#757575',
    border: '#e0e0e0',
    shadow: 'rgba(76, 175, 80, 0.2)',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336'
  }
};

// Long break mode theme - Blue color scheme
const longBreakTheme: Theme = {
  mode: 'longBreak',
  name: 'longBreak',
  displayName: '長休息模式',
  colors: {
    primary: '#2196f3',
    primaryLight: '#bbdefb',
    primaryDark: '#1976d2',
    secondary: '#03a9f4',
    background: '#e3f2fd',
    surface: '#ffffff',
    text: '#212121',
    textSecondary: '#757575',
    border: '#e0e0e0',
    shadow: 'rgba(33, 150, 243, 0.2)',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336'
  }
};

export class ThemeManager {
  private themes: Record<ThemeMode, Theme>;
  private currentTheme: Theme;
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor() {
    this.themes = {
      work: workTheme,
      shortBreak: shortBreakTheme,
      longBreak: longBreakTheme
    };
    this.currentTheme = workTheme;
  }

  /**
   * 獲取當前主題
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * 獲取所有主題
   */
  getAllThemes(): Record<ThemeMode, Theme> {
    return this.themes;
  }

  /**
   * 獲取指定模式的主題
   */
  getTheme(mode: ThemeMode): Theme {
    return this.themes[mode];
  }

  /**
   * 設置主題模式
   */
  setTheme(mode: ThemeMode): void {
    const newTheme = this.themes[mode];
    if (newTheme && newTheme !== this.currentTheme) {
      this.currentTheme = newTheme;
      this.applyThemeToDOM();
      this.notifyListeners();
    }
  }

  /**
   * 訂閱主題變更事件
   */
  subscribe(callback: (theme: Theme) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 應用主題到 DOM
   */
  private applyThemeToDOM(): void {
    const root = document.documentElement;
    const colors = this.currentTheme.colors;

    // 設置 CSS 自定義屬性
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-primary-light', colors.primaryLight);
    root.style.setProperty('--theme-primary-dark', colors.primaryDark);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-background', colors.background);
    root.style.setProperty('--theme-surface', colors.surface);
    root.style.setProperty('--theme-text', colors.text);
    root.style.setProperty('--theme-text-secondary', colors.textSecondary);
    root.style.setProperty('--theme-border', colors.border);
    root.style.setProperty('--theme-shadow', colors.shadow);
    root.style.setProperty('--theme-success', colors.success);
    root.style.setProperty('--theme-warning', colors.warning);
    root.style.setProperty('--theme-error', colors.error);

    // 設置主題模式類名
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${this.currentTheme.mode}`);
  }

  /**
   * 通知所有監聽器
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.currentTheme));
  }

  /**
   * 初始化主題系統
   */
  initialize(): void {
    this.applyThemeToDOM();
  }
}

// 創建全局主題管理器實例
export const themeManager = new ThemeManager();