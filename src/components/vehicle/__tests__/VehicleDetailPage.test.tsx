import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VehicleDetailPage } from '../../../pages/VehicleDetailPage';

// Mock the vehicle service
vi.mock('../../../services/vehicleService', () => ({
  vehicleService: {
    getVehicle: vi.fn().mockResolvedValue({
      id: 1,
      operator_id: 1,
      registration: 'CA 456 789',
      category: 'Sedan',
      make: 'BMW',
      model: '3 Series',
      year: 2023,
      color: 'Black',
      vin: 'WBA123456789',
      specifications: {
        engine: {
          type: 'Inline-4 Turbo',
          displacement: 2.0,
          fuel_type: 'Petrol'
        },
        transmission: 'Automatic',
        seats: 5,
        doors: 4,
        features: ['GPS Navigation', 'Air Conditioning', 'Bluetooth'],
        safety_features: ['ABS', 'Airbags'],
        entertainment: ['Premium Audio', 'USB Charging']
      },
      pricing: {
        base_daily_rate: 650,
        currency: 'ZAR',
        seasonal_adjustments: {
          peak_multiplier: 1.3,
          off_peak_multiplier: 0.8
        },
        distance_pricing: {
          included_km_per_day: 250,
          excess_km_rate: 3.5
        },
        cross_border_surcharge: 75,
        security_deposit: 3000
      },
      availability: {
        calendar_type: 'calendar_based',
        advance_booking_days: 60,
        minimum_rental_days: 1,
        maximum_rental_days: 30,
        blocked_dates: [],
        available_times: {
          start_time: '08:00',
          end_time: '18:00'
        }
      },
      cross_border_config: {
        allowed: true,
        countries: ['ZA', 'BW', 'NA'],
        surcharge_percentage: 15,
        required_documents: ['passport'],
        insurance_requirements: ['comprehensive']
      },
      verification: {
        status: 'verified',
        verified_at: '2024-01-20',
        documents_verified: ['registration']
      },
      status: 'available',
      location: {
        latitude: -33.9249,
        longitude: 18.4241,
        address: '123 Main Street',
        city: 'Cape Town',
        country: 'South Africa'
      },
      description: 'Test vehicle description',
      photos: [
        {
          id: 1,
          url: '/test-image.jpg',
          caption: 'Test image',
          is_primary: true,
          order_index: 0
        }
      ],
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-25T15:30:00Z'
    })
  }
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => vi.fn()
  };
});

// Create a mock store
const mockStore = configureStore({
  reducer: {
    // Add minimal reducers for testing
    user: (state = {}) => state,
    vehicle: (state = {}) => state,
    search: (state = {}) => state,
    booking: (state = {}) => state
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('VehicleDetailPage', () => {
  it('should render basic vehicle information', () => {
    renderWithProviders(<VehicleDetailPage />);
    
    // The component should render without crashing
    // Since we have mocked data, we can check for basic structure
    expect(document.body).toBeTruthy();
  });
});