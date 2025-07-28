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

describe('End-to-End Tests - Core User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Timer Operation Workflow', () => {
    it('should complete basic timer operations', async () => {
      render(<App />);
      
      // Verify initial state
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      expect(screen.getAllByText('工作時間')[0]).toBeInTheDocument();
      
      // Start timer
      const startButtons = screen.getAllByLabelText('開始計時器');
      fireEvent.click(startButtons[0]);
      
      // Verify running state
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // Pause timer
      const pauseButtons = screen.getAllByLabelText('暫停計時器');
      fireEvent.click(pauseButtons[0]);
      
      // Verify paused state
      expect(screen.getAllByText('已暫停')[0]).toBeInTheDocument();
      
      // Reset timer
      const resetButtons = screen.getAllByLabelText('重置計時器');
      fireEvent.click(resetButtons[0]);
      
      // Verify reset state
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      expect(screen.getAllByText('已暫停')[0]).toBeInTheDocument();
    });
  });

  describe('Navigation Workflow', () => {
    it('should navigate between different panels', async () => {
      render(<App />);
      
      // Test tasks navigation
      const tasksButtons = screen.getAllByText('任務');
      fireEvent.click(tasksButtons[0]);
      
      // Should show task management
      expect(screen.getAllByText('任務管理')[0]).toBeInTheDocument();
      
      // Test stats navigation
      const statsButtons = screen.getAllByText('統計');
      fireEvent.click(statsButtons[0]);
      
      // Should show statistics
      expect(screen.getAllByText('統計數據')[0]).toBeInTheDocument();
      expect(screen.getAllByText('今日完成')[0]).toBeInTheDocument();
      
      // Test settings navigation
      const settingsButtons = screen.getAllByText('設定');
      fireEvent.click(settingsButtons[0]);
      
      // Should show settings (check for common settings elements)
      const workInputs = screen.getAllByDisplayValue('25');
      expect(workInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Settings Persistence Workflow', () => {
    it('should save and apply settings changes', async () => {
      render(<App />);
      
      // Open settings
      const settingsButtons = screen.getAllByText('設定');
      fireEvent.click(settingsButtons[0]);
      
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
      fireEvent.click(settingsButtons[0]);
      
      // Verify timer shows new duration
      await waitFor(() => {
        const timerDisplays = screen.queryAllByText('30:00');
        expect(timerDisplays.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
      
      // Verify settings were saved
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Mobile Interface Workflow', () => {
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

  describe('Error Handling Workflow', () => {
    it('should handle storage errors gracefully', () => {
      // Mock localStorage to throw errors
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // App should still render without crashing
      expect(() => render(<App />)).not.toThrow();
      
      // Should show default timer
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      
      // Timer should still be functional
      const startButtons = screen.getAllByLabelText('開始計時器');
      expect(() => fireEvent.click(startButtons[0])).not.toThrow();
    });

    it('should handle rapid user interactions', () => {
      render(<App />);
      
      const startButtons = screen.getAllByLabelText('開始計時器');
      const resetButtons = screen.getAllByLabelText('重置計時器');
      const tasksButtons = screen.getAllByText('任務');
      const statsButtons = screen.getAllByText('統計');
      const settingsButtons = screen.getAllByText('設定');
      
      // Perform rapid interactions
      for (let i = 0; i < 5; i++) {
        fireEvent.click(startButtons[0]);
        fireEvent.click(resetButtons[0]);
        fireEvent.click(tasksButtons[0]);
        fireEvent.click(statsButtons[0]);
        fireEvent.click(settingsButtons[0]);
      }
      
      // App should remain stable
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      expect(screen.getAllByText('工作時間')[0]).toBeInTheDocument();
    });
  });

  describe('Accessibility Workflow', () => {
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

  describe('Data Flow Workflow', () => {
    it('should maintain consistent state across components', async () => {
      render(<App />);
      
      // Start timer
      const startButtons = screen.getAllByLabelText('開始計時器');
      fireEvent.click(startButtons[0]);
      
      // Verify timer is running
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // Navigate to different panels while timer is running
      const tasksButtons = screen.getAllByText('任務');
      fireEvent.click(tasksButtons[0]);
      
      // Timer should still be running
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // Navigate to stats
      const statsButtons = screen.getAllByText('統計');
      fireEvent.click(statsButtons[0]);
      
      // Timer should still be running
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
      
      // Navigate to settings
      const settingsButtons = screen.getAllByText('設定');
      fireEvent.click(settingsButtons[0]);
      
      // Timer should still be running
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
    });
  });

  describe('Theme Integration Workflow', () => {
    it('should apply theme classes consistently', () => {
      render(<App />);
      
      // Check that theme classes are applied
      const app = document.querySelector('.app');
      expect(app).toHaveClass('theme-transition');
      
      const timerDisplay = document.querySelector('.timer-display');
      expect(timerDisplay).toHaveClass('theme-transition');
      
      const controlButtons = document.querySelectorAll('.control-button');
      controlButtons.forEach(button => {
        expect(button).toHaveClass('theme-transition');
      });
      
      // Start timer to potentially trigger theme changes
      const startButtons = screen.getAllByLabelText('開始計時器');
      fireEvent.click(startButtons[0]);
      
      // Theme classes should still be present
      expect(app).toHaveClass('theme-transition');
      expect(timerDisplay).toHaveClass('theme-transition');
    });
  });

  describe('Performance Workflow', () => {
    it('should handle component mounting and unmounting efficiently', () => {
      const { unmount } = render(<App />);
      
      // Perform some interactions
      const startButtons = screen.getAllByLabelText('開始計時器');
      fireEvent.click(startButtons[0]);
      
      const tasksButtons = screen.getAllByText('任務');
      fireEvent.click(tasksButtons[0]);
      
      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });

    it('should maintain performance with multiple state changes', () => {
      render(<App />);
      
      const startTime = performance.now();
      
      // Perform multiple state changes
      const startButtons = screen.getAllByLabelText('開始計時器');
      const resetButtons = screen.getAllByLabelText('重置計時器');
      
      for (let i = 0; i < 10; i++) {
        fireEvent.click(startButtons[0]);
        fireEvent.click(resetButtons[0]);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(500);
      
      // App should still be functional
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
    });
  });
});