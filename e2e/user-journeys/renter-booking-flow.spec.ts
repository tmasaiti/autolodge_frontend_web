/**
 * E2E Tests: Complete Renter Booking Flow
 * Tests the entire user journey from search to booking completion
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers, testBookings, testPaymentMethods } from '../fixtures/test-data';

test.describe('Renter Booking Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Complete domestic booking flow', async ({ page }) => {
    // 1. Navigate to home page
    await helpers.navigateTo('/');
    await expect(page.getByText('Rent Vehicles Across')).toBeVisible();

    // 2. Perform vehicle search
    await helpers.fillField('Pick-up Location', testBookings.domestic.pickup_location.address);
    await helpers.fillDateRange(
      testBookings.domestic.date_range.start_date,
      testBookings.domestic.date_range.end_date
    );
    await helpers.clickButton('Search Vehicles');
    await helpers.waitForLoading();

    // 3. Verify search results
    await expect(page.getByText('Available Vehicles')).toBeVisible();
    await expect(page.locator('[data-testid="vehicle-card"]')).toHaveCount({ min: 1 });

    // 4. Select a vehicle
    await page.locator('[data-testid="vehicle-card"]').first().click();
    await helpers.waitForPageLoad();

    // 5. Verify vehicle details page
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Specifications')).toBeVisible();
    await expect(page.getByText('Pricing')).toBeVisible();

    // 6. Start booking process
    await helpers.clickButton('Book Now');

    // 7. Login (if not already logged in)
    if (page.url().includes('/login')) {
      await helpers.login(testUsers.renter.email, testUsers.renter.password);
    }

    // 8. Complete booking wizard - Dates & Location step
    await expect(page.getByText('Booking Details')).toBeVisible();
    await helpers.verifyText('[data-testid="pickup-location"]', 'Johannesburg');
    await helpers.clickButton('Continue');

    // 9. Insurance selection step
    await expect(page.getByText('Insurance Coverage')).toBeVisible();
    await page.getByRole('radio', { name: 'Basic Coverage' }).check();
    await helpers.clickButton('Continue');

    // 10. Payment step
    await expect(page.getByText('Payment Details')).toBeVisible();
    await helpers.fillField('Card Number', testPaymentMethods.creditCard.card_number);
    await helpers.fillField('Expiry Month', testPaymentMethods.creditCard.expiry_month);
    await helpers.fillField('Expiry Year', testPaymentMethods.creditCard.expiry_year);
    await helpers.fillField('CVV', testPaymentMethods.creditCard.cvv);
    await helpers.fillField('Cardholder Name', testPaymentMethods.creditCard.cardholder_name);

    // 11. Review and confirm
    await helpers.clickButton('Review Booking');
    await expect(page.getByText('Booking Summary')).toBeVisible();
    await expect(page.getByText('Total Amount')).toBeVisible();
    await helpers.clickButton('Confirm Booking');

    // 12. Verify booking confirmation
    await helpers.waitForPageLoad();
    await expect(page.getByText('Booking Confirmed!')).toBeVisible();
    await expect(page.getByText('Your booking reference:')).toBeVisible();

    // 13. Verify booking appears in dashboard
    await helpers.navigateTo('/dashboard');
    await expect(page.getByText('My Bookings')).toBeVisible();
    await expect(page.locator('[data-testid="booking-item"]')).toHaveCount({ min: 1 });
  });

  test('Complete cross-border booking flow', async ({ page }) => {
    // 1. Navigate and login
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/');

    // 2. Search for cross-border capable vehicles
    await helpers.fillField('Pick-up Location', testBookings.crossBorder.pickup_location.address);
    await helpers.fillField('Drop-off Location', testBookings.crossBorder.dropoff_location.address);
    await helpers.fillDateRange(
      testBookings.crossBorder.date_range.start_date,
      testBookings.crossBorder.date_range.end_date
    );
    await page.getByLabel('Cross-border travel').check();
    await helpers.clickButton('Search Vehicles');
    await helpers.waitForLoading();

    // 3. Select cross-border capable vehicle
    await page.locator('[data-testid="vehicle-card"][data-cross-border="true"]').first().click();
    await helpers.waitForPageLoad();

    // 4. Start booking
    await helpers.clickButton('Book Now');

    // 5. Complete dates & location step
    await helpers.clickButton('Continue');

    // 6. Cross-border step
    await expect(page.getByText('Cross-Border Travel')).toBeVisible();
    await page.getByLabel('Botswana').check();
    await expect(page.getByText('Required Documents')).toBeVisible();
    await expect(page.getByText('Additional Surcharge')).toBeVisible();
    await helpers.clickButton('Continue');

    // 7. Insurance step (cross-border requires comprehensive)
    await expect(page.getByText('Cross-border travel requires comprehensive coverage')).toBeVisible();
    await page.getByRole('radio', { name: 'Comprehensive Coverage' }).check();
    await helpers.clickButton('Continue');

    // 8. Payment step
    await helpers.fillField('Card Number', testPaymentMethods.creditCard.card_number);
    await helpers.fillField('Expiry Month', testPaymentMethods.creditCard.expiry_month);
    await helpers.fillField('Expiry Year', testPaymentMethods.creditCard.expiry_year);
    await helpers.fillField('CVV', testPaymentMethods.creditCard.cvv);
    await helpers.fillField('Cardholder Name', testPaymentMethods.creditCard.cardholder_name);

    // 9. Review and confirm
    await helpers.clickButton('Review Booking');
    await expect(page.getByText('Cross-Border Surcharge')).toBeVisible();
    await expect(page.getByText('Permit Requirements')).toBeVisible();
    await helpers.clickButton('Confirm Booking');

    // 10. Verify confirmation
    await expect(page.getByText('Booking Confirmed!')).toBeVisible();
    await expect(page.getByText('Cross-border permit application will be processed')).toBeVisible();
  });

  test('Booking modification flow', async ({ page }) => {
    // 1. Login and navigate to bookings
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/dashboard');

    // 2. Select a booking to modify
    await page.locator('[data-testid="booking-item"]').first().click();
    await helpers.waitForPageLoad();

    // 3. Initiate modification
    await helpers.clickButton('Modify Booking');
    await expect(page.getByText('Modify Your Booking')).toBeVisible();

    // 4. Change dates
    await helpers.fillDateRange('2024-02-16', '2024-02-22');
    await helpers.clickButton('Check Availability');
    await helpers.waitForLoading();

    // 5. Review changes
    await expect(page.getByText('Booking Changes')).toBeVisible();
    await expect(page.getByText('Additional Cost')).toBeVisible();
    await helpers.clickButton('Confirm Changes');

    // 6. Verify modification confirmation
    await expect(page.getByText('Booking Modified Successfully')).toBeVisible();
  });

  test('Booking cancellation flow', async ({ page }) => {
    // 1. Login and navigate to booking
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/dashboard');
    await page.locator('[data-testid="booking-item"]').first().click();

    // 2. Initiate cancellation
    await helpers.clickButton('Cancel Booking');
    await helpers.waitForModal('Cancel Booking');

    // 3. Select cancellation reason
    await helpers.selectFromDropdown('Reason for Cancellation', 'Change of plans');
    await page.getByLabel('Additional comments').fill('Test cancellation');

    // 4. Confirm cancellation
    await helpers.clickButton('Confirm Cancellation');

    // 5. Verify cancellation
    await expect(page.getByText('Booking Cancelled')).toBeVisible();
    await expect(page.getByText('Refund will be processed')).toBeVisible();
  });
});