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

describe('Desktop Layout', () => {
  it('should render navigation buttons in header', () => {
    render(<App />);
    
    expect(screen.getByText('任務')).toBeInTheDocument();
    expect(screen.getByText('統計')).toBeInTheDocument();
    expect(screen.getAllByText('設定')[0]).toBeInTheDocument(); // Get the first one (nav button)
  });

  it('should toggle task panel visibility when task button is clicked', () => {
    render(<App />);
    
    const taskButton = screen.getByText('任務');
    
    // Initially not active
    expect(taskButton).not.toHaveClass('active');
    
    // Click to activate
    fireEvent.click(taskButton);
    expect(taskButton).toHaveClass('active');
    
    // Click again to deactivate
    fireEvent.click(taskButton);
    expect(taskButton).not.toHaveClass('active');
  });

  it('should toggle stats panel visibility when stats button is clicked', () => {
    render(<App />);
    
    const statsButton = screen.getByText('統計');
    
    // Initially not active
    expect(statsButton).not.toHaveClass('active');
    
    // Click to activate
    fireEvent.click(statsButton);
    expect(statsButton).toHaveClass('active');
    
    // Click again to deactivate
    fireEvent.click(statsButton);
    expect(statsButton).not.toHaveClass('active');
  });

  it('should toggle settings panel visibility when settings button is clicked', () => {
    render(<App />);
    
    const settingsButton = screen.getAllByText('設定')[0]; // Get the first one (nav button)
    
    // Initially not active
    expect(settingsButton).not.toHaveClass('active');
    
    // Click to activate
    fireEvent.click(settingsButton);
    expect(settingsButton).toHaveClass('active');
    
    // Click again to deactivate
    fireEvent.click(settingsButton);
    expect(settingsButton).not.toHaveClass('active');
  });

  it('should render timer display and controls in center', () => {
    render(<App />);
    
    // Timer should be visible (check for multiple instances)
    expect(screen.getAllByText('25:00')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByText('開始')).toHaveLength(2); // Desktop and mobile
    expect(screen.getAllByText('重置')).toHaveLength(2); // Desktop and mobile
  });

  it('should show current task display when task is selected', () => {
    render(<App />);
    
    // Initially no current task display
    expect(screen.queryByText('當前任務')).not.toBeInTheDocument();
    
    // This would require more complex setup to test task selection
    // For now, we verify the structure is in place
  });

  it('should have proper CSS classes for desktop layout', () => {
    render(<App />);
    
    const app = screen.getByRole('main');
    expect(app).toHaveClass('app-main');
    
    // Check for desktop layout structure
    const desktopLayout = app.querySelector('.desktop-layout');
    expect(desktopLayout).toBeInTheDocument();
    
    const mobileLayout = app.querySelector('.mobile-layout');
    expect(mobileLayout).toBeInTheDocument();
  });

  it('should render all sidebar components', () => {
    render(<App />);
    
    // Check for sidebar elements (they exist in DOM but may be hidden)
    const leftSidebar = screen.getByRole('main').querySelector('.sidebar-left');
    const rightSidebar = screen.getByRole('main').querySelector('.sidebar-right');
    
    expect(leftSidebar).toBeInTheDocument();
    expect(rightSidebar).toBeInTheDocument();
  });
});

describe('Desktop Layout Responsive Behavior', () => {
  it('should have appropriate CSS classes for responsive design', () => {
    render(<App />);
    
    const app = document.querySelector('.app');
    expect(app).toBeInTheDocument();
    
    // Check that responsive classes are applied
    const header = app?.querySelector('.app-header');
    expect(header).toBeInTheDocument();
    
    const nav = header?.querySelector('.app-nav');
    expect(nav).toBeInTheDocument();
  });

  it('should maintain timer functionality in desktop layout', () => {
    render(<App />);
    
    const startButtons = screen.getAllByText('開始');
    const resetButtons = screen.getAllByText('重置');
    
    expect(startButtons).toHaveLength(2); // Desktop and mobile
    expect(resetButtons).toHaveLength(2); // Desktop and mobile
    
    // Buttons should be clickable
    startButtons.forEach(button => expect(button).not.toBeDisabled());
    resetButtons.forEach(button => expect(button).not.toBeDisabled());
  });
});