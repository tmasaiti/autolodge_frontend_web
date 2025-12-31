/**
 * Booking-related JSON schemas
 * Maps to bookings.date_range, bookings.locations, bookings.pricing, 
 * bookings.cross_border, bookings.add_ons, bookings.agreement, and bookings.timeline JSON fields
 */

import { JSONSchemaType } from 'ajv';
import { DateRange, dateRangeSchema, GeoLocation, geoLocationSchema, CurrencyAmount, currencyAmountSchema, SADCCountryCode } from './common-schemas';

// Booking locations schema - maps to bookings.locations JSON field
export interface BookingLocations {
  pickup: GeoLocation & {
    instructions?: string;
    contact_person?: string;
    contact_phone?: string;
  };
  dropoff: GeoLocation & {
    instructions?: string;
    contact_person?: string;
    contact_phone?: string;
  };
  same_location: boolean;
}

export const bookingLocationsSchema: JSONSchemaType<BookingLocations> = {
  type: 'object',
  properties: {
    pickup: {
      type: 'object',
      properties: {
        ...geoLocationSchema.properties,
        instructions: { type: 'string', nullable: true },
        contact_person: { type: 'string', nullable: true },
        contact_phone: { type: 'string', nullable: true }
      },
      required: ['latitude', 'longitude'],
      additionalProperties: false
    },
    dropoff: {
      type: 'object',
      properties: {
        ...geoLocationSchema.properties,
        instructions: { type: 'string', nullable: true },
        contact_person: { type: 'string', nullable: true },
        contact_phone: { type: 'string', nullable: true }
      },
      required: ['latitude', 'longitude'],
      additionalProperties: false
    },
    same_location: { type: 'boolean' }
  },
  required: ['pickup', 'dropoff', 'same_location'],
  additionalProperties: false
};

// Tax breakdown schema - used in booking pricing
export interface TaxBreakdown {
  tax_type: string;
  rate_percent: number;
  amount: number;
  currency: string;
  description?: string;
}

export const taxBreakdownSchema: JSONSchemaType<TaxBreakdown> = {
  type: 'object',
  properties: {
    tax_type: { type: 'string' },
    rate_percent: { type: 'number', minimum: 0, maximum: 100 },
    amount: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' },
    description: { type: 'string', nullable: true }
  },
  required: ['tax_type', 'rate_percent', 'amount', 'currency'],
  additionalProperties: false
};

// Booking pricing schema - maps to bookings.pricing JSON field
export interface BookingPricing {
  daily_rate: number;
  total_days: number;
  subtotal: number;
  taxes: TaxBreakdown[];
  platform_fee: number;
  security_deposit: number;
  cross_border_surcharge?: number;
  insurance_premium?: number;
  additional_fees: {
    cleaning_fee?: number;
    delivery_fee?: number;
    fuel_fee?: number;
    late_return_fee?: number;
  };
  discounts: {
    weekly_discount?: number;
    monthly_discount?: number;
    promotional_discount?: number;
    loyalty_discount?: number;
  };
  total_amount: number;
  currency: string;
  exchange_rate?: number;
  locked_at?: string;
}

export const bookingPricingSchema: JSONSchemaType<BookingPricing> = {
  type: 'object',
  properties: {
    daily_rate: { type: 'number', minimum: 0 },
    total_days: { type: 'number', minimum: 1 },
    subtotal: { type: 'number', minimum: 0 },
    taxes: { type: 'array', items: taxBreakdownSchema },
    platform_fee: { type: 'number', minimum: 0 },
    security_deposit: { type: 'number', minimum: 0 },
    cross_border_surcharge: { type: 'number', minimum: 0, nullable: true },
    insurance_premium: { type: 'number', minimum: 0, nullable: true },
    additional_fees: {
      type: 'object',
      properties: {
        cleaning_fee: { type: 'number', minimum: 0, nullable: true },
        delivery_fee: { type: 'number', minimum: 0, nullable: true },
        fuel_fee: { type: 'number', minimum: 0, nullable: true },
        late_return_fee: { type: 'number', minimum: 0, nullable: true }
      },
      required: [],
      additionalProperties: false
    },
    discounts: {
      type: 'object',
      properties: {
        weekly_discount: { type: 'number', minimum: 0, nullable: true },
        monthly_discount: { type: 'number', minimum: 0, nullable: true },
        promotional_discount: { type: 'number', minimum: 0, nullable: true },
        loyalty_discount: { type: 'number', minimum: 0, nullable: true }
      },
      required: [],
      additionalProperties: false
    },
    total_amount: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' },
    exchange_rate: { type: 'number', minimum: 0, nullable: true },
    locked_at: { type: 'string', format: 'date-time', nullable: true }
  },
  required: ['daily_rate', 'total_days', 'subtotal', 'taxes', 'platform_fee', 
            'security_deposit', 'additional_fees', 'discounts', 'total_amount', 'currency'],
  additionalProperties: false
};

