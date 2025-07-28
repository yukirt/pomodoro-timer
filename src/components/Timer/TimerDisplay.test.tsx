import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TimerDisplay from './TimerDisplay';

describe('TimerDisplay', () => {
  const defaultProps = {
    timeRemaining: 1500, // 25 minutes in seconds
    mode: 'work' as const,
    isRunning: false,
    totalTime: 1500
  };

  describe('Time Display', () => {
    it('should format time correctly in MM:SS format', () => {
      render(<TimerDisplay {...defaultProps} timeRemaining={1500} />);
      expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('should format time correctly for single digit minutes and seconds', () => {
      render(<TimerDisplay {...defaultProps} timeRemaining={65} />);
      expect(screen.getByText('01:05')).toBeInTheDocument();
    });

    it('should format time correctly for zero seconds', () => {
      render(<TimerDisplay {...defaultProps} timeRemaining={0} />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('should format time correctly for seconds only', () => {
      render(<TimerDisplay {...defaultProps} timeRemaining={45} />);
      expect(screen.getByText('00:45')).toBeInTheDocument();
    });
  });

  describe('Mode Indicator', () => {
    it('should display correct text for work mode', () => {
      render(<TimerDisplay {...defaultProps} mode="work" />);
      expect(screen.getByText('工作時間')).toBeInTheDocument();
    });

    it('should display correct text for short break mode', () => {
      render(<TimerDisplay {...defaultProps} mode="shortBreak" />);
      expect(screen.getByText('短休息')).toBeInTheDocument();
    });

    it('should display correct text for long break mode', () => {
      render(<TimerDisplay {...defaultProps} mode="longBreak" />);
      expect(screen.getByText('長休息')).toBeInTheDocument();
    });
  });

  describe('Status Indicator', () => {
    it('should show running status when timer is running', () => {
      render(<TimerDisplay {...defaultProps} isRunning={true} />);
      expect(screen.getByText('運行中')).toBeInTheDocument();
    });

    it('should show paused status when timer is not running', () => {
      render(<TimerDisplay {...defaultProps} isRunning={false} />);
      expect(screen.getByText('已暫停')).toBeInTheDocument();
    });

    it('should apply correct CSS class for running status', () => {
      render(<TimerDisplay {...defaultProps} isRunning={true} />);
      const statusElement = screen.getByText('運行中');
      expect(statusElement).toHaveClass('running');
    });

    it('should apply correct CSS class for paused status', () => {
      render(<TimerDisplay {...defaultProps} isRunning={false} />);
      const statusElement = screen.getByText('已暫停');
      expect(statusElement).toHaveClass('paused');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply work mode CSS class', () => {
      const { container } = render(<TimerDisplay {...defaultProps} mode="work" />);
      const timerDisplay = container.querySelector('.timer-display');
      expect(timerDisplay).toHaveClass('work');
    });

    it('should apply short break mode CSS class', () => {
      const { container } = render(<TimerDisplay {...defaultProps} mode="shortBreak" />);
      const timerDisplay = container.querySelector('.timer-display');
      expect(timerDisplay).toHaveClass('shortBreak');
    });

    it('should apply long break mode CSS class', () => {
      const { container } = render(<TimerDisplay {...defaultProps} mode="longBreak" />);
      const timerDisplay = container.querySelector('.timer-display');
      expect(timerDisplay).toHaveClass('longBreak');
    });
  });

  describe('Circular Progress Indicator', () => {
    it('should render SVG circle elements', () => {
      const { container } = render(<TimerDisplay {...defaultProps} />);
      const svg = container.querySelector('svg.timer-circle');
      expect(svg).toBeInTheDocument();
      
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2); // Background and progress circles
    });

    it('should calculate progress correctly when time has elapsed', () => {
      const { container } = render(
        <TimerDisplay 
          {...defaultProps} 
          timeRemaining={750} // Half time remaining
          totalTime={1500}
        />
      );
      
      const progressCircle = container.querySelector('.progress-circle');
      expect(progressCircle).toBeInTheDocument();
      
      // Progress should be 50% (750 seconds elapsed out of 1500 total)
      const strokeDashoffset = progressCircle?.getAttribute('stroke-dashoffset');
      expect(strokeDashoffset).toBeTruthy();
    });

    it('should handle zero total time gracefully', () => {
      const { container } = render(
        <TimerDisplay 
          {...defaultProps} 
          timeRemaining={100}
          totalTime={0}
        />
      );
      
      const progressCircle = container.querySelector('.progress-circle');
      expect(progressCircle).toBeInTheDocument();
    });

    it('should use correct stroke color for work mode', () => {
      const { container } = render(<TimerDisplay {...defaultProps} mode="work" />);
      const progressCircle = container.querySelector('.progress-circle');
      expect(progressCircle?.getAttribute('stroke')).toBe('var(--theme-primary)');
    });

    it('should use correct stroke color for short break mode', () => {
      const { container } = render(<TimerDisplay {...defaultProps} mode="shortBreak" />);
      const progressCircle = container.querySelector('.progress-circle');
      expect(progressCircle?.getAttribute('stroke')).toBe('var(--theme-primary)');
    });

    it('should use correct stroke color for long break mode', () => {
      const { container } = render(<TimerDisplay {...defaultProps} mode="longBreak" />);
      const progressCircle = container.querySelector('.progress-circle');
      expect(progressCircle?.getAttribute('stroke')).toBe('var(--theme-primary)');
    });
  });

  describe('Progress Calculation', () => {
    it('should show 0% progress when no time has elapsed', () => {
      const { container } = render(
        <TimerDisplay 
          {...defaultProps} 
          timeRemaining={1500}
          totalTime={1500}
        />
      );
      
      const progressCircle = container.querySelector('.progress-circle');
      const circumference = 2 * Math.PI * 90;
      const expectedOffset = circumference; // 0% progress means full offset
      
      expect(progressCircle?.getAttribute('stroke-dashoffset')).toBe(expectedOffset.toString());
    });

    it('should show 100% progress when all time has elapsed', () => {
      const { container } = render(
        <TimerDisplay 
          {...defaultProps} 
          timeRemaining={0}
          totalTime={1500}
        />
      );
      
      const progressCircle = container.querySelector('.progress-circle');
      const expectedOffset = 0; // 100% progress means no offset
      
      expect(progressCircle?.getAttribute('stroke-dashoffset')).toBe(expectedOffset.toString());
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', () => {
      render(<TimerDisplay {...defaultProps} />);
      
      // Check that important information is accessible
      expect(screen.getByText('工作時間')).toBeInTheDocument();
      expect(screen.getByText('25:00')).toBeInTheDocument();
      expect(screen.getByText('已暫停')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined totalTime', () => {
      const { container } = render(
        <TimerDisplay 
          timeRemaining={1500}
          mode="work"
          isRunning={false}
        />
      );
      
      // Should not crash and should render basic elements
      expect(screen.getByText('25:00')).toBeInTheDocument();
      expect(container.querySelector('.progress-circle')).toBeInTheDocument();
    });

    it('should handle negative time remaining', () => {
      render(<TimerDisplay {...defaultProps} timeRemaining={-10} />);
      expect(screen.getByText('00:00')).toBeInTheDocument(); // Should not show negative time
    });

    it('should handle very large time values', () => {
      render(<TimerDisplay {...defaultProps} timeRemaining={3661} />); // 1 hour, 1 minute, 1 second
      expect(screen.getByText('61:01')).toBeInTheDocument(); // Should handle hours as minutes
    });
  });
});