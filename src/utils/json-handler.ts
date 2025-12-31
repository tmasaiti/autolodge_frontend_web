/**
 * JSON Data Handler Utilities
 * Provides validation, transformation, and serialization functions for complex JSON data
 * Maps to database JSON field constraints from autolodge_dev.sql
 */

import Ajv, { JSONSchemaType, ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

// Import all schemas
import {
  UserProfile,
  UserPreferences,
  UserVerificationStatus,
  userProfileSchema,
  userPreferencesSchema,
  userVerificationStatusSchema
} from '../schemas/user-schemas';

import {
  VehicleSpecifications,
  VehiclePricing,
  VehicleAvailability,
  CrossBorderConfig,
  VehicleVerification,
  VehicleLocation,
  vehicleSpecificationsSchema,
  vehiclePricingSchema,
  vehicleAvailabilitySchema,
  crossBorderConfigSchema,
  vehicleVerificationSchema,
  vehicleLocationSchema
} from '../schemas/vehicle-schemas';

import {
  BookingLocations,
  BookingPricing,
  CrossBorderDetails,
  BookingAddOns,
  RentalAgreement,
  BookingTimelineEvent,
  bookingLocationsSchema,
  bookingPricingSchema,
  crossBorderDetailsSchema,
  bookingAddOnsSchema,
  rentalAgreementSchema,
  bookingTimelineEventSchema
} from '../schemas/booking-schemas';

import {
  DisputeEvidenceData,
  DisputeEvidenceMetadata,
  DisputePatternData,
  disputeEvidenceDataSchema,
  disputeEvidenceMetadataSchema,
  disputePatternDataSchema
} from '../schemas/dispute-schemas';

import {
  InsuranceCoverageLimits,
  InsurancePremiumCalculation,
  InsurancePolicyCoverageDetails,
  InsuranceClaimData,
  insuranceCoverageLimitsSchema,
  insurancePremiumCalculationSchema,
  insurancePolicyCoverageDetailsSchema,
  insuranceClaimDataSchema
} from '../schemas/insurance-schemas';

import {
  ComplianceRequirements,
  ComplianceViolations,
  ComplianceReportData,
  complianceRequirementsSchema,
  complianceViolationsSchema,
  complianceReportDataSchema
} from '../schemas/compliance-schemas';

// JSON validation error class
export class JSONValidationError extends Error {
  public readonly errors: ErrorObject[];
  public readonly field: string;
  public readonly receivedValue: unknown;

  constructor(field: string, errors: ErrorObject[], receivedValue: unknown) {
    const errorMessages = errors.map(err => `${err.instancePath || field}: ${err.message}`).join(', ');
    super(`JSON validation failed for ${field}: ${errorMessages}`);
    this.name = 'JSONValidationError';
    this.errors = errors;
    this.field = field;
    this.receivedValue = receivedValue;
  }
}

// JSON transformation error class
export class JSONTransformationError extends Error {
  public readonly field: string;
  public readonly originalError: Error;

  constructor(field: string, originalError: Error) {
    super(`JSON transformation failed for ${field}: ${originalError.message}`);
    this.name = 'JSONTransformationError';
    this.field = field;
    this.originalError = originalError;
  }
}

// Generic JSON data handler interface
export interface JSONDataHandler<T> {
  validate: (data: unknown) => T;
  transform: (data: T) => T;
  serialize: (data: T) => string;
  deserialize: (json: string) => T;
  getDefaultValue: () => T;
}

// Base JSON handler class
class BaseJSONHandler<T> implements JSONDataHandler<T> {
  private validator: ValidateFunction<T>;
  private fieldName: string;
  private defaultValueFactory: () => T;

  constructor(
    schema: JSONSchemaType<T>,
    fieldName: string,
    defaultValueFactory: () => T
  ) {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    this.validator = ajv.compile(schema);
    this.fieldName = fieldName;
    this.defaultValueFactory = defaultValueFactory;
  }

  validate(data: unknown): T {
    try {
      if (!this.validator(data)) {
        throw new JSONValidationError(
          this.fieldName,
          this.validator.errors || [],
          data
        );
      }
      return data;
    } catch (error) {
      if (error instanceof JSONValidationError) {
        throw error;
      }
      // Log error and return default value for graceful degradation
      console.error(`JSON validation error for ${this.fieldName}:`, error);
      return this.getDefaultValue();
    }
  }

  transform(data: T): T {
    try {
      // Apply any necessary transformations
      // For now, return data as-is, but this can be extended for specific transformations
      return data;
    } catch (error) {
      throw new JSONTransformationError(this.fieldName, error as Error);
    }
  }

  serialize(data: T): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      throw new JSONTransformationError(this.fieldName, error as Error);
    }
  }

  deserialize(json: string): T {
    try {
      const parsed = JSON.parse(json);
      return this.validate(parsed);
    } catch (error) {
      if (error instanceof JSONValidationError) {
        throw error;
      }
      throw new JSONTransformationError(this.fieldName, error as Error);
    }
  }

  getDefaultValue(): T {
    return this.defaultValueFactory();
  }
}

