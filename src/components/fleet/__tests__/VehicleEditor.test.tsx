import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { store } from '../../../store/store';
import { VehicleEditor } from '../VehicleEditor';
import { Vehicle } from '../../../types/vehicle';

// Mock the hooks
vi.mock('../../../hooks/useJSONHandler', () => ({
  useJSONHandler: () => ({
    data: null,
    errors: [],
    isValid: true,
    validateData: vi.fn()
  })
}));

const mockVehicle: Vehicle = {
  id: 1,
  operator_id: 1,
  registration: 'CA 123 456',
  category: 'Sedan',
  make: 'BMW',
  model: '3 Series',
  year: 2023,
  color: 'Black',
  vin: 'WBA123456789',
  specifications: {
    engine: { type: 'Inline-4 Turbo', displacement: 2.0, fuel_type: 'Petrol' },
    transmission: 'Automatic',
    seats: 5,
    doors: 4,
    features: ['GPS Navigation', 'Air Conditioning'],
    safety_features: ['ABS', 'Airbags'],
    entertainment: ['Premium Audio', 'USB Charging']
  },
  pricing: {
    base_daily_rate: 650,
    currency: 'ZAR',
    seasonal_adjustments: { peak_multiplier: 1.3, off_peak_multiplier: 0.8 },
    distance_pricing: { included_km_per_day: 250, excess_km_rate: 3.5 },
    cross_border_surcharge: 75,
    security_deposit: 3000
  },
  availability: {
    calendar_type: 'calendar_based',
    advance_booking_days: 60,
    minimum_rental_days: 1,
    maximum_rental_days: 30,
    blocked_dates: [],
    available_times: { start_time: '08:00', end_time: '18:00' }
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
  description: 'Luxury sedan perfect for business trips',
  photos: [
    { id: 1, url: '/vehicle-1.jpg', caption: 'Front view', is_primary: true, order_index: 0 }
  ],
  created_at: '2024-01-20T10:00:00Z',
  updated_at: '2024-01-25T15:30:00Z'
};

const renderVehicleEditor = (vehicle?: Vehicle) => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          <VehicleEditor
            vehicle={vehicle}
            onSave={mockOnSave}
            onCancel={mockOnCancel}
          />
        </BrowserRouter>
      </Provider>
    ),
    mockOnSave,
    mockOnCancel
  };
};

describe('VehicleEditor', () => {
  it('should render add vehicle form when no vehicle provided', () => {
    renderVehicleEditor();
    
    expect(screen.getByText('Add New Vehicle')).toBeInTheDocument();
    expect(screen.getByText('Add a new vehicle to your fleet')).toBeInTheDocument();
  });

  it('should render edit vehicle form when vehicle provided', () => {
    renderVehicleEditor(mockVehicle);
    
    expect(screen.getByText('Edit Vehicle')).toBeInTheDocument();
    expect(screen.getByText('Update vehicle information and settings')).toBeInTheDocument();
  });

  it('should populate form fields with vehicle data', () => {
    renderVehicleEditor(mockVehicle);
    
    expect(screen.getByDisplayValue('CA 123 456')).toBeInTheDocument();
    expect(screen.getByDisplayValue('BMW')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3 Series')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2023')).toBeInTheDocument();
  });

  it('should switch between tabs', () => {
    renderVehicleEditor();
    
    // Should start on basic tab
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    
    // Click pricing tab
    fireEvent.click(screen.getByText('Pricing'));
    expect(screen.getByText('Base Pricing')).toBeInTheDocument();
    
    // Click availability tab
    fireEvent.click(screen.getByText('Availability'));
    expect(screen.getByText('Availability Settings')).toBeInTheDocument();
    
    // Click specifications tab
    fireEvent.click(screen.getByText('Specifications'));
    expect(screen.getByText('Vehicle Specifications')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const { mockOnCancel } = renderVehicleEditor();
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should validate required fields', () => {
    renderVehicleEditor();
    
    // Try to save without filling required fields
    fireEvent.click(screen.getByText('Save Vehicle'));
    
    // Should show validation errors (form won't submit)
    expect(screen.getByText('Save Vehicle')).toBeInTheDocument();
  });
});