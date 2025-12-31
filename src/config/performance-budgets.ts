/**
 * Performance Budget Configuration
 * Defines performance thresholds and budgets for the application
 */

export interface PerformanceBudgetConfig {
  // Core Web Vitals budgets (in milliseconds, except CLS)
  webVitals: {
    LCP: { good: number; warning: number; poor: number };
    FID: { good: number; warning: number; poor: number };
    CLS: { good: number; warning: number; poor: number };
    FCP: { good: number; warning: number; poor: number };
    TTFB: { good: number; warning: number; poor: number };
    INP: { good: number; warning: number; poor: number };
  };

  // Resource budgets (in bytes)
  resources: {
    totalJavaScript: number;
    totalCSS: number;
    totalImages: number;
    totalFonts: number;
    totalHTML: number;
  };

  // Network budgets (in milliseconds)
  network: {
    maxRequestDuration: number;
    maxLongTaskDuration: number;
    maxMemoryUsage: number; // in MB
  };

  // Page-specific budgets
  pages: {
    [pageName: string]: {
      loadTime: number;
      interactionTime: number;
      renderTime: number;
    };
  };
}

export const PERFORMANCE_BUDGETS: PerformanceBudgetConfig = {
  webVitals: {
    // Largest Contentful Paint
    LCP: {
      good: 2500,    // Good: ≤ 2.5s
      warning: 3000, // Needs improvement: 2.5s - 4s
      poor: 4000     // Poor: > 4s
    },

    // First Input Delay
    FID: {
      good: 100,     // Good: ≤ 100ms
      warning: 200,  // Needs improvement: 100ms - 300ms
      poor: 300      // Poor: > 300ms
    },

    // Cumulative Layout Shift
    CLS: {
      good: 0.1,     // Good: ≤ 0.1
      warning: 0.15, // Needs improvement: 0.1 - 0.25
      poor: 0.25     // Poor: > 0.25
    },

    // First Contentful Paint
    FCP: {
      good: 1800,    // Good: ≤ 1.8s
      warning: 2500, // Needs improvement: 1.8s - 3s
      poor: 3000     // Poor: > 3s
    },

    // Time to First Byte
    TTFB: {
      good: 600,     // Good: ≤ 600ms
      warning: 800,  // Needs improvement: 600ms - 1s
      poor: 1000     // Poor: > 1s
    },

    // Interaction to Next Paint
    INP: {
      good: 200,     // Good: ≤ 200ms
      warning: 350,  // Needs improvement: 200ms - 500ms
      poor: 500      // Poor: > 500ms
    }
  },

  resources: {
    // JavaScript bundle size limits
    totalJavaScript: 500 * 1024,  // 500KB total JS
    
    // CSS bundle size limits
    totalCSS: 100 * 1024,         // 100KB total CSS
    
    // Image size limits
    totalImages: 2 * 1024 * 1024, // 2MB total images per page
    
    // Font size limits
    totalFonts: 200 * 1024,       // 200KB total fonts
    
    // HTML size limits
    totalHTML: 50 * 1024          // 50KB HTML
  },

  network: {
    // Maximum time for any single request
    maxRequestDuration: 3000,     // 3 seconds
    
    // Maximum duration for long tasks
    maxLongTaskDuration: 50,      // 50ms (blocks main thread)
    
    // Maximum memory usage
    maxMemoryUsage: 100           // 100MB
  },

  pages: {
    // Home page budgets
    home: {
      loadTime: 2000,       // 2 seconds
      interactionTime: 100, // 100ms
      renderTime: 16        // 16ms (60fps)
    },

    // Search page budgets
    search: {
      loadTime: 2500,       // 2.5 seconds
      interactionTime: 150, // 150ms
      renderTime: 16        // 16ms
    },

    // Vehicle detail page budgets
    vehicleDetail: {
      loadTime: 3000,       // 3 seconds (more images)
      interactionTime: 100, // 100ms
      renderTime: 16        // 16ms
    },

    // Booking flow budgets
    booking: {
      loadTime: 2000,       // 2 seconds
      interactionTime: 100, // 100ms (critical for UX)
      renderTime: 16        // 16ms
    },

    // Dashboard budgets
    dashboard: {
      loadTime: 2500,       // 2.5 seconds
      interactionTime: 150, // 150ms
      renderTime: 16        // 16ms
    },

    // Admin pages (can be slightly slower)
    admin: {
      loadTime: 4000,       // 4 seconds
      interactionTime: 200, // 200ms
      renderTime: 16        // 16ms
    }
  }
};

/**
 * Environment-specific budget adjustments
 */
export const getEnvironmentBudgets = (): PerformanceBudgetConfig => {
  const budgets = { ...PERFORMANCE_BUDGETS };

  // Adjust budgets based on environment
  if (process.env.NODE_ENV === 'development') {
    // Relax budgets in development
    Object.keys(budgets.webVitals).forEach(key => {
      const metric = budgets.webVitals[key as keyof typeof budgets.webVitals];
      metric.good *= 1.5;
      metric.warning *= 1.5;
      metric.poor *= 1.5;
    });

    // Increase resource budgets in development
    Object.keys(budgets.resources).forEach(key => {
      budgets.resources[key as keyof typeof budgets.resources] *= 2;
    });
  }

  // Adjust for mobile devices
  if (typeof window !== 'undefined' && window.navigator.userAgent.includes('Mobile')) {
    // Stricter budgets for mobile
    Object.keys(budgets.webVitals).forEach(key => {
      const metric = budgets.webVitals[key as keyof typeof budgets.webVitals];
      if (key !== 'CLS') { // CLS is not affected by device performance
        metric.good *= 0.8;
        metric.warning *= 0.8;
        metric.poor *= 0.8;
      }
    });
  }

  return budgets;
};

/**
 * Get budget for specific metric
 */
export const getBudgetForMetric = (metricName: string): { good: number; warning: number; poor: number } | null => {
  const budgets = getEnvironmentBudgets();
  
  if (metricName in budgets.webVitals) {
    return budgets.webVitals[metricName as keyof typeof budgets.webVitals];
  }
  
  return null;
};

/**
 * Get budget for specific page
 */
export const getBudgetForPage = (pageName: string) => {
  const budgets = getEnvironmentBudgets();
  return budgets.pages[pageName] || budgets.pages.home;
};

/**
 * Check if metric passes budget
 */
export const checkMetricBudget = (metricName: string, value: number): 'good' | 'warning' | 'poor' => {
  const budget = getBudgetForMetric(metricName);
  if (!budget) return 'good';

  if (value <= budget.good) return 'good';
  if (value <= budget.warning) return 'warning';
  return 'poor';
};

/**
 * Performance budget alerts configuration
 */
export const BUDGET_ALERTS = {
  // When to show warnings
  warningThreshold: 0.8, // Show warning when 80% of budget is used
  
  // When to show errors
  errorThreshold: 1.0,   // Show error when budget is exceeded
  
  // How often to check budgets (in milliseconds)
  checkInterval: 5000,   // Check every 5 seconds
  
  // Maximum number of alerts to show
  maxAlerts: 3,
  
  // Alert persistence (in milliseconds)
  alertDuration: 10000   // Show alerts for 10 seconds
};

export default PERFORMANCE_BUDGETS;