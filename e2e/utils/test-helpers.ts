/**
 * Test helper utilities for E2E tests
 */

import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
  }

  /**
   * Fill form field by label or placeholder
   */
  async fillField(labelOrPlaceholder: string, value: string) {
    const field = this.page.getByLabel(labelOrPlaceholder).or(
      this.page.getByPlaceholder(labelOrPlaceholder)
    );
    await field.fill(value);
  }

  /**
   * Click button by text or role
   */
  async clickButton(text: string) {
    await this.page.getByRole('button', { name: text }).click();
  }

  /**
   * Wait for toast notification and verify message
   */
  async waitForToast(message: string) {
    const toast = this.page.getByRole('alert').filter({ hasText: message });
    await expect(toast).toBeVisible();
    return toast;
  }

  /**
   * Navigate to a specific page and wait for load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Login with test credentials
   */
  async login(email: string, password: string) {
    await this.navigateTo('/login');
    await this.fillField('Email', email);
    await this.fillField('Password', password);
    await this.clickButton('Sign In');
    await this.waitForPageLoad();
  }

  /**
   * Logout from the application
   */
  async logout() {
    await this.page.getByRole('button', { name: 'Profile' }).click();
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
    await this.waitForPageLoad();
  }

  /**
   * Fill date range picker
   */
  async fillDateRange(startDate: string, endDate: string) {
    await this.page.getByLabel('Check-in Date').fill(startDate);
    await this.page.getByLabel('Check-out Date').fill(endDate);
  }

  /**
   * Select from dropdown by value
   */
  async selectFromDropdown(label: string, value: string) {
    await this.page.getByLabel(label).click();
    await this.page.getByRole('option', { name: value }).click();
  }

  /**
   * Upload file to input
   */
  async uploadFile(inputSelector: string, filePath: string) {
    await this.page.setInputFiles(inputSelector, filePath);
  }

  /**
   * Wait for modal to appear
   */
  async waitForModal(title: string) {
    const modal = this.page.getByRole('dialog', { name: title });
    await expect(modal).toBeVisible();
    return modal;
  }

  /**
   * Close modal
   */
  async closeModal() {
    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  /**
   * Verify URL contains path
   */
  async verifyUrl(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    await this.page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 });
  }

  /**
   * Verify element is visible
   */
  async verifyVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  /**
   * Verify text content
   */
  async verifyText(selector: string, text: string) {
    await expect(this.page.locator(selector)).toContainText(text);
  }

  /**
   * Take screenshot with name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for network request to complete
   */
  async waitForRequest(urlPattern: string) {
    return this.page.waitForRequest(urlPattern);
  }

  /**
   * Wait for response
   */
  async waitForResponse(urlPattern: string) {
    return this.page.waitForResponse(urlPattern);
  }

  /**
   * Mock API response
   */
  async mockApiResponse(url: string, response: any) {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Check accessibility violations
   */
  async checkAccessibility() {
    // This would integrate with axe-core
    const violations = await this.page.evaluate(() => {
      // @ts-ignore
      return window.axe ? window.axe.run() : { violations: [] };
    });
    
    if (violations.violations && violations.violations.length > 0) {
      console.warn('Accessibility violations found:', violations.violations);
    }
    
    return violations;
  }

  /**
   * Verify responsive design at different viewports
   */
  async testResponsiveDesign() {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 1920, height: 1080, name: 'Desktop Large' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500); // Allow layout to settle
      await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
    }
  }
}