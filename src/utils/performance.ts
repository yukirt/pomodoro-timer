// Performance monitoring utilities

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface RenderMetric {
  componentName: string;
  renderCount: number;
  totalTime: number;
  averageTime: number;
  lastRenderTime: number;
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>();
  private renderMetrics = new Map<string, RenderMetric>();
  private isEnabled = process.env.NODE_ENV === 'development';

  /**
   * Start measuring performance for a given operation
   */
  startMeasure(name: string): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now()
    });
  }

  /**
   * End measuring performance and calculate duration
   */
  endMeasure(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log slow operations
    if (duration > 16) { // More than one frame at 60fps
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure a function execution time
   */
  measureFunction<T>(name: string, fn: () => T): T {
    if (!this.isEnabled) return fn();

    this.startMeasure(name);
    try {
      const result = fn();
      return result;
    } finally {
      this.endMeasure(name);
    }
  }

  /**
   * Measure an async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) return fn();

    this.startMeasure(name);
    try {
      const result = await fn();
      return result;
    } finally {
      this.endMeasure(name);
    }
  }

  /**
   * Track component render performance
   */
  trackRender(componentName: string, renderTime: number): void {
    if (!this.isEnabled) return;

    const existing = this.renderMetrics.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.totalTime += renderTime;
      existing.averageTime = existing.totalTime / existing.renderCount;
      existing.lastRenderTime = renderTime;
    } else {
      this.renderMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        totalTime: renderTime,
        averageTime: renderTime,
        lastRenderTime: renderTime
      });
    }

    // Warn about slow renders
    if (renderTime > 16) {
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get all performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get render metrics for all components
   */
  getRenderMetrics(): RenderMetric[] {
    return Array.from(this.renderMetrics.values());
  }

  /**
   * Get render metrics for a specific component
   */
  getComponentRenderMetrics(componentName: string): RenderMetric | null {
    return this.renderMetrics.get(componentName) || null;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.renderMetrics.clear();
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (!this.isEnabled) return;

    console.group('Performance Summary');
    
    // Log operation metrics
    const operations = this.getMetrics().filter(m => m.duration !== undefined);
    if (operations.length > 0) {
      console.group('Operations');
      operations.forEach(metric => {
        console.log(`${metric.name}: ${metric.duration!.toFixed(2)}ms`);
      });
      console.groupEnd();
    }

    // Log render metrics
    const renders = this.getRenderMetrics();
    if (renders.length > 0) {
      console.group('Component Renders');
      renders.forEach(metric => {
        console.log(`${metric.componentName}: ${metric.renderCount} renders, avg ${metric.averageTime.toFixed(2)}ms`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if performance monitoring is enabled
   */
  isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component render time
export function useRenderPerformance(componentName: string) {
  if (!performanceMonitor.isMonitoringEnabled()) {
    return () => {}; // No-op if monitoring is disabled
  }

  const startTime = performance.now();
  
  return () => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.trackRender(componentName, renderTime);
  };
}

// Higher-order component for measuring render performance
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const PerformanceTrackedComponent = (props: P) => {
    const trackRender = useRenderPerformance(displayName);
    
    React.useEffect(() => {
      trackRender();
    });

    return React.createElement(WrappedComponent, props);
  };

  PerformanceTrackedComponent.displayName = `withPerformanceTracking(${displayName})`;
  
  return PerformanceTrackedComponent;
}

// Utility functions
export const measureOperation = (name: string, fn: () => void): void => {
  performanceMonitor.measureFunction(name, fn);
};

export const measureAsyncOperation = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  return performanceMonitor.measureAsyncFunction(name, fn);
};

export const logPerformanceSummary = (): void => {
  performanceMonitor.logSummary();
};

// Auto-log performance summary in development
if (process.env.NODE_ENV === 'development') {
  // Log summary every 30 seconds
  setInterval(() => {
    performanceMonitor.logSummary();
    performanceMonitor.clearMetrics(); // Clear to avoid memory buildup
  }, 30000);
}

export default performanceMonitor;