// Vehicle types for frontend application
// Maps to vehicles table structure from autolodge_dev.sql

export interface VehicleLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
}

export interface VehicleSpecifications {
  engine: {
    type: string;
    displacement: number;
    fuel_type: string;
  };
  transmission: string;
  seats: number;
  doors: number;
  features: string[];
  safety_features: string[];
  entertainment: string[];
}

export interface VehiclePricing {
  base_daily_rate: number;
  currency: string;
  seasonal_adjustments: {
    peak_multiplier: number;
    off_peak_multiplier: number;
  };
  distance_pricing: {
    included_km_per_day: number;
    excess_km_rate: number;
  };
  cross_border_surcharge: number;
  security_deposit: number;
}

export interface CrossBorderConfig {
  allowed: boolean;
  countries: string[];
  surcharge_percentage: number;
  required_documents: string[];
  insurance_requirements: string[];
}

export interface VehicleVerification {
  status: 'pending' | 'verified' | 'rejected';
  verified_at?: string;
  documents_verified: string[];
}

export interface VehiclePhoto {
  id: number;
  url: string;
  caption?: string;
  is_primary: boolean;
  order_index: number;
}

export interface AvailabilityConfig {
  calendar_type: 'always_available' | 'calendar_based' | 'request_based';
  advance_booking_days: number;
  minimum_rental_days: number;
  maximum_rental_days: number;
  blocked_dates: string[];
  available_times: {
    start_time: string;
    end_time: string;
  };
}

export interface Vehicle {
  id: number;
  operator_id: number;
  registration: string;
  category: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  specifications: VehicleSpecifications;
  pricing: VehiclePricing;
  availability: AvailabilityConfig;
  cross_border_config: CrossBorderConfig;
  verification: VehicleVerification;
  status: string;
  location: VehicleLocation;
  description?: string;
  photos: VehiclePhoto[];
  created_at: string;
  updated_at: string;
}