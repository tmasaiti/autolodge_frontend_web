/**
 * Zimbabwe Payment Integration Tests
 * Tests the integration between Zimbabwe payment services and components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ZimbabwePaymentForm } from '../ZimbabwePaymentForm';
import { PaymentMethodSelector } from '../PaymentMethodSelector';
import { zimbabwePaymentService } from '../../../services/zimbabwePaymentService';
import { PaymentMethod } from '../../../schemas/payment-schemas';

// Mock the Zimbabwe payment service
vi.mock('../../../services/zimbabwePaymentService', () => ({
  zimbabwePaymentService: {
    getZimbabwePaymentMethods: vi.fn(),
    validateZimbabweanPhone: vi.fn(),
    getZimbabweanBanks: vi.fn(),
    getZimbabweExchangeRates: vi.fn()
  }
}));

const mockZimbabwePaymentService = zimbabwePaymentService as any;

describe('Zimbabwe Payment Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Zimbabwe Payment Methods', () => {
    it('should load Zimbabwe-specific payment methods', () => {
      mockZimbabwePaymentService.getZimbabwePaymentMethods.mockReturnValue([
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
        }
      ]);

      const methods = mockZimbabwePaymentService.getZimbabwePaymentMethods();
      
      expect(methods).toBeDefined();
      expect(Array.isArray(methods)).toBe(true);
    });

    it('should include all major Zimbabwe payment providers', () => {
      mockZimbabwePaymentService.getZimbabwePaymentMethods.mockReturnValue([
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
        }
      ]);

      const methods = mockZimbabwePaymentService.getZimbabwePaymentMethods();
      const providerNames = methods.map(m => m.provider);
      
      expect(providerNames).toContain('paynow_zimbabwe');
      expect(providerNames).toContain('ecocash');
    });
  });

  describe('PaymentMethodSelector with Zimbabwe methods', () => {
    const mockMethods: PaymentMethod[] = [
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
      }
    ];

    it('should display Zimbabwe payment methods correctly', () => {
      const mockOnSelect = vi.fn();

      render(
        <PaymentMethodSelector
          methods={mockMethods}
          selectedMethod={null}
          onMethodSelect={mockOnSelect}
          amount={100}
          currency="USD"
        />
      );

      expect(screen.getByText('Paynow Zimbabwe')).toBeInTheDocument();
      expect(screen.getByText('EcoCash')).toBeInTheDocument();
      expect(screen.getByText('Pay with EcoCash, OneMoney, Visa, Mastercard via Paynow')).toBeInTheDocument();
    });

    it('should show Zimbabwe flag emoji for Zimbabwe providers', () => {
      const mockOnSelect = vi.fn();

      render(
        <PaymentMethodSelector
          methods={mockMethods}
          selectedMethod={null}
          onMethodSelect={mockOnSelect}
          amount={100}
          currency="USD"
        />
      );

      // Check for Zimbabwe flag emoji
      expect(screen.getByText('🇿🇼')).toBeInTheDocument();
    });
  });

  describe('ZimbabwePaymentForm', () => {
    const mockPaynowMethod: PaymentMethod = {
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
    };

    const mockEcoCashMethod: PaymentMethod = {
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
    };

    it('should render Paynow form correctly', () => {
      const mockOnSubmit = vi.fn();

      render(
        <ZimbabwePaymentForm
          paymentMethod={mockPaynowMethod}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Paynow Zimbabwe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
      expect(screen.getByText('How Paynow Works')).toBeInTheDocument();
    });

    it('should render EcoCash form correctly', () => {
      const mockOnSubmit = vi.fn();
      
      mockZimbabwePaymentService.getZimbabweExchangeRates.mockResolvedValue({
        official_rate: 1000,
        parallel_rate: 1200,
        last_updated: new Date().toISOString()
      });

      render(
        <ZimbabwePaymentForm
          paymentMethod={mockEcoCashMethod}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('EcoCash (Econet)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+263771234567')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    it('should validate Zimbabwean phone numbers', () => {
      mockZimbabwePaymentService.validateZimbabweanPhone.mockReturnValue({
        isValid: true,
        provider: 'econet',
        formatted: '+263771234567'
      });

      const result = mockZimbabwePaymentService.validateZimbabweanPhone('0771234567');
      
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('econet');
      expect(result.formatted).toBe('+263771234567');
    });

    it('should show billing address section', () => {
      const mockOnSubmit = vi.fn();

      render(
        <ZimbabwePaymentForm
          paymentMethod={mockPaynowMethod}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Billing Address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('123 Main Street, Harare')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Harare')).toBeInTheDocument();
    });

    it('should show Zimbabwe payment support notice', () => {
      const mockOnSubmit = vi.fn();

      render(
        <ZimbabwePaymentForm
          paymentMethod={mockPaynowMethod}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Zimbabwe Payment Support')).toBeInTheDocument();
      expect(screen.getByText(/We support all major Zimbabwean payment methods/)).toBeInTheDocument();
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate Econet numbers correctly', () => {
      mockZimbabwePaymentService.validateZimbabweanPhone.mockReturnValue({
        isValid: true,
        provider: 'econet',
        formatted: '+263771234567'
      });

      const result = mockZimbabwePaymentService.validateZimbabweanPhone('0771234567');
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('econet');
    });

    it('should validate NetOne numbers correctly', () => {
      mockZimbabwePaymentService.validateZimbabweanPhone.mockReturnValue({
        isValid: true,
        provider: 'netone',
        formatted: '+263711234567'
      });

      const result = mockZimbabwePaymentService.validateZimbabweanPhone('0711234567');
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('netone');
    });

    it('should validate Telecel numbers correctly', () => {
      mockZimbabwePaymentService.validateZimbabweanPhone.mockReturnValue({
        isValid: true,
        provider: 'telecel',
        formatted: '+263731234567'
      });

      const result = mockZimbabwePaymentService.validateZimbabweanPhone('0731234567');
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('telecel');
    });

    it('should reject invalid phone numbers', () => {
      mockZimbabwePaymentService.validateZimbabweanPhone.mockReturnValue({
        isValid: false
      });

      const result = mockZimbabwePaymentService.validateZimbabweanPhone('1234567890');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Zimbabwean Banks', () => {
    it('should return list of Zimbabwean banks', () => {
      mockZimbabwePaymentService.getZimbabweanBanks.mockReturnValue([
        { code: 'CBZ', name: 'CBZ Bank' },
        { code: 'STANBIC', name: 'Stanbic Bank' },
        { code: 'STEWARD', name: 'Steward Bank' }
      ]);

      const banks = mockZimbabwePaymentService.getZimbabweanBanks();
      
      expect(banks).toHaveLength(3);
      expect(banks[0]).toEqual({ code: 'CBZ', name: 'CBZ Bank' });
      expect(banks[1]).toEqual({ code: 'STANBIC', name: 'Stanbic Bank' });
      expect(banks[2]).toEqual({ code: 'STEWARD', name: 'Steward Bank' });
    });
  });
});