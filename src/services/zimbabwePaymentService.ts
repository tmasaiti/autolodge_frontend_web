/**
 * Zimbabwe Payment Service Integration
 * Handles Zimbabwe-specific payment providers: Paynow, EcoCash, OneMoney, etc.
 * Addresses the bias towards South African payment methods
 */

import { api } from './api';
import { PaymentMethod, PaymentDetails, BillingAddress } from '../schemas/payment-schemas';

export interface PaynowPaymentRequest {
  reference: string;
  amount: number;
  currency: 'USD' | 'ZWL';
  email: string;
  phone?: string;
  return_url: string;
  result_url: string;
  additional_info?: string;
}

export interface PaynowPaymentResponse {
  status: 'Ok' | 'Error';
  reference: string;
  paynowreference: string;
  redirect_url?: string;
  error?: string;
  poll_url: string;
}

export interface EcoCashPaymentRequest {
  phone_number: string;
  amount: number;
  currency: 'USD' | 'ZWL';
  reference: string;
  merchant_code: string;
}

export interface FlutterwavePaymentRequest {
  tx_ref: string;
  amount: number;
  currency: 'USD' | 'ZWL';
  redirect_url: string;
  customer: {
    email: string;
    phonenumber: string;
    name: string;
  };
  payment_options: string;
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
}