// User profile handler
export const userProfileHandler = new BaseJSONHandler<UserProfile>(
  userProfileSchema,
  'user_profile',
  () => ({
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-01-01',
    nationality: 'ZA',
    address: {
      latitude: -26.2041,
      longitude: 28.0473,
      city: 'Johannesburg',
      country: 'ZA'
    }
  })
);

// User preferences handler
export const userPreferencesHandler = new BaseJSONHandler<UserPreferences>(
  userPreferencesSchema,
  'user_preferences',
  () => ({
    language: 'en',
    currency: 'USD',
    timezone: 'Africa/Johannesburg',
    notifications: {
      email: true,
      sms: false,
      push: true,
      marketing: false
    },
    privacy: {
      profile_visibility: 'private',
      location_sharing: false,
      activity_tracking: true
    },
    accessibility: {
      high_contrast: false,
      large_text: false,
      screen_reader: false
    }
  })
);

// User verification status handler
export const userVerificationStatusHandler = new BaseJSONHandler<UserVerificationStatus>(
  userVerificationStatusSchema,
  'user_verification_status',
  () => ({
    identity_verified: false,
    license_verified: false,
    phone_verified: false,
    email_verified: false,
    verification_level: 'basic',
    kyc_status: 'pending',
    documents_submitted: [],
    trust_score: 0
  })
);

// Vehicle specifications handler
export const vehicleSpecificationsHandler = new BaseJSONHandler<VehicleSpecifications>(
  vehicleSpecificationsSchema,
  'vehicle_specifications',
  () => ({
    engine: {
      type: 'Unknown',
      displacement: 0,
      fuel_type: 'petrol'
    },
    transmission: 'manual',
    drivetrain: 'fwd',
    seats: 5,
    doors: 4,
    dimensions: {
      length_mm: 0,
      width_mm: 0,
      height_mm: 0
    },
    weight: {
      curb_weight_kg: 0,
      gross_weight_kg: 0,
      payload_kg: 0
    },
    features: [],
    safety_features: [],
    entertainment: [],
    comfort_features: []
  })
);

// Vehicle pricing handler
export const vehiclePricingHandler = new BaseJSONHandler<VehiclePricing>(
  vehiclePricingSchema,
  'vehicle_pricing',
  () => ({
    base_daily_rate: 0,
    currency: 'USD',
    seasonal_adjustments: {
      peak_multiplier: 1.0,
      off_peak_multiplier: 1.0,
      holiday_multiplier: 1.0
    },
    distance_pricing: {
      included_km_per_day: 200,
      excess_km_rate: 0
    },
    duration_discounts: {
      weekly_discount_percent: 0,
      monthly_discount_percent: 0
    },
    cross_border_surcharge: 0,
    security_deposit: 0
  })
);

// Vehicle availability handler
export const vehicleAvailabilityHandler = new BaseJSONHandler<VehicleAvailability>(
  vehicleAvailabilitySchema,
  'vehicle_availability',
  () => ({
    calendar: {},
    advance_booking_days: 30,
    minimum_rental_duration: 1,
    maximum_rental_duration: 30,
    blackout_dates: [],
    recurring_availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    }
  })
);

// Cross-border configuration handler
export const crossBorderConfigHandler = new BaseJSONHandler<CrossBorderConfig>(
  crossBorderConfigSchema,
  'cross_border_config',
  () => ({
    allowed: false,
    countries: [],
    surcharge_percentage: 0,
    required_documents: [],
    insurance_requirements: [],
    permit_processing_days: 0,
    restrictions: {
      minimum_age: 21,
      minimum_license_years: 2,
      deposit_multiplier: 1.0
    }
  })
);

