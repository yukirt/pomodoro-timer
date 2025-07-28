import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TimerControls from './TimerControls';

describe('TimerControls', () => {
  const mockOnStart = vi.fn();
  const mockOnPause = vi.fn();
  const mockOnReset = vi.fn();

  const defaultProps = {
    isRunning: false,
    onStart: mockOnStart,
    onPause: mockOnPause,
    onReset: mockOnReset
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('keydown', expect.any(Function));
  });

  describe('Button Rendering', () => {
    it('should render start button when timer is not running', () => {
      render(<TimerControls {...defaultProps} isRunning={false} />);
      expect(screen.getByText('開始')).toBeInTheDocument();
      expect(screen.getByLabelText('開始計時器')).toBeInTheDocument();
    });

    it('should render pause button when timer is running', () => {
      render(<TimerControls {...defaultProps} isRunning={true} />);
      expect(screen.getByText('暫停')).toBeInTheDocument();
      expect(screen.getByLabelText('暫停計時器')).toBeInTheDocument();
    });

    it('should always render reset button', () => {
      render(<TimerControls {...defaultProps} />);
      expect(screen.getByText('重置')).toBeInTheDocument();
      expect(screen.getByLabelText('重置計時器')).toBeInTheDocument();
    });

    it('should render button icons', () => {
      render(<TimerControls {...defaultProps} isRunning={false} />);
      expect(screen.getByText('▶️')).toBeInTheDocument();
      expect(screen.getByText('🔄')).toBeInTheDocument();
    });

    it('should render pause icon when running', () => {
      render(<TimerControls {...defaultProps} isRunning={true} />);
      expect(screen.getByText('⏸️')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onStart when start button is clicked', () => {
      render(<TimerControls {...defaultProps} isRunning={false} />);
      const startButton = screen.getByText('開始');
      fireEvent.click(startButton);
      expect(mockOnStart).toHaveBeenCalledTimes(1);
      expect(mockOnPause).not.toHaveBeenCalled();
    });

    it('should call onPause when pause button is clicked', () => {
      render(<TimerControls {...defaultProps} isRunning={true} />);
      const pauseButton = screen.getByText('暫停');
      fireEvent.click(pauseButton);
      expect(mockOnPause).toHaveBeenCalledTimes(1);
      expect(mockOnStart).not.toHaveBeenCalled();
    });

    it('should call onReset when reset button is clicked', () => {
      render(<TimerControls {...defaultProps} />);
      const resetButton = screen.getByText('重置');
      fireEvent.click(resetButton);
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply primary class to start/pause button', () => {
      render(<TimerControls {...defaultProps} />);
      const startButton = screen.getByText('開始').closest('button');
      expect(startButton).toHaveClass('control-button', 'primary');
    });

    it('should apply secondary class to reset button', () => {
      render(<TimerControls {...defaultProps} />);
      const resetButton = screen.getByText('重置').closest('button');
      expect(resetButton).toHaveClass('control-button', 'secondary');
    });

    it('should have proper container structure', () => {
      const { container } = render(<TimerControls {...defaultProps} />);
      expect(container.querySelector('.timer-controls')).toBeInTheDocument();
      expect(container.querySelector('.control-buttons')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should show keyboard shortcuts hint by default', () => {
      render(<TimerControls {...defaultProps} />);
      expect(screen.getByText(/快捷鍵:/)).toBeInTheDocument();
    });

    it('should hide keyboard shortcuts hint when disabled', () => {
      render(<TimerControls {...defaultProps} enableKeyboardShortcuts={false} />);
      expect(screen.queryByText(/快捷鍵:/)).not.toBeInTheDocument();
    });

    it('should call onStart when spacebar is pressed and timer is not running', () => {
      render(<TimerControls {...defaultProps} isRunning={false} />);
      fireEvent.keyDown(document, { key: ' ' });
      expect(mockOnStart).toHaveBeenCalledTimes(1);
    });

    it('should call onPause when spacebar is pressed and timer is running', () => {
      render(<TimerControls {...defaultProps} isRunning={true} />);
      fireEvent.keyDown(document, { key: ' ' });
      expect(mockOnPause).toHaveBeenCalledTimes(1);
    });

    it('should call onStart when Enter is pressed and timer is not running', () => {
      render(<TimerControls {...defaultProps} isRunning={false} />);
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(mockOnStart).toHaveBeenCalledTimes(1);
    });

    it('should call onPause when Enter is pressed and timer is running', () => {
      render(<TimerControls {...defaultProps} isRunning={true} />);
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(mockOnPause).toHaveBeenCalledTimes(1);
    });

    it('should call onReset when R key is pressed', () => {
      render(<TimerControls {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'r' });
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('should call onReset when Escape key is pressed', () => {
      render(<TimerControls {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('should handle uppercase R key', () => {
      render(<TimerControls {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'R' });
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('should not trigger shortcuts when disabled', () => {
      render(<TimerControls {...defaultProps} enableKeyboardShortcuts={false} />);
      fireEvent.keyDown(document, { key: ' ' });
      fireEvent.keyDown(document, { key: 'r' });
      expect(mockOnStart).not.toHaveBeenCalled();
      expect(mockOnReset).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts when typing in input field', () => {
      const { container } = render(
        <div>
          <input type="text" />
          <TimerControls {...defaultProps} />
        </div>
      );
      
      const input = container.querySelector('input') as HTMLInputElement;
      input.focus();
      
      fireEvent.keyDown(input, { key: ' ' });
      fireEvent.keyDown(input, { key: 'r' });
      
      expect(mockOnStart).not.toHaveBeenCalled();
      expect(mockOnReset).not.toHaveBeenCalled();
    });

    it('should not interfere with Ctrl+R (browser refresh)', () => {
      render(<TimerControls {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'r', ctrlKey: true });
      expect(mockOnReset).not.toHaveBeenCalled();
    });

    it('should not interfere with Cmd+R (browser refresh on Mac)', () => {
      render(<TimerControls {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'r', metaKey: true });
      expect(mockOnReset).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TimerControls {...defaultProps} isRunning={false} />);
      expect(screen.getByLabelText('開始計時器')).toBeInTheDocument();
      expect(screen.getByLabelText('重置計時器')).toBeInTheDocument();
    });

    it('should have proper ARIA labels when running', () => {
      render(<TimerControls {...defaultProps} isRunning={true} />);
      expect(screen.getByLabelText('暫停計時器')).toBeInTheDocument();
      expect(screen.getByLabelText('重置計時器')).toBeInTheDocument();
    });

    it('should have proper title attributes for tooltips', () => {
      render(<TimerControls {...defaultProps} isRunning={false} />);
      expect(screen.getByTitle('開始 (空格鍵或Enter)')).toBeInTheDocument();
      expect(screen.getByTitle('重置 (R鍵或Esc)')).toBeInTheDocument();
    });

    it('should update title when timer state changes', () => {
      const { rerender } = render(<TimerControls {...defaultProps} isRunning={false} />);
      expect(screen.getByTitle('開始 (空格鍵或Enter)')).toBeInTheDocument();
      
      rerender(<TimerControls {...defaultProps} isRunning={true} />);
      expect(screen.getByTitle('暫停 (空格鍵或Enter)')).toBeInTheDocument();
    });
  });

  describe('Event Cleanup', () => {
    it('should clean up event listeners when component unmounts', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const { unmount } = render(<TimerControls {...defaultProps} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('should not add event listeners when keyboard shortcuts are disabled', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      render(<TimerControls {...defaultProps} enableKeyboardShortcuts={false} />);
      
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', () => {
      render(<TimerControls {...defaultProps} isRunning={false} />);
      const startButton = screen.getByText('開始');
      
      // Simulate rapid clicking
      fireEvent.click(startButton);
      fireEvent.click(startButton);
      fireEvent.click(startButton);
      
      expect(mockOnStart).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid keyboard shortcuts', () => {
      render(<TimerControls {...defaultProps} isRunning={false} />);
      
      // Simulate rapid key presses
      fireEvent.keyDown(document, { key: ' ' });
      fireEvent.keyDown(document, { key: ' ' });
      fireEvent.keyDown(document, { key: ' ' });
      
      expect(mockOnStart).toHaveBeenCalledTimes(3);
    });

    it('should handle unknown key presses gracefully', () => {
      render(<TimerControls {...defaultProps} />);
      
      // Should not crash or call any handlers
      fireEvent.keyDown(document, { key: 'x' });
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'Shift' });
      
      expect(mockOnStart).not.toHaveBeenCalled();
      expect(mockOnPause).not.toHaveBeenCalled();
      expect(mockOnReset).not.toHaveBeenCalled();
    });
  });
});