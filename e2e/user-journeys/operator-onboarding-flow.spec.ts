/**
 * E2E Tests: Operator Onboarding and Fleet Management Flow
 * Tests the complete operator journey from registration to fleet management
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers, testVehicles } from '../fixtures/test-data';

test.describe('Operator Onboarding Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Complete operator registration and onboarding', async ({ page }) => {
    // 1. Navigate to registration
    await helpers.navigateTo('/register');
    await page.getByRole('tab', { name: 'Operator' }).click();

    // 2. Fill registration form
    await helpers.fillField('Email', 'new.operator@test.com');
    await helpers.fillField('Password', 'TestPassword123!');
    await helpers.fillField('Confirm Password', 'TestPassword123!');
    await page.getByLabel('I agree to the Terms of Service').check();
    await helpers.clickButton('Create Account');

    // 3. Verify email verification prompt
    await expect(page.getByText('Verify Your Email')).toBeVisible();
    
    // Mock email verification (in real test, would check email)
    await helpers.navigateTo('/verify-email?token=mock-token');
    await expect(page.getByText('Email Verified Successfully')).toBeVisible();

    // 4. Start onboarding wizard
    await helpers.clickButton('Complete Onboarding');
    await expect(page.getByText('Operator Onboarding')).toBeVisible();

    // 5. Business Information Step
    await expect(page.getByText('Business Information')).toBeVisible();
    await helpers.fillField('Business Name', testUsers.operator.profile.business_name);
    await helpers.fillField('Registration Number', testUsers.operator.profile.business_registration);
    await helpers.selectFromDropdown('Business Type', 'Private Company');
    await helpers.fillField('Tax Number', 'TAX123456789');
    await helpers.fillField('Business Address', '123 Business Street, Johannesburg, South Africa');
    await helpers.fillField('Contact Person', 'Jane Smith');
    await helpers.fillField('Phone Number', '+27123456789');
    await helpers.clickButton('Continue');

    // 6. Documents Step
    await expect(page.getByText('Business Documents')).toBeVisible();
    
    // Mock file uploads (in real test, would use actual files)
    await helpers.uploadFile('[data-testid="business-registration-upload"]', 'test-files/business-registration.pdf');
    await helpers.uploadFile('[data-testid="tax-certificate-upload"]', 'test-files/tax-certificate.pdf');
    await helpers.uploadFile('[data-testid="insurance-certificate-upload"]', 'test-files/insurance.pdf');
    await helpers.uploadFile('[data-testid="bank-statement-upload"]', 'test-files/bank-statement.pdf');
    
    await helpers.clickButton('Continue');

    // 7. Verification Step
    await expect(page.getByText('Identity Verification')).toBeVisible();
    await helpers.uploadFile('[data-testid="id-document-upload"]', 'test-files/id-document.pdf');
    await helpers.uploadFile('[data-testid="drivers-license-upload"]', 'test-files/drivers-license.pdf');
    await helpers.clickButton('Continue');

    // 8. Fleet Setup Step
    await expect(page.getByText('Fleet Setup')).toBeVisible();
    await helpers.clickButton('Add Vehicle');

    // Fill vehicle details
    await helpers.fillField('Make', testVehicles.sedan.make);
    await helpers.fillField('Model', testVehicles.sedan.model);
    await helpers.fillField('Year', testVehicles.sedan.year.toString());
    await helpers.selectFromDropdown('Category', testVehicles.sedan.category);
    await helpers.fillField('Registration Number', testVehicles.sedan.registration);
    await helpers.fillField('VIN', 'TEST123456789VIN');
    
    // Upload vehicle documents
    await helpers.uploadFile('[data-testid="vehicle-registration-upload"]', 'test-files/vehicle-registration.pdf');
    await helpers.uploadFile('[data-testid="vehicle-insurance-upload"]', 'test-files/vehicle-insurance.pdf');
    await helpers.uploadFile('[data-testid="roadworthy-certificate-upload"]', 'test-files/roadworthy.pdf');
    
    // Upload vehicle photos
    await helpers.uploadFile('[data-testid="vehicle-photos-upload"]', 'test-files/vehicle-photo1.jpg');
    
    await helpers.clickButton('Save Vehicle');
    await helpers.clickButton('Complete Onboarding');

    // 9. Verify onboarding completion
    await expect(page.getByText('Onboarding Complete!')).toBeVisible();
    await expect(page.getByText('Your application is under review')).toBeVisible();
  });

  test('Fleet management operations', async ({ page }) => {
    // 1. Login as operator
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
    await helpers.navigateTo('/fleet');

    // 2. Verify fleet dashboard
    await expect(page.getByText('Fleet Management')).toBeVisible();
    await expect(page.getByText('Total Vehicles')).toBeVisible();
    await expect(page.getByText('Active Bookings')).toBeVisible();

    // 3. Add new vehicle
    await helpers.clickButton('Add Vehicle');
    await helpers.fillField('Make', testVehicles.suv.make);
    await helpers.fillField('Model', testVehicles.suv.model);
    await helpers.fillField('Year', testVehicles.suv.year.toString());
    await helpers.selectFromDropdown('Category', testVehicles.suv.category);
    await helpers.fillField('Registration Number', testVehicles.suv.registration);
    
    // Set pricing
    await helpers.fillField('Daily Rate', testVehicles.suv.pricing.base_daily_rate.toString());
    await helpers.selectFromDropdown('Currency', testVehicles.suv.pricing.currency);
    await helpers.fillField('Security Deposit', testVehicles.suv.pricing.security_deposit.toString());
    
    // Configure cross-border settings
    await page.getByLabel('Allow Cross-Border Travel').check();
    await page.getByLabel('Botswana').check();
    await page.getByLabel('Namibia').check();
    await helpers.fillField('Cross-Border Surcharge', testVehicles.suv.pricing.cross_border_surcharge.toString());
    
    await helpers.clickButton('Save Vehicle');
    await helpers.waitForToast('Vehicle added successfully');

    // 4. Edit vehicle details
    await page.locator('[data-testid="vehicle-item"]').first().click();
    await helpers.clickButton('Edit Vehicle');
    
    await helpers.fillField('Description', 'Updated vehicle description with additional features');
    await page.getByLabel('GPS Navigation').check();
    await page.getByLabel('Bluetooth').check();
    await page.getByLabel('Air Conditioning').check();
    
    await helpers.clickButton('Save Changes');
    await helpers.waitForToast('Vehicle updated successfully');

    // 5. Manage availability
    await helpers.clickButton('Manage Availability');
    await expect(page.getByText('Availability Calendar')).toBeVisible();
    
    // Block dates
    await page.locator('[data-date="2024-02-20"]').click();
    await page.locator('[data-date="2024-02-21"]').click();
    await helpers.clickButton('Block Selected Dates');
    await helpers.fillField('Reason', 'Vehicle maintenance');
    await helpers.clickButton('Confirm Block');
    
    await helpers.waitForToast('Availability updated');

    // 6. View analytics
    await helpers.navigateTo('/fleet/analytics');
    await expect(page.getByText('Fleet Analytics')).toBeVisible();
    await expect(page.getByText('Booking Performance')).toBeVisible();
    await expect(page.getByText('Revenue Overview')).toBeVisible();
    await expect(page.getByText('Vehicle Utilization')).toBeVisible();
  });

  test('Booking management for operators', async ({ page }) => {
    // 1. Login and navigate to bookings
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
    await helpers.navigateTo('/operator/bookings');

    // 2. Verify bookings dashboard
    await expect(page.getByText('Booking Management')).toBeVisible();
    await expect(page.locator('[data-testid="booking-filter"]')).toBeVisible();

    // 3. Filter bookings
    await helpers.selectFromDropdown('Status Filter', 'Confirmed');
    await helpers.waitForLoading();
    
    // 4. View booking details
    await page.locator('[data-testid="booking-row"]').first().click();
    await expect(page.getByText('Booking Details')).toBeVisible();
    await expect(page.getByText('Renter Information')).toBeVisible();
    await expect(page.getByText('Vehicle Information')).toBeVisible();

    // 5. Confirm pickup
    await helpers.clickButton('Confirm Pickup');
    await helpers.fillField('Odometer Reading', '45000');
    await helpers.fillField('Fuel Level', '100');
    await page.getByLabel('Vehicle condition is satisfactory').check();
    await helpers.uploadFile('[data-testid="pickup-photos"]', 'test-files/pickup-photo.jpg');
    await helpers.clickButton('Complete Pickup');
    
    await helpers.waitForToast('Pickup confirmed successfully');

    // 6. Process return
    await helpers.navigateTo('/operator/bookings');
    await page.locator('[data-testid="booking-row"][data-status="active"]').first().click();
    await helpers.clickButton('Process Return');
    
    await helpers.fillField('Return Odometer', '45250');
    await helpers.fillField('Return Fuel Level', '75');
    await page.getByLabel('No damage observed').check();
    await helpers.uploadFile('[data-testid="return-photos"]', 'test-files/return-photo.jpg');
    await helpers.clickButton('Complete Return');
    
    await helpers.waitForToast('Return processed successfully');
  });

  test('Operator profile and settings management', async ({ page }) => {
    // 1. Login and navigate to profile
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
    await helpers.navigateTo('/profile');

    // 2. Update business information
    await helpers.clickButton('Edit Business Info');
    await helpers.fillField('Business Description', 'Premium vehicle rental services across SADC region');
    await helpers.fillField('Website', 'https://testfleet.com');
    await helpers.fillField('Operating Hours', 'Monday-Sunday: 8:00 AM - 6:00 PM');
    await helpers.clickButton('Save Changes');
    
    await helpers.waitForToast('Profile updated successfully');

    // 3. Manage payment settings
    await page.getByRole('tab', { name: 'Payment Settings' }).click();
    await helpers.fillField('Bank Name', 'Standard Bank');
    await helpers.fillField('Account Number', '123456789');
    await helpers.fillField('Branch Code', '051001');
    await helpers.fillField('Account Holder', 'Test Fleet Services');
    await helpers.clickButton('Save Payment Details');
    
    await helpers.waitForToast('Payment settings updated');

    // 4. Configure notification preferences
    await page.getByRole('tab', { name: 'Notifications' }).click();
    await page.getByLabel('Email notifications for new bookings').check();
    await page.getByLabel('SMS notifications for urgent matters').check();
    await page.getByLabel('Weekly performance reports').check();
    await helpers.clickButton('Save Preferences');
    
    await helpers.waitForToast('Notification preferences updated');
  });
});