/**
 * E2E Performance Tests
 * Tests application performance metrics and optimization
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Performance Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Core Web Vitals - Home Page', async ({ page }) => {
    // Navigate to home page and measure Core Web Vitals
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {
          LCP: 0, // Largest Contentful Paint
          FID: 0, // First Input Delay
          CLS: 0, // Cumulative Layout Shift
          FCP: 0, // First Contentful Paint
          TTFB: 0 // Time to First Byte
        };

        // Measure LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.LCP = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Measure CLS
        new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.CLS = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        // Measure FCP
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['paint'] });

        // Get navigation timing for TTFB
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          vitals.TTFB = navigation.responseStart - navigation.requestStart;
        }

        // Resolve after a short delay to collect metrics
        setTimeout(() => resolve(vitals), 2000);
      });
    });

    // Assert Core Web Vitals thresholds
    expect(webVitals.LCP).toBeLessThan(2500); // LCP should be < 2.5s
    expect(webVitals.FCP).toBeLessThan(1800); // FCP should be < 1.8s
    expect(webVitals.CLS).toBeLessThan(0.1);  // CLS should be < 0.1
    expect(webVitals.TTFB).toBeLessThan(600); // TTFB should be < 600ms

    console.log('Core Web Vitals:', webVitals);
  });

  test('Page Load Performance', async ({ page }) => {
    const pages = [
      { path: '/', name: 'Home' },
      { path: '/search', name: 'Search' },
      { path: '/login', name: 'Login' },
      { path: '/register', name: 'Register' }
    ];

    for (const testPage of pages) {
      const startTime = performance.now();
      
      await page.goto(testPage.path);
      await page.waitForLoadState('networkidle');
      
      const loadTime = performance.now() - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      console.log(`${testPage.name} page load time: ${loadTime.toFixed(2)}ms`);
    }
  });

  test('Bundle Size and Resource Loading', async ({ page }) => {
    await page.goto('/');
    
    // Get all network requests
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries.map(entry => ({
        name: entry.name,
        size: entry.transferSize || 0,
        duration: entry.duration,
        type: entry.initiatorType
      }));
    });

    // Analyze JavaScript bundles
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    
    // Main bundle should be reasonable size (< 500KB)
    expect(totalJSSize).toBeLessThan(500 * 1024);

    // Analyze CSS bundles
    const cssResources = resources.filter(r => r.name.includes('.css'));
    const totalCSSSize = cssResources.reduce((sum, r) => sum + r.size, 0);
    
    // CSS should be reasonable size (< 100KB)
    expect(totalCSSSize).toBeLessThan(100 * 1024);

    console.log(`Total JS size: ${(totalJSSize / 1024).toFixed(2)}KB`);
    console.log(`Total CSS size: ${(totalCSSSize / 1024).toFixed(2)}KB`);
  });

  test('Image Optimization', async ({ page }) => {
    await page.goto('/vehicles/1');
    await page.waitForLoadState('networkidle');

    // Check image loading performance
    const images = await page.locator('img').all();
    
    for (const image of images.slice(0, 5)) { // Test first 5 images
      const src = await image.getAttribute('src');
      const loading = await image.getAttribute('loading');
      
      if (src) {
        // Images should use lazy loading where appropriate
        if (!src.includes('hero') && !src.includes('above-fold')) {
          expect(loading).toBe('lazy');
        }

        // Check image format optimization
        const isOptimized = src.includes('.webp') || 
                           src.includes('.avif') || 
                           src.includes('format=auto');
        
        if (!isOptimized) {
          console.warn(`Image not optimized: ${src}`);
        }
      }
    }
  });

  test('Search Performance', async ({ page }) => {
    await helpers.navigateTo('/');
    
    // Measure search performance
    const startTime = performance.now();
    
    await helpers.fillField('Pick-up Location', 'Johannesburg, South Africa');
    await helpers.fillDateRange('2024-02-15', '2024-02-20');
    await helpers.clickButton('Search Vehicles');
    
    // Wait for results to load
    await page.waitForSelector('[data-testid="vehicle-card"]', { timeout: 5000 });
    
    const searchTime = performance.now() - startTime;
    
    // Search should complete within 3 seconds
    expect(searchTime).toBeLessThan(3000);
    
    console.log(`Search completion time: ${searchTime.toFixed(2)}ms`);
  });

  test('Booking Flow Performance', async ({ page }) => {
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    
    // Measure booking wizard performance
    const startTime = performance.now();
    
    await helpers.navigateTo('/vehicles/1');
    await helpers.clickButton('Book Now');
    
    // Navigate through wizard steps
    const steps = ['Continue', 'Continue', 'Review Booking'];
    
    for (const step of steps) {
      await page.waitForSelector(`button:has-text("${step}")`, { timeout: 2000 });
      const stepStartTime = performance.now();
      
      await helpers.clickButton(step);
      
      if (step !== 'Review Booking') {
        await page.waitForLoadState('networkidle');
      }
      
      const stepTime = performance.now() - stepStartTime;
      
      // Each step should complete within 1 second
      expect(stepTime).toBeLessThan(1000);
      
      console.log(`${step} step time: ${stepTime.toFixed(2)}ms`);
    }
    
    const totalBookingTime = performance.now() - startTime;
    
    // Entire booking flow should complete within 5 seconds
    expect(totalBookingTime).toBeLessThan(5000);
    
    console.log(`Total booking flow time: ${totalBookingTime.toFixed(2)}ms`);
  });

  test('Memory Usage', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });

    if (initialMemory) {
      // Navigate through several pages to test for memory leaks
      const pages = ['/search', '/vehicles/1', '/dashboard', '/profile'];
      
      for (const testPage of pages) {
        await helpers.navigateTo(testPage);
        await page.waitForLoadState('networkidle');
      }

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      });

      // Memory usage shouldn't increase dramatically (allow 50% increase)
      const memoryIncrease = (finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / initialMemory.usedJSHeapSize;
      
      expect(memoryIncrease).toBeLessThan(0.5);
      
      console.log(`Memory increase: ${(memoryIncrease * 100).toFixed(2)}%`);
    }
  });

  test('Network Request Optimization', async ({ page }) => {
    const requests: any[] = [];
    
    // Monitor network requests
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Analyze request patterns
    const apiRequests = requests.filter(r => r.url.includes('/api/'));
    const imageRequests = requests.filter(r => r.resourceType === 'image');
    const fontRequests = requests.filter(r => r.resourceType === 'font');

    // Should not make excessive API requests on initial load
    expect(apiRequests.length).toBeLessThan(10);

    // Should not load too many images on initial page load
    expect(imageRequests.length).toBeLessThan(20);

    // Should preload critical fonts
    expect(fontRequests.length).toBeGreaterThan(0);

    console.log(`API requests: ${apiRequests.length}`);
    console.log(`Image requests: ${imageRequests.length}`);
    console.log(`Font requests: ${fontRequests.length}`);
  });

  test('Caching Performance', async ({ page }) => {
    // First visit
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get performance metrics for first visit
    const firstVisit = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart
      };
    });

    // Second visit (should use cache)
    await page.reload();
    await page.waitForLoadState('networkidle');

    const secondVisit = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart
      };
    });

    // Second visit should be faster due to caching
    expect(secondVisit.loadTime).toBeLessThan(firstVisit.loadTime);
    
    console.log(`First visit load time: ${firstVisit.loadTime.toFixed(2)}ms`);
    console.log(`Second visit load time: ${secondVisit.loadTime.toFixed(2)}ms`);
    console.log(`Cache improvement: ${((firstVisit.loadTime - secondVisit.loadTime) / firstVisit.loadTime * 100).toFixed(2)}%`);
  });

  test('Mobile Performance', async ({ page }) => {
    // Set mobile viewport and network conditions
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate slower network (3G)
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      route.continue();
    });

    const startTime = performance.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = performance.now() - startTime;

    // Mobile should still load within reasonable time even on slower network
    expect(loadTime).toBeLessThan(5000);

    // Test mobile-specific interactions
    await helpers.fillField('Pick-up Location', 'Johannesburg');
    await helpers.clickButton('Search Vehicles');
    
    const searchStartTime = performance.now();
    await page.waitForSelector('[data-testid="vehicle-card"]', { timeout: 8000 });
    const searchTime = performance.now() - searchStartTime;

    // Mobile search should complete within 6 seconds on slower network
    expect(searchTime).toBeLessThan(6000);

    console.log(`Mobile load time: ${loadTime.toFixed(2)}ms`);
    console.log(`Mobile search time: ${searchTime.toFixed(2)}ms`);
  });
});