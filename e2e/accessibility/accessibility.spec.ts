/**
 * E2E Accessibility Tests
 * Tests accessibility compliance across the application
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Accessibility Tests @accessibility', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Home page accessibility', async ({ page }) => {
    await helpers.navigateTo('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Search results accessibility', async ({ page }) => {
    await helpers.navigateTo('/');
    
    // Perform search
    await helpers.fillField('Pick-up Location', 'Johannesburg, South Africa');
    await helpers.fillDateRange('2024-02-15', '2024-02-20');
    await helpers.clickButton('Search Vehicles');
    await helpers.waitForLoading();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Vehicle detail page accessibility', async ({ page }) => {
    await helpers.navigateTo('/vehicles/1');
    await helpers.waitForPageLoad();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Booking wizard accessibility', async ({ page }) => {
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/vehicles/1');
    await helpers.clickButton('Book Now');

    // Test each step of the wizard
    const wizardSteps = [
      'Booking Details',
      'Insurance Coverage', 
      'Payment Details'
    ];

    for (const stepName of wizardSteps) {
      await expect(page.getByText(stepName)).toBeVisible();
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Move to next step (except for last step)
      if (stepName !== 'Payment Details') {
        await helpers.clickButton('Continue');
      }
    }
  });

  test('Forms accessibility', async ({ page }) => {
    // Test login form
    await helpers.navigateTo('/login');
    
    let accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Test registration form
    await helpers.navigateTo('/register');
    
    accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard accessibility', async ({ page }) => {
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation', async ({ page }) => {
    await helpers.navigateTo('/');

    // Test tab navigation through main elements
    await page.keyboard.press('Tab'); // Skip to main content link
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // Navigation menu
    await page.keyboard.press('Tab'); // Search form
    
    // Verify focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test search form keyboard interaction
    await page.keyboard.press('Tab'); // Pick-up location
    await page.keyboard.type('Johannesburg');
    await page.keyboard.press('Tab'); // Date picker
    await page.keyboard.press('Enter'); // Open date picker
    await page.keyboard.press('Escape'); // Close date picker
    await page.keyboard.press('Tab'); // Search button
    await page.keyboard.press('Enter'); // Activate search
  });

  test('Screen reader compatibility', async ({ page }) => {
    await helpers.navigateTo('/');

    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Verify main landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      expect(alt).toBeDefined();
    }

    // Verify form labels
    const inputs = await page.locator('input, select, textarea').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  });

  test('Color contrast and visual accessibility', async ({ page }) => {
    await helpers.navigateTo('/');

    // Test with high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await helpers.waitForPageLoad();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Test with reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await helpers.waitForPageLoad();

    // Verify animations are reduced/disabled
    const animatedElements = await page.locator('[class*="animate"], [class*="transition"]').all();
    for (const element of animatedElements) {
      const computedStyle = await element.evaluate(el => getComputedStyle(el));
      // Check that animation duration is reduced or set to none
      expect(
        computedStyle.animationDuration === '0s' || 
        computedStyle.transitionDuration === '0s' ||
        computedStyle.animationPlayState === 'paused'
      ).toBeTruthy();
    }
  });

  test('Mobile accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.navigateTo('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // Test touch targets are appropriately sized (minimum 44px)
    const touchTargets = await page.locator('button, a, input[type="checkbox"], input[type="radio"]').all();
    
    for (const target of touchTargets) {
      const boundingBox = await target.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Error handling accessibility', async ({ page }) => {
    await helpers.navigateTo('/login');

    // Trigger form validation errors
    await helpers.clickButton('Sign In');

    // Check that error messages are properly announced
    const errorMessages = await page.locator('[role="alert"], .error-message').all();
    expect(errorMessages.length).toBeGreaterThan(0);

    for (const error of errorMessages) {
      await expect(error).toBeVisible();
      const ariaLive = await error.getAttribute('aria-live');
      expect(ariaLive).toBeTruthy();
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Modal and dialog accessibility', async ({ page }) => {
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/dashboard');

    // Open a modal (e.g., booking details)
    if (await page.locator('[data-testid="booking-item"]').count() > 0) {
      await page.locator('[data-testid="booking-item"]').first().click();
      
      // Check modal accessibility
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Verify modal has proper ARIA attributes
      await expect(modal).toHaveAttribute('aria-modal', 'true');
      
      const modalTitle = modal.locator('[id*="title"]');
      if (await modalTitle.count() > 0) {
        const titleId = await modalTitle.getAttribute('id');
        await expect(modal).toHaveAttribute('aria-labelledby', titleId);
      }

      // Test focus management
      const focusedElement = await page.locator(':focus');
      const isInsideModal = await focusedElement.evaluate((el, modalEl) => {
        return modalEl.contains(el);
      }, await modal.elementHandle());
      
      expect(isInsideModal).toBeTruthy();

      // Test escape key closes modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });
});