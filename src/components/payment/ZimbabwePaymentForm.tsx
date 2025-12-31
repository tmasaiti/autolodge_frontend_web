/**
 * Zimbabwe Payment Form Component
 * Specialized form for Zimbabwean payment methods
 * Addresses the need for proper Zimbabwe payment integration
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, Building2, CreditCard, Banknote } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { PaymentMethod, PaymentDetails, BillingAddress } from '../../schemas/payment-schemas';
import { zimbabwePaymentService } from '../../services/zimbabwePaymentService';

export interface ZimbabwePaymentFormProps {
  paymentMethod: PaymentMethod;
  onSubmit: (paymentDetails: PaymentDetails, billingAddress: BillingAddress) => void;
  loading?: boolean;
}

export const ZimbabwePaymentForm: React.FC<ZimbabwePaymentFormProps> = ({
  paymentMethod,
  onSubmit,
  loading = false
}) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    street: '',
    city: '',
    postal_code: '',
    country: 'ZW'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [exchangeRates, setExchangeRates] = useState<{
    official_rate: number;
    parallel_rate: number;
  } | null>(null);

  useEffect(() => {
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    try {
      const rates = await zimbabwePaymentService.getZimbabweExchangeRates();
      setExchangeRates(rates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate based on payment method
    switch (paymentMethod.provider) {
      case 'paynow_zimbabwe':
        if (!paymentDetails.digital_wallet?.wallet_id) {
          newErrors.email = 'Email address is required for Paynow';
        }
        break;

      case 'ecocash':
      case 'onemoney':
      case 'telecash':
        if (!paymentDetails.mobile_money?.phone_number) {
          newErrors.phoneNumber = 'Phone number is required';
        } else {
          const validation = zimbabwePaymentService.validateZimbabweanPhone(
            paymentDetails.mobile_money.phone_number
          );
          if (!validation.isValid) {
            newErrors.phoneNumber = 'Please enter a valid Zimbabwean phone number';
          }
          
          // Check if provider matches phone number
          const expectedProvider = paymentMethod.provider === 'ecocash' ? 'econet' :
                                 paymentMethod.provider === 'onemoney' ? 'netone' : 'telecel';
          if (validation.provider && validation.provider !== expectedProvider) {
            newErrors.phoneNumber = `This phone number is not compatible with ${paymentMethod.name}`;
          }
        }
        break;

      case 'zipit':
        if (!paymentDetails.bank_transfer?.bank_name) {
          newErrors.bankName = 'Please select your bank';
        }
        if (!paymentDetails.bank_transfer?.account_number) {
          newErrors.accountNumber = 'Account number is required';
        }
        break;
    }

    // Validate billing address
    if (!billingAddress.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!billingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(paymentDetails, billingAddress);
    }
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
    switch (paymentMethod.provider) {
      case 'paynow_zimbabwe':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-2xl">🇿🇼</div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Paynow Zimbabwe</h3>
                <p className="text-sm text-neutral-600">
                  Pay with EcoCash, OneMoney, Visa, or Mastercard
                </p>
              </div>
            </div>

            <Input
              label="Email Address"
              type="email"
              value={paymentDetails.digital_wallet?.wallet_id || ''}
              onChange={(e) => updateDigitalWalletDetails('wallet_id', e.target.value)}
              placeholder="your.email@example.com"
              error={errors.email}
              required
              autoComplete="email"
            />

            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">How Paynow Works</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. You'll be redirected to Paynow's secure payment page</li>
                <li>2. Choose your preferred payment method (EcoCash, OneMoney, Card)</li>
                <li>3. Complete the payment using your chosen method</li>
                <li>4. You'll be redirected back to confirm your booking</li>
              </ol>
            </Card>
          </div>
        );

      case 'ecocash':
      case 'onemoney':
      case 'telecash':
        const providerNames = {
          ecocash: 'EcoCash (Econet)',
          onemoney: 'OneMoney (NetOne)',
          telecash: 'Telecash (Telecel)'
        };

        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Smartphone className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {providerNames[paymentMethod.provider as keyof typeof providerNames]}
                </h3>
                <p className="text-sm text-neutral-600">Mobile money payment</p>
              </div>
            </div>

            <Input
              label="Mobile Number"
              value={paymentDetails.mobile_money?.phone_number || ''}
              onChange={(e) => updateMobileMoneyDetails('phone_number', e.target.value)}
              placeholder="+263771234567"
              error={errors.phoneNumber}
              required
              autoComplete="tel"
            />

            <Input
              label="Account Name"
              value={paymentDetails.mobile_money?.account_name || ''}
              onChange={(e) => updateMobileMoneyDetails('account_name', e.target.value)}
              placeholder="John Doe"
              required
            />

            <Card className="p-4 bg-green-50 border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Payment Process</h4>
              <p className="text-sm text-green-800">
                You will receive an SMS prompt on your mobile device to authorize this payment. 
                Please ensure you have sufficient balance in your {paymentMethod.name} wallet.
              </p>
            </Card>

            {exchangeRates && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">Exchange Rates (USD/ZWL)</h4>
                <div className="text-sm text-yellow-800 space-y-1">
                  <div>Official Rate: 1 USD = {exchangeRates.official_rate.toLocaleString()} ZWL</div>
                  <div>Parallel Rate: 1 USD = {exchangeRates.parallel_rate.toLocaleString()} ZWL</div>
                </div>
              </Card>
            )}
          </div>
        );

      case 'zipit':
        const zimbabweanBanks = zimbabwePaymentService.getZimbabweanBanks();

        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">ZipIt Bank Transfer</h3>
                <p className="text-sm text-neutral-600">Instant transfer between Zimbabwean banks</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Your Bank *
              </label>
              <select
                value={paymentDetails.bank_transfer?.bank_name || ''}
                onChange={(e) => updateBankTransferDetails('bank_name', e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:ring-primary-500"
                required
              >
                <option value="">Select your bank</option>
                {zimbabweanBanks.map(bank => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {errors.bankName && (
                <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
              )}
            </div>

            <Input
              label="Account Number"
              value={paymentDetails.bank_transfer?.account_number || ''}
              onChange={(e) => updateBankTransferDetails('account_number', e.target.value)}
              placeholder="1234567890"
              error={errors.accountNumber}
              required
            />

            <Input
              label="Account Holder Name"
              value={paymentDetails.bank_transfer?.account_holder_name || ''}
              onChange={(e) => updateBankTransferDetails('account_holder_name', e.target.value)}
              placeholder="John Doe"
              required
            />

            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">ZipIt Transfer</h4>
              <p className="text-sm text-blue-800">
                ZipIt enables instant transfers between participating Zimbabwean banks. 
                The transfer will be processed immediately and you'll receive confirmation via SMS.
              </p>
            </Card>
          </div>
        );

      case 'stripe':
      case 'flutterwave':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {paymentMethod.name}
                </h3>
                <p className="text-sm text-neutral-600">
                  International payment processing
                </p>
              </div>
            </div>

            <Card className="p-4 bg-green-50 border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Supported Payment Methods</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Visa and Mastercard (local and international)</li>
                <li>• Mobile money (EcoCash, OneMoney)</li>
                <li>• Bank transfers</li>
                <li>• Digital wallets</li>
              </ul>
              <p className="text-sm text-green-800 mt-2">
                You'll be redirected to {paymentMethod.name}'s secure payment page to complete your transaction.
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
          placeholder="123 Main Street, Harare"
          error={errors.street}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="City"
            value={billingAddress.city}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Harare"
            error={errors.city}
            required
          />

          <Input
            label="Postal Code"
            value={billingAddress.postal_code}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
            placeholder="263"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Country
          </label>
          <select
            value={billingAddress.country}
            onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value as any }))}
            className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-primary-500 focus:ring-primary-500"
            required
          >
            <option value="ZW">Zimbabwe</option>
          </select>
        </div>
      </div>

      {/* Zimbabwe-specific Notice */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <div className="text-green-600 mt-0.5">🇿🇼</div>
          <div>
            <h4 className="font-medium text-green-900 mb-2">Zimbabwe Payment Support</h4>
            <p className="text-sm text-green-800">
              We support all major Zimbabwean payment methods including EcoCash, OneMoney, 
              Telecash, ZipIt, and international cards. All transactions are processed securely 
              with local and international payment partners.
            </p>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full py-3 text-lg font-semibold"
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Processing...' : `Pay with ${paymentMethod.name}`}
      </Button>
    </form>
  );
};