/**
 * Vehicle-related JSON schemas
 * Maps to vehicles.specifications, vehicles.pricing, vehicles.availability, 
 * vehicles.cross_border_config, and vehicles.verification JSON fields
 */

import { JSONSchemaType } from 'ajv';
import { GeoLocation, geoLocationSchema, CurrencyAmount, currencyAmountSchema, SADCCountryCode, sadcCountrySchema } from './common-schemas';

// Vehicle specifications schema - maps to vehicles.specifications JSON field
export interface VehicleSpecifications {
  engine: {
    type: string;
    displacement: number;
    fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    power_hp?: number;
    torque_nm?: number;
  };
  transmission: 'manual' | 'automatic' | 'cvt';
  drivetrain: 'fwd' | 'rwd' | 'awd' | '4wd';
  seats: number;
  doors: number;
  fuel_capacity?: number;
  range_km?: number; // For electric vehicles
  dimensions: {
    length_mm: number;
    width_mm: number;
    height_mm: number;
    wheelbase_mm?: number;
  };
  weight: {
    curb_weight_kg: number;
    gross_weight_kg: number;
    payload_kg: number;
  };
  features: string[];
  safety_features: string[];
  entertainment: string[];
  comfort_features: string[];
}

export const vehicleSpecificationsSchema: JSONSchemaType<VehicleSpecifications> = {
  type: 'object',
  properties: {
    engine: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        displacement: { type: 'number', minimum: 0 },
        fuel_type: { type: 'string', enum: ['petrol', 'diesel', 'electric', 'hybrid'] },
        power_hp: { type: 'number', minimum: 0, nullable: true },
        torque_nm: { type: 'number', minimum: 0, nullable: true }
      },
      required: ['type', 'displacement', 'fuel_type'],
      additionalProperties: false
    },
    transmission: { type: 'string', enum: ['manual', 'automatic', 'cvt'] },
    drivetrain: { type: 'string', enum: ['fwd', 'rwd', 'awd', '4wd'] },
    seats: { type: 'number', minimum: 1, maximum: 50 },
    doors: { type: 'number', minimum: 2, maximum: 6 },
    fuel_capacity: { type: 'number', minimum: 0, nullable: true },
    range_km: { type: 'number', minimum: 0, nullable: true },
    dimensions: {
      type: 'object',
      properties: {
        length_mm: { type: 'number', minimum: 0 },
        width_mm: { type: 'number', minimum: 0 },
        height_mm: { type: 'number', minimum: 0 },
        wheelbase_mm: { type: 'number', minimum: 0, nullable: true }
      },
      required: ['length_mm', 'width_mm', 'height_mm'],
      additionalProperties: false
    },
    weight: {
      type: 'object',
      properties: {
        curb_weight_kg: { type: 'number', minimum: 0 },
        gross_weight_kg: { type: 'number', minimum: 0 },
        payload_kg: { type: 'number', minimum: 0 }
      },
      required: ['curb_weight_kg', 'gross_weight_kg', 'payload_kg'],
      additionalProperties: false
    },
    features: { type: 'array', items: { type: 'string' } },
    safety_features: { type: 'array', items: { type: 'string' } },
    entertainment: { type: 'array', items: { type: 'string' } },
    comfort_features: { type: 'array', items: { type: 'string' } }
  },
  required: ['engine', 'transmission', 'drivetrain', 'seats', 'doors', 'dimensions', 'weight', 
            'features', 'safety_features', 'entertainment', 'comfort_features'],
  additionalProperties: false
};

// Vehicle pricing schema - maps to vehicles.pricing JSON field
export interface VehiclePricing {
  base_daily_rate: number;
  currency: string;
  seasonal_adjustments: {
    peak_multiplier: number;
    off_peak_multiplier: number;
    holiday_multiplier: number;
  };
  distance_pricing: {
    included_km_per_day: number;
    excess_km_rate: number;
  };
  duration_discounts: {
    weekly_discount_percent: number;
    monthly_discount_percent: number;
  };
  cross_border_surcharge: number;
  security_deposit: number;
  cleaning_fee?: number;
  delivery_fee?: number;
  late_return_fee_per_hour?: number;
}

