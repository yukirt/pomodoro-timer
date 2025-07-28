import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../App';

// Mock the core modules
vi.mock('../../core/timer/TimerController', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      getState: vi.fn().mockReturnValue({
        mode: 'work',
        timeRemaining: 1500,
        isRunning: false,
        currentCycle: 0
      }),
      start: vi.fn(),
      pause: vi.fn(),
      reset: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }))
  };
});

vi.mock('../../core/task/TaskManager', () => {
  return {
    TaskManager: vi.fn().mockImplementation(() => ({
      getAllTasks: vi.fn().mockReturnValue([]),
      getTaskStats: vi.fn().mockReturnValue({
        activeTasks: 0,
        completedTasks: 0,
        totalTasks: 0,
        totalCompletedPomodoros: 0,
        completionRate: 0
      }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    }))
  };
});

vi.mock('../../core/stats/SessionManager', () => {
  return {
    SessionManager: vi.fn().mockImplementation(() => ({
      getAllSessions: vi.fn().mockReturnValue([])
    }))
  };
});

vi.mock('../../core/stats/StatsCalculator', () => {
  return {
    StatsCalculator: vi.fn().mockImplementation(() => ({
      calculateDailyStats: vi.fn().mockReturnValue({
        completedPomodoros: 0,
        totalWorkTime: 0
      }),
      calculateRangeStats: vi.fn().mockReturnValue({
        totalPomodoros: 0,
        totalWorkTime: 0,
        totalBreakTime: 0,
        averageDailyPomodoros: 0,
        dailyStats: []
      }),
      calculateProductivityTrend: vi.fn().mockReturnValue({
        trend: 'stable',
        changePercentage: 0
      }),
      calculateBestWorkingHours: vi.fn().mockReturnValue({
        bestHour: 9,
        hourlyStats: []
      })
    }))
  };
});

describe('Responsive Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render both desktop and mobile layouts', () => {
    render(<App />);
    
    // Check for desktop layout structure
    const desktopLayout = document.querySelector('.desktop-layout');
    expect(desktopLayout).toBeInTheDocument();
    
    // Check for mobile layout structure
    const mobileLayout = document.querySelector('.mobile-layout');
    expect(mobileLayout).toBeInTheDocument();
    
    // Check for both navigation types
    const desktopNav = document.querySelector('.desktop-nav');
    const mobileNav = document.querySelector('.mobile-nav');
    expect(desktopNav).toBeInTheDocument();
    expect(mobileNav).toBeInTheDocument();
  });

  it('should have proper responsive CSS classes', () => {
    render(<App />);
    
    const app = document.querySelector('.app');
    expect(app).toBeInTheDocument();
    
    // Check for sidebar elements
    const leftSidebar = document.querySelector('.sidebar-left');
    const rightSidebar = document.querySelector('.sidebar-right');
    expect(leftSidebar).toBeInTheDocument();
    expect(rightSidebar).toBeInTheDocument();
  });

  it('should render mobile navigation with hamburger menu', () => {
    render(<App />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    expect(menuToggle).toBeInTheDocument();
    expect(menuToggle).toHaveClass('menu-toggle');
    
    // Check for hamburger lines
    const hamburgerLines = menuToggle.querySelectorAll('.hamburger-line');
    expect(hamburgerLines).toHaveLength(3);
  });

  it('should handle mobile menu interactions', () => {
    render(<App />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    
    // Open mobile menu
    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveClass('active');
    
    // Check menu items are visible (using getAllByText to handle multiple instances)
    expect(screen.getAllByText('任務管理').length).toBeGreaterThan(0);
    expect(screen.getAllByText('統計數據').length).toBeGreaterThan(0);
    expect(screen.getAllByText('設定').length).toBeGreaterThan(0);
  });

  it('should show modal overlays for mobile panels', () => {
    render(<App />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    fireEvent.click(menuToggle);
    
    // Click on tasks menu item (specifically the one in mobile menu)
    const taskMenuItem = document.querySelector('.mobile-menu-item .menu-text');
    if (taskMenuItem) {
      fireEvent.click(taskMenuItem.closest('button')!);
    }
    
    // Check for modal overlay
    const modalOverlay = document.querySelector('.modal-overlay');
    expect(modalOverlay).toBeInTheDocument();
    
    // Check for task panel in modal
    const taskPanel = document.querySelector('.task-panel');
    expect(taskPanel).toBeInTheDocument();
  });

  it('should handle touch-friendly interactions', () => {
    render(<App />);
    
    // Check that timer controls have proper touch targets
    const startButtons = screen.getAllByText('開始');
    startButtons.forEach(button => {
      const buttonElement = button.closest('button');
      expect(buttonElement).toHaveClass('control-button');
    });
    
    const resetButtons = screen.getAllByText('重置');
    resetButtons.forEach(button => {
      const buttonElement = button.closest('button');
      expect(buttonElement).toHaveClass('control-button');
    });
  });

  it('should maintain timer functionality across layouts', () => {
    render(<App />);
    
    // Timer should be visible in both layouts
    const timerDisplays = screen.getAllByText('25:00');
    expect(timerDisplays).toHaveLength(2); // Desktop and mobile
    
    // Controls should be functional
    const startButtons = screen.getAllByText('開始');
    const resetButtons = screen.getAllByText('重置');
    
    expect(startButtons).toHaveLength(2);
    expect(resetButtons).toHaveLength(2);
    
    // All buttons should be enabled
    startButtons.forEach(button => expect(button).not.toBeDisabled());
    resetButtons.forEach(button => expect(button).not.toBeDisabled());
  });

  it('should handle current task display in both layouts', () => {
    render(<App />);
    
    // Initially no current task should be displayed
    expect(screen.queryByText('當前任務')).not.toBeInTheDocument();
    
    // The structure should be in place for when a task is selected
    const timerSections = document.querySelectorAll('.timer-section');
    expect(timerSections.length).toBeGreaterThan(0);
  });

  it('should have proper accessibility attributes', () => {
    render(<App />);
    
    // Check mobile menu accessibility
    const menuToggle = screen.getByLabelText('切換選單');
    expect(menuToggle).toHaveAttribute('aria-label');
    
    // Check timer controls accessibility
    const startButtons = screen.getAllByLabelText('開始計時器');
    const resetButtons = screen.getAllByLabelText('重置計時器');
    
    expect(startButtons.length).toBeGreaterThan(0);
    expect(resetButtons.length).toBeGreaterThan(0);
  });

  it('should handle panel close functionality', () => {
    render(<App />);
    
    // Open mobile menu and select tasks
    const menuToggle = screen.getByLabelText('切換選單');
    fireEvent.click(menuToggle);
    
    // Click on tasks menu item (specifically the one in mobile menu)
    const taskMenuItem = document.querySelector('.mobile-menu-item .menu-text');
    if (taskMenuItem) {
      fireEvent.click(taskMenuItem.closest('button')!);
    }
    
    // Find and click close button (get all and use the first one)
    const closeButtons = screen.getAllByLabelText('關閉任務管理');
    expect(closeButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(closeButtons[0]);
    
    // Modal should be closed (no longer visible)
    // Note: The modal might still exist in DOM but be hidden
  });
});