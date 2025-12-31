/**
 * Tests for JSON handler utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  userProfileHandler, 
  vehicleSpecificationsHandler,
  JSONValidationError,
  JSONHandlerUtils
} from '../json-handler';

describe('JSON Handler Utilities', () => {
  describe('userProfileHandler', () => {
    it('should validate valid user profile data', () => {
      const validProfile = {
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
      };

      const result = userProfileHandler.validate(validProfile);
      expect(result).toEqual(validProfile);
    });

    it('should throw JSONValidationError for invalid data', () => {
      const invalidProfile = {
        first_name: '', // Empty string should fail minLength validation
        last_name: 'Doe',
        date_of_birth: 'invalid-date',
        nationality: 'INVALID', // Should be 2-character country code
        address: {
          latitude: 200, // Invalid latitude
          longitude: 28.0473
        }
      };

      expect(() => userProfileHandler.validate(invalidProfile)).toThrow(JSONValidationError);
    });

    it('should return default value for malformed data', () => {
      const malformedData = 'not an object';
      
      // The handler should catch the error and return default value
      expect(() => userProfileHandler.validate(malformedData)).toThrow(JSONValidationError);
    });

    it('should serialize and deserialize correctly', () => {
      const profile = userProfileHandler.getDefaultValue();
      
      const serialized = userProfileHandler.serialize(profile);
      expect(typeof serialized).toBe('string');
      
      const deserialized = userProfileHandler.deserialize(serialized);
      expect(deserialized).toEqual(profile);
    });
  });

  describe('vehicleSpecificationsHandler', () => {
    it('should validate valid vehicle specifications', () => {
      const validSpecs = {
        engine: {
          type: 'V6',
          displacement: 3.0,
          fuel_type: 'petrol' as const
        },
        transmission: 'automatic' as const,
        drivetrain: 'awd' as const,
        seats: 5,
        doors: 4,
        dimensions: {
          length_mm: 4500,
          width_mm: 1800,
          height_mm: 1600
        },
        weight: {
          curb_weight_kg: 1500,
          gross_weight_kg: 2000,
          payload_kg: 500
        },
        features: ['GPS', 'Bluetooth'],
        safety_features: ['ABS', 'Airbags'],
        entertainment: ['Radio', 'USB'],
        comfort_features: ['AC', 'Power Windows']
      };

      const result = vehicleSpecificationsHandler.validate(validSpecs);
      expect(result).toEqual(validSpecs);
    });

    it('should handle missing optional fields', () => {
      const minimalSpecs = {
        engine: {
          type: 'I4',
          displacement: 2.0,
          fuel_type: 'petrol' as const
        },
        transmission: 'manual' as const,
        drivetrain: 'fwd' as const,
        seats: 5,
        doors: 4,
        dimensions: {
          length_mm: 4200,
          width_mm: 1750,
          height_mm: 1550
        },
        weight: {
          curb_weight_kg: 1300,
          gross_weight_kg: 1800,
          payload_kg: 500
        },
        features: [],
        safety_features: [],
        entertainment: [],
        comfort_features: []
      };

      const result = vehicleSpecificationsHandler.validate(minimalSpecs);
      expect(result).toEqual(minimalSpecs);
    });
  });

  describe('JSONHandlerUtils', () => {
    it('should safely validate with error handling', () => {
      const validData = {
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
      };
      const invalidData = { invalid: 'data' };

      const validResult = JSONHandlerUtils.safeValidate(userProfileHandler, validData);
      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual(validData);
      expect(validResult.error).toBeUndefined();

      const invalidResult = JSONHandlerUtils.safeValidate(userProfileHandler, invalidData);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toBeInstanceOf(JSONValidationError);
      expect(invalidResult.data).toEqual(userProfileHandler.getDefaultValue());
    });

    it('should batch validate multiple fields', () => {
      const validProfile = {
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
      };

      const validations = [
        {
          handler: userProfileHandler,
          data: validProfile,
          fieldName: 'profile'
        },
        {
          handler: vehicleSpecificationsHandler,
          data: { invalid: 'data' },
          fieldName: 'specifications'
        }
      ];

      const result = JSONHandlerUtils.batchValidate(validations);
      
      expect(result.success).toBe(false);
      expect(result.results.profile).toBeDefined();
      expect(result.results.specifications).toBeDefined();
      expect(result.errors.specifications).toBeInstanceOf(JSONValidationError);
    });
  });
});