// Vehicle verification handler
export const vehicleVerificationHandler = new BaseJSONHandler<VehicleVerification>(
  vehicleVerificationSchema,
  'vehicle_verification',
  () => ({
    registration_verified: false,
    insurance_verified: false,
    roadworthy_verified: false,
    ownership_verified: false,
    inspection_completed: false,
    verification_level: 'basic',
    documents: {
      registration_certificate: false,
      insurance_certificate: false,
      roadworthy_certificate: false,
      ownership_proof: false,
      inspection_report: false
    }
  })
);

// Vehicle location handler
export const vehicleLocationHandler = new BaseJSONHandler<VehicleLocation>(
  vehicleLocationSchema,
  'vehicle_location',
  () => ({
    latitude: -26.2041,
    longitude: 28.0473,
    city: 'Johannesburg',
    country: 'ZA'
  })
);

// Booking locations handler
export const bookingLocationsHandler = new BaseJSONHandler<BookingLocations>(
  bookingLocationsSchema,
  'booking_locations',
  () => ({
    pickup: {
      latitude: -26.2041,
      longitude: 28.0473
    },
    dropoff: {
      latitude: -26.2041,
      longitude: 28.0473
    },
    same_location: true
  })
);

// Booking pricing handler
export const bookingPricingHandler = new BaseJSONHandler<BookingPricing>(
  bookingPricingSchema,
  'booking_pricing',
  () => ({
    daily_rate: 0,
    total_days: 1,
    subtotal: 0,
    taxes: [],
    platform_fee: 0,
    security_deposit: 0,
    additional_fees: {},
    discounts: {},
    total_amount: 0,
    currency: 'USD'
  })
);

// Cross-border details handler
export const crossBorderDetailsHandler = new BaseJSONHandler<CrossBorderDetails>(
  crossBorderDetailsSchema,
  'cross_border_details',
  () => ({
    destination_countries: [],
    permit_required: false,
    additional_documents: [],
    surcharge_applied: 0,
    insurance_requirements: [],
    estimated_processing_days: 0
  })
);

// Booking add-ons handler
export const bookingAddOnsHandler = new BaseJSONHandler<BookingAddOns>(
  bookingAddOnsSchema,
  'booking_add_ons',
  () => ({})
);

// Rental agreement handler
export const rentalAgreementHandler = new BaseJSONHandler<RentalAgreement>(
  rentalAgreementSchema,
  'rental_agreement',
  () => ({
    template_id: 0,
    version: '1.0',
    terms_accepted: false,
    accepted_by: 0,
    liability_waivers: [],
    insurance_acknowledgment: false,
    damage_policy_accepted: false,
    fuel_policy: 'full_to_full',
    mileage_policy: {
      included_km: 200,
      excess_rate: 0
    }
  })
);

// Booking timeline event handler
export const bookingTimelineEventHandler = new BaseJSONHandler<BookingTimelineEvent>(
  bookingTimelineEventSchema,
  'booking_timeline_event',
  () => ({
    id: '',
    type: 'created',
    timestamp: new Date().toISOString(),
    description: '',
    performed_by: {
      id: 0,
      name: 'System',
      type: 'system'
    },
    visible_to: ['renter', 'operator']
  })
);

// Dispute evidence data handler
export const disputeEvidenceDataHandler = new BaseJSONHandler<DisputeEvidenceData>(
  disputeEvidenceDataSchema,
  'dispute_evidence_data',
  () => ({
    photos: [],
    documents: [],
    videos: [],
    text_statements: [],
    timeline: []
  })
);

// Dispute evidence metadata handler
export const disputeEvidenceMetadataHandler = new BaseJSONHandler<DisputeEvidenceMetadata>(
  disputeEvidenceMetadataSchema,
  'dispute_evidence_metadata',
  () => ({
    file_size: 0,
    file_type: 'unknown',
    checksum: '',
    upload_source: 'web',
    verification_status: 'pending'
  })
);

// Dispute pattern data handler
export const disputePatternDataHandler = new BaseJSONHandler<DisputePatternData>(
  disputePatternDataSchema,
  'dispute_pattern_data',
  () => ({
    pattern_type: 'frequent_disputes',
    risk_indicators: [],
    confidence_metrics: {
      data_quality_score: 0,
      sample_size: 0,
      statistical_significance: 0
    }
  })
);