export const vehiclePricingSchema: JSONSchemaType<VehiclePricing> = {
  type: 'object',
  properties: {
    base_daily_rate: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' },
    seasonal_adjustments: {
      type: 'object',
      properties: {
        peak_multiplier: { type: 'number', minimum: 0 },
        off_peak_multiplier: { type: 'number', minimum: 0 },
        holiday_multiplier: { type: 'number', minimum: 0 }
      },
      required: ['peak_multiplier', 'off_peak_multiplier', 'holiday_multiplier'],
      additionalProperties: false
    },
    distance_pricing: {
      type: 'object',
      properties: {
        included_km_per_day: { type: 'number', minimum: 0 },
        excess_km_rate: { type: 'number', minimum: 0 }
      },
      required: ['included_km_per_day', 'excess_km_rate'],
      additionalProperties: false
    },
    duration_discounts: {
      type: 'object',
      properties: {
        weekly_discount_percent: { type: 'number', minimum: 0, maximum: 100 },
        monthly_discount_percent: { type: 'number', minimum: 0, maximum: 100 }
      },
      required: ['weekly_discount_percent', 'monthly_discount_percent'],
      additionalProperties: false
    },
    cross_border_surcharge: { type: 'number', minimum: 0 },
    security_deposit: { type: 'number', minimum: 0 },
    cleaning_fee: { type: 'number', minimum: 0, nullable: true },
    delivery_fee: { type: 'number', minimum: 0, nullable: true },
    late_return_fee_per_hour: { type: 'number', minimum: 0, nullable: true }
  },
  required: ['base_daily_rate', 'currency', 'seasonal_adjustments', 'distance_pricing', 
            'duration_discounts', 'cross_border_surcharge', 'security_deposit'],
  additionalProperties: false
};

// Vehicle availability schema - maps to vehicles.availability JSON field
export interface VehicleAvailability {
  calendar: {
    [date: string]: {
      available: boolean;
      price_multiplier?: number;
      minimum_rental_days?: number;
      blocked_reason?: string;
    };
  };
  advance_booking_days: number;
  minimum_rental_duration: number;
  maximum_rental_duration: number;
  blackout_dates: string[];
  recurring_availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
}

export const vehicleAvailabilitySchema: JSONSchemaType<VehicleAvailability> = {
  type: 'object',
  properties: {
    calendar: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          available: { type: 'boolean' },
          price_multiplier: { type: 'number', minimum: 0, nullable: true },
          minimum_rental_days: { type: 'number', minimum: 1, nullable: true },
          blocked_reason: { type: 'string', nullable: true }
        },
        required: ['available'],
        additionalProperties: false
      }
    } as any,
    advance_booking_days: { type: 'number', minimum: 0 },
    minimum_rental_duration: { type: 'number', minimum: 1 },
    maximum_rental_duration: { type: 'number', minimum: 1 },
    blackout_dates: { type: 'array', items: { type: 'string', format: 'date' } },
    recurring_availability: {
      type: 'object',
      properties: {
        monday: { type: 'boolean' },
        tuesday: { type: 'boolean' },
        wednesday: { type: 'boolean' },
        thursday: { type: 'boolean' },
        friday: { type: 'boolean' },
        saturday: { type: 'boolean' },
        sunday: { type: 'boolean' }
      },
      required: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      additionalProperties: false
    }
  },
  required: ['calendar', 'advance_booking_days', 'minimum_rental_duration', 
            'maximum_rental_duration', 'blackout_dates', 'recurring_availability'],
  additionalProperties: false
};

// Cross-border configuration schema - maps to vehicles.cross_border_config JSON field
export interface CrossBorderConfig {
  allowed: boolean;
  countries: SADCCountryCode[];
  surcharge_percentage: number;
  required_documents: string[];
  insurance_requirements: string[];
  permit_processing_days: number;
  restrictions: {
    minimum_age: number;
    minimum_license_years: number;
    deposit_multiplier: number;
  };
}

