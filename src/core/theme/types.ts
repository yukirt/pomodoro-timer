// Theme types and interfaces
export type ThemeMode = 'work' | 'shortBreak' | 'longBreak';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  name: string;
  displayName: string;
}

export interface ThemeContextValue {
  currentTheme: Theme;
  setTheme: (mode: ThemeMode) => void;
  themes: Record<ThemeMode, Theme>;
}