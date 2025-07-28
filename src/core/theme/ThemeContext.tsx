import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, ThemeMode, ThemeContextValue } from './types';
import { themeManager } from './ThemeManager';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeManager.getCurrentTheme());

  useEffect(() => {
    // 初始化主題系統
    themeManager.initialize();

    // 訂閱主題變更
    const unsubscribe = themeManager.subscribe((theme: Theme) => {
      setCurrentTheme(theme);
    });

    return unsubscribe;
  }, []);

  const setTheme = (mode: ThemeMode) => {
    themeManager.setTheme(mode);
  };

  const contextValue: ThemeContextValue = {
    currentTheme,
    setTheme,
    themes: themeManager.getAllThemes()
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};