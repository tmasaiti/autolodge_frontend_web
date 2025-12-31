/**
 * Insurance-related JSON schemas
 * Maps to insurance_products.coverage_limits, insurance_products.premium_calculation,
 * insurance_products.countries, insurance_products.vehicle_categories, and insurance_policies.coverage_details JSON fields
 */

import { JSONSchemaType } from 'ajv';
import { SADCCountryCode, sadcCountrySchema } from './common-schemas';

// Insurance coverage limits schema - maps to insurance_products.coverage_limits JSON field
export interface InsuranceCoverageLimits {
  liability_limit: number;
  collision_deductible: number;
  comprehensive_deductible: number;
  personal_injury: number;
  property_damage: number;
  theft_coverage: number;
  fire_coverage: number;
  natural_disaster_coverage: number;
  third_party_liability: number;
  passenger_coverage: number;
  roadside_assistance_limit: number;
  rental_reimbursement_limit: number;
  medical_expenses_limit: number;
}

export const insuranceCoverageLimitsSchema: JSONSchemaType<InsuranceCoverageLimits> = {
  type: 'object',
  properties: {
    liability_limit: { type: 'number', minimum: 0 },
    collision_deductible: { type: 'number', minimum: 0 },
    comprehensive_deductible: { type: 'number', minimum: 0 },
    personal_injury: { type: 'number', minimum: 0 },
    property_damage: { type: 'number', minimum: 0 },
    theft_coverage: { type: 'number', minimum: 0 },
    fire_coverage: { type: 'number', minimum: 0 },
    natural_disaster_coverage: { type: 'number', minimum: 0 },
    third_party_liability: { type: 'number', minimum: 0 },
    passenger_coverage: { type: 'number', minimum: 0 },
    roadside_assistance_limit: { type: 'number', minimum: 0 },
    rental_reimbursement_limit: { type: 'number', minimum: 0 },
    medical_expenses_limit: { type: 'number', minimum: 0 }
  },
  required: ['liability_limit', 'collision_deductible', 'comprehensive_deductible', 'personal_injury',
            'property_damage', 'theft_coverage', 'fire_coverage', 'natural_disaster_coverage',
            'third_party_liability', 'passenger_coverage', 'roadside_assistance_limit',
            'rental_reimbursement_limit', 'medical_expenses_limit'],
  additionalProperties: false
};

// Insurance premium calculation schema - maps to insurance_products.premium_calculation JSON field
export interface InsurancePremiumCalculation {
  base_rate: number;
  currency: string;
  calculation_method: 'daily' | 'percentage' | 'fixed';
  age_multipliers: {
    age_range: string;
    multiplier: number;
  }[];
  vehicle_category_multipliers: {
    category: string;
    multiplier: number;
  }[];
  duration_discounts: {
    min_days: number;
    max_days: number;
    discount_percent: number;
  }[];
  location_multipliers: {
    country: SADCCountryCode;
    multiplier: number;
  }[];
  risk_factors: {
    factor: string;
    multiplier: number;
    description: string;
  }[];
  seasonal_adjustments: {
    month: number;
    multiplier: number;
  }[];
}