// Insurance coverage limits handler
export const insuranceCoverageLimitsHandler = new BaseJSONHandler<InsuranceCoverageLimits>(
  insuranceCoverageLimitsSchema,
  'insurance_coverage_limits',
  () => ({
    liability_limit: 0,
    collision_deductible: 0,
    comprehensive_deductible: 0,
    personal_injury: 0,
    property_damage: 0,
    theft_coverage: 0,
    fire_coverage: 0,
    natural_disaster_coverage: 0,
    third_party_liability: 0,
    passenger_coverage: 0,
    roadside_assistance_limit: 0,
    rental_reimbursement_limit: 0,
    medical_expenses_limit: 0
  })
);

// Insurance premium calculation handler
export const insurancePremiumCalculationHandler = new BaseJSONHandler<InsurancePremiumCalculation>(
  insurancePremiumCalculationSchema,
  'insurance_premium_calculation',
  () => ({
    base_rate: 0,
    currency: 'USD',
    calculation_method: 'daily',
    age_multipliers: [],
    vehicle_category_multipliers: [],
    duration_discounts: [],
    location_multipliers: [],
    risk_factors: [],
    seasonal_adjustments: []
  })
);

// Insurance policy coverage details handler
export const insurancePolicyCoverageDetailsHandler = new BaseJSONHandler<InsurancePolicyCoverageDetails>(
  insurancePolicyCoverageDetailsSchema,
  'insurance_policy_coverage_details',
  () => ({
    policy_number: '',
    coverage_type: 'basic',
    effective_date: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    coverage_limits: insuranceCoverageLimitsHandler.getDefaultValue(),
    deductibles: {
      collision: 0,
      comprehensive: 0,
      theft: 0
    },
    exclusions: [],
    special_conditions: [],
    emergency_contacts: {
      claims_hotline: '',
      roadside_assistance: '',
      emergency_services: ''
    },
    claim_procedures: {
      reporting_deadline_hours: 24,
      required_documents: [],
      claim_process_steps: []
    },
    territorial_coverage: {
      countries: [],
      restrictions: []
    }
  })
);

// Insurance claim data handler
export const insuranceClaimDataHandler = new BaseJSONHandler<InsuranceClaimData>(
  insuranceClaimDataSchema,
  'insurance_claim_data',
  () => ({
    incident_details: {
      date_time: new Date().toISOString(),
      location: {
        latitude: -26.2041,
        longitude: 28.0473,
        address: ''
      },
      description: '',
      incident_type: 'other',
      witnesses: []
    },
    damage_assessment: {
      estimated_cost: 0,
      currency: 'USD',
      damage_photos: [],
      repair_estimates: []
    },
    parties_involved: {
      driver_details: {
        name: '',
        license_number: '',
        contact: ''
      }
    },
    supporting_documents: {}
  })
);

// Compliance requirements handler
export const complianceRequirementsHandler = new BaseJSONHandler<ComplianceRequirements>(
  complianceRequirementsSchema,
  'compliance_requirements',
  () => ({
    kyc_requirements: {
      identity_verification: false,
      address_verification: false,
      income_verification: false,
      document_types: [],
      minimum_verification_level: 'basic'
    },
    tax_requirements: {
      tax_registration_required: false,
      vat_registration_required: false,
      tax_reporting_frequency: 'annually',
      required_tax_documents: []
    },
    licensing_requirements: {
      business_license_required: false,
      vehicle_operator_license_required: false,
      insurance_requirements: [],
      minimum_insurance_coverage: 0
    },
    cross_border_requirements: {
      permits_required: false,
      customs_declarations: false,
      additional_insurance: false,
      restricted_countries: []
    },
    data_protection: {
      gdpr_compliance: false,
      data_retention_days: 365,
      consent_requirements: [],
      privacy_policy_required: true
    },
    financial_requirements: {
      escrow_account_required: false,
      minimum_capital: 0,
      currency: 'USD',
      audit_frequency: 'annually'
    }
  })
);

// Compliance violations handler
export const complianceViolationsHandler = new BaseJSONHandler<ComplianceViolations>(
  complianceViolationsSchema,
  'compliance_violations',
  () => ({
    violations: [],
    summary: {
      total_violations: 0,
      critical_violations: 0,
      overdue_violations: 0,
      compliance_score: 100
    },
    remediation_plan: {
      priority_actions: [],
      estimated_resolution_time: 0,
      required_resources: []
    }
  })
);