// Cross-border details schema - maps to bookings.cross_border JSON field
export interface CrossBorderDetails {
  destination_countries: SADCCountryCode[];
  permit_required: boolean;
  permit_ids?: number[];
  additional_documents: string[];
  surcharge_applied: number;
  insurance_requirements: string[];
  estimated_processing_days: number;
  border_crossing_points?: {
    entry_point: string;
    exit_point: string;
    estimated_crossing_time: string;
  }[];
}

export const crossBorderDetailsSchema: JSONSchemaType<CrossBorderDetails> = {
  type: 'object',
  properties: {
    destination_countries: {
      type: 'array',
      items: { type: 'string', enum: ['AO', 'BW', 'CD', 'SZ', 'LS', 'MG', 'MW', 'MU', 'MZ', 'NA', 'SC', 'ZA', 'TZ', 'ZM', 'ZW'] }
    },
    permit_required: { type: 'boolean' },
    permit_ids: { type: 'array', items: { type: 'number' }, nullable: true },
    additional_documents: { type: 'array', items: { type: 'string' } },
    surcharge_applied: { type: 'number', minimum: 0 },
    insurance_requirements: { type: 'array', items: { type: 'string' } },
    estimated_processing_days: { type: 'number', minimum: 0 },
    border_crossing_points: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          entry_point: { type: 'string' },
          exit_point: { type: 'string' },
          estimated_crossing_time: { type: 'string' }
        },
        required: ['entry_point', 'exit_point', 'estimated_crossing_time'],
        additionalProperties: false
      },
      nullable: true
    }
  },
  required: ['destination_countries', 'permit_required', 'additional_documents', 
            'surcharge_applied', 'insurance_requirements', 'estimated_processing_days'],
  additionalProperties: false
};

// Add-ons schema - maps to bookings.add_ons JSON field
export interface BookingAddOns {
  insurance_product_id?: number;
  additional_driver?: {
    enabled: boolean;
    driver_details?: {
      name: string;
      license_number: string;
      age: number;
    };
    fee: number;
  };
  gps_navigation?: {
    enabled: boolean;
    fee: number;
  };
  child_seat?: {
    enabled: boolean;
    quantity: number;
    age_group: 'infant' | 'toddler' | 'booster';
    fee_per_item: number;
  };
  wifi_hotspot?: {
    enabled: boolean;
    data_limit_gb: number;
    fee: number;
  };
  roadside_assistance?: {
    enabled: boolean;
    coverage_level: 'basic' | 'premium';
    fee: number;
  };
}

export const bookingAddOnsSchema: JSONSchemaType<BookingAddOns> = {
  type: 'object',
  properties: {
    insurance_product_id: { type: 'number', nullable: true },
    additional_driver: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        driver_details: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            license_number: { type: 'string' },
            age: { type: 'number', minimum: 18 }
          },
          required: ['name', 'license_number', 'age'],
          additionalProperties: false,
          nullable: true
        },
        fee: { type: 'number', minimum: 0 }
      },
      required: ['enabled', 'fee'],
      additionalProperties: false,
      nullable: true
    },
    gps_navigation: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        fee: { type: 'number', minimum: 0 }
      },
      required: ['enabled', 'fee'],
      additionalProperties: false,
      nullable: true
    },
    child_seat: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        quantity: { type: 'number', minimum: 1 },
        age_group: { type: 'string', enum: ['infant', 'toddler', 'booster'] },
        fee_per_item: { type: 'number', minimum: 0 }
      },
      required: ['enabled', 'quantity', 'age_group', 'fee_per_item'],
      additionalProperties: false,
      nullable: true
    },
    wifi_hotspot: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        data_limit_gb: { type: 'number', minimum: 0 },
        fee: { type: 'number', minimum: 0 }
      },
      required: ['enabled', 'data_limit_gb', 'fee'],
      additionalProperties: false,
      nullable: true
    },
    roadside_assistance: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        coverage_level: { type: 'string', enum: ['basic', 'premium'] },
        fee: { type: 'number', minimum: 0 }
      },
      required: ['enabled', 'coverage_level', 'fee'],
      additionalProperties: false,
      nullable: true
    }
  },
  required: [],
  additionalProperties: false
};

