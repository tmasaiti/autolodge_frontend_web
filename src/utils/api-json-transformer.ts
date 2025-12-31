/**
 * API JSON Transformer Utilities
 * Handles JSON transformation between API responses and frontend data structures
 * Ensures data integrity when receiving JSON fields from autolodge_dev.sql database
 */

import { 
  JSONDataHandler, 
  JSONValidationError, 
  JSONHandlerUtils,
  jsonHandlers 
} from './json-handler';

// API response wrapper interface
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Transformed API response with validation results
export interface TransformedAPIResponse<T = any> extends APIResponse<T> {
  validationErrors?: Record<string, JSONValidationError> | Record<number, Record<string, JSONValidationError>>;
  hasValidationErrors: boolean;
}

/**
 * Transform API response data with JSON field validation
 */
export class APIJSONTransformer {
  /**
   * Transform a single entity with JSON fields
   */
  static transformEntity<T>(
    entity: any,
    jsonFieldMappings: Record<string, JSONDataHandler<any>>
  ): { transformedEntity: T; validationErrors: Record<string, JSONValidationError> } {
    const transformedEntity = { ...entity };
    const validationErrors: Record<string, JSONValidationError> = {};

    // Process each JSON field mapping
    for (const [fieldName, handler] of Object.entries(jsonFieldMappings)) {
      const fieldData = entity[fieldName];
      
      if (fieldData !== undefined && fieldData !== null) {
        const result = JSONHandlerUtils.safeValidate(handler, fieldData, true);
        transformedEntity[fieldName] = result.data;
        
        if (!result.success && result.error) {
          validationErrors[fieldName] = result.error;
        }
      } else {
        // Use default value for missing fields
        transformedEntity[fieldName] = handler.getDefaultValue();
      }
    }

    return { transformedEntity, validationErrors };
  }

  /**
   * Transform an array of entities with JSON fields
   */
  static transformEntityArray<T>(
    entities: any[],
    jsonFieldMappings: Record<string, JSONDataHandler<any>>
  ): { 
    transformedEntities: T[]; 
    validationErrors: Record<number, Record<string, JSONValidationError>> 
  } {
    const transformedEntities: T[] = [];
    const validationErrors: Record<number, Record<string, JSONValidationError>> = {};

    entities.forEach((entity, index) => {
      const result = this.transformEntity<T>(entity, jsonFieldMappings);
      transformedEntities.push(result.transformedEntity);
      
      if (Object.keys(result.validationErrors).length > 0) {
        validationErrors[index] = result.validationErrors;
      }
    });

    return { transformedEntities, validationErrors };
  }

  /**
   * Transform API response with automatic JSON field handling
   */
  static transformAPIResponse<T>(
    response: APIResponse,
    jsonFieldMappings: Record<string, JSONDataHandler<any>>,
    isArray = false
  ): TransformedAPIResponse<T> {
    if (!response.success || !response.data) {
      return {
        ...response,
        hasValidationErrors: false
      };
    }

    try {
      if (isArray) {
        const result = this.transformEntityArray<T>(response.data, jsonFieldMappings);
        return {
          ...response,
          data: result.transformedEntities as T,
          validationErrors: result.validationErrors,
          hasValidationErrors: Object.keys(result.validationErrors).length > 0
        };
      } else {
        const result = this.transformEntity<T>(response.data, jsonFieldMappings);
        return {
          ...response,
          data: result.transformedEntity,
          validationErrors: result.validationErrors,
          hasValidationErrors: Object.keys(result.validationErrors).length > 0
        };
      }
    } catch (error) {
      console.error('API JSON transformation error:', error);
      return {
        success: false,
        error: 'Data transformation failed',
        hasValidationErrors: true
      };
    }
  }
}

/**
 * Predefined transformers for common entities
 */
