/**
 * React hook for using JSON handlers in components
 * Provides type-safe JSON validation and error handling
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  JSONDataHandler, 
  JSONValidationError, 
  JSONTransformationError,
  JSONHandlerUtils,
  jsonHandlers 
} from '../utils/json-handler';

export interface UseJSONHandlerResult<T> {
  data: T;
  isValid: boolean;
  error: JSONValidationError | JSONTransformationError | null;
  validate: (newData: unknown) => boolean;
  transform: (newData: T) => T;
  serialize: () => string;
  deserialize: (json: string) => boolean;
  reset: () => void;
}

/**
 * Hook for handling JSON data with validation and error management
 */
export function useJSONHandler<T>(
  handler: JSONDataHandler<T>,
  initialData?: unknown
): UseJSONHandlerResult<T> {
  const [data, setData] = useState<T>(() => {
    if (initialData !== undefined) {
      const result = JSONHandlerUtils.safeValidate(handler, initialData);
      return result.data;
    }
    return handler.getDefaultValue();
  });

  const [error, setError] = useState<JSONValidationError | JSONTransformationError | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);

  const validate = useCallback((newData: unknown): boolean => {
    try {
      const validatedData = handler.validate(newData);
      setData(validatedData);
      setError(null);
      setIsValid(true);
      return true;
    } catch (err) {
      if (err instanceof JSONValidationError || err instanceof JSONTransformationError) {
        setError(err);
        setIsValid(false);
        return false;
      }
      throw err;
    }
  }, [handler]);

  const transform = useCallback((newData: T): T => {
    try {
      const transformedData = handler.transform(newData);
      setData(transformedData);
      setError(null);
      setIsValid(true);
      return transformedData;
    } catch (err) {
      if (err instanceof JSONTransformationError) {
        setError(err);
        setIsValid(false);
        return newData; // Return original data on transformation error
      }
      throw err;
    }
  }, [handler]);

  const serialize = useCallback((): string => {
    try {
      return handler.serialize(data);
    } catch (err) {
      if (err instanceof JSONTransformationError) {
        setError(err);
        setIsValid(false);
        return '{}';
      }
      throw err;
    }
  }, [handler, data]);

  const deserialize = useCallback((json: string): boolean => {
    try {
      const deserializedData = handler.deserialize(json);
      setData(deserializedData);
      setError(null);
      setIsValid(true);
      return true;
    } catch (err) {
      if (err instanceof JSONValidationError || err instanceof JSONTransformationError) {
        setError(err);
        setIsValid(false);
        return false;
      }
      throw err;
    }
  }, [handler]);

  const reset = useCallback(() => {
    setData(handler.getDefaultValue());
    setError(null);
    setIsValid(true);
  }, [handler]);

  return {
    data,
    isValid,
    error,
    validate,
    transform,
    serialize,
    deserialize,
    reset
  };
}

/**
 * Hook for handling multiple JSON fields with batch validation
 */
export function useBatchJSONHandler(
  handlers: Record<string, JSONDataHandler<any>>,
  initialData?: Record<string, unknown>
) {
  const [data, setData] = useState<Record<string, any>>(() => {
    const result: Record<string, any> = {};
    for (const [key, handler] of Object.entries(handlers)) {
      const initial = initialData?.[key];
      if (initial !== undefined) {
        const validationResult = JSONHandlerUtils.safeValidate(handler, initial);
        result[key] = validationResult.data;
      } else {
        result[key] = handler.getDefaultValue();
      }
    }
    return result;
  });

  const [errors, setErrors] = useState<Record<string, JSONValidationError>>({});
  const [isValid, setIsValid] = useState<boolean>(true);

  const validateAll = useCallback((newData: Record<string, unknown>): boolean => {
    const validations = Object.entries(handlers).map(([key, handler]) => ({
      handler,
      data: newData[key],
      fieldName: key
    }));

    const result = JSONHandlerUtils.batchValidate(validations);
    
    setData(result.results);
    setErrors(result.errors);
    setIsValid(result.success);
    
    return result.success;
  }, [handlers]);

  const validateField = useCallback((fieldName: string, fieldData: unknown): boolean => {
    const handler = handlers[fieldName];
    if (!handler) {
      console.warn(`No handler found for field: ${fieldName}`);
      return false;
    }

    const result = JSONHandlerUtils.safeValidate(handler, fieldData);
    
    setData(prev => ({ ...prev, [fieldName]: result.data }));
    
    if (result.error) {
      setErrors(prev => ({ ...prev, [fieldName]: result.error! }));
      setIsValid(false);
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      setIsValid(Object.keys(errors).length === 0);
    }

    return result.success;
  }, [handlers, errors]);

  const reset = useCallback(() => {
    const defaultData: Record<string, any> = {};
    for (const [key, handler] of Object.entries(handlers)) {
      defaultData[key] = handler.getDefaultValue();
    }
    setData(defaultData);
    setErrors({});
    setIsValid(true);
  }, [handlers]);

  return {
    data,
    errors,
    isValid,
    validateAll,
    validateField,
    reset
  };
}

/**
 * Predefined hooks for common JSON handlers
 */
export const useUserProfile = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.userProfile, initialData);

export const useUserPreferences = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.userPreferences, initialData);

export const useUserVerificationStatus = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.userVerificationStatus, initialData);

export const useVehicleSpecifications = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.vehicleSpecifications, initialData);

export const useVehiclePricing = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.vehiclePricing, initialData);

export const useVehicleAvailability = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.vehicleAvailability, initialData);

export const useCrossBorderConfig = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.crossBorderConfig, initialData);

export const useVehicleVerification = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.vehicleVerification, initialData);

export const useVehicleLocation = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.vehicleLocation, initialData);

export const useBookingLocations = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.bookingLocations, initialData);

export const useBookingPricing = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.bookingPricing, initialData);

export const useCrossBorderDetails = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.crossBorderDetails, initialData);

export const useBookingAddOns = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.bookingAddOns, initialData);

export const useRentalAgreement = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.rentalAgreement, initialData);

export const useBookingTimelineEvent = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.bookingTimelineEvent, initialData);

export const useDisputeEvidenceData = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.disputeEvidenceData, initialData);

export const useDisputeEvidenceMetadata = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.disputeEvidenceMetadata, initialData);

export const useDisputePatternData = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.disputePatternData, initialData);

export const useInsuranceCoverageLimits = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.insuranceCoverageLimits, initialData);

export const useInsurancePremiumCalculation = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.insurancePremiumCalculation, initialData);

export const useInsurancePolicyCoverageDetails = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.insurancePolicyCoverageDetails, initialData);

export const useInsuranceClaimData = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.insuranceClaimData, initialData);

export const useComplianceRequirements = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.complianceRequirements, initialData);

export const useComplianceViolations = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.complianceViolations, initialData);

export const useComplianceReportData = (initialData?: unknown) => 
  useJSONHandler(jsonHandlers.complianceReportData, initialData);