// Rental agreement schema - maps to bookings.agreement JSON field
export interface RentalAgreement {
  template_id: number;
  version: string;
  terms_accepted: boolean;
  accepted_at?: string;
  accepted_by: number;
  digital_signature?: string;
  witness_signature?: string;
  special_conditions?: string[];
  liability_waivers: string[];
  insurance_acknowledgment: boolean;
  damage_policy_accepted: boolean;
  fuel_policy: 'full_to_full' | 'same_to_same' | 'prepaid';
  mileage_policy: {
    included_km: number;
    excess_rate: number;
  };
}

export const rentalAgreementSchema: JSONSchemaType<RentalAgreement> = {
  type: 'object',
  properties: {
    template_id: { type: 'number' },
    version: { type: 'string' },
    terms_accepted: { type: 'boolean' },
    accepted_at: { type: 'string', format: 'date-time', nullable: true },
    accepted_by: { type: 'number' },
    digital_signature: { type: 'string', nullable: true },
    witness_signature: { type: 'string', nullable: true },
    special_conditions: { type: 'array', items: { type: 'string' }, nullable: true },
    liability_waivers: { type: 'array', items: { type: 'string' } },
    insurance_acknowledgment: { type: 'boolean' },
    damage_policy_accepted: { type: 'boolean' },
    fuel_policy: { type: 'string', enum: ['full_to_full', 'same_to_same', 'prepaid'] },
    mileage_policy: {
      type: 'object',
      properties: {
        included_km: { type: 'number', minimum: 0 },
        excess_rate: { type: 'number', minimum: 0 }
      },
      required: ['included_km', 'excess_rate'],
      additionalProperties: false
    }
  },
  required: ['template_id', 'version', 'terms_accepted', 'accepted_by', 'liability_waivers', 
            'insurance_acknowledgment', 'damage_policy_accepted', 'fuel_policy', 'mileage_policy'],
  additionalProperties: false
};

// Booking timeline event schema - maps to bookings.timeline JSON field
export interface BookingTimelineEvent {
  id: string;
  type: 'created' | 'confirmed' | 'payment_captured' | 'pickup_scheduled' | 'picked_up' | 
        'return_scheduled' | 'returned' | 'completed' | 'cancelled' | 'disputed' | 'modified';
  timestamp: string;
  description: string;
  performed_by: {
    id: number;
    name: string;
    type: 'renter' | 'operator' | 'admin' | 'system';
  };
  metadata?: {
    [key: string]: any;
  };
  visible_to: ('renter' | 'operator' | 'admin')[];
}

export const bookingTimelineEventSchema: JSONSchemaType<BookingTimelineEvent> = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    type: { type: 'string', enum: ['created', 'confirmed', 'payment_captured', 'pickup_scheduled', 
                                   'picked_up', 'return_scheduled', 'returned', 'completed', 
                                   'cancelled', 'disputed', 'modified'] },
    timestamp: { type: 'string', format: 'date-time' },
    description: { type: 'string' },
    performed_by: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        type: { type: 'string', enum: ['renter', 'operator', 'admin', 'system'] }
      },
      required: ['id', 'name', 'type'],
      additionalProperties: false
    },
    metadata: {
      type: 'object',
      additionalProperties: true,
      nullable: true
    } as any,
    visible_to: {
      type: 'array',
      items: { type: 'string', enum: ['renter', 'operator', 'admin'] }
    }
  },
  required: ['id', 'type', 'timestamp', 'description', 'performed_by', 'visible_to'],
  additionalProperties: false
};