import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookingFlow } from '../components/booking';
import { Vehicle } from '../types/vehicle';
import { BookingLocations } from '../schemas/booking-schemas';

// Mock vehicle data - in a real app this would come from API
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

export function BookingPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();

  const handleBookingComplete = (bookingData: any) => {
    console.log('Booking completed:', bookingData);
    // In a real app, this would save to backend
    alert('Booking created successfully! You will receive a confirmation email shortly.');
    navigate('/dashboard');
  };

  const handleCancel = () => {
    navigate('/search');
  };

  // In a real app, you would fetch the vehicle data based on vehicleId
  // For now, we'll use the mock data
  const vehicle = mockVehicle;

  // Mock locations for the booking flow
  const mockLocations: BookingLocations = {
    pickup: {
      latitude: vehicle.location.latitude,
      longitude: vehicle.location.longitude,
      address: vehicle.location.address,
      city: vehicle.location.city,
      country: vehicle.location.country,
      instructions: 'Please arrive 15 minutes early for vehicle inspection'
    },
    dropoff: {
      latitude: vehicle.location.latitude,
      longitude: vehicle.location.longitude,
      address: vehicle.location.address,
      city: vehicle.location.city,
      country: vehicle.location.country,
      instructions: 'Return with same fuel level as pickup'
    },
    same_location: true
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <BookingFlow
          vehicle={vehicle}
          locations={mockLocations}
          userCountry="ZA"
          onBookingComplete={handleBookingComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}