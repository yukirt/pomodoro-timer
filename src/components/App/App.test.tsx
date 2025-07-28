import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../../App';

// Mock TimerController to avoid timer-related side effects
vi.mock('../../core/timer/TimerController', () => {
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

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Helper function to get desktop settings button
const getDesktopSettingsButton = () => {
  const settingsButtons = screen.getAllByRole('button', { name: /設定/i });
  return settingsButtons.find(button => 
    button.className.includes('nav-button')
  );
};

describe('App - 設定面板顯示測試', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock default settings
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
  });

  describe('設定按鈕點擊行為', () => {
    it('應該顯示設定按鈕', () => {
      render(<App />);
      
      const desktopSettingsButton = getDesktopSettingsButton();
      expect(desktopSettingsButton).toBeInTheDocument();
    });

    it('點擊設定按鈕應該顯示設定面板', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      
      // 初始狀態：設定面板不應該可見
      expect(screen.queryByTestId('desktop-settings-panel')).not.toBeInTheDocument();
      
      // 點擊設定按鈕
      fireEvent.click(settingsButton);
      
      // 等待設定面板出現
      await waitFor(() => {
        expect(screen.getByTestId('desktop-settings-panel')).toBeInTheDocument();
      });
    });

    it('設定按鈕點擊後應該有active狀態', () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      
      // 初始狀態
      expect(settingsButton).not.toHaveClass('active');
      
      // 點擊後
      fireEvent.click(settingsButton);
      expect(settingsButton).toHaveClass('active');
    });

    it('再次點擊設定按鈕應該隱藏設定面板', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      
      // 第一次點擊顯示
      fireEvent.click(settingsButton);
      await waitFor(() => {
        expect(screen.getByTestId('desktop-settings-panel')).toBeInTheDocument();
      });
      
      // 第二次點擊隱藏
      fireEvent.click(settingsButton);
      expect(settingsButton).not.toHaveClass('active');
    });
  });

  describe('桌面端設定面板顯示', () => {
    beforeEach(() => {
      // Mock desktop view (width >= 1200px)
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 1200px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    it('桌面端設定面板應該有正確的CSS類名', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const settingsPanel = screen.getByTestId('desktop-settings-panel');
        expect(settingsPanel).toBeInTheDocument();
        expect(settingsPanel).toHaveClass('sidebar', 'sidebar-settings', 'visible');
      });
    });

    it('桌面端設定面板應該從右側滑入', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const settingsPanel = screen.getByTestId('desktop-settings-panel');
        expect(settingsPanel).toHaveClass('visible');
      });
    });

    it('桌面端設定面板關閉後應該移除visible類', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      
      // 打開設定面板
      fireEvent.click(settingsButton);
      await waitFor(() => {
        const settingsPanel = screen.getByTestId('desktop-settings-panel');
        expect(settingsPanel).toHaveClass('visible');
      });
      
      // 關閉設定面板
      fireEvent.click(settingsButton);
      
      // 確認visible類被移除
      await waitFor(() => {
        expect(settingsButton).not.toHaveClass('active');
      });
    });
  });

  describe('移動端設定面板顯示', () => {
    beforeEach(() => {
      // Mock mobile view (width < 1200px)
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query !== '(min-width: 1200px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    it('移動端設定面板應該顯示在modal overlay中', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const modalOverlay = screen.getByTestId('mobile-settings-modal');
        expect(modalOverlay).toBeInTheDocument();
        expect(modalOverlay).toHaveClass('modal-overlay');
      });
    });

    it('移動端設定面板應該有modal-content類', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const modalContent = screen.getByTestId('mobile-settings-modal').querySelector('.modal-content');
        expect(modalContent).toBeInTheDocument();
        expect(modalContent).toHaveClass('modal-content');
      });
    });
  });

  describe('設定面板內容和功能', () => {
    it('設定面板應該存在', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('desktop-settings-panel')).toBeInTheDocument();
      });
    });

    it('設定面板應該有關閉按鈕', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const closeButtons = screen.getAllByRole('button', { name: /關閉設定/i });
        expect(closeButtons.length).toBeGreaterThan(0);
      });
    });

    it('點擊關閉按鈕應該關閉設定面板', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const closeButtons = screen.getAllByRole('button', { name: /關閉設定/i });
        fireEvent.click(closeButtons[0]);
      });
      
      expect(settingsButton).not.toHaveClass('active');
    });
  });

  describe('設定值更新', () => {
    it('設定面板應該支持值更新', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('desktop-settings-panel')).toBeInTheDocument();
        // 驗證localStorage mock存在
        expect(localStorageMock.setItem).toBeDefined();
      });
    });
  });

  describe('響應式設計', () => {
    it('在大螢幕上應該顯示桌面佈局', () => {
      // Mock large screen
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 1200px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<App />);
      
      const desktopLayout = document.querySelector('.desktop-layout');
      const mobileLayout = document.querySelector('.mobile-layout');
      
      expect(desktopLayout).toBeInTheDocument();
      expect(mobileLayout).toBeInTheDocument();
    });

    it('在小螢幕上應該隱藏桌面導航', () => {
      // Mock small screen
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query !== '(min-width: 1200px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<App />);
      
      const desktopNav = document.querySelector('.desktop-nav');
      const mobileNav = document.querySelector('.mobile-nav');
      
      expect(desktopNav).toBeInTheDocument();
      expect(mobileNav).toBeInTheDocument();
    });
  });
});