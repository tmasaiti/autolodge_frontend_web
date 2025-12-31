/**
 * React Hook for Performance Monitoring
 * Provides easy integration of performance monitoring in React components
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { performanceMonitor, WebVitalsMetrics, PerformanceMetric } from '../utils/performance-monitoring';

interface UsePerformanceMonitoringOptions {
  trackComponentRender?: boolean;
  trackUserInteractions?: boolean;
  reportInterval?: number;
}

interface PerformanceHookReturn {
  webVitals: WebVitalsMetrics;
  metrics: PerformanceMetric[];
  startMeasure: (name: string) => void;
  endMeasure: (name: string) => void;
  measureRender: (componentName: string, renderFn: () => void) => void;
  getPerformanceSummary: () => any;
}

export function usePerformanceMonitoring(
  componentName?: string,
  options: UsePerformanceMonitoringOptions = {}
): PerformanceHookReturn {
  const {
    trackComponentRender = false,
    trackUserInteractions = false,
    reportInterval = 5000
  } = options;

  const [webVitals, setWebVitals] = useState<WebVitalsMetrics>({});
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const renderStartTime = useRef<number>();
  const mountTime = useRef<number>(Date.now());

  // Track component mount and unmount
  useEffect(() => {
    if (componentName && trackComponentRender) {
      const mountDuration = Date.now() - mountTime.current;
      performanceMonitor['recordMetric'](`COMPONENT_MOUNT_${componentName.toUpperCase()}`, mountDuration);
    }

    return () => {
      if (componentName && trackComponentRender) {
        const unmountTime = Date.now() - mountTime.current;
        performanceMonitor['recordMetric'](`COMPONENT_LIFETIME_${componentName.toUpperCase()}`, unmountTime);
      }
    };
  }, [componentName, trackComponentRender]);

  // Track component renders
  useEffect(() => {
    if (componentName && trackComponentRender) {
      if (renderStartTime.current) {
        const renderDuration = performance.now() - renderStartTime.current;
        performanceMonitor['recordMetric'](`COMPONENT_RENDER_${componentName.toUpperCase()}`, renderDuration);
      }
      renderStartTime.current = performance.now();
    }
  });

  // Periodic updates of metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setWebVitals(performanceMonitor.getWebVitals());
      setMetrics(performanceMonitor.getMetrics());
    }, reportInterval);

    return () => clearInterval(interval);
  }, [reportInterval]);

  // Track user interactions if enabled
  useEffect(() => {
    if (!trackUserInteractions) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementName = target.tagName.toLowerCase();
      const className = target.className;
      const id = target.id;
      
      const interactionName = `click_${elementName}${id ? `_${id}` : ''}${className ? `_${className.split(' ')[0]}` : ''}`;
      performanceMonitor.startInteractionMeasure(interactionName);
      
      // End measure after a short delay to capture immediate response
      setTimeout(() => {
        performanceMonitor.endInteractionMeasure(interactionName);
      }, 100);
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const target = event.target as HTMLElement;
        const interactionName = `keypress_${target.tagName.toLowerCase()}_${event.key}`;
        performanceMonitor.startInteractionMeasure(interactionName);
        
        setTimeout(() => {
          performanceMonitor.endInteractionMeasure(interactionName);
        }, 100);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [trackUserInteractions]);

  const startMeasure = useCallback((name: string) => {
    performanceMonitor.startInteractionMeasure(name);
  }, []);

  const endMeasure = useCallback((name: string) => {
    performanceMonitor.endInteractionMeasure(name);
  }, []);

  const measureRender = useCallback((componentName: string, renderFn: () => void) => {
    performanceMonitor.measureComponentRender(componentName, renderFn);
  }, []);

  const getPerformanceSummary = useCallback(() => {
    return performanceMonitor.getPerformanceSummary();
  }, []);

  return {
    webVitals,
    metrics,
    startMeasure,
    endMeasure,
    measureRender,
    getPerformanceSummary
  };
}

/**
 * Hook for measuring async operations
 */
export function useAsyncPerformance() {
  const measureAsync = useCallback(async <T>(
    name: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await asyncFn();
      const duration = performance.now() - startTime;
      performanceMonitor['recordMetric'](`ASYNC_${name.toUpperCase()}`, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor['recordMetric'](`ASYNC_ERROR_${name.toUpperCase()}`, duration);
      throw error;
    }
  }, []);

  return { measureAsync };
}

/**
 * Hook for measuring API calls
 */
export function useApiPerformance() {
  const measureApiCall = useCallback(async <T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    const sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9]/g, '_');
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      performanceMonitor['recordMetric'](`API_${sanitizedEndpoint.toUpperCase()}`, duration);
      
      // Track API success rate
      performanceMonitor['recordMetric'](`API_SUCCESS_${sanitizedEndpoint.toUpperCase()}`, 1);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor['recordMetric'](`API_ERROR_${sanitizedEndpoint.toUpperCase()}`, duration);
      
      // Track API error rate
      performanceMonitor['recordMetric'](`API_FAILURE_${sanitizedEndpoint.toUpperCase()}`, 1);
      
      throw error;
    }
  }, []);

  return { measureApiCall };
}

/**
 * Hook for measuring route changes
 */
export function useRoutePerformance() {
  const [currentRoute, setCurrentRoute] = useState<string>('');
  const routeStartTime = useRef<number>();

  useEffect(() => {
    const newRoute = window.location.pathname;
    
    if (currentRoute && routeStartTime.current) {
      const navigationDuration = performance.now() - routeStartTime.current;
      const sanitizedRoute = currentRoute.replace(/[^a-zA-Z0-9]/g, '_');
      performanceMonitor['recordMetric'](`ROUTE_${sanitizedRoute.toUpperCase()}`, navigationDuration);
    }

    setCurrentRoute(newRoute);
    routeStartTime.current = performance.now();
  }, [currentRoute]);

  return { currentRoute };
}

/**
 * Hook for performance alerts
 */
export function usePerformanceAlerts() {
  const [alerts, setAlerts] = useState<Array<{
    type: string;
    message: string;
    timestamp: number;
    severity: 'warning' | 'error';
  }>>([]);

  useEffect(() => {
    const checkPerformance = () => {
      const summary = performanceMonitor.getPerformanceSummary();
      const newAlerts: typeof alerts = [];

      // Check Web Vitals
      summary.budgetStatus.forEach(status => {
        if (status.status === 'poor') {
          newAlerts.push({
            type: 'web_vital',
            message: `${status.metric} is poor: ${status.current}ms (budget: ${status.budget}ms)`,
            timestamp: Date.now(),
            severity: 'error'
          });
        } else if (status.status === 'warning') {
          newAlerts.push({
            type: 'web_vital',
            message: `${status.metric} needs improvement: ${status.current}ms (warning: ${status.warning}ms)`,
            timestamp: Date.now(),
            severity: 'warning'
          });
        }
      });

      // Check for long tasks
      if (summary.longTasks > 5) {
        newAlerts.push({
          type: 'long_task',
          message: `${summary.longTasks} long tasks detected. Consider code splitting or optimization.`,
          timestamp: Date.now(),
          severity: 'warning'
        });
      }

      // Check for slow resources
      if (summary.slowResources > 3) {
        newAlerts.push({
          type: 'slow_resource',
          message: `${summary.slowResources} slow resources detected. Consider optimization.`,
          timestamp: Date.now(),
          severity: 'warning'
        });
      }

      setAlerts(newAlerts);
    };

    const interval = setInterval(checkPerformance, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = useCallback((index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  }, []);

  return { alerts, dismissAlert };
}