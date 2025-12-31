import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../store/store';
import { SearchInterface } from '../../components/search/SearchInterface';
import { BookingFlow } from '../../components/booking/BookingFlow';
import { PaymentForm } from '../../components/payment/PaymentForm';
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

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    vi.mocked(api.api.get).mockImplementation((url: string) => {
      if (url.includes('/vehicles/search')) {
        return Promise.resolve({
          data: {
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
            totalPages: 1
          }
        });
      }
      if (url.includes('/vehicles/1')) {
        return Promise.resolve({
          data: {
            id: '1',
            make: 'Toyota',
            model: 'Camry',
            year: 2023,
            pricePerDay: 50,
            location: 'Harare',
            availability: { isAvailable: true }
          }
        });
      }
      return Promise.resolve({ data: {} });
    });

    vi.mocked(api.api.post).mockImplementation((url: string, data: any) => {
      if (url.includes('/bookings')) {
        return Promise.resolve({
          data: {
            id: 'booking_123',
            status: 'confirmed',
            totalAmount: 320,
            currency: 'USD'
          }
        });
      }
      if (url.includes('/payments')) {
        return Promise.resolve({
          data: {
            success: true,
            transactionId: 'txn_123',
            amount: 320,
            currency: 'USD'
          }
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('should handle API errors with proper retry mechanisms', async () => {
    // Mock API failure followed by success
    vi.mocked(api.api.get)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        data: {
          vehicles: [],
          total: 0,
          page: 1,
          totalPages: 0
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

    // Should show error initially
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    // Should show retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    
    // Click retry
    fireEvent.click(retryButton);

    // Should succeed on retry
    await waitFor(() => {
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });
  });

  it('should handle concurrent API requests properly', async () => {
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

    // Trigger multiple rapid searches
    const locationInput = screen.getByPlaceholderText(/where/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(locationInput, { target: { value: 'Harare' } });
    fireEvent.click(searchButton);
    
    fireEvent.change(locationInput, { target: { value: 'Bulawayo' } });
    fireEvent.click(searchButton);
    
    fireEvent.change(locationInput, { target: { value: 'Mutare' } });
    fireEvent.click(searchButton);

    // Should handle concurrent requests without race conditions
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(3);
    });

    // Should show results for the last search
    expect(mockOnSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ location: 'Mutare' })
    );
  });

  it('should handle API rate limiting gracefully', async () => {
    // Mock rate limit error
    vi.mocked(api.api.get).mockRejectedValue({
      response: {
        status: 429,
        data: { message: 'Rate limit exceeded', retryAfter: 5 }
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

    // Should show rate limit message
    await waitFor(() => {
      expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
    });

    // Should show retry countdown
    expect(screen.getByText(/try again in.*5.*seconds/i)).toBeInTheDocument();
  });

  it('should handle authentication token expiration', async () => {
    // Mock 401 unauthorized error
    vi.mocked(api.api.get).mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Token expired' }
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

    // Should redirect to login or show auth error
    await waitFor(() => {
      expect(screen.getByText(/session expired/i)).toBeInTheDocument();
    });
  });

  it('should handle booking API integration end-to-end', async () => {
    const mockOnBookingComplete = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <TestWrapper>
        <BookingFlow 
          vehicleId="1"
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
    
    const nextButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(nextButton);

    // Skip through steps to payment
    await waitFor(() => {
      expect(screen.getByText(/insurance/i)).toBeInTheDocument();
    });
    
    const basicInsurance = screen.getByLabelText(/basic insurance/i);
    fireEvent.click(basicInsurance);
    fireEvent.click(nextButton);

    // Payment step
    await waitFor(() => {
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });
    
    const cardNumberInput = screen.getByLabelText(/card number/i);
    fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
    
    const completeButton = screen.getByRole('button', { name: /complete booking/i });
    fireEvent.click(completeButton);

    // Should complete booking via API
    await waitFor(() => {
      expect(mockOnBookingComplete).toHaveBeenCalled();
    });

    // Verify API calls were made
    expect(api.api.post).toHaveBeenCalledWith('/bookings', expect.any(Object));
    expect(api.api.post).toHaveBeenCalledWith('/payments', expect.any(Object));
  });

  it('should handle payment API integration with error recovery', async () => {
    const mockOnPaymentSuccess = vi.fn();
    const mockOnPaymentError = vi.fn();

    // Mock payment failure followed by success
    vi.mocked(api.api.post)
      .mockRejectedValueOnce(new Error('Payment processing failed'))
      .mockResolvedValueOnce({
        data: {
          success: true,
          transactionId: 'txn_124',
          amount: 320,
          currency: 'USD'
        }
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
    fireEvent.change(cardNumberInput, { target: { value: '4242424242424242' } });
    
    // First payment attempt (will fail)
    const payButton = screen.getByRole('button', { name: /pay now/i });
    fireEvent.click(payButton);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/payment processing failed/i)).toBeInTheDocument();
    });
    
    expect(mockOnPaymentError).toHaveBeenCalled();
    
    // Retry payment
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    // Should succeed on retry
    await waitFor(() => {
      expect(mockOnPaymentSuccess).toHaveBeenCalledWith({
        success: true,
        transactionId: 'txn_124',
        amount: 320,
        currency: 'USD'
      });
    });
  });

  it('should handle API timeout scenarios', async () => {
    // Mock API timeout
    vi.mocked(api.api.get).mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );

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

    // Should show timeout error
    await waitFor(() => {
      expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should handle malformed API responses', async () => {
    // Mock malformed response
    vi.mocked(api.api.get).mockResolvedValue({
      data: {
        // Missing required fields
        vehicles: null,
        total: 'invalid'
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

    // Should handle malformed response gracefully
    await waitFor(() => {
      expect(screen.getByText(/unexpected response format/i)).toBeInTheDocument();
    });
  });

  it('should handle API versioning and backward compatibility', async () => {
    // Mock API response with version mismatch
    vi.mocked(api.api.get).mockResolvedValue({
      data: {
        version: '2.0',
        vehicles: [
          {
            id: '1',
            make: 'Toyota',
            model: 'Camry',
            // New field in v2.0
            electricRange: 0,
            // Renamed field
            dailyPrice: 50 // was pricePerDay
          }
        ]
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

    // Should handle version differences gracefully
    await waitFor(() => {
      expect(screen.getByText(/toyota camry/i)).toBeInTheDocument();
    });
  });

  it('should handle offline/online state transitions', async () => {
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

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    // Trigger search while offline
    const locationInput = screen.getByPlaceholderText(/where/i);
    fireEvent.change(locationInput, { target: { value: 'Harare' } });
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // Should show offline message
    await waitFor(() => {
      expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
    });

    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Should automatically retry when back online
    window.dispatchEvent(new Event('online'));

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });
  });
});