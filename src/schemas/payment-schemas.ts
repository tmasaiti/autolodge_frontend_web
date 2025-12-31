/**
 * Payment-related JSON schemas
 * Maps to payments, escrow_accounts, payment_methods, and payment_transactions tables
 * Implements SADC-specific payment methods per requirements 6.1, 6.2, 6.4
 */

import { JSONSchemaType } from 'ajv';
import { SADCCountryCode } from './common-schemas';

// Payment method types supported across SADC region
export type PaymentMethodType = 
  | 'credit_card' 
  | 'debit_card' 
  | 'bank_transfer' 
  | 'mobile_money' 
  | 'digital_wallet'
  | 'cash_deposit';

// SADC-specific payment providers
export type PaymentProvider = 
  | 'visa' 
  | 'mastercard' 
  | 'american_express'
  // Zimbabwe providers
  | 'paynow_zimbabwe'
  | 'ecocash'
  | 'onemoney'
  | 'telecash'
  | 'zipit'
  | 'stripe'
  | 'flutterwave'
  // South Africa providers
  | 'fnb' 
  | 'standard_bank' 
  | 'absa' 
  | 'nedbank'
  | 'payfast' 
  | 'peach_payments'
  // Other SADC
  | 'mpesa' 
  | 'orange_money'
  | 'paypal';

// Payment method configuration - maps to payment_methods table
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  name: string;
  description: string;
  processing_fee_percent: number;
  fixed_fee: number;
  currency: string;
  supported_countries: SADCCountryCode[];
  min_amount: number;
  max_amount: number;
  processing_time_hours: number;
  requires_verification: boolean;
  icon_url?: string;
  enabled: boolean;
}

export const paymentMethodSchema: JSONSchemaType<PaymentMethod> = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    type: { 
      type: 'string', 
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'mobile_money', 'digital_wallet', 'cash_deposit'] 
    },
    provider: { 
      type: 'string', 
      enum: ['visa', 'mastercard', 'american_express', 'paynow_zimbabwe', 'ecocash', 'onemoney', 
             'telecash', 'zipit', 'stripe', 'flutterwave', 'fnb', 'standard_bank', 'absa', 
             'nedbank', 'payfast', 'peach_payments', 'mpesa', 'orange_money', 'paypal'] 
    },
    name: { type: 'string' },
    description: { type: 'string' },
    processing_fee_percent: { type: 'number', minimum: 0, maximum: 10 },
    fixed_fee: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' },
    supported_countries: {
      type: 'array',
      items: { 
        type: 'string', 
        enum: ['AO', 'BW', 'CD', 'SZ', 'LS', 'MG', 'MW', 'MU', 'MZ', 'NA', 'SC', 'ZA', 'TZ', 'ZM', 'ZW'] 
      }
    },
    min_amount: { type: 'number', minimum: 0 },
    max_amount: { type: 'number', minimum: 0 },
    processing_time_hours: { type: 'number', minimum: 0 },
    requires_verification: { type: 'boolean' },
    icon_url: { type: 'string', nullable: true },
    enabled: { type: 'boolean' }
  },
  required: ['id', 'type', 'provider', 'name', 'description', 'processing_fee_percent', 
            'fixed_fee', 'currency', 'supported_countries', 'min_amount', 'max_amount', 
            'processing_time_hours', 'requires_verification', 'enabled'],
  additionalProperties: false
};

// Payment details for different method types
export interface PaymentDetails {
  card?: {
    number: string;
    expiry_month: number;
    expiry_year: number;
    cvv: string;
    cardholder_name: string;
  };
  bank_transfer?: {
    account_number: string;
    routing_number: string;
    bank_name: string;
    account_holder_name: string;
  };
  mobile_money?: {
    phone_number: string;
    provider: string;
    account_name: string;
  };
  digital_wallet?: {
    wallet_id: string;
    provider: string;
  };
}

