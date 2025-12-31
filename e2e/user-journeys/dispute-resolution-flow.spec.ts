/**
 * E2E Tests: Dispute Resolution Flow
 * Tests the complete dispute management process from creation to resolution
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Dispute Resolution Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Renter creates dispute and submits evidence', async ({ page }) => {
    // 1. Login as renter and navigate to completed booking
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/dashboard');
    
    // 2. Select completed booking
    await page.locator('[data-testid="booking-item"][data-status="completed"]').first().click();
    await helpers.waitForPageLoad();

    // 3. Initiate dispute
    await helpers.clickButton('Report Issue');
    await helpers.waitForModal('Report an Issue');

    // 4. Fill dispute form
    await helpers.selectFromDropdown('Issue Type', 'Vehicle Damage');
    await helpers.fillField('Issue Title', 'Pre-existing damage not disclosed');
    await page.getByLabel('Issue Description').fill(
      'The vehicle had scratches on the left side that were not mentioned during pickup. ' +
      'This caused confusion during return and potential liability issues.'
    );
    await helpers.fillField('Estimated Cost', '2500');

    // 5. Upload evidence
    await helpers.uploadFile('[data-testid="evidence-upload"]', 'test-files/damage-photo1.jpg');
    await helpers.uploadFile('[data-testid="evidence-upload"]', 'test-files/damage-photo2.jpg');
    await helpers.uploadFile('[data-testid="evidence-upload"]', 'test-files/pickup-checklist.pdf');

    // 6. Submit dispute
    await helpers.clickButton('Submit Dispute');
    await helpers.waitForToast('Dispute submitted successfully');

    // 7. Verify dispute creation
    await expect(page.getByText('Dispute Submitted')).toBeVisible();
    await expect(page.getByText('Dispute ID:')).toBeVisible();
    await expect(page.getByText('We\'ll review your case within 48 hours')).toBeVisible();

    // 8. Navigate to disputes dashboard
    await helpers.navigateTo('/disputes');
    await expect(page.getByText('My Disputes')).toBeVisible();
    await expect(page.locator('[data-testid="dispute-item"]')).toHaveCount({ min: 1 });

    // 9. View dispute details
    await page.locator('[data-testid="dispute-item"]').first().click();
    await expect(page.getByText('Dispute Details')).toBeVisible();
    await expect(page.getByText('Status: Open')).toBeVisible();
    await expect(page.getByText('Evidence Submitted')).toBeVisible();

    // 10. Add additional evidence
    await helpers.clickButton('Add Evidence');
    await helpers.waitForModal('Add Evidence');
    await helpers.selectFromDropdown('Evidence Type', 'Document');
    await helpers.fillField('Evidence Title', 'Insurance Assessment Report');
    await page.getByLabel('Description').fill('Independent assessment of the damage');
    await helpers.uploadFile('[data-testid="additional-evidence-upload"]', 'test-files/assessment-report.pdf');
    await helpers.clickButton('Submit Evidence');
    
    await helpers.waitForToast('Evidence added successfully');
  });

  test('Operator responds to dispute', async ({ page }) => {
    // 1. Login as operator
    await helpers.login(testUsers.operator.email, testUsers.operator.password);
    await helpers.navigateTo('/operator/disputes');

    // 2. View pending disputes
    await expect(page.getByText('Dispute Management')).toBeVisible();
    await expect(page.locator('[data-testid="dispute-item"][data-status="open"]')).toHaveCount({ min: 1 });

    // 3. Select dispute to respond to
    await page.locator('[data-testid="dispute-item"]').first().click();
    await expect(page.getByText('Dispute Details')).toBeVisible();

    // 4. Review renter's evidence
    await expect(page.getByText('Renter Evidence')).toBeVisible();
    await page.locator('[data-testid="evidence-item"]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible(); // Evidence viewer modal

    // 5. Submit operator response
    await helpers.clickButton('Respond to Dispute');
    await page.getByLabel('Response').fill(
      'The damage mentioned was clearly documented in our pre-rental inspection report. ' +
      'The renter was informed of all existing damage during the pickup process and signed ' +
      'the condition report acknowledging the vehicle\'s state.'
    );

    // 6. Upload counter-evidence
    await helpers.uploadFile('[data-testid="response-evidence-upload"]', 'test-files/pre-rental-inspection.pdf');
    await helpers.uploadFile('[data-testid="response-evidence-upload"]', 'test-files/signed-condition-report.pdf');
    await helpers.uploadFile('[data-testid="response-evidence-upload"]', 'test-files/pickup-photos.jpg');

    // 7. Submit response
    await helpers.clickButton('Submit Response');
    await helpers.waitForToast('Response submitted successfully');

    // 8. Verify response recorded
    await expect(page.getByText('Status: Under Review')).toBeVisible();
    await expect(page.getByText('Operator Response Submitted')).toBeVisible();
  });

  test('Admin reviews and resolves dispute', async ({ page }) => {
    // 1. Login as admin
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    await helpers.navigateTo('/admin/disputes');

    // 2. View disputes requiring review
    await expect(page.getByText('Dispute Administration')).toBeVisible();
    await helpers.selectFromDropdown('Status Filter', 'Under Review');
    await helpers.waitForLoading();

    // 3. Select dispute for review
    await page.locator('[data-testid="dispute-row"]').first().click();
    await expect(page.getByText('Admin Dispute Review')).toBeVisible();

    // 4. Review all evidence
    await expect(page.getByText('Renter Evidence')).toBeVisible();
    await expect(page.getByText('Operator Evidence')).toBeVisible();
    
    // View evidence items
    await page.locator('[data-testid="renter-evidence"] [data-testid="evidence-item"]').first().click();
    await helpers.closeModal();
    
    await page.locator('[data-testid="operator-evidence"] [data-testid="evidence-item"]').first().click();
    await helpers.closeModal();

    // 5. Add admin investigation notes
    await helpers.clickButton('Add Investigation Note');
    await page.getByLabel('Investigation Notes').fill(
      'Reviewed all submitted evidence. The operator\'s pre-rental inspection report clearly ' +
      'documents the existing damage. The signed condition report shows the renter was aware ' +
      'of the vehicle\'s condition. However, the pickup photos could have been clearer.'
    );
    await helpers.clickButton('Save Notes');

    // 6. Make resolution decision
    await helpers.clickButton('Resolve Dispute');
    await helpers.waitForModal('Resolve Dispute');
    
    await helpers.selectFromDropdown('Resolution', 'Favor Operator');
    await page.getByLabel('Resolution Reason').fill(
      'Evidence clearly shows the damage was pre-existing and properly documented. ' +
      'The renter acknowledged the vehicle condition at pickup. No liability for operator.'
    );
    
    await helpers.selectFromDropdown('Fund Action', 'Release to Operator');
    await helpers.fillField('Operator Amount', '0');
    await helpers.fillField('Renter Refund', '0');

    // 7. Confirm resolution
    await helpers.clickButton('Confirm Resolution');
    await helpers.waitForToast('Dispute resolved successfully');

    // 8. Verify resolution
    await expect(page.getByText('Status: Resolved')).toBeVisible();
    await expect(page.getByText('Resolution: Favor Operator')).toBeVisible();
    await expect(page.getByText('Funds Released')).toBeVisible();
  });

  test('Dispute escalation and pattern detection', async ({ page }) => {
    // 1. Login as admin
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
    await helpers.navigateTo('/admin/disputes/patterns');

    // 2. View dispute patterns dashboard
    await expect(page.getByText('Dispute Pattern Analysis')).toBeVisible();
    await expect(page.getByText('Frequent Dispute Types')).toBeVisible();
    await expect(page.getByText('High-Risk Operators')).toBeVisible();
    await expect(page.getByText('Problematic Renters')).toBeVisible();

    // 3. Review pattern alerts
    await expect(page.locator('[data-testid="pattern-alert"]')).toHaveCount({ min: 0 });
    
    // If there are pattern alerts
    if (await page.locator('[data-testid="pattern-alert"]').count() > 0) {
      await page.locator('[data-testid="pattern-alert"]').first().click();
      await expect(page.getByText('Pattern Details')).toBeVisible();
      
      // Take action on pattern
      await helpers.clickButton('Investigate Pattern');
      await page.getByLabel('Investigation Action').fill('Flagged for detailed review of operator practices');
      await helpers.clickButton('Save Action');
    }

    // 4. Generate dispute report
    await helpers.navigateTo('/admin/disputes/reports');
    await helpers.selectFromDropdown('Report Type', 'Monthly Dispute Summary');
    await helpers.selectFromDropdown('Month', 'February 2024');
    await helpers.clickButton('Generate Report');
    
    await helpers.waitForLoading();
    await expect(page.getByText('Dispute Report Generated')).toBeVisible();
    await helpers.clickButton('Download Report');
  });

  test('Dispute communication and notifications', async ({ page }) => {
    // 1. Login as renter with active dispute
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/disputes');

    // 2. Select active dispute
    await page.locator('[data-testid="dispute-item"][data-status="under_review"]').first().click();

    // 3. Check dispute timeline
    await expect(page.getByText('Dispute Timeline')).toBeVisible();
    await expect(page.getByText('Dispute Created')).toBeVisible();
    await expect(page.getByText('Evidence Submitted')).toBeVisible();
    await expect(page.getByText('Operator Response')).toBeVisible();

    // 4. Send message to admin
    await helpers.clickButton('Contact Admin');
    await page.getByLabel('Message').fill(
      'I would like to provide additional context about this dispute. ' +
      'The damage was not visible during the initial inspection due to poor lighting conditions.'
    );
    await helpers.clickButton('Send Message');
    
    await helpers.waitForToast('Message sent to admin');

    // 5. Check notifications
    await helpers.navigateTo('/notifications');
    await expect(page.getByText('Dispute Updates')).toBeVisible();
    
    // Verify dispute-related notifications
    const disputeNotifications = page.locator('[data-testid="notification-item"][data-type="dispute"]');
    await expect(disputeNotifications).toHaveCount({ min: 1 });

    // 6. Update notification preferences
    await helpers.navigateTo('/profile/notifications');
    await page.getByLabel('Email notifications for dispute updates').check();
    await page.getByLabel('SMS notifications for dispute resolutions').check();
    await helpers.clickButton('Save Preferences');
    
    await helpers.waitForToast('Notification preferences updated');
  });
});