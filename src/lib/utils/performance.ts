// Performance monitoring and optimization utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page-load', navEntry.loadEventEnd - navEntry.fetchStart);
            this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
          }
        });
      });

      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric(`resource-${resourceEntry.initiatorType}`, resourceEntry.duration);
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Monitor LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric('lcp', entry.startTime);
        });
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Monitor FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          this.recordMetric('fid', fidEntry.processingStart - fidEntry.startTime);
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    }
  }

  public recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  public getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  }

  public getAllMetrics() {
    const result: Record<string, any> = {};
    this.metrics.forEach((_, name) => {
      result[name] = this.getMetrics(name);
    });
    return result;
  }

  public startTimer(name: string) {
    performance.mark(`${name}-start`);
    return {
      end: () => {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        this.recordMetric(name, measure.duration);
        
        // Cleanup marks and measures
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
      }
    };
  }

  public measureComponent(componentName: string) {
    return {
      render: this.startTimer(`${componentName}-render`),
      mount: this.startTimer(`${componentName}-mount`),
      update: this.startTimer(`${componentName}-update`)
    };
  }

  public dispose() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();

  const measureRender = () => monitor.startTimer(`${componentName}-render`);
  const measureUpdate = () => monitor.startTimer(`${componentName}-update`);
  const measureAsync = (operation: string) => monitor.startTimer(`${componentName}-${operation}`);

  return {
    measureRender,
    measureUpdate,
    measureAsync,
    getMetrics: (metricName?: string) => metricName ? monitor.getMetrics(metricName) : monitor.getAllMetrics()
  };
}

// Lazy loading utility
export function createLazyComponent<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(factory);
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => (
    <React.Suspense fallback={fallback ? React.createElement(fallback) : <div>Loading...</div>}>
      <LazyComponent {...props} ref={ref} />
    </React.Suspense>
  ));
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return null;

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const scripts = entries.filter(entry => entry.name.endsWith('.js'));
  const styles = entries.filter(entry => entry.name.endsWith('.css'));

  return {
    scripts: {
      count: scripts.length,
      totalSize: scripts.reduce((sum, script) => sum + (script.transferSize || 0), 0),
      avgSize: scripts.length > 0 ? scripts.reduce((sum, script) => sum + (script.transferSize || 0), 0) / scripts.length : 0
    },
    styles: {
      count: styles.length,
      totalSize: styles.reduce((sum, style) => sum + (style.transferSize || 0), 0),
      avgSize: styles.length > 0 ? styles.reduce((sum, style) => sum + (style.transferSize || 0), 0) / styles.length : 0
    }
  };
}

// React import for lazy loading
import React from 'react';