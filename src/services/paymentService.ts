/**
 * Payment Service
 * Handles payment processing, escrow management, and SADC-specific payment methods
 * Implements requirements 6.1, 6.2, 6.4, 6.5
 */

import { api } from './api';
import { 
  PaymentMethod, 
  PaymentTransaction, 
  EscrowAccount, 
  FeeBreakdown,
  PaymentDetails,
  BillingAddress 
} from '../schemas/payment-schemas';
import { SADCCountryCode } from '../schemas/common-schemas';

export interface PaymentProcessingRequest {
  booking_id: number;
  payment_method_id: string;
  amount: number;
  currency: string;
  payment_details: PaymentDetails;
  billing_address: BillingAddress;
  save_payment_method?: boolean;
}

export interface PaymentProcessingResponse {
  transaction: PaymentTransaction;
  escrow_account: EscrowAccount;
  confirmation_url?: string;
  requires_3ds?: boolean;
  redirect_url?: string;
}

export interface RefundRequest {
  payment_id: number;
  amount?: number; // Partial refund if specified
  reason: string;
}

export interface RefundResponse {
  refund_id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  estimated_completion: string;
}

class PaymentService {
  /**
   * Get available payment methods for a specific country and amount
   */
  async getPaymentMethods(
    country: SADCCountryCode, 
    amount: number, 
    currency: string
  ): Promise<PaymentMethod[]> {
    try {
      const response = await api.get<PaymentMethod[]>('/payments/methods', {
        params: { country, amount, currency }
      });
      
      // Add Zimbabwe-specific methods if user is from Zimbabwe
      if (country === 'ZW') {
        const { zimbabwePaymentService } = await import('./zimbabwePaymentService');
        const zimbabweMethods = zimbabwePaymentService.getZimbabwePaymentMethods();
        return [...response.data, ...zimbabweMethods];
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      
      // Fallback: return Zimbabwe methods if user is from Zimbabwe
      if (country === 'ZW') {
        const { zimbabwePaymentService } = await import('./zimbabwePaymentService');
        return zimbabwePaymentService.getZimbabwePaymentMethods();
      }
      
      throw new Error('Unable to load payment methods. Please try again.');
    }
  }

  /**
   * Calculate fee breakdown for transparent pricing (requirement 6.5)
   */
  async calculateFees(
    amount: number,
    currency: string,
    payment_method_id: string,
    country: SADCCountryCode
  ): Promise<FeeBreakdown> {
    try {
      const response = await api.post<FeeBreakdown>('/payments/calculate-fees', {
        amount,
        currency,
        payment_method_id,
        country
      });
      return response.data;
    } catch (error) {
      console.error('Failed to calculate fees:', error);
      throw new Error('Unable to calculate fees. Please try again.');
    }
  }

  /**
   * Process payment with escrow (requirements 6.1, 6.2)
   */
  async processPayment(request: PaymentProcessingRequest): Promise<PaymentProcessingResponse> {
    try {
      const response = await api.post<PaymentProcessingResponse>('/payments/process', request);
      return response.data;
    } catch (error: any) {
      console.error('Payment processing failed:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid payment details');
      } else if (error.response?.status === 402) {
        throw new Error('Payment declined. Please check your payment details or try a different method.');
      } else if (error.response?.status === 429) {
        throw new Error('Too many payment attempts. Please wait before trying again.');
      } else {
        throw new Error('Payment processing failed. Please try again.');
      }
    }
  }

