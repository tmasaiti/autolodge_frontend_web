// Performance monitoring and optimization utilities

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

// Web Vitals measurement
export function measureWebVitals(): Promise<Partial<PerformanceMetrics>> {
  return new Promise((resolve) => {
    const metrics: Partial<PerformanceMetrics> = {};

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.lcp = lastEntry.startTime;
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        metrics.fid = entry.processingStart - entry.startTime;
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      metrics.cls = clsValue;
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Time to First Byte
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    }

    // Resolve after a delay to collect metrics
    setTimeout(() => {
      resolve(metrics);
    }, 3000);
  });
}

// Resource performance analysis
export function analyzeResourcePerformance(): ResourceTiming[] {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return resources.map(resource => ({
    name: resource.name,
    duration: resource.duration,
    size: resource.transferSize || 0,
    type: getResourceType(resource.name)
  })).sort((a, b) => b.duration - a.duration);
}

function getResourceType(url: string): string {
  if (url.includes('.js')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
  if (url.includes('.woff') || url.includes('.ttf')) return 'font';
  if (url.includes('/api/')) return 'api';
  return 'other';
}

// Image lazy loading utility
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Bundle size analysis
export function analyzeBundleSize(): Promise<{ [key: string]: number }> {
  return new Promise((resolve) => {
    const bundleInfo: { [key: string]: number } = {};
    
    // Analyze loaded scripts
    const scripts = document.querySelectorAll('script[src]');
    let loadedScripts = 0;
    
    scripts.forEach((script: any) => {
      fetch(script.src, { method: 'HEAD' })
        .then(response => {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            bundleInfo[script.src] = parseInt(contentLength, 10);
          }
        })
        .finally(() => {
          loadedScripts++;
          if (loadedScripts === scripts.length) {
            resolve(bundleInfo);
          }
        });
    });

    if (scripts.length === 0) {
      resolve(bundleInfo);
    }
  });
}

// Memory usage monitoring
export function getMemoryUsage(): any {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
}

// Performance budget checker
export interface PerformanceBudget {
  fcp: number; // milliseconds
  lcp: number; // milliseconds
  fid: number; // milliseconds
  cls: number; // score
  bundleSize: number; // bytes
}

export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  fcp: 1800, // 1.8s
  lcp: 2500, // 2.5s
  fid: 100,  // 100ms
  cls: 0.1,  // 0.1 score
  bundleSize: 1024 * 1024 // 1MB
};

export function checkPerformanceBudget(
  metrics: Partial<PerformanceMetrics>,
  budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET
): { [key: string]: { value: number; budget: number; passed: boolean } } {
  const results: any = {};

  if (metrics.fcp !== undefined) {
    results.fcp = {
      value: metrics.fcp,
      budget: budget.fcp,
      passed: metrics.fcp <= budget.fcp
    };
  }

  if (metrics.lcp !== undefined) {
    results.lcp = {
      value: metrics.lcp,
      budget: budget.lcp,
      passed: metrics.lcp <= budget.lcp
    };
  }

  if (metrics.fid !== undefined) {
    results.fid = {
      value: metrics.fid,
      budget: budget.fid,
      passed: metrics.fid <= budget.fid
    };
  }

  if (metrics.cls !== undefined) {
    results.cls = {
      value: metrics.cls,
      budget: budget.cls,
      passed: metrics.cls <= budget.cls
    };
  }

  return results;
}

// Critical resource preloading
export function preloadCriticalResources(resources: string[]): void {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    
    if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.match(/\.(woff2?|ttf|otf)$/)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
      link.as = 'image';
    }
    
    document.head.appendChild(link);
  });
}

// Code splitting utility
export function loadComponentAsync<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
): React.LazyExoticComponent<T> {
  const LazyComponent = React.lazy(importFn);
  
  if (fallback) {
    return React.lazy(() => 
      importFn().catch(() => ({ default: fallback as T }))
    ) as React.LazyExoticComponent<T>;
  }
  
  return LazyComponent;
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = React.useState<Partial<PerformanceMetrics>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    measureWebVitals().then(measuredMetrics => {
      setMetrics(measuredMetrics);
      setIsLoading(false);
    });
  }, []);

  return { metrics, isLoading };
}

// Import React for the lazy loading utility
import React from 'react';