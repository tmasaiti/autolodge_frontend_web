/**
 * Performance Monitoring Utilities
 * Implements Core Web Vitals monitoring and performance budgets
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

interface PerformanceBudget {
  metric: string;
  budget: number;
  warning: number;
}

interface WebVitalsMetrics {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private budgets: PerformanceBudget[] = [];
  private observers: PerformanceObserver[] = [];
  private webVitals: WebVitalsMetrics = {};

  constructor() {
    this.initializeBudgets();
    this.initializeObservers();
  }

  /**
   * Initialize performance budgets
   */
  private initializeBudgets() {
    this.budgets = [
      { metric: 'LCP', budget: 2500, warning: 2000 }, // Good: <2.5s, Needs Improvement: 2.5s-4s
      { metric: 'FID', budget: 100, warning: 75 },    // Good: <100ms, Needs Improvement: 100ms-300ms
      { metric: 'CLS', budget: 0.1, warning: 0.05 },  // Good: <0.1, Needs Improvement: 0.1-0.25
      { metric: 'FCP', budget: 1800, warning: 1500 }, // Good: <1.8s, Needs Improvement: 1.8s-3s
      { metric: 'TTFB', budget: 600, warning: 400 },  // Good: <600ms
      { metric: 'INP', budget: 200, warning: 150 }    // Good: <200ms
    ];
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // First Input Delay (FID) and Interaction to Next Paint (INP)
    this.observeInputDelay();

    // Cumulative Layout Shift (CLS)
    this.observeLayoutShift();

    // First Contentful Paint (FCP)
    this.observePaint();

    // Navigation timing for TTFB
    this.observeNavigation();

    // Long tasks
    this.observeLongTasks();

    // Resource timing
    this.observeResources();
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;
      
      this.webVitals.LCP = lastEntry.startTime;
      this.recordMetric('LCP', lastEntry.startTime);
      this.checkBudget('LCP', lastEntry.startTime);
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('LCP observer not supported');
    }
  }

  /**
   * Observe First Input Delay and Interaction to Next Paint
   */
  private observeInputDelay() {
    if (!('PerformanceObserver' in window)) return;

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.webVitals.FID = entry.processingStart - entry.startTime;
        this.recordMetric('FID', entry.processingStart - entry.startTime);
        this.checkBudget('FID', entry.processingStart - entry.startTime);
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Interaction to Next Paint (newer metric)
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.interactionId) {
          const inp = entry.processingEnd - entry.startTime;
          this.webVitals.INP = Math.max(this.webVitals.INP || 0, inp);
          this.recordMetric('INP', inp);
          this.checkBudget('INP', inp);
        }
      });
    });

    try {
      inpObserver.observe({ entryTypes: ['event'] });
      this.observers.push(inpObserver);
    } catch (e) {
      console.warn('INP observer not supported');
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeLayoutShift() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (sessionValue && 
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            this.webVitals.CLS = clsValue;
            this.recordMetric('CLS', clsValue);
            this.checkBudget('CLS', clsValue);
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  }

  /**
   * Observe paint metrics
   */
  private observePaint() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.webVitals.FCP = entry.startTime;
          this.recordMetric('FCP', entry.startTime);
          this.checkBudget('FCP', entry.startTime);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Paint observer not supported');
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigation() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceNavigationTiming[]) {
        const ttfb = entry.responseStart - entry.requestStart;
        this.webVitals.TTFB = ttfb;
        this.recordMetric('TTFB', ttfb);
        this.checkBudget('TTFB', ttfb);

        // Additional navigation metrics
        this.recordMetric('DOM_CONTENT_LOADED', entry.domContentLoadedEventEnd - entry.navigationStart);
        this.recordMetric('LOAD_COMPLETE', entry.loadEventEnd - entry.navigationStart);
        this.recordMetric('DNS_LOOKUP', entry.domainLookupEnd - entry.domainLookupStart);
        this.recordMetric('TCP_CONNECT', entry.connectEnd - entry.connectStart);
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Navigation observer not supported');
    }
  }

  /**
   * Observe long tasks
   */
  private observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('LONG_TASK', entry.duration);
        
        if (entry.duration > 50) {
          console.warn(`Long task detected: ${entry.duration}ms`);
          this.reportPerformanceIssue('LONG_TASK', entry.duration);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Long task observer not supported');
    }
  }

  /**
   * Observe resource loading
   */
  private observeResources() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        const duration = entry.responseEnd - entry.startTime;
        
        // Track different resource types
        this.recordMetric(`RESOURCE_${entry.initiatorType.toUpperCase()}`, duration);
        
        // Check for slow resources
        if (duration > 1000) {
          console.warn(`Slow resource: ${entry.name} (${duration}ms)`);
          this.reportPerformanceIssue('SLOW_RESOURCE', duration, entry.name);
        }

        // Track resource sizes
        if (entry.transferSize) {
          this.recordMetric(`SIZE_${entry.initiatorType.toUpperCase()}`, entry.transferSize);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Resource observer not supported');
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, value: number, url?: string) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: url || window.location.href,
      userAgent: navigator.userAgent
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Send to analytics if configured
    this.sendToAnalytics(metric);
  }

  /**
   * Check if metric exceeds budget
   */
  private checkBudget(metricName: string, value: number) {
    const budget = this.budgets.find(b => b.metric === metricName);
    if (!budget) return;

    if (value > budget.budget) {
      console.error(`Performance budget exceeded for ${metricName}: ${value} > ${budget.budget}`);
      this.reportPerformanceIssue('BUDGET_EXCEEDED', value, metricName);
    } else if (value > budget.warning) {
      console.warn(`Performance warning for ${metricName}: ${value} > ${budget.warning}`);
    }
  }

  /**
   * Report performance issue
   */
  private reportPerformanceIssue(type: string, value: number, details?: string) {
    const issue = {
      type,
      value,
      details,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      webVitals: { ...this.webVitals }
    };

    // Send to error reporting service
    console.error('Performance issue:', issue);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorReporting(issue);
    }
  }

  /**
   * Send metric to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetric) {
    // In production, send to analytics service like Google Analytics, DataDog, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: gtag('event', 'performance_metric', { metric_name: metric.name, value: metric.value });
    }
  }

  /**
   * Send to error reporting service
   */
  private sendToErrorReporting(issue: any) {
    // In production, send to error reporting service like Sentry, Bugsnag, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(new Error(`Performance issue: ${issue.type}`), { extra: issue });
    }
  }

  /**
   * Get current Web Vitals
   */
  public getWebVitals(): WebVitalsMetrics {
    return { ...this.webVitals };
  }

  /**
   * Get all recorded metrics
   */
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary() {
    const summary = {
      webVitals: this.webVitals,
      budgetStatus: this.budgets.map(budget => ({
        metric: budget.metric,
        budget: budget.budget,
        warning: budget.warning,
        current: this.webVitals[budget.metric as keyof WebVitalsMetrics] || 0,
        status: this.getBudgetStatus(budget.metric)
      })),
      resourceCounts: this.getResourceCounts(),
      longTasks: this.getMetricsByName('LONG_TASK').length,
      slowResources: this.metrics.filter(m => m.name.startsWith('RESOURCE_') && m.value > 1000).length
    };

    return summary;
  }

  /**
   * Get budget status for a metric
   */
  private getBudgetStatus(metricName: string): 'good' | 'warning' | 'poor' | 'unknown' {
    const budget = this.budgets.find(b => b.metric === metricName);
    const value = this.webVitals[metricName as keyof WebVitalsMetrics];

    if (!budget || value === undefined) return 'unknown';

    if (value <= budget.warning) return 'good';
    if (value <= budget.budget) return 'warning';
    return 'poor';
  }

  /**
   * Get resource loading counts by type
   */
  private getResourceCounts() {
    const counts: Record<string, number> = {};
    
    this.metrics.forEach(metric => {
      if (metric.name.startsWith('RESOURCE_')) {
        const type = metric.name.replace('RESOURCE_', '');
        counts[type] = (counts[type] || 0) + 1;
      }
    });

    return counts;
  }

  /**
   * Start monitoring a specific user interaction
   */
  public startInteractionMeasure(name: string) {
    performance.mark(`${name}-start`);
  }

  /**
   * End monitoring a specific user interaction
   */
  public endInteractionMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    if (measure) {
      this.recordMetric(`INTERACTION_${name.toUpperCase()}`, measure.duration);
    }
  }

  /**
   * Measure component render time
   */
  public measureComponentRender(componentName: string, renderFn: () => void) {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    this.recordMetric(`COMPONENT_RENDER_${componentName.toUpperCase()}`, endTime - startTime);
  }

  /**
   * Clean up observers
   */
  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types
export type { PerformanceMetric, PerformanceBudget, WebVitalsMetrics };