  /**
   * Get payment transaction status
   */
  async getPaymentStatus(payment_id: number): Promise<PaymentTransaction> {
    try {
      const response = await api.get<PaymentTransaction>(`/payments/${payment_id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch payment status:', error);
      throw new Error('Unable to retrieve payment status.');
    }
  }

  /**
   * Get escrow account details (requirement 6.2)
   */
  async getEscrowAccount(booking_id: number): Promise<EscrowAccount> {
    try {
      const response = await api.get<EscrowAccount>(`/escrow/booking/${booking_id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch escrow account:', error);
      throw new Error('Unable to retrieve escrow information.');
    }
  }

  /**
   * Request payment refund (requirement 6.4)
   */
  async requestRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await api.post<RefundResponse>('/payments/refund', request);
      return response.data;
    } catch (error: any) {
      console.error('Refund request failed:', error);
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid refund request');
      } else if (error.response?.status === 403) {
        throw new Error('Refund not allowed for this payment');
      } else {
        throw new Error('Refund request failed. Please contact support.');
      }
    }
  }

  /**
   * Get user's saved payment methods
   */
  async getSavedPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await api.get<PaymentMethod[]>('/payments/saved-methods');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch saved payment methods:', error);
      return [];
    }
  }

  /**
   * Save payment method for future use
   */
  async savePaymentMethod(
    payment_method_id: string,
    payment_details: Partial<PaymentDetails>,
    billing_address: BillingAddress
  ): Promise<{ success: boolean; method_id: string }> {
    try {
      const response = await api.post<{ success: boolean; method_id: string }>('/payments/save-method', {
        payment_method_id,
        payment_details,
        billing_address
      });
      return response.data;
    } catch (error) {
      console.error('Failed to save payment method:', error);
      throw new Error('Unable to save payment method.');
    }
  }

  /**
   * Delete saved payment method
   */
  async deleteSavedPaymentMethod(method_id: string): Promise<void> {
    try {
      await api.delete(`/payments/saved-methods/${method_id}`);
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      throw new Error('Unable to delete payment method.');
    }
  }

  /**
   * Validate payment details before processing
   */
  validatePaymentDetails(
    payment_method_type: string,
    payment_details: PaymentDetails
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (payment_method_type) {
      case 'credit_card':
      case 'debit_card':
        if (!payment_details.card) {
          errors.push('Card details are required');
        } else {
          const { card } = payment_details;
          
          // Validate card number (basic Luhn algorithm check)
          if (!this.isValidCardNumber(card.number)) {
            errors.push('Invalid card number');
          }
          
          // Validate expiry date
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;
          
          if (card.expiry_year < currentYear || 
              (card.expiry_year === currentYear && card.expiry_month < currentMonth)) {
            errors.push('Card has expired');
          }
          
          // Validate CVV
          if (!/^[0-9]{3,4}$/.test(card.cvv)) {
            errors.push('Invalid CVV');
          }
          
          // Validate cardholder name
          if (card.cardholder_name.length < 2) {
            errors.push('Cardholder name is required');
          }
        }
        break;

      case 'mobile_money':
        if (!payment_details.mobile_money) {
          errors.push('Mobile money details are required');
        } else {
          const { mobile_money } = payment_details;
          
          // Validate phone number format
          if (!/^\+[1-9]\d{1,14}$/.test(mobile_money.phone_number)) {
            errors.push('Invalid phone number format');
          }
          
          if (!mobile_money.provider) {
            errors.push('Mobile money provider is required');
          }
        }
        break;

      case 'bank_transfer':
        if (!payment_details.bank_transfer) {
          errors.push('Bank transfer details are required');
        } else {
          const { bank_transfer } = payment_details;
          
          if (bank_transfer.account_number.length < 8) {
            errors.push('Invalid account number');
          }
          
          if (bank_transfer.routing_number.length < 6) {
            errors.push('Invalid routing number');
          }
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Basic Luhn algorithm implementation for card number validation
   */
  private isValidCardNumber(cardNumber: string): boolean {
    const number = cardNumber.replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(number)) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Format currency amount for display
   */
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get payment method icon based on type and provider
   */
  getPaymentMethodIcon(type: string, provider?: string): string {
    const iconMap: Record<string, string> = {
      'credit_card': '💳',
      'debit_card': '💳',
      'bank_transfer': '🏦',
      'mobile_money': '📱',
      'digital_wallet': '💰',
      'cash_deposit': '💵'
    };

    return iconMap[type] || '💳';
  }
}

export const paymentService = new PaymentService();
export default paymentService;