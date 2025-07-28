import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

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

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  },
  writable: true
});

// Mock Audio API
const mockAudio = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  volume: 1,
  currentTime: 0,
  duration: 0,
};
global.Audio = vi.fn().mockImplementation(() => mockAudio);

describe('Integration Tests - Extended User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('完整番茄鐘使用流程', () => {
    it('should support complete pomodoro workflow with tasks', async () => {
      render(<App />);
      
      // 1. 創建任務
      const tasksButton = screen.getAllByText('任務')[0];
      fireEvent.click(tasksButton);
      
      expect(screen.getAllByText('任務管理')[0]).toBeInTheDocument();
      
      const addTaskButtons = screen.getAllByText('+ 新增任務');
      fireEvent.click(addTaskButtons[0]);
      
      const titleInput = screen.getByPlaceholderText('輸入任務標題');
      fireEvent.change(titleInput, { target: { value: '重要專案' } });
      
      const saveButton = screen.getByText('建立任務');
      fireEvent.click(saveButton);
      
      // 2. 選擇任務
      await waitFor(() => {
        const taskItem = screen.getByText('重要專案');
        fireEvent.click(taskItem);
      }, { timeout: 3000 });
      
      // 3. 驗證任務選中狀態
      await waitFor(() => {
        expect(screen.getAllByText('當前任務')[0]).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // 4. 開始番茄鐘
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // 5. 暫停和重置
      const pauseButton = screen.getAllByLabelText('暫停計時器')[0];
      fireEvent.click(pauseButton);
      
      expect(screen.getAllByText('已暫停')[0]).toBeInTheDocument();
      
      const resetButton = screen.getAllByLabelText('重置計時器')[0];
      fireEvent.click(resetButton);
      
      // 6. 檢查統計面板
      const statsButton = screen.getAllByText('統計')[0];
      fireEvent.click(statsButton);
      
      expect(screen.getAllByText('統計數據')[0]).toBeInTheDocument();
      expect(screen.getAllByText('今日完成')[0]).toBeInTheDocument();
    });

    it('should persist data across sessions', async () => {
      // 模擬已保存的數據
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'pomodoro-timer-settings') {
          return JSON.stringify({
            workDuration: 30,
            shortBreakDuration: 10,
            longBreakDuration: 20,
            longBreakInterval: 3,
            autoStartBreaks: true,
            autoStartWork: false,
            soundEnabled: true,
            notificationsEnabled: true
          });
        }
        return null;
      });
      
      render(<App />);
      
      // 驗證設定被恢復
      await waitFor(() => {
        const timerDisplays = screen.queryAllByText('30:00');
        expect(timerDisplays.length).toBeGreaterThan(0);
      });
      
      // 驗證設定面板顯示正確的值
      const settingsButton = screen.getAllByText('設定')[0];
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const workInputs = screen.getAllByDisplayValue('30');
        expect(workInputs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('設定和個人化流程', () => {
    it('should customize timer settings and apply immediately', async () => {
      render(<App />);
      
      // 打開設定
      const settingsButton = screen.getAllByText('設定')[0];
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('時間設定')[0]).toBeInTheDocument();
      });
      
      // 修改工作時間
      const workInput = screen.getByLabelText('工作時間 (分鐘)');
      fireEvent.change(workInput, { target: { value: '45' } });
      
      // 啟用自動開始
      const autoStartCheckboxes = screen.getAllByLabelText('自動開始休息');
      fireEvent.click(autoStartCheckboxes[0]);
      
      // 保存設定
      const saveButtons = screen.getAllByText('儲存');
      const enabledSaveButton = saveButtons.find(button => !button.hasAttribute('disabled'));
      if (enabledSaveButton) {
        fireEvent.click(enabledSaveButton);
      }
      
      // 關閉設定
      fireEvent.click(settingsButton);
      
      // 驗證計時器顯示新的時間
      await waitFor(() => {
        const timerDisplays = screen.queryAllByText('45:00');
        expect(timerDisplays.length).toBeGreaterThan(0);
      });
      
      // 驗證設定被保存
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pomodoro-timer-settings',
        expect.stringContaining('45')
      );
    });

    it('should handle notification preferences', async () => {
      render(<App />);
      
      const settingsButton = screen.getAllByText('設定')[0];
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('通知設定')[0]).toBeInTheDocument();
      });
      
      // 切換通知設定
      const notificationCheckboxes = screen.getAllByLabelText('啟用桌面通知');
      fireEvent.click(notificationCheckboxes[0]);
      
      const soundCheckboxes = screen.getAllByLabelText('啟用聲音提醒');
      fireEvent.click(soundCheckboxes[0]);
      
      // 保存設定
      const saveButtons = screen.getAllByText('儲存');
      const enabledSaveButton = saveButtons.find(button => !button.hasAttribute('disabled'));
      if (enabledSaveButton) {
        fireEvent.click(enabledSaveButton);
      }
      
      // 驗證設定被保存
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pomodoro-timer-settings',
        expect.stringContaining('notificationsEnabled')
      );
    });
  });

  describe('任務管理完整流程', () => {
    it('should manage tasks throughout their lifecycle', async () => {
      render(<App />);
      
      // 1. 創建多個任務
      const tasksButton = screen.getAllByText('任務')[0];
      fireEvent.click(tasksButton);
      
      const taskTitles = ['設計原型', '實現功能', '測試驗證'];
      
      for (const title of taskTitles) {
        const addTaskButtons = screen.getAllByText('+ 新增任務');
        fireEvent.click(addTaskButtons[0]);
        
        const titleInput = screen.getByPlaceholderText('輸入任務標題');
        fireEvent.change(titleInput, { target: { value: title } });
        
        const estimateInputs = screen.getAllByLabelText(/預估番茄鐘數/);
        fireEvent.change(estimateInputs[0], { target: { value: '3' } });
        
        const saveButton = screen.getByText('建立任務');
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(title)).toBeInTheDocument();
        });
      }
      
      // 2. 選擇第一個任務
      const firstTask = screen.getByText('設計原型');
      fireEvent.click(firstTask);
      
      // 3. 完成工作會話
      await waitFor(() => {
        expect(screen.getAllByText('當前任務')[0]).toBeInTheDocument();
      });
      
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // 4. 檢查任務進度更新
      expect(screen.getAllByText('設計原型')[0]).toBeInTheDocument();
      
      // 5. 驗證數據持久化
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should show task statistics and progress', async () => {
      render(<App />);
      
      // 創建任務
      const tasksButton = screen.getAllByText('任務')[0];
      fireEvent.click(tasksButton);
      
      const addTaskButtons = screen.getAllByText('+ 新增任務');
      fireEvent.click(addTaskButtons[0]);
      
      const titleInput = screen.getByPlaceholderText('輸入任務標題');
      fireEvent.change(titleInput, { target: { value: '統計測試任務' } });
      
      const saveButton = screen.getByText('建立任務');
      fireEvent.click(saveButton);
      
      // 選擇任務
      await waitFor(() => {
        const taskItem = screen.getByText('統計測試任務');
        fireEvent.click(taskItem);
      });
      
      // 檢查任務統計顯示
      expect(screen.getAllByText('活動任務')[0]).toBeInTheDocument();
      expect(screen.getAllByText('已完成')[0]).toBeInTheDocument();
      
      // 檢查統計面板中的任務相關統計
      const statsButton = screen.getAllByText('統計')[0];
      fireEvent.click(statsButton);
      
      expect(screen.getAllByText('統計數據')[0]).toBeInTheDocument();
    });
  });

  describe('響應式界面流程', () => {
    it('should work consistently across different screen sizes', async () => {
      render(<App />);
      
      // 測試桌面導航
      expect(screen.getAllByText('任務')[0]).toBeInTheDocument();
      expect(screen.getAllByText('統計')[0]).toBeInTheDocument();
      expect(screen.getAllByText('設定')[0]).toBeInTheDocument();
      
      // 測試移動端導航
      const menuToggle = screen.getByLabelText('切換選單');
      fireEvent.click(menuToggle);
      
      expect(screen.getAllByText('任務管理')[0]).toBeInTheDocument();
      expect(screen.getAllByText('統計數據')[0]).toBeInTheDocument();
      
      // 測試移動端面板切換
      const mobileTasksItem = screen.getAllByText('任務管理')[0];
      fireEvent.click(mobileTasksItem);
      
      expect(screen.getAllByText('任務管理')[0]).toBeInTheDocument();
    });

    it('should handle panel switching smoothly', async () => {
      render(<App />);
      
      // 快速切換面板
      const tasksButton = screen.getAllByText('任務')[0];
      const statsButton = screen.getAllByText('統計')[0];
      const settingsButton = screen.getAllByText('設定')[0];
      
      fireEvent.click(tasksButton);
      expect(screen.getAllByText('任務管理')[0]).toBeInTheDocument();
      
      fireEvent.click(statsButton);
      expect(screen.getAllByText('統計數據')[0]).toBeInTheDocument();
      
      fireEvent.click(settingsButton);
      await waitFor(() => {
        expect(screen.getAllByText('時間設定')[0]).toBeInTheDocument();
      });
      
      // 關閉設定
      fireEvent.click(settingsButton);
      
      // 計時器應該始終可見
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
    });
  });

  describe('數據完整性流程', () => {
    it('should handle data migration gracefully', async () => {
      // 模擬舊版本數據
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'pomodoro-timer-settings') {
          // 舊格式：缺少某些新字段
          return JSON.stringify({
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15
            // 缺少新字段如 autoStartBreaks 等
          });
        }
        return null;
      });
      
      render(<App />);
      
      // 應用應該正常啟動
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      
      // 設定面板應該顯示默認值
      const settingsButton = screen.getAllByText('設定')[0];
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getAllByText('自動化設定')[0]).toBeInTheDocument();
      });
    });

    it('should handle storage errors gracefully', async () => {
      // 模擬存儲錯誤
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // 應用應該仍然可以啟動
      expect(() => render(<App />)).not.toThrow();
      
      // 應該顯示默認計時器
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      
      // 功能應該仍然可用
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      expect(() => fireEvent.click(startButton)).not.toThrow();
    });

    it('should maintain performance during extended use', async () => {
      render(<App />);
      
      const startTime = performance.now();
      
      // 模擬長期使用：多次操作
      for (let i = 0; i < 15; i++) {
        const tasksButton = screen.getAllByText('任務')[0];
        const statsButton = screen.getAllByText('統計')[0];
        const settingsButton = screen.getAllByText('設定')[0];
        
        fireEvent.click(tasksButton);
        fireEvent.click(statsButton);
        fireEvent.click(settingsButton);
        fireEvent.click(settingsButton); // 關閉設定
        
        const startButton = screen.getAllByLabelText('開始計時器')[0];
        const resetButton = screen.getAllByLabelText('重置計時器')[0];
        
        fireEvent.click(startButton);
        fireEvent.click(resetButton);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 應該在合理時間內完成
      expect(duration).toBeLessThan(1500);
      
      // 應用應該仍然正常運行
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      expect(screen.getAllByText('工作時間')[0]).toBeInTheDocument();
    });
  });

  describe('用戶體驗流程', () => {
    it('should provide consistent accessibility features', async () => {
      render(<App />);
      
      // 檢查主要的可訪問性功能
      expect(screen.getAllByLabelText('開始計時器')[0]).toBeInTheDocument();
      expect(screen.getAllByLabelText('重置計時器')[0]).toBeInTheDocument();
      expect(screen.getByLabelText('切換選單')).toBeInTheDocument();
      
      // 檢查語義化結構
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content
      
      // 測試鍵盤導航
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      startButton.focus();
      expect(document.activeElement).toBe(startButton);
      
      // 測試鍵盤激活
      fireEvent.keyDown(startButton, { key: 'Enter' });
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
    });

    it('should maintain state consistency across user interactions', async () => {
      render(<App />);
      
      // 開始計時器
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // 在計時器運行時切換面板
      const tasksButton = screen.getAllByText('任務')[0];
      fireEvent.click(tasksButton);
      
      // 計時器狀態應該保持
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // 切換到統計面板
      const statsButton = screen.getAllByText('統計')[0];
      fireEvent.click(statsButton);
      
      // 計時器仍應該運行
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // 打開設定
      const settingsButton = screen.getAllByText('設定')[0];
      fireEvent.click(settingsButton);
      
      // 計時器狀態應該保持不變
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
    });
  });
});