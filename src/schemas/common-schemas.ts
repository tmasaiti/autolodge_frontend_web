/**
 * Common JSON schemas used across multiple entities
 * Based on autolodge_dev.sql database schema
 */

import { JSONSchemaType } from 'ajv';

// Geographic location schema - used in multiple tables
export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
}

export const geoLocationSchema: JSONSchemaType<GeoLocation> = {
  type: 'object',
  properties: {
    latitude: { type: 'number', minimum: -90, maximum: 90 },
    longitude: { type: 'number', minimum: -180, maximum: 180 },
    address: { type: 'string', nullable: true },
    city: { type: 'string', nullable: true },
    country: { type: 'string', nullable: true },
    postal_code: { type: 'string', nullable: true }
  },
  required: ['latitude', 'longitude'],
  additionalProperties: false
};

// Date range schema - used in bookings and availability
export interface DateRange {
  start_date: string;
  end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
}

export const dateRangeSchema: JSONSchemaType<DateRange> = {
  type: 'object',
  properties: {
    start_date: { type: 'string', format: 'date-time' },
    end_date: { type: 'string', format: 'date-time' },
    actual_start_date: { type: 'string', format: 'date-time', nullable: true },
    actual_end_date: { type: 'string', format: 'date-time', nullable: true }
  },
  required: ['start_date', 'end_date'],
  additionalProperties: false
};

// Digital signature schema - used in handovers and returns
export interface DigitalSignature {
  signature_data: string;
  signer_name: string;
  signer_id: number;
  timestamp: string;
  device_info?: string;
  ip_address?: string;
}

export const digitalSignatureSchema: JSONSchemaType<DigitalSignature> = {
  type: 'object',
  properties: {
    signature_data: { type: 'string' },
    signer_name: { type: 'string' },
    signer_id: { type: 'number' },
    timestamp: { type: 'string', format: 'date-time' },
    device_info: { type: 'string', nullable: true },
    ip_address: { type: 'string', nullable: true }
  },
  required: ['signature_data', 'signer_name', 'signer_id', 'timestamp'],
  additionalProperties: false
};

// Currency amount schema - used in pricing and payments
export interface CurrencyAmount {
  amount: number;
  currency: string;
  exchange_rate?: number;
  original_amount?: number;
  original_currency?: string;
}

export const currencyAmountSchema: JSONSchemaType<CurrencyAmount> = {
  type: 'object',
  properties: {
    amount: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' }, // ISO 4217 currency codes
    exchange_rate: { type: 'number', minimum: 0, nullable: true },
    original_amount: { type: 'number', minimum: 0, nullable: true },
    original_currency: { type: 'string', pattern: '^[A-Z]{3}$', nullable: true }
  },
  required: ['amount', 'currency'],
  additionalProperties: false
};

// SADC country codes - per SADC COMPLIANCE.md
export const SADC_COUNTRIES = [
  'AO', 'BW', 'CD', 'SZ', 'LS', 'MG', 'MW', 'MU', 'MZ', 'NA', 'SC', 'ZA', 'TZ', 'ZM', 'ZW'
] as const;

export type SADCCountryCode = typeof SADC_COUNTRIES[number];

export const sadcCountrySchema: JSONSchemaType<SADCCountryCode> = {
  type: 'string',
  enum: [...SADC_COUNTRIES]
};