export const insurancePremiumCalculationSchema: JSONSchemaType<InsurancePremiumCalculation> = {
  type: 'object',
  properties: {
    base_rate: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' },
    calculation_method: { type: 'string', enum: ['daily', 'percentage', 'fixed'] },
    age_multipliers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          age_range: { type: 'string' },
          multiplier: { type: 'number', minimum: 0 }
        },
        required: ['age_range', 'multiplier'],
        additionalProperties: false
      }
    },
    vehicle_category_multipliers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          multiplier: { type: 'number', minimum: 0 }
        },
        required: ['category', 'multiplier'],
        additionalProperties: false
      }
    },
    duration_discounts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          min_days: { type: 'number', minimum: 1 },
          max_days: { type: 'number', minimum: 1 },
          discount_percent: { type: 'number', minimum: 0, maximum: 100 }
        },
        required: ['min_days', 'max_days', 'discount_percent'],
        additionalProperties: false
      }
    },
    location_multipliers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          country: sadcCountrySchema,
          multiplier: { type: 'number', minimum: 0 }
        },
        required: ['country', 'multiplier'],
        additionalProperties: false
      }
    },
    risk_factors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          factor: { type: 'string' },
          multiplier: { type: 'number', minimum: 0 },
          description: { type: 'string' }
        },
        required: ['factor', 'multiplier', 'description'],
        additionalProperties: false
      }
    },
    seasonal_adjustments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          month: { type: 'number', minimum: 1, maximum: 12 },
          multiplier: { type: 'number', minimum: 0 }
        },
        required: ['month', 'multiplier'],
        additionalProperties: false
      }
    }
  },
  required: ['base_rate', 'currency', 'calculation_method', 'age_multipliers', 
            'vehicle_category_multipliers', 'duration_discounts', 'location_multipliers',
            'risk_factors', 'seasonal_adjustments'],
  additionalProperties: false
};

// Insurance policy coverage details schema - maps to insurance_policies.coverage_details JSON field
export interface InsurancePolicyCoverageDetails {
  policy_number: string;
  coverage_type: 'basic' | 'comprehensive' | 'third_party' | 'collision' | 'theft';
  effective_date: string;
  expiry_date: string;
  coverage_limits: InsuranceCoverageLimits;
  deductibles: {
    collision: number;
    comprehensive: number;
    theft: number;
  };
  exclusions: string[];
  special_conditions: string[];
  emergency_contacts: {
    claims_hotline: string;
    roadside_assistance: string;
    emergency_services: string;
  };
  claim_procedures: {
    reporting_deadline_hours: number;
    required_documents: string[];
    claim_process_steps: string[];
  };
  territorial_coverage: {
    countries: SADCCountryCode[];
    restrictions: string[];
  };
}

export const insurancePolicyCoverageDetailsSchema: JSONSchemaType<InsurancePolicyCoverageDetails> = {
  type: 'object',
  properties: {
    policy_number: { type: 'string' },
    coverage_type: { type: 'string', enum: ['basic', 'comprehensive', 'third_party', 'collision', 'theft'] },
    effective_date: { type: 'string', format: 'date-time' },
    expiry_date: { type: 'string', format: 'date-time' },
    coverage_limits: insuranceCoverageLimitsSchema,
    deductibles: {
      type: 'object',
      properties: {
        collision: { type: 'number', minimum: 0 },
        comprehensive: { type: 'number', minimum: 0 },
        theft: { type: 'number', minimum: 0 }
      },
      required: ['collision', 'comprehensive', 'theft'],
      additionalProperties: false
    },
    exclusions: { type: 'array', items: { type: 'string' } },
    special_conditions: { type: 'array', items: { type: 'string' } },
    emergency_contacts: {
      type: 'object',
      properties: {
        claims_hotline: { type: 'string' },
        roadside_assistance: { type: 'string' },
        emergency_services: { type: 'string' }
      },
      required: ['claims_hotline', 'roadside_assistance', 'emergency_services'],
      additionalProperties: false
    },
    claim_procedures: {
      type: 'object',
      properties: {
        reporting_deadline_hours: { type: 'number', minimum: 1 },
        required_documents: { type: 'array', items: { type: 'string' } },
        claim_process_steps: { type: 'array', items: { type: 'string' } }
      },
      required: ['reporting_deadline_hours', 'required_documents', 'claim_process_steps'],
      additionalProperties: false
    },
    territorial_coverage: {
      type: 'object',
      properties: {
        countries: { type: 'array', items: sadcCountrySchema },
        restrictions: { type: 'array', items: { type: 'string' } }
      },
      required: ['countries', 'restrictions'],
      additionalProperties: false
    }
  },
  required: ['policy_number', 'coverage_type', 'effective_date', 'expiry_date', 'coverage_limits',
            'deductibles', 'exclusions', 'special_conditions', 'emergency_contacts',
            'claim_procedures', 'territorial_coverage'],
  additionalProperties: false
};

