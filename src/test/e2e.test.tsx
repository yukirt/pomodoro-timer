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

describe('End-to-End Tests - Complete User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Complete Pomodoro Session Workflow', () => {
    it('should complete a full pomodoro work session', async () => {
      render(<App />);
      
      // Initial state - timer should show 25:00 for work
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      expect(screen.getAllByText('工作時間')[0]).toBeInTheDocument();
      
      // Start the timer
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      // Timer should be running
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // Pause the timer
      const pauseButton = screen.getAllByLabelText('暫停計時器')[0];
      fireEvent.click(pauseButton);
      
      // Timer should be paused
      expect(screen.getAllByText('已暫停')[0]).toBeInTheDocument();
      
      // Resume the timer
      const resumeButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(resumeButton);
      
      // Reset the timer
      const resetButton = screen.getAllByLabelText('重置計時器')[0];
      fireEvent.click(resetButton);
      
      // Should be back to initial state
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      expect(screen.getAllByText('已暫停')[0]).toBeInTheDocument();
    });
  });

  describe('Task Management Integration', () => {
    it('should create and work on a task', async () => {
      render(<App />);
      
      // Open tasks panel
      const tasksButton = screen.getAllByText('任務')[0];
      fireEvent.click(tasksButton);
      
      // Should show task management panel
      expect(screen.getAllByText('任務管理')[0]).toBeInTheDocument();
      
      // Add a new task - use getAllByText and select the first one to handle duplicates
      const addTaskButtons = screen.getAllByText('+ 新增任務');
      fireEvent.click(addTaskButtons[0]);
      
      // Fill in task details
      const titleInput = screen.getByPlaceholderText('輸入任務標題');
      fireEvent.change(titleInput, { target: { value: '完成專案文檔' } });
      
      // Save the task
      const saveButton = screen.getByText('建立任務');
      fireEvent.click(saveButton);
      
      // Task should appear in the list
      await waitFor(() => {
        expect(screen.getByText('完成專案文檔')).toBeInTheDocument();
      });
      
      // Select the task
      const taskItem = screen.getByText('完成專案文檔');
      fireEvent.click(taskItem);
      
      // Current task should be displayed in timer area
      await waitFor(() => {
        expect(screen.getAllByText('當前任務')[0]).toBeInTheDocument();
        expect(screen.getAllByText('完成專案文檔')[0]).toBeInTheDocument();
      });
      
      // Start working on the task
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      // Timer should be running with task selected
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      expect(screen.getAllByText('完成專案文檔')[0]).toBeInTheDocument();
    });
  });

  describe('Settings and Statistics Integration', () => {
    it('should configure settings and view statistics', async () => {
      render(<App />);
      
      // Open settings
      const settingsButton = screen.getAllByText('設定')[0];
      fireEvent.click(settingsButton);
      
      // Wait for settings panel to be visible
      await waitFor(() => {
        expect(screen.getAllByText('時間設定')[0]).toBeInTheDocument();
      });

      // Change work duration
      const workInput = screen.getByLabelText('工作時間 (分鐘)');
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
      
      // Open statistics
      const statsButton = screen.getAllByText('統計')[0];
      fireEvent.click(statsButton);
      
      // Should show statistics panel
      expect(screen.getAllByText('統計數據')[0]).toBeInTheDocument();
      expect(screen.getAllByText('今日完成')[0]).toBeInTheDocument();
    });
  });

  describe('Mobile Navigation Integration', () => {
    it('should work with mobile navigation', async () => {
      render(<App />);
      
      // Should have mobile menu toggle
      const menuToggle = screen.getByLabelText('切換選單');
      expect(menuToggle).toBeInTheDocument();
      
      // Open mobile menu
      fireEvent.click(menuToggle);
      
      // Should show mobile menu items
      const mobileMenuItems = screen.getAllByText('任務管理');
      expect(mobileMenuItems.length).toBeGreaterThan(0);
      
      // Click on mobile menu item
      const tasksMenuItem = mobileMenuItems.find(item => 
        item.closest('.mobile-menu-item')
      );
      
      if (tasksMenuItem) {
        fireEvent.click(tasksMenuItem);
        
        // Should show tasks panel
        expect(screen.getAllByText('任務管理')[0]).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle storage errors gracefully', () => {
      // Mock localStorage to throw errors
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // App should still render without crashing
      expect(() => render(<App />)).not.toThrow();
      
      // Should show default timer
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      
      // Timer should still be functional
      const startButtons = screen.getAllByLabelText('開始計時器');
      expect(() => fireEvent.click(startButtons[0])).not.toThrow();
    });
  });

  describe('Accessibility Integration', () => {
    it('should provide proper accessibility features', () => {
      render(<App />);
      
      // Check for essential ARIA labels
      expect(screen.getAllByLabelText('開始計時器')[0]).toBeInTheDocument();
      expect(screen.getAllByLabelText('重置計時器')[0]).toBeInTheDocument();
      expect(screen.getByLabelText('切換選單')).toBeInTheDocument();
      
      // Check for proper heading structure
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content
      
      // Test keyboard navigation
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      startButton.focus();
      expect(document.activeElement).toBe(startButton);
      
      // Test keyboard activation
      fireEvent.keyDown(startButton, { key: 'Enter' });
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
    });
  });
});