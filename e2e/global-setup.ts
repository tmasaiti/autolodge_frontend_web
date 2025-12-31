/**
 * Global setup for E2E tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Starting global E2E test setup...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Check if the application is running
    await page.goto('http://localhost:3001', { timeout: 30000 });
    
    // Wait for app to be ready
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    
    console.log('Application is ready for testing');

    // Setup test data if needed
    await setupTestData(page);

  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('Global E2E test setup completed');
}

async function setupTestData(page: any) {
  // This would typically seed test data in the database
  // For now, we'll just verify the API is accessible
  
  try {
    const response = await page.request.get('http://localhost:3000/api/health');
    if (response.status() !== 200) {
      console.warn('Backend API health check failed');
    }
  } catch (error) {
    console.warn('Backend API not accessible, tests will use mocked data');
  }
}

export default globalSetup;