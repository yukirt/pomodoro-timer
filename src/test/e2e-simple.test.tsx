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

// Audio API is now mocked in setup.ts

describe('End-to-End Tests - User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Basic Timer Workflow', () => {
    it('should start, pause, and reset timer', async () => {
      render(<App />);
      
      // Initial state
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      expect(screen.getAllByText('工作時間')[0]).toBeInTheDocument();
      
      // Start timer
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      // Should show running state
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // Pause timer
      const pauseButton = screen.getAllByLabelText('暫停計時器')[0];
      fireEvent.click(pauseButton);
      
      // Should show paused state
      expect(screen.getAllByText('已暫停')[0]).toBeInTheDocument();
      
      // Reset timer
      const resetButton = screen.getAllByLabelText('重置計時器')[0];
      fireEvent.click(resetButton);
      
      // Should return to initial state
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
    });
  });

  describe('Task Management Workflow', () => {
    it('should create and select a task', async () => {
      render(<App />);
      
      // Open tasks panel
      const tasksButton = screen.getAllByText('任務')[0];
      fireEvent.click(tasksButton);
      
      // Should show task panel
      expect(screen.getAllByText('任務管理')[0]).toBeInTheDocument();
      
      // Add new task
      const addButton = screen.getAllByText('+ 新增任務')[0]; // Get the first one
      fireEvent.click(addButton);
      
      // Fill task form
      const titleInput = screen.getByPlaceholderText('輸入任務標題');
      fireEvent.change(titleInput, { target: { value: '測試任務' } });
      
      const saveButton = screen.getByText('建立任務');
      fireEvent.click(saveButton);
      
      // Task should appear
      await waitFor(() => {
        expect(screen.getByText('測試任務')).toBeInTheDocument();
      });
      
      // Select task
      const taskItem = screen.getByText('測試任務');
      fireEvent.click(taskItem);
      
      // Should show current task
      await waitFor(() => {
        expect(screen.getAllByText('當前任務')[0]).toBeInTheDocument();
      });
    });
  });

  describe('Settings Workflow', () => {
    it('should change timer settings', async () => {
      render(<App />);
      
      // Open settings
      const settingsButton = screen.getAllByText('設定')[0];
      fireEvent.click(settingsButton);
      
      // Wait for settings panel to be visible
      await waitFor(() => {
        expect(screen.getAllByText('時間設定')[0]).toBeInTheDocument();
      });

      // Find work duration input
      const workInput = screen.getByLabelText('工作時間 (分鐘)');
      
      // Change work duration
      fireEvent.change(workInput, { target: { value: '30' } });
      
      // Save settings
      const saveButtons = screen.getAllByText('儲存');
      const enabledSaveButton = saveButtons.find(button => !button.hasAttribute('disabled'));
      if (enabledSaveButton) {
        fireEvent.click(enabledSaveButton);
      }
      
      // Close settings
      fireEvent.click(settingsButton);
      
      // Timer should show new duration
      await waitFor(() => {
        const timerDisplays = screen.queryAllByText('30:00');
        expect(timerDisplays.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Statistics Workflow', () => {
    it('should view statistics and change time periods', async () => {
      render(<App />);
      
      // Open stats
      const statsButton = screen.getAllByText('統計')[0];
      fireEvent.click(statsButton);
      
      // Should show stats panel
      expect(screen.getAllByText('統計數據')[0]).toBeInTheDocument();
      expect(screen.getAllByText('今日完成')[0]).toBeInTheDocument();
      
      // Change to week view
      const weekButton = screen.getAllByText('本週')[0]; // Get the first one
      fireEvent.click(weekButton);
      expect(weekButton).toHaveClass('active');
      
      // Change to month view
      const monthButton = screen.getAllByText('本月')[0]; // Get the first one
      fireEvent.click(monthButton);
      expect(monthButton).toHaveClass('active');
    });
  });

  describe('Mobile Navigation Workflow', () => {
    it('should work with mobile navigation', async () => {
      render(<App />);
      
      // Should have mobile menu toggle
      const menuToggle = screen.getByLabelText('切換選單');
      expect(menuToggle).toBeInTheDocument();
      
      // Open mobile menu
      fireEvent.click(menuToggle);
      
      // Should show menu items
      expect(screen.getAllByText('任務管理')[0]).toBeInTheDocument();
      expect(screen.getAllByText('統計數據')[0]).toBeInTheDocument();
      
      // Click tasks in mobile menu
      const tasksItem = screen.getAllByText('任務管理')[0]; // Get the first one (mobile menu)
      fireEvent.click(tasksItem);
      
      // Should show tasks panel
      expect(screen.getAllByText('任務管理')[0]).toBeInTheDocument();
    });
  });

  describe('Complete User Journey', () => {
    it('should complete a full user workflow', async () => {
      render(<App />);
      
      // 1. Create a task
      const tasksButton = screen.getAllByText('任務')[0];
      fireEvent.click(tasksButton);
      
      const addButton = screen.getAllByText('+ 新增任務')[0]; // Get the first one
      fireEvent.click(addButton);
      
      const titleInput = screen.getByPlaceholderText('輸入任務標題');
      fireEvent.change(titleInput, { target: { value: '完整工作流程測試' } });
      
      const saveButton = screen.getByText('建立任務');
      fireEvent.click(saveButton);
      
      // 2. Select the task
      await waitFor(() => {
        const taskItem = screen.getByText('完整工作流程測試');
        fireEvent.click(taskItem);
      });
      
      // 3. Start working on the task
      await waitFor(() => {
        expect(screen.getAllByText('當前任務')[0]).toBeInTheDocument();
      });
      
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      // 4. Check timer is running
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // 5. View statistics
      const statsButton = screen.getAllByText('統計')[0];
      fireEvent.click(statsButton);
      
      expect(screen.getAllByText('統計數據')[0]).toBeInTheDocument();
      
      // 6. Configure settings
      const settingsButton = screen.getAllByText('設定')[0];
      fireEvent.click(settingsButton);
      
      // Settings should be accessible
      const workInputs = screen.getAllByDisplayValue('25');
      expect(workInputs.length).toBeGreaterThan(0);
      
      // 7. Return to timer
      fireEvent.click(settingsButton);
      
      // Timer should still be running with task selected
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      expect(screen.getAllByText('完整工作流程測試')[0]).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Should not crash
      expect(() => render(<App />)).not.toThrow();
      
      // Should show default timer
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
    });

    it('should handle rapid interactions without issues', () => {
      render(<App />);
      
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      const resetButton = screen.getAllByLabelText('重置計時器')[0];
      
      // Rapid clicks should not crash
      for (let i = 0; i < 10; i++) {
        fireEvent.click(startButton);
        fireEvent.click(resetButton);
      }
      
      // App should remain stable
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<App />);
      
      // Check essential ARIA labels
      expect(screen.getAllByLabelText('開始計時器')[0]).toBeInTheDocument();
      expect(screen.getAllByLabelText('重置計時器')[0]).toBeInTheDocument();
      expect(screen.getByLabelText('切換選單')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(<App />);
      
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      
      // Should be focusable
      startButton.focus();
      expect(document.activeElement).toBe(startButton);
      
      // Should respond to keyboard events
      fireEvent.keyDown(startButton, { key: 'Enter' });
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
    });
  });
});