export const paymentDetailsSchema: JSONSchemaType<PaymentDetails> = {
  type: 'object',
  properties: {
    card: {
      type: 'object',
      properties: {
        number: { type: 'string', pattern: '^[0-9]{13,19}$' },
        expiry_month: { type: 'number', minimum: 1, maximum: 12 },
        expiry_year: { type: 'number', minimum: 2024, maximum: 2040 },
        cvv: { type: 'string', pattern: '^[0-9]{3,4}$' },
        cardholder_name: { type: 'string', minLength: 2 }
      },
      required: ['number', 'expiry_month', 'expiry_year', 'cvv', 'cardholder_name'],
      additionalProperties: false,
      nullable: true
    },
    bank_transfer: {
      type: 'object',
      properties: {
        account_number: { type: 'string', minLength: 8 },
        routing_number: { type: 'string', minLength: 6 },
        bank_name: { type: 'string', minLength: 2 },
        account_holder_name: { type: 'string', minLength: 2 }
      },
      required: ['account_number', 'routing_number', 'bank_name', 'account_holder_name'],
      additionalProperties: false,
      nullable: true
    },
    mobile_money: {
      type: 'object',
      properties: {
        phone_number: { type: 'string', pattern: '^\\+[1-9]\\d{1,14}$' },
        provider: { type: 'string' },
        account_name: { type: 'string', minLength: 2 }
      },
      required: ['phone_number', 'provider', 'account_name'],
      additionalProperties: false,
      nullable: true
    },
    digital_wallet: {
      type: 'object',
      properties: {
        wallet_id: { type: 'string', minLength: 3 },
        provider: { type: 'string' }
      },
      required: ['wallet_id', 'provider'],
      additionalProperties: false,
      nullable: true
    }
  },
  required: [],
  additionalProperties: false
};

// Billing address for payment processing
export interface BillingAddress {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: SADCCountryCode;
}

export const billingAddressSchema: JSONSchemaType<BillingAddress> = {
  type: 'object',
  properties: {
    street: { type: 'string', minLength: 5 },
    city: { type: 'string', minLength: 2 },
    state: { type: 'string', nullable: true },
    postal_code: { type: 'string', minLength: 3 },
    country: { 
      type: 'string', 
      enum: ['AO', 'BW', 'CD', 'SZ', 'LS', 'MG', 'MW', 'MU', 'MZ', 'NA', 'SC', 'ZA', 'TZ', 'ZM', 'ZW'] 
    }
  },
  required: ['street', 'city', 'postal_code', 'country'],
  additionalProperties: false
};

// Payment transaction - maps to payments table
export interface PaymentTransaction {
  id: number;
  booking_id: number;
  payment_method_id: string;
  amount: number;
  currency: string;
  processing_fee: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  transaction_id?: string;
  provider_transaction_id?: string;
  payment_details: PaymentDetails;
  billing_address: BillingAddress;
  created_at: string;
  processed_at?: string;
  failure_reason?: string;
  refund_amount?: number;
  refunded_at?: string;
}

export const paymentTransactionSchema: JSONSchemaType<PaymentTransaction> = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    booking_id: { type: 'number' },
    payment_method_id: { type: 'string' },
    amount: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' },
    processing_fee: { type: 'number', minimum: 0 },
    total_amount: { type: 'number', minimum: 0 },
    status: { 
      type: 'string', 
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'] 
    },
    transaction_id: { type: 'string', nullable: true },
    provider_transaction_id: { type: 'string', nullable: true },
    payment_details: paymentDetailsSchema,
    billing_address: billingAddressSchema,
    created_at: { type: 'string', format: 'date-time' },
    processed_at: { type: 'string', format: 'date-time', nullable: true },
    failure_reason: { type: 'string', nullable: true },
    refund_amount: { type: 'number', minimum: 0, nullable: true },
    refunded_at: { type: 'string', format: 'date-time', nullable: true }
  },
  required: ['id', 'booking_id', 'payment_method_id', 'amount', 'currency', 'processing_fee', 
            'total_amount', 'status', 'payment_details', 'billing_address', 'created_at'],
  additionalProperties: false
};

// Escrow account - maps to escrow_accounts table
export interface EscrowAccount {
  id: number;
  booking_id: number;
  payment_id: number;
  amount: number;
  currency: string;
  status: 'created' | 'funded' | 'disputed' | 'released' | 'refunded';
  created_at: string;
  funded_at?: string;
  release_scheduled_at?: string;
  released_at?: string;
  dispute_id?: number;
  release_conditions: {
    auto_release_hours: number;
    requires_confirmation: boolean;
    dispute_period_hours: number;
  };
  fees: {
    platform_fee: number;
    processing_fee: number;
    total_fees: number;
  };
}