export const EntityTransformers = {
  /**
   * User entity transformer
   */
  user: (response: APIResponse, isArray = false) => 
    APIJSONTransformer.transformAPIResponse(response, {
      profile: jsonHandlers.userProfile,
      preferences: jsonHandlers.userPreferences,
      verification_status: jsonHandlers.userVerificationStatus
    }, isArray),

  /**
   * Vehicle entity transformer
   */
  vehicle: (response: APIResponse, isArray = false) => 
    APIJSONTransformer.transformAPIResponse(response, {
      specifications: jsonHandlers.vehicleSpecifications,
      pricing: jsonHandlers.vehiclePricing,
      availability: jsonHandlers.vehicleAvailability,
      cross_border_config: jsonHandlers.crossBorderConfig,
      verification: jsonHandlers.vehicleVerification,
      location: jsonHandlers.vehicleLocation
    }, isArray),

  /**
   * Booking entity transformer
   */
  booking: (response: APIResponse, isArray = false) => 
    APIJSONTransformer.transformAPIResponse(response, {
      date_range: jsonHandlers.bookingTimelineEvent, // Using timeline event for date range structure
      locations: jsonHandlers.bookingLocations,
      pricing: jsonHandlers.bookingPricing,
      cross_border: jsonHandlers.crossBorderDetails,
      add_ons: jsonHandlers.bookingAddOns,
      agreement: jsonHandlers.rentalAgreement,
      timeline: jsonHandlers.bookingTimelineEvent
    }, isArray),

  /**
   * Dispute entity transformer
   */
  dispute: (response: APIResponse, isArray = false) => 
    APIJSONTransformer.transformAPIResponse(response, {
      evidence: jsonHandlers.disputeEvidenceData,
      pattern_data: jsonHandlers.disputePatternData
    }, isArray),

  /**
   * Dispute evidence transformer
   */
  disputeEvidence: (response: APIResponse, isArray = false) => 
    APIJSONTransformer.transformAPIResponse(response, {
      metadata: jsonHandlers.disputeEvidenceMetadata
    }, isArray),

  /**
   * Insurance product transformer
   */
  insuranceProduct: (response: APIResponse, isArray = false) => 
    APIJSONTransformer.transformAPIResponse(response, {
      coverage_limits: jsonHandlers.insuranceCoverageLimits,
      premium_calculation: jsonHandlers.insurancePremiumCalculation
    }, isArray),

  /**
   * Insurance policy transformer
   */
  insurancePolicy: (response: APIResponse, isArray = false) => 
    APIJSONTransformer.transformAPIResponse(response, {
      coverage_details: jsonHandlers.insurancePolicyCoverageDetails
    }, isArray),

  /**
   * Insurance claim transformer
   */
  insuranceClaim: (response: APIResponse, isArray = false) => 
    APIJSONTransformer.transformAPIResponse(response, {
      claim_data: jsonHandlers.insuranceClaimData
    }, isArray),

  /**
   * Compliance check transformer
   */
  complianceCheck: (response: APIResponse, isArray = false) => 
    APIJSONTransformer.transformAPIResponse(response, {
      requirements: jsonHandlers.complianceRequirements,
      violations: jsonHandlers.complianceViolations
    }, isArray),

  /**
   * Compliance report transformer
   */
  complianceReport: (response: APIResponse, isArray = false) => 
    APIJSONTransformer.transformAPIResponse(response, {
      data: jsonHandlers.complianceReportData
    }, isArray)
};

/**
 * API client wrapper with automatic JSON transformation
 */
export class TransformingAPIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Generic API call with transformation
   */
  async call<T>(
    endpoint: string,
    options: RequestInit = {},
    transformer?: (response: APIResponse, isArray?: boolean) => TransformedAPIResponse<T>,
    isArray = false
  ): Promise<TransformedAPIResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const apiResponse: APIResponse = await response.json();

      if (transformer) {
        return transformer(apiResponse, isArray);
      }

      return {
        ...apiResponse,
        hasValidationErrors: false
      };
    } catch (error) {
      console.error('API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hasValidationErrors: false
      };
    }
  }

  // Predefined methods for common entities
  async getUsers() {
    return this.call('/users', { method: 'GET' }, EntityTransformers.user, true);
  }

  async getUser(id: number) {
    return this.call(`/users/${id}`, { method: 'GET' }, EntityTransformers.user);
  }

  async getVehicles(params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.call(`/vehicles${queryString}`, { method: 'GET' }, EntityTransformers.vehicle, true);
  }

  async getVehicle(id: number) {
    return this.call(`/vehicles/${id}`, { method: 'GET' }, EntityTransformers.vehicle);
  }

  async getBookings(userId?: number) {
    const endpoint = userId ? `/users/${userId}/bookings` : '/bookings';
    return this.call(endpoint, { method: 'GET' }, EntityTransformers.booking, true);
  }

  async getBooking(id: number) {
    return this.call(`/bookings/${id}`, { method: 'GET' }, EntityTransformers.booking);
  }

  async createBooking(bookingData: any) {
    return this.call('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    }, EntityTransformers.booking);
  }

  async getDisputes(bookingId?: number) {
    const endpoint = bookingId ? `/bookings/${bookingId}/disputes` : '/disputes';
    return this.call(endpoint, { method: 'GET' }, EntityTransformers.dispute, true);
  }

  async getDispute(id: number) {
    return this.call(`/disputes/${id}`, { method: 'GET' }, EntityTransformers.dispute);
  }

  async getInsuranceProducts(params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.call(`/insurance/products${queryString}`, { method: 'GET' }, EntityTransformers.insuranceProduct, true);
  }

  async getInsurancePolicies(userId?: number) {
    const endpoint = userId ? `/users/${userId}/insurance/policies` : '/insurance/policies';
    return this.call(endpoint, { method: 'GET' }, EntityTransformers.insurancePolicy, true);
  }

  async getComplianceChecks(entityId?: number, entityType?: string) {
    let endpoint = '/compliance/checks';
    if (entityId && entityType) {
      endpoint += `?entity_id=${entityId}&entity_type=${entityType}`;
    }
    return this.call(endpoint, { method: 'GET' }, EntityTransformers.complianceCheck, true);
  }

  async getComplianceReports(params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.call(`/compliance/reports${queryString}`, { method: 'GET' }, EntityTransformers.complianceReport, true);
  }
}

// Export a default instance
export const apiClient = new TransformingAPIClient(process.env.REACT_APP_API_BASE_URL || '/api');