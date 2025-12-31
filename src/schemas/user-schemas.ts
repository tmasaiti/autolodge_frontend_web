/**
 * User-related JSON schemas
 * Maps to users.profile, users.preferences, and users.verification_status JSON fields
 */

import { JSONSchemaType } from 'ajv';
import { GeoLocation, geoLocationSchema } from './common-schemas';

// User preferences schema - maps to users.preferences JSON field
export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'private' | 'contacts_only';
    location_sharing: boolean;
    activity_tracking: boolean;
  };
  accessibility: {
    high_contrast: boolean;
    large_text: boolean;
    screen_reader: boolean;
  };
}

// User profile schema - maps to users.profile JSON field
export interface UserProfile {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  phone?: string;
  address: GeoLocation;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences?: UserPreferences;
}

// User verification status schema - maps to users.verification_status JSON field
export interface UserVerificationStatus {
  identity_verified: boolean;
  license_verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  verification_level: 'basic' | 'standard' | 'premium' | 'operator';
  kyc_status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'expired';
  documents_submitted: string[];
  verification_date?: string;
  expiry_date?: string;
  trust_score: number;
}

export const userPreferencesSchema: JSONSchemaType<UserPreferences> = {
  type: 'object',
  properties: {
    language: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' },
    timezone: { type: 'string' },
    notifications: {
      type: 'object',
      properties: {
        email: { type: 'boolean' },
        sms: { type: 'boolean' },
        push: { type: 'boolean' },
        marketing: { type: 'boolean' }
      },
      required: ['email', 'sms', 'push', 'marketing'],
      additionalProperties: false
    },
    privacy: {
      type: 'object',
      properties: {
        profile_visibility: { type: 'string', enum: ['public', 'private', 'contacts_only'] },
        location_sharing: { type: 'boolean' },
        activity_tracking: { type: 'boolean' }
      },
      required: ['profile_visibility', 'location_sharing', 'activity_tracking'],
      additionalProperties: false
    },
    accessibility: {
      type: 'object',
      properties: {
        high_contrast: { type: 'boolean' },
        large_text: { type: 'boolean' },
        screen_reader: { type: 'boolean' }
      },
      required: ['high_contrast', 'large_text', 'screen_reader'],
      additionalProperties: false
    }
  },
  required: ['language', 'currency', 'timezone', 'notifications', 'privacy', 'accessibility'],
  additionalProperties: false
};

export const userProfileSchema: JSONSchemaType<UserProfile> = {
  type: 'object',
  properties: {
    first_name: { type: 'string', minLength: 1, maxLength: 100 },
    last_name: { type: 'string', minLength: 1, maxLength: 100 },
    date_of_birth: { type: 'string', format: 'date' },
    nationality: { type: 'string', pattern: '^[A-Z]{2}$' },
    phone: { type: 'string', nullable: true },
    address: geoLocationSchema,
    emergency_contact: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        phone: { type: 'string', minLength: 1 },
        relationship: { type: 'string', minLength: 1 }
      },
      required: ['name', 'phone', 'relationship'],
      additionalProperties: false,
      nullable: true
    },
    preferences: {
      type: 'object',
      properties: userPreferencesSchema.properties,
      required: userPreferencesSchema.required,
      additionalProperties: false,
      nullable: true
    }
  },
  required: ['first_name', 'last_name', 'date_of_birth', 'nationality', 'address'],
  additionalProperties: false
};

export const userVerificationStatusSchema: JSONSchemaType<UserVerificationStatus> = {
  type: 'object',
  properties: {
    identity_verified: { type: 'boolean' },
    license_verified: { type: 'boolean' },
    phone_verified: { type: 'boolean' },
    email_verified: { type: 'boolean' },
    verification_level: { type: 'string', enum: ['basic', 'standard', 'premium', 'operator'] },
    kyc_status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'rejected', 'expired'] },
    documents_submitted: {
      type: 'array',
      items: { type: 'string' }
    },
    verification_date: { type: 'string', format: 'date-time', nullable: true },
    expiry_date: { type: 'string', format: 'date-time', nullable: true },
    trust_score: { type: 'number', minimum: 0, maximum: 100 }
  },
  required: ['identity_verified', 'license_verified', 'phone_verified', 'email_verified', 
            'verification_level', 'kyc_status', 'documents_submitted', 'trust_score'],
  additionalProperties: false
};