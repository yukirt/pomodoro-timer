/**
 * Performance monitoring utility for the Pomodoro Timer app
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'render' | 'interaction' | 'storage' | 'memory';
}

interface ComponentRenderInfo {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private renderTimes: Map<string, number[]> = new Map();
  private componentRenders: Map<string, ComponentRenderInfo> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, type: PerformanceMetric['type'] = 'interaction'): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log significant performance issues
    if (type === 'render' && value > 16) { // > 16ms render time
      console.warn(`Slow render detected: ${name} took ${value.toFixed(2)}ms`);
    }
  }

  /**
   * Start timing an operation
   */
  startTiming(name: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMetric(name, duration, 'interaction');
    };
  }

  /**
   * Time a component render
   */
  timeComponentRender(componentName: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric(`${componentName}_render`, duration, 'render');
      this.updateComponentRenderInfo(componentName, duration);
    };
  }

  /**
   * Update component render information
   */
  private updateComponentRenderInfo(componentName: string, renderTime: number): void {
    const existing = this.componentRenders.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += renderTime;
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.lastRenderTime = renderTime;
    } else {
      this.componentRenders.set(componentName, {
        componentName,
        renderCount: 1,
        totalRenderTime: renderTime,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime
      });
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): void {
    if (!this.isEnabled || !('memory' in performance)) return;

    const memory = (performance as any).memory;
    this.recordMetric('memory_used', memory.usedJSHeapSize, 'memory');
    this.recordMetric('memory_total', memory.totalJSHeapSize, 'memory');
    this.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'memory');
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalMetrics: number;
    averageRenderTime: number;
    slowRenders: number;
    componentRenders: ComponentRenderInfo[];
    recentMetrics: PerformanceMetric[];
  } {
    const renderMetrics = this.metrics.filter(m => m.type === 'render');
    const averageRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length 
      : 0;
    
    const slowRenders = renderMetrics.filter(m => m.value > 16).length;
    const recentMetrics = this.metrics.slice(-50);
    const componentRenders = Array.from(this.componentRenders.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime);

    return {
      totalMetrics: this.metrics.length,
      averageRenderTime,
      slowRenders,
      componentRenders,
      recentMetrics
    };
  }

  /**
   * Log performance summary to console
   */
  logPerformanceSummary(): void {
    if (!this.isEnabled) return;

    const summary = this.getPerformanceSummary();
    
    console.group('🚀 Performance Summary');
    console.log(`Total metrics recorded: ${summary.totalMetrics}`);
    console.log(`Average render time: ${summary.averageRenderTime.toFixed(2)}ms`);
    console.log(`Slow renders (>16ms): ${summary.slowRenders}`);
    
    if (summary.componentRenders.length > 0) {
      console.group('Component Render Performance');
      summary.componentRenders.forEach(comp => {
        console.log(`${comp.componentName}: ${comp.renderCount} renders, avg ${comp.averageRenderTime.toFixed(2)}ms`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.renderTimes.clear();
    this.componentRenders.clear();
  }

  /**
   * Monitor React component performance
   */
  wrapComponent<P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
  ): React.ComponentType<P> {
    if (!this.isEnabled) return Component;

    return (props: P) => {
      const endTiming = this.timeComponentRender(componentName);
      
      React.useEffect(() => {
        endTiming();
      });

      return React.createElement(Component, props);
    };
  }

  /**
   * Monitor localStorage operations
   */
  monitorStorageOperation<T>(operation: () => T, operationName: string): T {
    if (!this.isEnabled) return operation();

    const endTiming = this.startTiming(`storage_${operationName}`);
    try {
      const result = operation();
      endTiming();
      return result;
    } catch (error) {
      endTiming();
      this.recordMetric(`storage_error_${operationName}`, 1, 'storage');
      throw error;
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): {
    fps: number;
    memoryUsage: number;
    renderTime: number;
  } {
    const recentRenders = this.metrics
      .filter(m => m.type === 'render' && Date.now() - m.timestamp < 1000)
      .map(m => m.value);

    const fps = recentRenders.length > 0 ? Math.min(60, 1000 / (recentRenders.reduce((a, b) => a + b, 0) / recentRenders.length)) : 60;
    
    const memoryMetrics = this.metrics.filter(m => m.name === 'memory_used');
    const memoryUsage = memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1].value : 0;
    
    const renderTime = recentRenders.length > 0 ? recentRenders.reduce((a, b) => a + b, 0) / recentRenders.length : 0;

    return { fps, memoryUsage, renderTime };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-record memory usage periodically in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    performanceMonitor.recordMemoryUsage();
  }, 5000); // Every 5 seconds

  // Log summary on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.logPerformanceSummary();
  });
}

export default performanceMonitor;