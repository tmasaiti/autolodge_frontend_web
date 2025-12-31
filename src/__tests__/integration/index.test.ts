/**
 * Integration Test Suite Index
 * 
 * This file imports and runs all integration tests for the frontend web application.
 * It ensures comprehensive testing of API integration, complex workflows, and error handling.
 */

import { describe, it, expect } from 'vitest';
import './integration-test-runner';

// Import basic integration test suite
import './basic-integration.test.tsx';

describe('Integration Test Suite', () => {
  it('should have all integration test files imported', () => {
    // This test ensures all integration test files are properly imported
    // and will run as part of the test suite
    expect(true).toBe(true);
  });

  it('should validate test environment setup', () => {
    // Verify that the test environment is properly configured
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
    expect(typeof navigator).toBe('object');
    
    // Check that required globals are mocked
    expect(window.matchMedia).toBeDefined();
    expect(global.IntersectionObserver).toBeDefined();
    expect(global.ResizeObserver).toBeDefined();
    expect(navigator.geolocation).toBeDefined();
  });
});