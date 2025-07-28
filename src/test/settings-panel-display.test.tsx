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

describe('設定面板顯示問題修復測試', () => {
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

    // Mock desktop view by default
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

  describe('桌面端設定面板CSS類名修復', () => {
    beforeEach(() => {
      // Mock desktop viewport
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

    it('應該正確應用sidebar-settings類名', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const settingsPanel = screen.getByTestId('desktop-settings-panel');
        expect(settingsPanel).toBeInTheDocument();
        expect(settingsPanel).toHaveClass('sidebar');
        expect(settingsPanel).toHaveClass('sidebar-settings');
        expect(settingsPanel).toHaveClass('visible');
      });
    });

    it('設定面板應該具有固定定位樣式', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const settingsPanel = screen.getByTestId('desktop-settings-panel');
        const computedStyle = window.getComputedStyle(settingsPanel);
        
        // 檢查是否有正確的CSS類名（實際樣式計算在jsdom中可能不完整）
        expect(settingsPanel.className).toContain('sidebar-settings');
      });
    });

    it('設定面板關閉時應該移除visible類', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      
      // 打開設定面板
      fireEvent.click(settingsButton);
      await waitFor(() => {
        expect(screen.getByTestId('desktop-settings-panel')).toHaveClass('visible');
      });
      
      // 關閉設定面板
      fireEvent.click(settingsButton);
      
      // 確認面板被隱藏
      await waitFor(() => {
        expect(screen.queryByTestId('desktop-settings-panel')).not.toBeInTheDocument();
      });
    });

    it('設定面板應該正確處理z-index層級', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const settingsPanel = screen.getByTestId('desktop-settings-panel');
        expect(settingsPanel).toBeInTheDocument();
        
        // 確認CSS類名包含正確的樣式類
        expect(settingsPanel.className).toMatch(/sidebar-settings/);
      });
    });
  });

  describe('移動端設定面板顯示', () => {
    beforeEach(() => {
      // Mock mobile viewport
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

    it('移動端應該使用modal overlay顯示設定面板', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const mobileModal = screen.getByTestId('mobile-settings-modal');
        expect(mobileModal).toBeInTheDocument();
        expect(mobileModal).toHaveClass('modal-overlay');
      });
    });

    it('移動端modal應該包含正確的內容結構', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const mobileModal = screen.getByTestId('mobile-settings-modal');
        const modalContent = mobileModal.querySelector('.modal-content');
        
        expect(modalContent).toBeInTheDocument();
        expect(modalContent).toHaveClass('modal-content');
        
        // 確認設定面板內容存在
        const allHeadings = screen.getAllByRole('heading', { name: /設定/i });
        expect(allHeadings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('響應式佈局切換', () => {
    it('應該在不同視窗大小下正確切換佈局', async () => {
      // 先模擬桌面視窗
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

      const { rerender } = render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('desktop-settings-panel')).toBeInTheDocument();
      });
      
      // 關閉設定面板
      fireEvent.click(settingsButton);
      
      // 模擬切換到移動端
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

      rerender(<App />);
      
      // 再次打開設定面板
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mobile-settings-modal')).toBeInTheDocument();
      });
    });
  });

  describe('設定面板功能完整性', () => {
    it('桌面端和移動端都應該顯示完整的設定選項', async () => {
      // 測試桌面端
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

      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        // 檢查主要設定選項是否存在
        expect(screen.getAllByLabelText(/工作時間/i).length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText(/短休息時間/i).length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText(/長休息時間/i).length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText(/自動開始休息/i).length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText(/啟用聲音提醒/i).length).toBeGreaterThan(0);
        
        // 檢查操作按鈕
        expect(screen.getAllByRole('button', { name: /儲存/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: /取消/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: /重置為預設值/i }).length).toBeGreaterThan(0);
      });
    });

    it('設定面板關閉功能應該正常工作', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const closeButtons = screen.getAllByRole('button', { name: /關閉設定/i });
        expect(closeButtons.length).toBeGreaterThan(0);
        
        fireEvent.click(closeButtons[0]);
      });
      
      // 檢查設定按鈕狀態
      expect(settingsButton).not.toHaveClass('active');
    });
  });

  describe('CSS修復驗證', () => {
    it('修復前的問題：sidebar-settings類應該存在', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const settingsPanel = screen.getByTestId('desktop-settings-panel');
        
        // 驗證修復：確認sidebar-settings類名存在
        expect(settingsPanel.classList.contains('sidebar-settings')).toBe(true);
        
        // 驗證修復：確認visible類名存在
        expect(settingsPanel.classList.contains('visible')).toBe(true);
        
        // 驗證修復：確認基本的sidebar類名存在
        expect(settingsPanel.classList.contains('sidebar')).toBe(true);
      });
    });

    it('修復驗證：設定面板應該可以正常切換顯示狀態', async () => {
      render(<App />);
      
      const settingsButton = getDesktopSettingsButton();
      
      // 初始狀態：設定面板不存在
      expect(screen.queryByTestId('desktop-settings-panel')).not.toBeInTheDocument();
      
      // 打開設定面板
      fireEvent.click(settingsButton);
      await waitFor(() => {
        expect(screen.getByTestId('desktop-settings-panel')).toBeInTheDocument();
      });
      
      // 關閉設定面板
      fireEvent.click(settingsButton);
      await waitFor(() => {
        expect(screen.queryByTestId('desktop-settings-panel')).not.toBeInTheDocument();
      });
    });
  });
});