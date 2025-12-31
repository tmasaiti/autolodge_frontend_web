import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Integration Test Runner Configuration
 * 
 * This file sets up the testing environment for comprehensive integration tests
 * that validate API integration, complex workflows, and error handling scenarios.
 */

// Global test setup
beforeAll(() => {
  // Setup global test environment
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock geolocation (only if not already defined)
  if (!navigator.geolocation) {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: Function) => {
          success({
            coords: {
              latitude: -17.8292,
              longitude: 31.0522
            }
          });
        },
        watchPosition: () => {},
        clearWatch: () => {}
      }
    });
  }

  // Mock localStorage
  const localStorageMock = {
    getItem: (key: string) => null,
    setItem: (key: string, value: string) => {},
    removeItem: (key: string) => {},
    clear: () => {}
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
  });

  // Mock fetch for API calls
  global.fetch = vi.fn();

  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods
  vi.restoreAllMocks();
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up DOM after each test
  cleanup();
});

/**
 * Test Utilities for Integration Tests
 */
export const testUtils = {
  /**
   * Wait for async operations to complete
   */
  waitForAsyncOperations: () => {
    return new Promise(resolve => setTimeout(resolve, 0));
  },

  /**
   * Mock file upload
   */
  createMockFile: (name: string, type: string, content: string = 'test content') => {
    return new File([content], name, { type });
  },

  /**
   * Simulate offline state
   */
  simulateOffline: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    window.dispatchEvent(new Event('offline'));
  },

  /**
   * Simulate online state
   */
  simulateOnline: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    window.dispatchEvent(new Event('online'));
  }
};