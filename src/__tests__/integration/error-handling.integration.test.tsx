import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../store/store';
import { SearchInterface } from '../../components/search/SearchInterface';
import { BookingFlow } from '../../components/booking/BookingFlow';
import { PaymentForm } from '../../components/payment/PaymentForm';
import { VehicleDetailPage } from '../../pages/VehicleDetailPage';
import { AuthContext } from '../../contexts/AuthContext';
import { CurrencyContext } from '../../contexts/CurrencyContext';
import * as api from '../../services/api';
import * as vehicleService from '../../services/vehicleService';
import * as bookingService from '../../services/bookingService';
import * as paymentService from '../../services/paymentService';

// Mock services
vi.mock('../../services/api');
vi.mock('../../services/vehicleService');
vi.mock('../../services/bookingService');
vi.mock('../../services/paymentService');

const mockAuthContext = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'renter' as const,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  isLoading: false,
  error: null
};

const mockCurrencyContext = {
  currency: 'USD',
  setCurrency: vi.fn(),
  exchangeRates: { USD: 1, EUR: 0.85, GBP: 0.73, ZWL: 320 },
  convertAmount: (amount: number) => amount,
  formatAmount: (amount: number) => `$${amount.toFixed(2)}`
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <CurrencyContext.Provider value={mockCurrencyContext}>
          {children}
        </CurrencyContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  </Provider>
);

