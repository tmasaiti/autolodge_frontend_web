import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { BookingWizard } from '../booking/wizard';
import { OperatorOnboardingWizard } from '../operator/wizard';
import { Vehicle } from '../../types/vehicle';

// Mock vehicle data for demonstration
const mockVehicle: Vehicle = {
  id: 1,
  operator_id: 1,
  registration: 'ABC123GP',
  category: 'Economy',
  make: 'Toyota',
  model: 'Corolla',
  year: 2023,
  color: 'White',
  specifications: {
    engine: {
      type: 'Petrol',
      displacement: 1.6,
      fuel_type: 'Petrol'
    },
    transmission: 'Automatic',
    seats: 5,
    doors: 4,
    features: ['Air Conditioning', 'Bluetooth', 'GPS'],
    safety_features: ['ABS', 'Airbags'],
    entertainment: ['Radio', 'USB']
  },
  pricing: {
    base_daily_rate: 45,
    currency: 'USD',
    seasonal_adjustments: {
      peak_multiplier: 1.2,
      off_peak_multiplier: 0.9
    },
    distance_pricing: {
      included_km_per_day: 200,
      excess_km_rate: 0.15
    },
    cross_border_surcharge: 25,
    security_deposit: 200
  },
  availability: {
    calendar_type: 'calendar_based',
    advance_booking_days: 30,
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
    required_documents: ['Passport', 'International License'],
    insurance_requirements: ['Third Party', 'Cross Border Coverage']
  },
  verification: {
    status: 'verified',
    verified_at: '2024-01-01T00:00:00Z',
    documents_verified: ['registration', 'insurance']
  },
  status: 'active',
  location: {
    latitude: -33.9249,
    longitude: 18.4241,
    address: '123 Main Street',
    city: 'Cape Town',
    country: 'South Africa'
  },
  photos: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const WizardExample: React.FC = () => {
  const [activeWizard, setActiveWizard] = useState<'booking' | 'operator' | null>(null);

  const handleBookingComplete = (bookingData: any) => {
    console.log('Booking completed:', bookingData);
    alert('Booking wizard completed! Check console for data.');
    setActiveWizard(null);
  };

  const handleOperatorComplete = (operatorData: any) => {
    console.log('Operator onboarding completed:', operatorData);
    alert('Operator onboarding completed! Check console for data.');
    setActiveWizard(null);
  };

  const handleCancel = () => {
    setActiveWizard(null);
  };

  if (activeWizard === 'booking') {
    return (
      <BookingWizard
        vehicle={mockVehicle}
        initialDates={{
          startDate: '2024-02-01',
          endDate: '2024-02-05'
        }}
        onComplete={handleBookingComplete}
        onCancel={handleCancel}
      />
    );
  }

  if (activeWizard === 'operator') {
    return (
      <OperatorOnboardingWizard
        onComplete={handleOperatorComplete}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4">
          Wizard Components Demo
        </h1>
        <p className="text-lg text-neutral-600">
          Demonstration of the booking and operator onboarding wizards
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Booking Wizard Demo */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Booking Wizard
          </h2>
          <p className="text-neutral-600 mb-6">
            Multi-step wizard for creating vehicle bookings with dates, 
            cross-border travel, insurance, and payment processing.
          </p>
          
          <div className="space-y-3 mb-6">
            <h3 className="font-medium text-neutral-900">Features:</h3>
            <ul className="text-sm text-neutral-600 space-y-1">
              <li>• Date and location selection</li>
              <li>• Cross-border travel configuration</li>
              <li>• Insurance product selection</li>
              <li>• Payment processing with escrow</li>
              <li>• Booking confirmation and summary</li>
            </ul>
          </div>

          <Button 
            variant="accent" 
            onClick={() => setActiveWizard('booking')}
            className="w-full"
          >
            Start Booking Wizard
          </Button>
        </div>

        {/* Operator Onboarding Demo */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            Operator Onboarding Wizard
          </h2>
          <p className="text-neutral-600 mb-6">
            Complete onboarding process for new vehicle operators including 
            business registration, document verification, and fleet setup.
          </p>
          
          <div className="space-y-3 mb-6">
            <h3 className="font-medium text-neutral-900">Features:</h3>
            <ul className="text-sm text-neutral-600 space-y-1">
              <li>• Business information collection</li>
              <li>• Document upload and verification</li>
              <li>• KYC and trust score tracking</li>
              <li>• Fleet vehicle management</li>
              <li>• Operating area configuration</li>
            </ul>
          </div>

          <Button 
            variant="accent" 
            onClick={() => setActiveWizard('operator')}
            className="w-full"
          >
            Start Operator Onboarding
          </Button>
        </div>
      </div>

      {/* Wizard Framework Features */}
      <div className="mt-12 bg-neutral-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">
          Wizard Framework Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-neutral-900 mb-2">Progress Tracking</h3>
            <p className="text-sm text-neutral-600">
              Visual progress indicator showing completed, current, and upcoming steps
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-neutral-900 mb-2">Data Persistence</h3>
            <p className="text-sm text-neutral-600">
              Automatic saving to localStorage with recovery on page reload
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-neutral-900 mb-2">Conditional Steps</h3>
            <p className="text-sm text-neutral-600">
              Steps can be shown/hidden based on previous selections
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-neutral-900 mb-2">Validation</h3>
            <p className="text-sm text-neutral-600">
              Step-by-step validation with async support for API calls
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-neutral-900 mb-2">Navigation</h3>
            <p className="text-sm text-neutral-600">
              Forward/backward navigation with validation enforcement
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-neutral-900 mb-2">Responsive Design</h3>
            <p className="text-sm text-neutral-600">
              Mobile-friendly design that works on all screen sizes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};