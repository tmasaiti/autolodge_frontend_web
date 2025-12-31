/**
 * E2E API Integration Tests
 * Tests integration between frontend and backend APIs
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers, testVehicles } from '../fixtures/test-data';

test.describe('API Integration Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Authentication API integration', async ({ page }) => {
    // Test login API
    const loginResponse = page.waitForResponse('**/api/auth/login');
    
    await helpers.navigateTo('/login');
    await helpers.fillField('Email', testUsers.renter.email);
    await helpers.fillField('Password', testUsers.renter.password);
    await helpers.clickButton('Sign In');

    const response = await loginResponse;
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('token');
    expect(responseBody).toHaveProperty('user');
    expect(responseBody.user.email).toBe(testUsers.renter.email);

    // Verify token is stored and used in subsequent requests
    await helpers.navigateTo('/dashboard');
    
    const dashboardRequest = page.waitForRequest('**/api/user/profile');
    await dashboardRequest;
    
    const request = await dashboardRequest;
    const authHeader = request.headers()['authorization'];
    expect(authHeader).toContain('Bearer');
  });

  test('Vehicle search API integration', async ({ page }) => {
    await helpers.navigateTo('/');

    // Monitor search API call
    const searchResponse = page.waitForResponse('**/api/vehicles/search');

    await helpers.fillField('Pick-up Location', 'Johannesburg, South Africa');
    await helpers.fillDateRange('2024-02-15', '2024-02-20');
    await helpers.clickButton('Search Vehicles');

    const response = await searchResponse;
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('vehicles');
    expect(responseBody).toHaveProperty('total');
    expect(responseBody).toHaveProperty('filters');
    expect(Array.isArray(responseBody.vehicles)).toBe(true);

    // Verify search results are displayed
    await expect(page.getByText('Available Vehicles')).toBeVisible();
    await expect(page.locator('[data-testid="vehicle-card"]')).toHaveCount(responseBody.vehicles.length);
  });

  test('Vehicle details API integration', async ({ page }) => {
    const vehicleResponse = page.waitForResponse('**/api/vehicles/*');

    await helpers.navigateTo('/vehicles/1');

    const response = await vehicleResponse;
    expect(response.status()).toBe(200);

    const vehicle = await response.json();
    expect(vehicle).toHaveProperty('id');
    expect(vehicle).toHaveProperty('make');
    expect(vehicle).toHaveProperty('model');
    expect(vehicle).toHaveProperty('specifications');
    expect(vehicle).toHaveProperty('pricing');

    // Verify vehicle details are displayed correctly
    await expect(page.getByText(vehicle.make)).toBeVisible();
    await expect(page.getByText(vehicle.model)).toBeVisible();
    await expect(page.getByText(vehicle.pricing.base_daily_rate.toString())).toBeVisible();
  });

  test('Booking creation API integration', async ({ page }) => {
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/vehicles/1');

    // Start booking process
    await helpers.clickButton('Book Now');

    // Monitor booking API calls
    const availabilityResponse = page.waitForResponse('**/api/availability/check');
    const pricingResponse = page.waitForResponse('**/api/pricing/calculate');

    // Complete booking wizard steps
    await helpers.clickButton('Continue'); // Dates & Location

    // Check availability API
    const availResponse = await availabilityResponse;
    expect(availResponse.status()).toBe(200);

    const availability = await availResponse.json();
    expect(availability).toHaveProperty('available');
    expect(availability.available).toBe(true);

    // Continue to pricing
    await helpers.clickButton('Continue'); // Insurance

    // Check pricing API
    const priceResponse = await pricingResponse;
    expect(priceResponse.status()).toBe(200);

    const pricing = await priceResponse.json();
    expect(pricing).toHaveProperty('total_amount');
    expect(pricing).toHaveProperty('breakdown');
    expect(pricing.total_amount).toBeGreaterThan(0);

    // Complete booking
    const bookingResponse = page.waitForResponse('**/api/bookings');

    await helpers.fillField('Card Number', '4111111111111111');
    await helpers.fillField('Expiry Month', '12');
    await helpers.fillField('Expiry Year', '2025');
    await helpers.fillField('CVV', '123');
    await helpers.fillField('Cardholder Name', 'John Doe');

    await helpers.clickButton('Review Booking');
    await helpers.clickButton('Confirm Booking');

    const bookingResp = await bookingResponse;
    expect(bookingResp.status()).toBe(201);

    const booking = await bookingResp.json();
    expect(booking).toHaveProperty('id');
    expect(booking).toHaveProperty('status');
    expect(booking.status).toBe('confirmed');
  });

  test('Error handling and retry logic', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/vehicles/search', route => {
      route.abort('failed');
    });

    await helpers.navigateTo('/');
    await helpers.fillField('Pick-up Location', 'Johannesburg, South Africa');
    await helpers.clickButton('Search Vehicles');

    // Should show error message
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible();

    // Test retry functionality
    await page.unroute('**/api/vehicles/search');
    
    // Mock successful response for retry
    await page.route('**/api/vehicles/search', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vehicles: [testVehicles.sedan],
          total: 1,
          filters: {}
        })
      });
    });

    await helpers.clickButton('Try Again');
    await expect(page.getByText('Available Vehicles')).toBeVisible();
  });

  test('Real-time updates and WebSocket integration', async ({ page }) => {
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/dashboard');

    // Monitor WebSocket connection
    let wsConnected = false;
    page.on('websocket', ws => {
      wsConnected = true;
      
      ws.on('framereceived', event => {
        const data = JSON.parse(event.payload.toString());
        console.log('WebSocket message received:', data);
      });
    });

    // Wait for WebSocket connection
    await page.waitForTimeout(2000);
    expect(wsConnected).toBe(true);

    // Test real-time booking updates
    if (await page.locator('[data-testid="booking-item"]').count() > 0) {
      await page.locator('[data-testid="booking-item"]').first().click();
      
      // Should receive real-time updates for booking status changes
      await expect(page.locator('[data-testid="booking-status"]')).toBeVisible();
    }
  });

  test('File upload API integration', async ({ page }) => {
    await helpers.login(testUsers.renter.email, testUsers.renter.password);
    await helpers.navigateTo('/profile/kyc');

    // Monitor file upload API
    const uploadResponse = page.waitForResponse('**/api/documents/upload');

    // Create a test file
    const fileContent = 'test file content';
    const file = new File([fileContent], 'test-document.pdf', { type: 'application/pdf' });

    // Upload file
    await page.setInputFiles('[data-testid="document-upload"]', {
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(fileContent)
    });

    const response = await uploadResponse;
    expect(response.status()).toBe(200);

    const uploadResult = await response.json();
    expect(uploadResult).toHaveProperty('file_url');
    expect(uploadResult).toHaveProperty('file_id');

    // Verify file appears in UI
    await expect(page.getByText('test-document.pdf')).toBeVisible();
  });

  test('Pagination and infinite scroll API integration', async ({ page }) => {
    await helpers.navigateTo('/');
    await helpers.fillField('Pick-up Location', 'Johannesburg, South Africa');
    await helpers.clickButton('Search Vehicles');

    // Wait for initial results
    await page.waitForSelector('[data-testid="vehicle-card"]');

    const initialCount = await page.locator('[data-testid="vehicle-card"]').count();

    // Test infinite scroll
    const loadMoreResponse = page.waitForResponse('**/api/vehicles/search?page=2');

    // Scroll to bottom to trigger load more
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    const response = await loadMoreResponse;
    expect(response.status()).toBe(200);

    const moreResults = await response.json();
    expect(moreResults.vehicles).toBeDefined();

    // Verify more results are loaded
    await page.waitForTimeout(1000);
    const newCount = await page.locator('[data-testid="vehicle-card"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('Currency conversion API integration', async ({ page }) => {
    await helpers.navigateTo('/vehicles/1');

    // Monitor currency conversion API
    const conversionResponse = page.waitForResponse('**/api/currency/convert');

    // Change currency
    await page.getByRole('button', { name: 'Currency' }).click();
    await page.getByRole('option', { name: 'USD' }).click();

    const response = await conversionResponse;
    expect(response.status()).toBe(200);

    const conversion = await response.json();
    expect(conversion).toHaveProperty('converted_amount');
    expect(conversion).toHaveProperty('exchange_rate');
    expect(conversion).toHaveProperty('timestamp');

    // Verify converted price is displayed
    await expect(page.getByText('USD')).toBeVisible();
  });

  test('Search filters API integration', async ({ page }) => {
    await helpers.navigateTo('/');
    await helpers.fillField('Pick-up Location', 'Johannesburg, South Africa');
    await helpers.clickButton('Search Vehicles');

    // Wait for initial results
    await page.waitForSelector('[data-testid="vehicle-card"]');

    // Test filter application
    const filterResponse = page.waitForResponse('**/api/vehicles/search**');

    await page.getByLabel('Vehicle Category').click();
    await page.getByRole('option', { name: 'SUV' }).click();

    const response = await filterResponse;
    expect(response.status()).toBe(200);

    // Verify filter is applied in API request
    const url = new URL(response.url());
    expect(url.searchParams.get('category')).toBe('suv');

    const filteredResults = await response.json();
    expect(filteredResults.vehicles.every((v: any) => v.category === 'suv')).toBe(true);
  });
});