// Insurance claim data schema - used in insurance claims
export interface InsuranceClaimData {
  incident_details: {
    date_time: string;
    location: {
      latitude: number;
      longitude: number;
      address: string;
    };
    description: string;
    incident_type: 'accident' | 'theft' | 'vandalism' | 'natural_disaster' | 'mechanical_failure' | 'other';
    police_report_number?: string;
    witnesses: {
      name: string;
      contact: string;
      statement?: string;
    }[];
  };
  damage_assessment: {
    estimated_cost: number;
    currency: string;
    damage_photos: string[];
    repair_estimates: {
      provider: string;
      estimate_amount: number;
      estimate_date: string;
      estimate_document_url?: string;
    }[];
  };
  parties_involved: {
    driver_details: {
      name: string;
      license_number: string;
      contact: string;
    };
    third_parties?: {
      name: string;
      insurance_company?: string;
      policy_number?: string;
      contact: string;
    }[];
  };
  supporting_documents: {
    police_report?: string;
    medical_reports?: string[];
    repair_invoices?: string[];
    towing_receipts?: string[];
    other_documents?: string[];
  };
}

export const insuranceClaimDataSchema: JSONSchemaType<InsuranceClaimData> = {
  type: 'object',
  properties: {
    incident_details: {
      type: 'object',
      properties: {
        date_time: { type: 'string', format: 'date-time' },
        location: {
          type: 'object',
          properties: {
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
            address: { type: 'string' }
          },
          required: ['latitude', 'longitude', 'address'],
          additionalProperties: false
        },
        description: { type: 'string', minLength: 1 },
        incident_type: { type: 'string', enum: ['accident', 'theft', 'vandalism', 'natural_disaster', 'mechanical_failure', 'other'] },
        police_report_number: { type: 'string', nullable: true },
        witnesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              contact: { type: 'string' },
              statement: { type: 'string', nullable: true }
            },
            required: ['name', 'contact'],
            additionalProperties: false
          }
        }
      },
      required: ['date_time', 'location', 'description', 'incident_type', 'witnesses'],
      additionalProperties: false
    },
    damage_assessment: {
      type: 'object',
      properties: {
        estimated_cost: { type: 'number', minimum: 0 },
        currency: { type: 'string', pattern: '^[A-Z]{3}$' },
        damage_photos: { type: 'array', items: { type: 'string', format: 'uri' } },
        repair_estimates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              estimate_amount: { type: 'number', minimum: 0 },
              estimate_date: { type: 'string', format: 'date' },
              estimate_document_url: { type: 'string', format: 'uri', nullable: true }
            },
            required: ['provider', 'estimate_amount', 'estimate_date'],
            additionalProperties: false
          }
        }
      },
      required: ['estimated_cost', 'currency', 'damage_photos', 'repair_estimates'],
      additionalProperties: false
    },
    parties_involved: {
      type: 'object',
      properties: {
        driver_details: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            license_number: { type: 'string' },
            contact: { type: 'string' }
          },
          required: ['name', 'license_number', 'contact'],
          additionalProperties: false
        },
        third_parties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              insurance_company: { type: 'string', nullable: true },
              policy_number: { type: 'string', nullable: true },
              contact: { type: 'string' }
            },
            required: ['name', 'contact'],
            additionalProperties: false
          },
          nullable: true
        }
      },
      required: ['driver_details'],
      additionalProperties: false
    },
    supporting_documents: {
      type: 'object',
      properties: {
        police_report: { type: 'string', format: 'uri', nullable: true },
        medical_reports: { type: 'array', items: { type: 'string', format: 'uri' }, nullable: true },
        repair_invoices: { type: 'array', items: { type: 'string', format: 'uri' }, nullable: true },
        towing_receipts: { type: 'array', items: { type: 'string', format: 'uri' }, nullable: true },
        other_documents: { type: 'array', items: { type: 'string', format: 'uri' }, nullable: true }
      },
      required: [],
      additionalProperties: false
    }
  },
  required: ['incident_details', 'damage_assessment', 'parties_involved', 'supporting_documents'],
  additionalProperties: false
};