export const escrowAccountSchema: JSONSchemaType<EscrowAccount> = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    booking_id: { type: 'number' },
    payment_id: { type: 'number' },
    amount: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' },
    status: { 
      type: 'string', 
      enum: ['created', 'funded', 'disputed', 'released', 'refunded'] 
    },
    created_at: { type: 'string', format: 'date-time' },
    funded_at: { type: 'string', format: 'date-time', nullable: true },
    release_scheduled_at: { type: 'string', format: 'date-time', nullable: true },
    released_at: { type: 'string', format: 'date-time', nullable: true },
    dispute_id: { type: 'number', nullable: true },
    release_conditions: {
      type: 'object',
      properties: {
        auto_release_hours: { type: 'number', minimum: 0 },
        requires_confirmation: { type: 'boolean' },
        dispute_period_hours: { type: 'number', minimum: 0 }
      },
      required: ['auto_release_hours', 'requires_confirmation', 'dispute_period_hours'],
      additionalProperties: false
    },
    fees: {
      type: 'object',
      properties: {
        platform_fee: { type: 'number', minimum: 0 },
        processing_fee: { type: 'number', minimum: 0 },
        total_fees: { type: 'number', minimum: 0 }
      },
      required: ['platform_fee', 'processing_fee', 'total_fees'],
      additionalProperties: false
    }
  },
  required: ['id', 'booking_id', 'payment_id', 'amount', 'currency', 'status', 
            'created_at', 'release_conditions', 'fees'],
  additionalProperties: false
};

// Fee breakdown for transparent pricing per requirement 6.5
export interface FeeBreakdown {
  base_amount: number;
  platform_fee: {
    percentage: number;
    amount: number;
    description: string;
  };
  payment_processing_fee: {
    percentage: number;
    fixed_amount: number;
    total_amount: number;
    description: string;
  };
  taxes: {
    vat_percentage?: number;
    vat_amount?: number;
    other_taxes: Array<{
      name: string;
      percentage: number;
      amount: number;
    }>;
  };
  escrow_fee: {
    amount: number;
    description: string;
  };
  total_fees: number;
  net_amount: number;
  currency: string;
}

export const feeBreakdownSchema: JSONSchemaType<FeeBreakdown> = {
  type: 'object',
  properties: {
    base_amount: { type: 'number', minimum: 0 },
    platform_fee: {
      type: 'object',
      properties: {
        percentage: { type: 'number', minimum: 0, maximum: 100 },
        amount: { type: 'number', minimum: 0 },
        description: { type: 'string' }
      },
      required: ['percentage', 'amount', 'description'],
      additionalProperties: false
    },
    payment_processing_fee: {
      type: 'object',
      properties: {
        percentage: { type: 'number', minimum: 0, maximum: 100 },
        fixed_amount: { type: 'number', minimum: 0 },
        total_amount: { type: 'number', minimum: 0 },
        description: { type: 'string' }
      },
      required: ['percentage', 'fixed_amount', 'total_amount', 'description'],
      additionalProperties: false
    },
    taxes: {
      type: 'object',
      properties: {
        vat_percentage: { type: 'number', minimum: 0, maximum: 100, nullable: true },
        vat_amount: { type: 'number', minimum: 0, nullable: true },
        other_taxes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              percentage: { type: 'number', minimum: 0, maximum: 100 },
              amount: { type: 'number', minimum: 0 }
            },
            required: ['name', 'percentage', 'amount'],
            additionalProperties: false
          }
        }
      },
      required: ['other_taxes'],
      additionalProperties: false
    },
    escrow_fee: {
      type: 'object',
      properties: {
        amount: { type: 'number', minimum: 0 },
        description: { type: 'string' }
      },
      required: ['amount', 'description'],
      additionalProperties: false
    },
    total_fees: { type: 'number', minimum: 0 },
    net_amount: { type: 'number', minimum: 0 },
    currency: { type: 'string', pattern: '^[A-Z]{3}$' }
  },
  required: ['base_amount', 'platform_fee', 'payment_processing_fee', 'taxes', 
            'escrow_fee', 'total_fees', 'net_amount', 'currency'],
  additionalProperties: false
};