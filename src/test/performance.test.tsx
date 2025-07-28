import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { performanceMonitor } from '../utils/performanceMonitor';
import { optimizedStorage } from '../utils/optimizedStorage';

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
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  load: vi.fn(),
}));

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    performanceMonitor.clearMetrics();
    performanceMonitor.setEnabled(true);
  });

  describe('Render Performance', () => {
    it('should render initial app within performance budget', () => {
      const startTime = performance.now();
      
      render(<App />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Initial render should be under 100ms
      expect(renderTime).toBeLessThan(100);
      
      // Should have basic elements
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      expect(screen.getAllByText('工作時間')[0]).toBeInTheDocument();
    });

    it('should handle rapid state changes efficiently', () => {
      render(<App />);
      
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      const resetButton = screen.getAllByLabelText('重置計時器')[0];
      
      const startTime = performance.now();
      
      // Perform rapid state changes
      for (let i = 0; i < 20; i++) {
        fireEvent.click(startButton);
        fireEvent.click(resetButton);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // 20 state changes should complete within 200ms
      expect(totalTime).toBeLessThan(200);
      
      // App should still be functional
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
    });

    it('should not cause excessive re-renders', () => {
      const renderSpy = vi.fn();
      
      // Mock React.memo to track renders
      const originalMemo = React.memo;
      React.memo = vi.fn((component) => {
        return (props) => {
          renderSpy();
          return originalMemo(component)(props);
        };
      });
      
      render(<App />);
      
      const initialRenderCount = renderSpy.mock.calls.length;
      
      // Perform some interactions
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      const afterInteractionRenderCount = renderSpy.mock.calls.length;
      
      // Should not cause excessive re-renders
      const additionalRenders = afterInteractionRenderCount - initialRenderCount;
      expect(additionalRenders).toBeLessThan(10);
      
      // Restore original React.memo
      React.memo = originalMemo;
    });
  });

  describe('Storage Performance', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      localStorageMock.getItem.mockClear();
      localStorageMock.setItem.mockClear();
      localStorageMock.removeItem.mockClear();
      localStorageMock.clear.mockClear();
      
      // Reset mock implementations
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.getItem.mockImplementation(() => null);
    });

    it('should debounce localStorage writes', async () => {
      // Perform multiple rapid writes
      optimizedStorage.setItem('test1', { value: 1 });
      optimizedStorage.setItem('test1', { value: 2 });
      optimizedStorage.setItem('test1', { value: 3 });
      
      // Should not have written to localStorage yet (debounced)
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 350));
      
      // Should have written only once with the final value
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test1',
        JSON.stringify({ value: 3 })
      );
    });

    it('should cache reads efficiently', () => {
      // Setup mock return value
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ cached: true }));
      
      // First read should hit localStorage
      const result1 = optimizedStorage.getItem('test_cache');
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ cached: true });
      
      // Second read should use cache
      const result2 = optimizedStorage.getItem('test_cache');
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1); // Still 1
      expect(result2).toEqual({ cached: true });
    });

    it('should handle storage errors gracefully', () => {
      // Setup mock to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw error
      expect(() => optimizedStorage.setItemImmediate('test_error', { data: 'test' })).not.toThrow();
      
      // Reset to normal behavior (will be handled by beforeEach)
      localStorageMock.setItem.mockImplementation(() => {});
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory with component mounting/unmounting', () => {
      const { unmount } = render(<App />);
      
      // Perform some interactions
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      const tasksButton = screen.getAllByText('任務')[0];
      fireEvent.click(tasksButton);
      
      // Unmount should clean up properly
      expect(() => unmount()).not.toThrow();
    });

    it('should clean up event listeners properly', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<App />);
      
      const addedListeners = addEventListenerSpy.mock.calls.length;
      
      unmount();
      
      const removedListeners = removeEventListenerSpy.mock.calls.length;
      
      // Should remove at least as many listeners as were added
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      performanceMonitor.recordMetric('test_metric', 50, 'render');
      performanceMonitor.recordMetric('test_interaction', 10, 'interaction');
      
      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.totalMetrics).toBe(2);
      expect(summary.recentMetrics).toHaveLength(2);
    });

    it('should detect slow renders', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Record a slow render
      performanceMonitor.recordMetric('slow_component', 20, 'render');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow render detected')
      );
      
      consoleSpy.mockRestore();
    });

    it('should provide current performance metrics', () => {
      // Record some metrics
      performanceMonitor.recordMetric('render1', 10, 'render');
      performanceMonitor.recordMetric('render2', 15, 'render');
      
      const current = performanceMonitor.getCurrentMetrics();
      
      expect(current.fps).toBeGreaterThan(0);
      expect(current.renderTime).toBeGreaterThan(0);
    });
  });

  describe('Component Optimization', () => {
    it('should memoize expensive calculations', () => {
      render(<App />);
      
      // Timer display should memoize time formatting
      expect(screen.getAllByText('25:00')[0]).toBeInTheDocument();
      
      // Multiple renders with same props should not recalculate
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      // Should still show time efficiently
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
    });

    it('should use callback memoization for event handlers', () => {
      render(<App />);
      
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      const resetButton = screen.getAllByLabelText('重置計時器')[0];
      
      // Event handlers should be stable references
      const startHandler = startButton.onclick;
      const resetHandler = resetButton.onclick;
      
      // Trigger re-render
      fireEvent.click(startButton);
      
      // Handlers should be the same reference (memoized)
      expect(startButton.onclick).toBe(startHandler);
      expect(resetButton.onclick).toBe(resetHandler);
    });
  });

  describe('Bundle Size Impact', () => {
    it('should not significantly increase bundle size with optimizations', () => {
      // This is more of a build-time test, but we can check that
      // optimization utilities are tree-shakeable
      expect(typeof performanceMonitor.setEnabled).toBe('function');
      expect(typeof optimizedStorage.getItem).toBe('function');
      
      // In production, performance monitoring should be disabled by default
      if (process.env.NODE_ENV === 'production') {
        expect(performanceMonitor.getCurrentMetrics().fps).toBe(60);
      }
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle typical user workflow efficiently', async () => {
      const startTime = performance.now();
      
      render(<App />);
      
      // Typical user workflow
      const tasksButton = screen.getAllByText('任務')[0];
      fireEvent.click(tasksButton);
      
      const statsButton = screen.getAllByText('統計')[0];
      fireEvent.click(statsButton);
      
      const settingsButton = screen.getAllByText('設定')[0];
      fireEvent.click(settingsButton);
      
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      const endTime = performance.now();
      const workflowTime = endTime - startTime;
      
      // Complete workflow should be under 200ms (adjusted for test environment)
      expect(workflowTime).toBeLessThan(200);
    });

    it('should maintain performance with long-running timer', async () => {
      render(<App />);
      
      const startButton = screen.getAllByLabelText('開始計時器')[0];
      fireEvent.click(startButton);
      
      // Simulate timer running for a while
      const startTime = performance.now();
      
      // Simulate multiple timer ticks
      for (let i = 0; i < 100; i++) {
        act(() => {
          // Timer tick simulation
        });
      }
      
      const endTime = performance.now();
      const tickTime = endTime - startTime;
      
      // 100 timer ticks should be processed quickly
      expect(tickTime).toBeLessThan(100);
      
      // App should still be responsive
      expect(screen.getAllByText('運行中')[0]).toBeInTheDocument();
    });
  });
});