class ZimbabwePaymentService {
  /**
   * Get Zimbabwe-specific payment methods
   */
  getZimbabwePaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'paynow_zimbabwe',
        type: 'digital_wallet',
        provider: 'paynow_zimbabwe',
        name: 'Paynow Zimbabwe',
        description: 'Pay with EcoCash, OneMoney, Visa, Mastercard via Paynow',
        processing_fee_percent: 3.5,
        fixed_fee: 0,
        currency: 'USD',
        supported_countries: ['ZW'],
        min_amount: 1,
        max_amount: 5000,
        processing_time_hours: 0,
        requires_verification: false,
        enabled: true
      },
      {
        id: 'ecocash_direct',
        type: 'mobile_money',
        provider: 'ecocash',
        name: 'EcoCash',
        description: 'Direct EcoCash mobile money payment',
        processing_fee_percent: 2.5,
        fixed_fee: 0.50,
        currency: 'USD',
        supported_countries: ['ZW'],
        min_amount: 1,
        max_amount: 1000,
        processing_time_hours: 0,
        requires_verification: false,
        enabled: true
      },
      {
        id: 'onemoney',
        type: 'mobile_money',
        provider: 'onemoney',
        name: 'OneMoney',
        description: 'NetOne OneMoney mobile payment',
        processing_fee_percent: 2.5,
        fixed_fee: 0.50,
        currency: 'USD',
        supported_countries: ['ZW'],
        min_amount: 1,
        max_amount: 1000,
        processing_time_hours: 0,
        requires_verification: false,
        enabled: true
      },
      {
        id: 'telecash',
        type: 'mobile_money',
        provider: 'telecash',
        name: 'Telecash',
        description: 'Telecel Telecash mobile payment',
        processing_fee_percent: 2.5,
        fixed_fee: 0.50,
        currency: 'USD',
        supported_countries: ['ZW'],
        min_amount: 1,
        max_amount: 1000,
        processing_time_hours: 0,
        requires_verification: false,
        enabled: true
      },
      {
        id: 'zipit',
        type: 'bank_transfer',
        provider: 'zipit',
        name: 'ZipIt',
        description: 'Instant bank transfers between Zimbabwean banks',
        processing_fee_percent: 1.5,
        fixed_fee: 1.00,
        currency: 'USD',
        supported_countries: ['ZW'],
        min_amount: 5,
        max_amount: 10000,
        processing_time_hours: 0,
        requires_verification: true,
        enabled: true
      },
      {
        id: 'stripe_zimbabwe',
        type: 'credit_card',
        provider: 'stripe',
        name: 'Stripe',
        description: 'International cards via Stripe (Visa, Mastercard)',
        processing_fee_percent: 3.9,
        fixed_fee: 0.30,
        currency: 'USD',
        supported_countries: ['ZW', 'ZA', 'BW', 'NA', 'ZM'],
        min_amount: 0.50,
        max_amount: 50000,
        processing_time_hours: 0,
        requires_verification: false,
        enabled: true
      },
      {
        id: 'flutterwave_zimbabwe',
        type: 'digital_wallet',
        provider: 'flutterwave',
        name: 'Flutterwave',
        description: 'Multiple payment options via Flutterwave',
        processing_fee_percent: 3.8,
        fixed_fee: 0,
        currency: 'USD',
        supported_countries: ['ZW', 'ZA', 'BW', 'NA', 'ZM', 'MW', 'MZ'],
        min_amount: 1,
        max_amount: 25000,
        processing_time_hours: 0,
        requires_verification: false,
        enabled: true
      }
    ];
  }

  /**
   * Process Paynow payment
   */
  async processPaynowPayment(request: PaynowPaymentRequest): Promise<PaynowPaymentResponse> {
    try {
      const response = await api.post<PaynowPaymentResponse>('/payments/paynow/initiate', request);
      return response.data;
    } catch (error: any) {
      console.error('Paynow payment failed:', error);
      throw new Error('Failed to process Paynow payment: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Check Paynow payment status
   */
  async checkPaynowStatus(pollUrl: string): Promise<{
    status: 'Paid' | 'Awaiting Delivery' | 'Delivered' | 'Cancelled' | 'Created';
    reference: string;
    paynowreference: string;
    amount: number;
    hash: string;
  }> {
    try {
      const response = await api.get<{
        status: 'Paid' | 'Awaiting Delivery' | 'Delivered' | 'Cancelled' | 'Created';
        reference: string;
        paynowreference: string;
        amount: number;
        hash: string;
      }>(pollUrl);
      return response.data;
    } catch (error: any) {
      console.error('Failed to check Paynow status:', error);
      throw new Error('Failed to check payment status');
    }
  }

  /**
   * Process EcoCash direct payment
   */
  async processEcoCashPayment(request: EcoCashPaymentRequest): Promise<{
    status: 'success' | 'pending' | 'failed';
    transaction_id: string;
    message: string;
  }> {
    try {
      const response = await api.post<{
        status: 'success' | 'pending' | 'failed';
        transaction_id: string;
        message: string;
      }>('/payments/ecocash/direct', request);
      return response.data;
    } catch (error: any) {
      console.error('EcoCash payment failed:', error);
      throw new Error('Failed to process EcoCash payment: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Process Flutterwave payment
   */
  async processFlutterwavePayment(request: FlutterwavePaymentRequest): Promise<{
    status: 'success' | 'error';
    message: string;
    data?: {
      link: string;
    };
  }> {
    try {
      const response = await api.post<{
        status: 'success' | 'error';
        message: string;
        data?: {
          link: string;
        };
      }>('/payments/flutterwave/initiate', request);
      return response.data;
    } catch (error: any) {
      console.error('Flutterwave payment failed:', error);
      throw new Error('Failed to process Flutterwave payment: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Process ZipIt bank transfer
   */
  async processZipItTransfer(request: {
    from_bank: string;
    to_bank: string;
    account_number: string;
    amount: number;
    reference: string;
  }): Promise<{
    status: 'success' | 'pending' | 'failed';
    transaction_id: string;
    message: string;
  }> {
    try {
      const response = await api.post<{
        status: 'success' | 'pending' | 'failed';
        transaction_id: string;
        message: string;
      }>('/payments/zipit/transfer', request);
      return response.data;
    } catch (error: any) {
      console.error('ZipIt transfer failed:', error);
      throw new Error('Failed to process ZipIt transfer: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Get supported Zimbabwean banks for ZipIt
   */
  getZimbabweanBanks(): Array<{ code: string; name: string }> {
    return [
      { code: 'CBZ', name: 'CBZ Bank' },
      { code: 'STANBIC', name: 'Stanbic Bank' },
      { code: 'STEWARD', name: 'Steward Bank' },
      { code: 'FBC', name: 'FBC Bank' },
      { code: 'NEDBANK', name: 'Nedbank Zimbabwe' },
      { code: 'ECOBANK', name: 'Ecobank Zimbabwe' },
      { code: 'METBANK', name: 'Metbank' },
      { code: 'AGRIBANK', name: 'Agribank' },
      { code: 'POSB', name: 'POSB' },
      { code: 'CABS', name: 'CABS' },
      { code: 'BVN', name: 'BVN Bank' },
      { code: 'FIRST_CAPITAL', name: 'First Capital Bank' }
    ];
  }

  /**
   * Validate Zimbabwean phone number for mobile money
   */
  validateZimbabweanPhone(phoneNumber: string): {
    isValid: boolean;
    provider?: 'econet' | 'netone' | 'telecel';
    formatted?: string;
  } {
    // Remove any spaces, dashes, or plus signs
    const cleaned = phoneNumber.replace(/[\s\-\+]/g, '');
    
    // Zimbabwe phone number patterns
    const patterns = {
      econet: /^(263)?77[0-9]{7}$|^77[0-9]{7}$/,
      netone: /^(263)?71[0-9]{7}$|^71[0-9]{7}$/,
      telecel: /^(263)?73[0-9]{7}$|^73[0-9]{7}$/
    };

    for (const [provider, pattern] of Object.entries(patterns)) {
      if (pattern.test(cleaned)) {
        const formatted = cleaned.startsWith('263') ? `+${cleaned}` : `+263${cleaned.substring(1)}`;
        return {
          isValid: true,
          provider: provider as 'econet' | 'netone' | 'telecel',
          formatted
        };
      }
    }

    return { isValid: false };
  }

  /**
   * Get exchange rates for ZWL/USD
   */
  async getZimbabweExchangeRates(): Promise<{
    official_rate: number;
    parallel_rate: number;
    last_updated: string;
  }> {
    try {
      const response = await api.get<{
        official_rate: number;
        parallel_rate: number;
        last_updated: string;
      }>('/payments/zimbabwe/exchange-rates');
      return response.data;
    } catch (error) {
      console.error('Failed to get exchange rates:', error);
      // Return fallback rates
      return {
        official_rate: 1000, // ZWL per USD
        parallel_rate: 1200,
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Format amount for Zimbabwe (handle USD/ZWL)
   */
  formatZimbabweanAmount(amount: number, currency: 'USD' | 'ZWL'): string {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-ZW', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-ZW', {
        style: 'currency',
        currency: 'ZWL',
        minimumFractionDigits: 2
      }).format(amount);
    }
  }
}

export const zimbabwePaymentService = new ZimbabwePaymentService();
export default zimbabwePaymentService;