import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../App';

// Mock TimerController
vi.mock('../core/timer/TimerController', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      getState: () => ({
        timeRemaining: 1500,
        mode: 'work',
        isRunning: false,
        sessionCount: 0
      }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      start: vi.fn(),
      pause: vi.fn(),
      reset: vi.fn(),
      updateSettings: vi.fn()
    }))
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Helper function to get desktop settings button
const getDesktopSettingsButton = () => {
  const settingsButtons = screen.getAllByRole('button', { name: /設定/i });
  return settingsButtons.find(button => 
    button.className.includes('nav-button')
  );
};

describe('設定面板修復驗證測試', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'pomodoro-settings') {
        return JSON.stringify({
          workDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartWork: false,
          soundEnabled: true,
          notificationsEnabled: false
        });
      }
      return null;
    });

    // Mock desktop view
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 1200px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('核心修復驗證', () => {
    it('設定按鈕應該正常顯示', () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      expect(settingsButton).toBeInTheDocument();
      expect(settingsButton).toHaveClass('nav-button');
    });

    it('點擊設定按鈕應該顯示設定面板', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      
      // 初始狀態：設定面板不存在
      expect(screen.queryByTestId('desktop-settings-panel')).not.toBeInTheDocument();
      
      // 點擊設定按鈕
      fireEvent.click(settingsButton);
      
      // 設定面板應該出現
      await waitFor(() => {
        expect(screen.getByTestId('desktop-settings-panel')).toBeInTheDocument();
      });
    });

    it('設定面板應該有正確的CSS類名', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const settingsPanel = screen.getByTestId('desktop-settings-panel');
        
        // 驗證關鍵的CSS類名
        expect(settingsPanel).toHaveClass('sidebar');
        expect(settingsPanel).toHaveClass('sidebar-settings');
        expect(settingsPanel).toHaveClass('visible');
      });
    });

    it('設定按鈕應該正確切換active狀態', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      
      // 初始狀態
      expect(settingsButton).not.toHaveClass('active');
      
      // 點擊後應該有active類
      fireEvent.click(settingsButton);
      expect(settingsButton).toHaveClass('active');
      
      // 再次點擊應該移除active類
      fireEvent.click(settingsButton);
      expect(settingsButton).not.toHaveClass('active');
    });

    it('設定面板關閉後應該從DOM中移除', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      
      // 打開設定面板
      fireEvent.click(settingsButton);
      await waitFor(() => {
        expect(screen.getByTestId('desktop-settings-panel')).toBeInTheDocument();
      });
      
      // 關閉設定面板
      fireEvent.click(settingsButton);
      
      // 面板應該消失
      await waitFor(() => {
        expect(screen.queryByTestId('desktop-settings-panel')).not.toBeInTheDocument();
      });
    });
  });

  describe('移動端驗證', () => {
    beforeEach(() => {
      // Mock mobile view
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query !== '(min-width: 1200px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('移動端應該使用modal顯示設定面板', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const mobileModal = screen.getByTestId('mobile-settings-modal');
        expect(mobileModal).toBeInTheDocument();
        expect(mobileModal).toHaveClass('modal-overlay');
      });
    });
  });

  describe('修復前後對比', () => {
    it('確認sidebar-settings類現在存在（修復前的問題）', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const settingsPanel = screen.getByTestId('desktop-settings-panel');
        
        // 這個類名在修復前是缺失的
        expect(settingsPanel.classList.contains('sidebar-settings')).toBe(true);
      });
    });

    it('確認設定面板可以正常切換顯示狀態（修復的功能）', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      
      // 測試多次切換
      for (let i = 0; i < 3; i++) {
        // 打開
        fireEvent.click(settingsButton);
        await waitFor(() => {
          expect(screen.getByTestId('desktop-settings-panel')).toBeInTheDocument();
        });
        
        // 關閉
        fireEvent.click(settingsButton);
        await waitFor(() => {
          expect(screen.queryByTestId('desktop-settings-panel')).not.toBeInTheDocument();
        });
      }
    });
  });
});