describe('Error Handling and Recovery Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset to successful responses by default
    vi.mocked(api.api.get).mockResolvedValue({ data: {} });
    vi.mocked(api.api.post).mockResolvedValue({ data: {} });
    vi.mocked(vehicleService.searchVehicles).mockResolvedValue({
      vehicles: [],
      total: 0,
      page: 1,
      totalPages: 0,
      filters: {}
    });
  });

  it('should handle network connectivity issues with automatic retry', async () => {
    let attemptCount = 0;
    
    // Mock network failure followed by success
    vi.mocked(vehicleService.searchVehicles).mockImplementation(() => {
      attemptCount++;
      if (attemptCount <= 2) {
        return Promise.reject(new Error('Network Error'));
      }
      return Promise.resolve({
        vehicles: [
          {
            id: '1',
            make: 'Toyota',
            model: 'Camry',
            year: 2023,
            pricePerDay: 50,
            location: 'Harare'
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1,
        filters: {}
      });
    });

    const mockOnSearch = vi.fn();
    const mockOnFilterChange = vi.fn();

    render(
      <TestWrapper>
        <SearchInterface 
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          initialFilters={{}}
        />
      </TestWrapper>
    );

    // Trigger search
    const locationInput = screen.getByPlaceholderText(/where/i);
    fireEvent.change(locationInput, { target: { value: 'Harare' } });
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // Should show network error initially
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    // Should show retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    
    // First retry (will still fail)
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    // Second retry (will succeed)
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });

    // Should show search results
    expect(mockOnSearch).toHaveBeenCalled();
    expect(attemptCount).toBe(3);
  });

  it('should handle server errors with graceful degradation', async () => {
    // Mock 500 server error
    vi.mocked(api.api.get).mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'Internal Server Error' }
      }
    });

    const mockOnSearch = vi.fn();
    const mockOnFilterChange = vi.fn();

    render(
      <TestWrapper>
        <SearchInterface 
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          initialFilters={{}}
        />
      </TestWrapper>
    );

    // Trigger search
    const locationInput = screen.getByPlaceholderText(/where/i);
    fireEvent.change(locationInput, { target: { value: 'Harare' } });
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // Should show server error message
    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });

    // Should offer alternative actions
    expect(screen.getByText(/try again later/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse all vehicles/i })).toBeInTheDocument();
  });

  it('should handle validation errors with field-specific feedback', async () => {
    // Mock validation error response
    vi.mocked(bookingService.createBooking).mockRejectedValue({
      response: {
        status: 400,
        data: {
          message: 'Validation failed',
          errors: {
            startDate: 'Start date cannot be in the past',
            endDate: 'End date must be after start date',
            paymentMethod: 'Payment method is required'
          }
        }
      }
    });

    const mockOnBookingComplete = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <TestWrapper>
        <BookingFlow 
          vehicleId="vehicle_1"
          onBookingComplete={mockOnBookingComplete}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Fill invalid dates
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    
    fireEvent.change(startDateInput, { target: { value: '2023-01-15' } }); // Past date
    fireEvent.change(endDateInput, { target: { value: '2023-01-10' } }); // Before start date
    
    const nextButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextButton);

    // Should show field-specific validation errors
    await waitFor(() => {
      expect(screen.getByText(/start date cannot be in the past/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
    
    // Should highlight invalid fields
    expect(startDateInput).toHaveClass('error');
    expect(endDateInput).toHaveClass('error');
  });

  it('should handle payment processing errors with recovery options', async () => {
    const mockOnPaymentSuccess = vi.fn();
    const mockOnPaymentError = vi.fn();

    // Mock different payment error scenarios
    vi.mocked(paymentService.processPayment)
      .mockRejectedValueOnce({
        response: {
          status: 402,
          data: { 
            message: 'Payment failed',
            code: 'INSUFFICIENT_FUNDS',
            details: 'Your card has insufficient funds'
          }
        }
      })
      .mockRejectedValueOnce({
        response: {
          status: 402,
          data: { 
            message: 'Payment failed',
            code: 'CARD_DECLINED',
            details: 'Your card was declined'
          }
        }
      })
      .mockResolvedValueOnce({
        success: true,
        transactionId: 'txn_123',
        paymentMethod: 'card',
        amount: 320,
        currency: 'USD'
      });

    const paymentData = {
      bookingId: 'booking_123',
      amount: 320,
      currency: 'USD',
      description: 'Vehicle rental payment'
    };

    render(
      <TestWrapper>
        <PaymentForm 
          paymentData={paymentData}
          onPaymentSuccess={mockOnPaymentSuccess}
          onPaymentError={mockOnPaymentError}
        />
      </TestWrapper>
    );

    // Fill payment details
    const cardOption = screen.getByLabelText(/credit.*card/i);
    fireEvent.click(cardOption);
    
    const cardNumberInput = screen.getByLabelText(/card number/i);
    fireEvent.change(cardNumberInput, { target: { value: '4000000000000119' } }); // Insufficient funds card
    
    // First payment attempt (insufficient funds)
    const payButton = screen.getByRole('button', { name: /pay now/i });
    fireEvent.click(payButton);

    // Should show specific error message
    await waitFor(() => {
      expect(screen.getByText(/insufficient funds/i)).toBeInTheDocument();
    });
    
    // Should suggest alternative payment methods
    expect(screen.getByText(/try a different card/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use different card/i })).toBeInTheDocument();
    
    // Try different card (will be declined)
    fireEvent.change(cardNumberInput, { target: { value: '4000000000000002' } }); // Declined card
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    // Should show card declined error
    await waitFor(() => {
      expect(screen.getByText(/card was declined/i)).toBeInTheDocument();
    });
    
    // Should offer contact support option
    expect(screen.getByText(/contact your bank/i)).toBeInTheDocument();
    
    // Try valid card
    fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } }); // Valid card
    fireEvent.click(retryButton);

    // Should succeed
    await waitFor(() => {
      expect(mockOnPaymentSuccess).toHaveBeenCalled();
    });
  });

  it('should handle session expiration with seamless re-authentication', async () => {
    // Mock 401 unauthorized error
    vi.mocked(api.api.get).mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Token expired' }
      }
    });

    // Mock token refresh success
    vi.mocked(api.api.post).mockResolvedValue({
      data: {
        token: 'new_jwt_token',
        refreshToken: 'new_refresh_token'
      }
    });

    render(
      <TestWrapper>
        <VehicleDetailPage vehicleId="vehicle_1" />
      </TestWrapper>
    );

    // Should initially try to load vehicle data and fail with 401
    await waitFor(() => {
      expect(screen.getByText(/session expired/i)).toBeInTheDocument();
    });

    // Should show re-authentication options
    expect(screen.getByRole('button', { name: /sign in again/i })).toBeInTheDocument();
    
    // Should attempt automatic token refresh
    const refreshButton = screen.getByRole('button', { name: /refresh session/i });
    fireEvent.click(refreshButton);

    // Should show refreshing state
    expect(screen.getByText(/refreshing session/i)).toBeInTheDocument();
    
    // After refresh, should retry original request
    await waitFor(() => {
      expect(screen.queryByText(/session expired/i)).not.toBeInTheDocument();
    });
  });

  it('should handle data corruption with recovery mechanisms', async () => {
    // Mock corrupted response data
    vi.mocked(vehicleService.getVehicleById).mockResolvedValue({
      id: '1',
      make: null, // Corrupted data
      model: undefined,
      year: 'invalid',
      pricePerDay: -50, // Invalid price
      location: '',
      // Missing required fields
    } as any);

    render(
      <TestWrapper>
        <VehicleDetailPage vehicleId="vehicle_1" />
      </TestWrapper>
    );

    // Should detect data corruption
    await waitFor(() => {
      expect(screen.getByText(/data error/i)).toBeInTheDocument();
    });

    // Should show fallback content
    expect(screen.getByText(/unable to load vehicle details/i)).toBeInTheDocument();
    
    // Should offer recovery options
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse similar vehicles/i })).toBeInTheDocument();
  });

  it('should handle concurrent operation conflicts', async () => {
    // Mock booking conflict error
    vi.mocked(bookingService.createBooking).mockRejectedValue({
      response: {
        status: 409,
        data: {
          message: 'Booking conflict',
          code: 'VEHICLE_UNAVAILABLE',
          details: 'Vehicle was booked by another user',
          suggestedAlternatives: [
            {
              vehicleId: 'vehicle_2',
              make: 'Honda',
              model: 'Civic',
              pricePerDay: 45
            }
          ]
        }
      }
    });

    const mockOnBookingComplete = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <TestWrapper>
        <BookingFlow 
          vehicleId="vehicle_1"
          onBookingComplete={mockOnBookingComplete}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Complete booking flow
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-15' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-20' } });
    
    let nextButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextButton);

    // Skip to payment
    await waitFor(() => {
      expect(screen.getByText(/insurance/i)).toBeInTheDocument();
    });
    
    const basicInsurance = screen.getByLabelText(/basic insurance/i);
    fireEvent.click(basicInsurance);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });
    
    const cardNumberInput = screen.getByLabelText(/card number/i);
    fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
    
    const completeButton = screen.getByRole('button', { name: /complete booking/i });
    fireEvent.click(completeButton);

    // Should show conflict error
    await waitFor(() => {
      expect(screen.getByText(/vehicle was booked by another user/i)).toBeInTheDocument();
    });

    // Should show alternative vehicles
    expect(screen.getByText(/similar vehicles available/i)).toBeInTheDocument();
    expect(screen.getByText(/honda civic/i)).toBeInTheDocument();
    expect(screen.getByText(/\\$45/)).toBeInTheDocument();
    
    // Should allow booking alternative
    const bookAlternativeButton = screen.getByRole('button', { name: /book honda civic/i });
    expect(bookAlternativeButton).toBeInTheDocument();
  });

  it('should handle progressive failure with graceful degradation', async () => {
    let failureCount = 0;
    
    // Mock progressive service degradation
    vi.mocked(vehicleService.searchVehicles).mockImplementation(() => {
      failureCount++;
      
      if (failureCount === 1) {
        // First call: full search fails
        return Promise.reject(new Error('Search service unavailable'));
      } else if (failureCount === 2) {
        // Second call: return cached/limited results
        return Promise.resolve({
          vehicles: [
            {
              id: '1',
              make: 'Toyota',
              model: 'Camry',
              year: 2023,
              pricePerDay: 50,
              location: 'Harare'
            }
          ],
          total: 1,
          page: 1,
          totalPages: 1,
          filters: {},
          isLimitedResults: true,
          message: 'Showing cached results due to service issues'
        });
      }
      
      return Promise.resolve({
        vehicles: [],
        total: 0,
        page: 1,
        totalPages: 0,
        filters: {}
      });
    });

    const mockOnSearch = vi.fn();
    const mockOnFilterChange = vi.fn();

    render(
      <TestWrapper>
        <SearchInterface 
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          initialFilters={{}}
        />
      </TestWrapper>
    );

    // Trigger search
    const locationInput = screen.getByPlaceholderText(/where/i);
    fireEvent.change(locationInput, { target: { value: 'Harare' } });
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // Should show service unavailable error
    await waitFor(() => {
      expect(screen.getByText(/search service unavailable/i)).toBeInTheDocument();
    });

    // Should offer fallback option
    const fallbackButton = screen.getByRole('button', { name: /show available vehicles/i });
    fireEvent.click(fallbackButton);

    // Should show limited results with warning
    await waitFor(() => {
      expect(screen.getByText(/showing cached results/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/toyota camry/i)).toBeInTheDocument();
    expect(screen.getByText(/service issues/i)).toBeInTheDocument();
  });

  it('should handle memory and performance issues', async () => {
    // Mock large dataset that could cause performance issues
    const largeVehicleList = Array.from({ length: 1000 }, (_, i) => ({
      id: `vehicle_${i}`,
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      pricePerDay: 50 + i,
      location: 'Harare'
    }));

    vi.mocked(vehicleService.searchVehicles).mockResolvedValue({
      vehicles: largeVehicleList,
      total: 1000,
      page: 1,
      totalPages: 100,
      filters: {}
    });

    const mockOnSearch = vi.fn();
    const mockOnFilterChange = vi.fn();

    render(
      <TestWrapper>
        <SearchInterface 
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          initialFilters={{}}
        />
      </TestWrapper>
    );

    // Trigger search
    const locationInput = screen.getByPlaceholderText(/where/i);
    fireEvent.change(locationInput, { target: { value: 'Harare' } });
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // Should handle large dataset with pagination
    await waitFor(() => {
      expect(screen.getByText(/1000.*results/i)).toBeInTheDocument();
    });

    // Should show pagination controls
    expect(screen.getByText(/page 1 of 100/i)).toBeInTheDocument();
    
    // Should limit initial render for performance
    const vehicleCards = screen.getAllByTestId(/vehicle-card/i);
    expect(vehicleCards.length).toBeLessThanOrEqual(20); // Should limit to reasonable number
  });
});