// Compliance report data handler
export const complianceReportDataHandler = new BaseJSONHandler<ComplianceReportData>(
  complianceReportDataSchema,
  'compliance_report_data',
  () => ({
    report_metadata: {
      report_id: '',
      report_type: 'compliance_violations',
      generated_by: 'system',
      generation_timestamp: new Date().toISOString(),
      data_period: {
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      },
      scope: {
        regions: [],
        entity_types: [],
        compliance_areas: []
      }
    },
    executive_summary: {
      key_findings: [],
      compliance_status: 'compliant',
      risk_level: 'low',
      recommendations: []
    },
    detailed_findings: [],
    metrics: {
      compliance_scores: [],
      violation_statistics: {
        total_violations: 0,
        violations_by_type: [],
        resolution_rates: {
          resolved: 0,
          pending: 0,
          overdue: 0
        }
      },
      financial_impact: {
        penalties_paid: 0,
        compliance_costs: 0,
        currency: 'USD'
      }
    },
    appendices: {
      supporting_documents: [],
      data_sources: [],
      methodology: '',
      limitations: []
    }
  })
);

// Utility functions for common operations
export const JSONHandlerUtils = {
  /**
   * Safely validate and transform any JSON data with error handling
   */
  safeValidate<T>(
    handler: JSONDataHandler<T>,
    data: unknown,
    fallbackToDefault = true
  ): { success: boolean; data: T; error?: JSONValidationError } {
    try {
      const validatedData = handler.validate(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof JSONValidationError) {
        const fallbackData = fallbackToDefault ? handler.getDefaultValue() : data as T;
        return { success: false, data: fallbackData, error };
      }
      throw error;
    }
  },

  /**
   * Batch validate multiple JSON fields
   */
  batchValidate(
    validations: Array<{
      handler: JSONDataHandler<any>;
      data: unknown;
      fieldName: string;
    }>
  ): { success: boolean; results: Record<string, any>; errors: Record<string, JSONValidationError> } {
    const results: Record<string, any> = {};
    const errors: Record<string, JSONValidationError> = {};
    let allSuccess = true;

    for (const { handler, data, fieldName } of validations) {
      const result = this.safeValidate(handler, data);
      results[fieldName] = result.data;
      if (!result.success && result.error) {
        errors[fieldName] = result.error;
        allSuccess = false;
      }
    }

    return { success: allSuccess, results, errors };
  },

  /**
   * Create a type-safe JSON handler registry
   */
  createHandlerRegistry() {
    return {
      // User handlers
      userProfile: userProfileHandler,
      userPreferences: userPreferencesHandler,
      userVerificationStatus: userVerificationStatusHandler,

      // Vehicle handlers
      vehicleSpecifications: vehicleSpecificationsHandler,
      vehiclePricing: vehiclePricingHandler,
      vehicleAvailability: vehicleAvailabilityHandler,
      crossBorderConfig: crossBorderConfigHandler,
      vehicleVerification: vehicleVerificationHandler,
      vehicleLocation: vehicleLocationHandler,

      // Booking handlers
      bookingLocations: bookingLocationsHandler,
      bookingPricing: bookingPricingHandler,
      crossBorderDetails: crossBorderDetailsHandler,
      bookingAddOns: bookingAddOnsHandler,
      rentalAgreement: rentalAgreementHandler,
      bookingTimelineEvent: bookingTimelineEventHandler,

      // Dispute handlers
      disputeEvidenceData: disputeEvidenceDataHandler,
      disputeEvidenceMetadata: disputeEvidenceMetadataHandler,
      disputePatternData: disputePatternDataHandler,

      // Insurance handlers
      insuranceCoverageLimits: insuranceCoverageLimitsHandler,
      insurancePremiumCalculation: insurancePremiumCalculationHandler,
      insurancePolicyCoverageDetails: insurancePolicyCoverageDetailsHandler,
      insuranceClaimData: insuranceClaimDataHandler,

      // Compliance handlers
      complianceRequirements: complianceRequirementsHandler,
      complianceViolations: complianceViolationsHandler,
      complianceReportData: complianceReportDataHandler
    };
  }
};

// Export the handler registry for easy access
export const jsonHandlers = JSONHandlerUtils.createHandlerRegistry();