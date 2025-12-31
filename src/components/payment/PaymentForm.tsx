/**
 * Payment Form Component
 * Handles payment details collection for different SADC payment methods
 * Implements requirements 6.1, 6.2 (payment processing)
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Building2, Smartphone, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { PaymentMethod, PaymentDetails, BillingAddress } from '../../schemas/payment-schemas';
import { SADCCountryCode } from '../../schemas/common-schemas';

export interface PaymentFormProps {
  paymentMethod: PaymentMethod;
  onSubmit: (paymentDetails: PaymentDetails, billingAddress: BillingAddress, saveMethod: boolean) => void;
  initialBillingAddress?: Partial<BillingAddress>;
  loading?: boolean;
}

const SADC_COUNTRIES = [
  { code: 'AO' as SADCCountryCode, name: 'Angola' },
  { code: 'BW' as SADCCountryCode, name: 'Botswana' },
  { code: 'CD' as SADCCountryCode, name: 'Democratic Republic of Congo' },
  { code: 'SZ' as SADCCountryCode, name: 'Eswatini' },
  { code: 'LS' as SADCCountryCode, name: 'Lesotho' },
  { code: 'MG' as SADCCountryCode, name: 'Madagascar' },
  { code: 'MW' as SADCCountryCode, name: 'Malawi' },
  { code: 'MU' as SADCCountryCode, name: 'Mauritius' },
  { code: 'MZ' as SADCCountryCode, name: 'Mozambique' },
  { code: 'NA' as SADCCountryCode, name: 'Namibia' },
  { code: 'SC' as SADCCountryCode, name: 'Seychelles' },
  { code: 'ZA' as SADCCountryCode, name: 'South Africa' },
  { code: 'TZ' as SADCCountryCode, name: 'Tanzania' },
  { code: 'ZM' as SADCCountryCode, name: 'Zambia' },
  { code: 'ZW' as SADCCountryCode, name: 'Zimbabwe' }
];

export const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentMethod,
  onSubmit,
  initialBillingAddress = {},
  loading = false
}) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    street: initialBillingAddress.street || '',
    city: initialBillingAddress.city || '',
    state: initialBillingAddress.state || '',
    postal_code: initialBillingAddress.postal_code || '',
    country: initialBillingAddress.country || 'ZA'
  });
  const [saveMethod, setSaveMethod] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate billing address
    if (!billingAddress.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!billingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!billingAddress.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    }

    // Validate payment method specific details
    switch (paymentMethod.type) {
      case 'credit_card':
      case 'debit_card':
        if (!paymentDetails.card?.number) {
          newErrors.cardNumber = 'Card number is required';
        } else if (!/^\d{13,19}$/.test(paymentDetails.card.number.replace(/\s/g, ''))) {
          newErrors.cardNumber = 'Invalid card number';
        }

        if (!paymentDetails.card?.expiry_month || !paymentDetails.card?.expiry_year) {
          newErrors.expiry = 'Expiry date is required';
        } else {
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;
          
          if (paymentDetails.card.expiry_year < currentYear || 
              (paymentDetails.card.expiry_year === currentYear && paymentDetails.card.expiry_month < currentMonth)) {
            newErrors.expiry = 'Card has expired';
          }
        }

        if (!paymentDetails.card?.cvv) {
          newErrors.cvv = 'CVV is required';
        } else if (!/^\d{3,4}$/.test(paymentDetails.card.cvv)) {
          newErrors.cvv = 'Invalid CVV';
        }

        if (!paymentDetails.card?.cardholder_name?.trim()) {
          newErrors.cardholderName = 'Cardholder name is required';
        }
        break;

      case 'mobile_money':
        if (!paymentDetails.mobile_money?.phone_number) {
          newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\+[1-9]\d{1,14}$/.test(paymentDetails.mobile_money.phone_number)) {
          newErrors.phoneNumber = 'Invalid phone number format (use +country code)';
        }

        if (!paymentDetails.mobile_money?.account_name?.trim()) {
          newErrors.accountName = 'Account name is required';
        }
        break;

      case 'bank_transfer':
        if (!paymentDetails.bank_transfer?.account_number) {
          newErrors.accountNumber = 'Account number is required';
        } else if (paymentDetails.bank_transfer.account_number.length < 8) {
          newErrors.accountNumber = 'Account number must be at least 8 digits';
        }

        if (!paymentDetails.bank_transfer?.routing_number) {
          newErrors.routingNumber = 'Routing number is required';
        }

        if (!paymentDetails.bank_transfer?.bank_name?.trim()) {
          newErrors.bankName = 'Bank name is required';
        }

        if (!paymentDetails.bank_transfer?.account_holder_name?.trim()) {
          newErrors.accountHolderName = 'Account holder name is required';
        }
        break;

      case 'digital_wallet':
        if (!paymentDetails.digital_wallet?.wallet_id?.trim()) {
          newErrors.walletId = 'Wallet ID is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(paymentDetails, billingAddress, saveMethod);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const updateCardDetails = (field: string, value: any) => {
    setPaymentDetails(prev => ({
      ...prev,
      card: {
        number: '',
        expiry_month: 1,
        expiry_year: 2024,
        cvv: '',
        cardholder_name: '',
        ...prev.card,
        [field]: value
      }
    }));
  };

  const updateMobileMoneyDetails = (field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      mobile_money: {
        phone_number: '',
        provider: paymentMethod.provider,
        account_name: '',
        ...prev.mobile_money,
        [field]: value
      }
    }));
  };

  const updateBankTransferDetails = (field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      bank_transfer: {
        account_number: '',
        routing_number: '',
        bank_name: '',
        account_holder_name: '',
        ...prev.bank_transfer,
        [field]: value
      }
    }));
  };

  const updateDigitalWalletDetails = (field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      digital_wallet: {
        wallet_id: '',
        provider: paymentMethod.provider,
        ...prev.digital_wallet,
        [field]: value
      }
    }));
  };

  const renderPaymentMethodFields = () => {
    switch (paymentMethod.type) {
      case 'credit_card':
      case 'debit_card':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-900">Card Details</h3>
            </div>

            <Input
              label="Card Number"
              value={paymentDetails.card?.number || ''}
              onChange={(e) => updateCardDetails('number', formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              error={errors.cardNumber}
              required
              autoComplete="cc-number"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Expiry Date *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={paymentDetails.card?.expiry_month || ''}
                    onChange={(e) => updateCardDetails('expiry_month', parseInt(e.target.value))}
                    className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:ring-primary-500"
                    required
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {month.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <select
                    value={paymentDetails.card?.expiry_year || ''}
                    onChange={(e) => updateCardDetails('expiry_year', parseInt(e.target.value))}
                    className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:ring-primary-500"
                    required
                  >
                    <option value="">YYYY</option>
                    {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                {errors.expiry && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>
                )}
              </div>

              <div className="relative">
                <Input
                  label="CVV"
                  type={showCvv ? 'text' : 'password'}
                  value={paymentDetails.card?.cvv || ''}
                  onChange={(e) => updateCardDetails('cvv', e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  maxLength={4}
                  error={errors.cvv}
                  required
                  autoComplete="cc-csc"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowCvv(!showCvv)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      {showCvv ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />
              </div>
            </div>

            <Input
              label="Cardholder Name"
              value={paymentDetails.card?.cardholder_name || ''}
              onChange={(e) => updateCardDetails('cardholder_name', e.target.value)}
              placeholder="John Doe"
              error={errors.cardholderName}
              required
              autoComplete="cc-name"
            />
          </div>
        );

      case 'mobile_money':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Smartphone className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-900">Mobile Money Details</h3>
            </div>

            <Input
              label="Phone Number"
              value={paymentDetails.mobile_money?.phone_number || ''}
              onChange={(e) => updateMobileMoneyDetails('phone_number', e.target.value)}
              placeholder="+27123456789"
              error={errors.phoneNumber}
              required
              autoComplete="tel"
            />

            <Input
              label="Account Name"
              value={paymentDetails.mobile_money?.account_name || ''}
              onChange={(e) => updateMobileMoneyDetails('account_name', e.target.value)}
              placeholder="John Doe"
              error={errors.accountName}
              required
            />

            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You will receive an SMS prompt on your mobile device to authorize this payment.
              </p>
            </Card>
          </div>
        );

      case 'bank_transfer':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-900">Bank Transfer Details</h3>
            </div>

            <Input
              label="Bank Name"
              value={paymentDetails.bank_transfer?.bank_name || ''}
              onChange={(e) => updateBankTransferDetails('bank_name', e.target.value)}
              placeholder="First National Bank"
              error={errors.bankName}
              required
            />

            <Input
              label="Account Number"
              value={paymentDetails.bank_transfer?.account_number || ''}
              onChange={(e) => updateBankTransferDetails('account_number', e.target.value.replace(/\D/g, ''))}
              placeholder="1234567890"
              error={errors.accountNumber}
              required
            />

            <Input
              label="Routing Number / Branch Code"
              value={paymentDetails.bank_transfer?.routing_number || ''}
              onChange={(e) => updateBankTransferDetails('routing_number', e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              error={errors.routingNumber}
              required
            />

            <Input
              label="Account Holder Name"
              value={paymentDetails.bank_transfer?.account_holder_name || ''}
              onChange={(e) => updateBankTransferDetails('account_holder_name', e.target.value)}
              placeholder="John Doe"
              error={errors.accountHolderName}
              required
            />

            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Processing Time:</strong> Bank transfers typically take 1-3 business days to process.
              </p>
            </Card>
          </div>
        );

      case 'digital_wallet':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-neutral-900">Digital Wallet Details</h3>
            </div>

            <Input
              label={`${paymentMethod.name} ID`}
              value={paymentDetails.digital_wallet?.wallet_id || ''}
              onChange={(e) => updateDigitalWalletDetails('wallet_id', e.target.value)}
              placeholder="wallet@example.com"
              error={errors.walletId}
              required
            />

            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-sm text-green-800">
                You will be redirected to {paymentMethod.name} to complete your payment securely.
              </p>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Payment Method Specific Fields */}
      {renderPaymentMethodFields()}

      {/* Billing Address */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-neutral-900">Billing Address</h3>
        
        <Input
          label="Street Address"
          value={billingAddress.street}
          onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
          placeholder="123 Main Street"
          error={errors.street}
          required
          autoComplete="billing street-address"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="City"
            value={billingAddress.city}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Cape Town"
            error={errors.city}
            required
            autoComplete="billing address-level2"
          />

          <Input
            label="State/Province"
            value={billingAddress.state || ''}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
            placeholder="Western Cape"
            autoComplete="billing address-level1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Postal Code"
            value={billingAddress.postal_code}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
            placeholder="8001"
            error={errors.postal_code}
            required
            autoComplete="billing postal-code"
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Country *
            </label>
            <select
              value={billingAddress.country}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value as SADCCountryCode }))}
              className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:ring-primary-500"
              required
            >
              {SADC_COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Save Payment Method */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="saveMethod"
          checked={saveMethod}
          onChange={(e) => setSaveMethod(e.target.checked)}
          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="saveMethod" className="text-sm text-neutral-700">
          Save this payment method for future bookings
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full py-3 text-lg font-semibold"
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Processing...' : `Complete Payment`}
      </Button>
    </form>
  );
};