export const crossBorderConfigSchema: JSONSchemaType<CrossBorderConfig> = {
  type: 'object',
  properties: {
    allowed: { type: 'boolean' },
    countries: { type: 'array', items: sadcCountrySchema },
    surcharge_percentage: { type: 'number', minimum: 0, maximum: 100 },
    required_documents: { type: 'array', items: { type: 'string' } },
    insurance_requirements: { type: 'array', items: { type: 'string' } },
    permit_processing_days: { type: 'number', minimum: 0 },
    restrictions: {
      type: 'object',
      properties: {
        minimum_age: { type: 'number', minimum: 18 },
        minimum_license_years: { type: 'number', minimum: 0 },
        deposit_multiplier: { type: 'number', minimum: 1 }
      },
      required: ['minimum_age', 'minimum_license_years', 'deposit_multiplier'],
      additionalProperties: false
    }
  },
  required: ['allowed', 'countries', 'surcharge_percentage', 'required_documents', 
            'insurance_requirements', 'permit_processing_days', 'restrictions'],
  additionalProperties: false
};

// Vehicle verification schema - maps to vehicles.verification JSON field
export interface VehicleVerification {
  registration_verified: boolean;
  insurance_verified: boolean;
  roadworthy_verified: boolean;
  ownership_verified: boolean;
  inspection_completed: boolean;
  verification_level: 'basic' | 'standard' | 'premium';
  documents: {
    registration_certificate: boolean;
    insurance_certificate: boolean;
    roadworthy_certificate: boolean;
    ownership_proof: boolean;
    inspection_report: boolean;
  };
  verification_date?: string;
  expiry_date?: string;
  next_inspection_due?: string;
}

export const vehicleVerificationSchema: JSONSchemaType<VehicleVerification> = {
  type: 'object',
  properties: {
    registration_verified: { type: 'boolean' },
    insurance_verified: { type: 'boolean' },
    roadworthy_verified: { type: 'boolean' },
    ownership_verified: { type: 'boolean' },
    inspection_completed: { type: 'boolean' },
    verification_level: { type: 'string', enum: ['basic', 'standard', 'premium'] },
    documents: {
      type: 'object',
      properties: {
        registration_certificate: { type: 'boolean' },
        insurance_certificate: { type: 'boolean' },
        roadworthy_certificate: { type: 'boolean' },
        ownership_proof: { type: 'boolean' },
        inspection_report: { type: 'boolean' }
      },
      required: ['registration_certificate', 'insurance_certificate', 'roadworthy_certificate', 
                'ownership_proof', 'inspection_report'],
      additionalProperties: false
    },
    verification_date: { type: 'string', format: 'date-time', nullable: true },
    expiry_date: { type: 'string', format: 'date-time', nullable: true },
    next_inspection_due: { type: 'string', format: 'date-time', nullable: true }
  },
  required: ['registration_verified', 'insurance_verified', 'roadworthy_verified', 
            'ownership_verified', 'inspection_completed', 'verification_level', 'documents'],
  additionalProperties: false
};

// Vehicle location schema - maps to vehicles.location JSON field
export interface VehicleLocation extends GeoLocation {
  pickup_instructions?: string;
  parking_details?: string;
  landmark_description?: string;
  access_hours?: {
    start_time: string;
    end_time: string;
    timezone: string;
  };
}

export const vehicleLocationSchema: JSONSchemaType<VehicleLocation> = {
  type: 'object',
  properties: {
    ...geoLocationSchema.properties,
    pickup_instructions: { type: 'string', nullable: true },
    parking_details: { type: 'string', nullable: true },
    landmark_description: { type: 'string', nullable: true },
    access_hours: {
      type: 'object',
      properties: {
        start_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        end_time: { type: 'string', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
        timezone: { type: 'string' }
      },
      required: ['start_time', 'end_time', 'timezone'],
      additionalProperties: false,
      nullable: true
    }
  },
  required: ['latitude', 'longitude'],
  additionalProperties: false
};