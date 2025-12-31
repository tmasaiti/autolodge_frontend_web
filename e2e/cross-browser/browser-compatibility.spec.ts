/**
 * E2E Cross-Browser Compatibility Tests
 * Tests core functionality across different browsers and devices
 */

import { test, expect, devices } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

// Test configurations for different browsers and devices
const browserConfigs = [
  { name: 'Desktop Chrome', ...devices['Desktop Chrome'] },
  { name: 'Desktop Firefox', ...devices['Desktop Firefox'] },
  { name: 'Desktop Safari', ...devices['Desktop Safari'] },
  { name: 'Mobile Chrome', ...devices['Pixel 5'] },
  { name: 'Mobile Safari', ...devices['iPhone 12'] },
  { name: 'Tablet', ...devices['iPad Pro'] }
];

for (const config of browserConfigs) {
  test.describe(`Cross-Browser Tests - ${config.name}`, () => {
    test.use(config);
    
    let helpers: TestHelpers;

    test.beforeEach(async ({ page }) => {
      helpers = new TestHelpers(page);
    });

    test('Core navigation and layout', async ({ page }) => {
      await helpers.navigateTo('/');
      
      // Verify main layout elements are present
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
      
      // Test navigation menu
      if (config.name.includes('Mobile')) {
        // Mobile navigation
        await page.locator('[data-testid="mobile-menu-button"]').click();
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      } else {
        // Desktop navigation
        await expect(page.locator('nav')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Search' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'How it Works' })).toBeVisible();
      }

      // Test responsive design
      const viewport = page.viewportSize();
      if (viewport && viewport.width < 768) {
        // Mobile-specific checks
        await expect(page.locator('[data-testid="mobile-search-form"]')).toBeVisible();
      } else {
        // Desktop-specific checks
        await expect(page.locator('[data-testid="desktop-search-form"]')).toBeVisible();
      }
    });

    test('Search functionality', async ({ page }) => {
      await helpers.navigateTo('/');
      
      // Fill search form
      await helpers.fillField('Pick-up Location', 'Johannesburg, South Africa');
      await helpers.fillDateRange('2024-02-15', '2024-02-20');
      
      // Submit search
      await helpers.clickButton('Search Vehicles');
      await helpers.waitForLoading();
      
      // Verify search results
      await expect(page.getByText('Available Vehicles')).toBeVisible();
      
      // Test filters (if not mobile)
      if (!config.name.includes('Mobile')) {
        await expect(page.locator('[data-testid="search-filters"]')).toBeVisible();
        
        // Test filter interaction
        await page.getByLabel('Vehicle Category').click();
        await page.getByRole('option', { name: 'Sedan' }).click();
        await helpers.waitForLoading();
      }
    });

    test('User authentication', async ({ page }) => {
      // Test login
      await helpers.navigateTo('/login');
      
      await helpers.fillField('Email', testUsers.renter.email);
      await helpers.fillField('Password', testUsers.renter.password);
      await helpers.clickButton('Sign In');
      
      await helpers.waitForPageLoad();
      await helpers.verifyUrl('/dashboard');
      
      // Verify user is logged in
      await expect(page.getByText('Welcome back')).toBeVisible();
      
      // Test logout
      if (config.name.includes('Mobile')) {
        await page.locator('[data-testid="mobile-menu-button"]').click();
        await page.getByRole('button', { name: 'Logout' }).click();
      } else {
        await page.getByRole('button', { name: 'Profile' }).click();
        await page.getByRole('menuitem', { name: 'Logout' }).click();
      }
      
      await helpers.verifyUrl('/');
    });

    test('Form interactions', async ({ page }) => {
      await helpers.navigateTo('/register');
      
      // Test form validation
      await helpers.clickButton('Create Account');
      
      // Verify validation errors appear
      await expect(page.getByText('Email is required')).toBeVisible();
      await expect(page.getByText('Password is required')).toBeVisible();
      
      // Fill form correctly
      await helpers.fillField('Email', 'test@example.com');
      await helpers.fillField('Password', 'TestPassword123!');
      await helpers.fillField('Confirm Password', 'TestPassword123!');
      await page.getByLabel('I agree to the Terms of Service').check();
      
      // Verify form can be submitted (don't actually submit in test)
      const submitButton = page.getByRole('button', { name: 'Create Account' });
      await expect(submitButton).toBeEnabled();
    });

    test('Modal and overlay interactions', async ({ page }) => {
      await helpers.login(testUsers.renter.email, testUsers.renter.password);
      await helpers.navigateTo('/vehicles/1');
      
      // Test image gallery modal (if present)
      if (await page.locator('[data-testid="vehicle-image"]').count() > 0) {
        await page.locator('[data-testid="vehicle-image"]').first().click();
        
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();
        
        // Test modal close
        if (config.name.includes('Mobile')) {
          // Mobile: tap outside or use close button
          await page.getByRole('button', { name: 'Close' }).click();
        } else {
          // Desktop: ESC key or click outside
          await page.keyboard.press('Escape');
        }
        
        await expect(modal).not.toBeVisible();
      }
    });

    test('Touch and gesture interactions', async ({ page }) => {
      if (config.name.includes('Mobile') || config.name.includes('Tablet')) {
        await helpers.navigateTo('/');
        
        // Test touch scrolling
        await page.touchscreen.tap(200, 300);
        
        // Test swipe gestures (if carousel present)
        if (await page.locator('[data-testid="image-carousel"]').count() > 0) {
          const carousel = page.locator('[data-testid="image-carousel"]');
          const box = await carousel.boundingBox();
          
          if (box) {
            // Swipe left
            await page.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2);
            await page.touchscreen.tap(box.x + 50, box.y + box.height / 2);
          }
        }
        
        // Test pinch zoom (if supported)
        await page.touchscreen.tap(200, 300);
      }
    });

    test('Performance and loading', async ({ page }) => {
      // Measure page load performance
      const startTime = Date.now();
      await helpers.navigateTo('/');
      const loadTime = Date.now() - startTime;
      
      // Page should load within reasonable time (adjust threshold as needed)
      expect(loadTime).toBeLessThan(5000);
      
      // Test lazy loading
      if (await page.locator('[data-testid="lazy-image"]').count() > 0) {
        const lazyImages = page.locator('[data-testid="lazy-image"]');
        
        // Scroll to trigger lazy loading
        await lazyImages.first().scrollIntoViewIfNeeded();
        
        // Verify image loads
        await expect(lazyImages.first()).toHaveAttribute('src', /.+/);
      }
    });

    test('Local storage and session management', async ({ page }) => {
      await helpers.navigateTo('/');
      
      // Test local storage functionality
      await page.evaluate(() => {
        localStorage.setItem('test-key', 'test-value');
      });
      
      const storedValue = await page.evaluate(() => {
        return localStorage.getItem('test-key');
      });
      
      expect(storedValue).toBe('test-value');
      
      // Test session persistence across page reloads
      await helpers.login(testUsers.renter.email, testUsers.renter.password);
      await page.reload();
      await helpers.waitForPageLoad();
      
      // User should still be logged in
      await expect(page.getByText('Welcome back')).toBeVisible();
    });

    test('Error handling and recovery', async ({ page }) => {
      // Test network error handling
      await page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      await helpers.navigateTo('/');
      
      // Should show error state gracefully
      await expect(page.getByText(/error|failed|try again/i)).toBeVisible();
      
      // Test recovery
      await page.unroute('**/api/**');
      await page.reload();
      await helpers.waitForPageLoad();
      
      // Should recover successfully
      await expect(page.getByText('Rent Vehicles Across')).toBeVisible();
    });

    test('Responsive images and media', async ({ page }) => {
      await helpers.navigateTo('/vehicles/1');
      
      // Test responsive images
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const image = images.nth(i);
        
        // Verify image loads
        await expect(image).toHaveAttribute('src', /.+/);
        
        // Check for responsive attributes
        const srcset = await image.getAttribute('srcset');
        const sizes = await image.getAttribute('sizes');
        
        // At least one responsive attribute should be present for optimization
        expect(srcset || sizes).toBeTruthy();
      }
    });
  });
}