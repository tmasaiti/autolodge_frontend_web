import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, Lock } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { WizardStepProps } from '../../wizard/WizardStepWrapper';

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_transfer' | 'mobile_money';
  name: string;
  description: string;
  processing_fee: number;
  supported_countries: string[];
  icon: React.ReactNode;
}

export interface PaymentStepData {
  selectedPaymentMethod?: string;
  paymentDetails: {
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
    billingAddress?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  agreedToTerms: boolean;
  agreedToEscrow: boolean;
}

export interface PaymentStepProps extends WizardStepProps {
  totalAmount: number;
  currency: string;
}

// Mock payment methods - in real app, these would be filtered by country/region
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'credit_card',
    type: 'credit_card',
    name: 'Credit Card',
    description: 'Visa, Mastercard, American Express',
    processing_fee: 2.9,
    supported_countries: ['ZA', 'BW', 'NA', 'ZM', 'ZW'],
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    id: 'debit_card',
    type: 'debit_card',
    name: 'Debit Card',
    description: 'Bank debit cards',
    processing_fee: 1.5,
    supported_countries: ['ZA', 'BW', 'NA'],
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer (EFT)',
    processing_fee: 0,
    supported_countries: ['ZA', 'BW', 'NA', 'ZM'],
    icon: <CreditCard className="h-5 w-5" />
  }
];

export const PaymentStep: React.FC<PaymentStepProps> = ({
  totalAmount,
  currency,
  data,
  onDataChange,
  onNext
}) => {
  const [formData, setFormData] = useState<PaymentStepData>({
    selectedPaymentMethod: data.selectedPaymentMethod,
    paymentDetails: data.paymentDetails || {
      billingAddress: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
    },
    agreedToTerms: data.agreedToTerms || false,
    agreedToEscrow: data.agreedToEscrow || false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update parent data when form changes
  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === formData.selectedPaymentMethod);
  const processingFee = selectedMethod ? (totalAmount * selectedMethod.processing_fee / 100) : 0;
  const finalAmount = totalAmount + processingFee;

  const handlePaymentMethodSelect = (methodId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPaymentMethod: methodId
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentDetails: {
        ...prev.paymentDetails,
        [field]: value
      }
    }));
  };

  const handleBillingAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentDetails: {
        ...prev.paymentDetails,
        billingAddress: {
          ...prev.paymentDetails.billingAddress!,
          [field]: value
        }
      }
    }));
  };

  const handleAgreementChange = (field: 'agreedToTerms' | 'agreedToEscrow') => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.selectedPaymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    if (formData.selectedPaymentMethod === 'credit_card' || formData.selectedPaymentMethod === 'debit_card') {
      if (!formData.paymentDetails.cardNumber) {
        newErrors.cardNumber = 'Card number is required';
      } else if (!/^\d{16}$/.test(formData.paymentDetails.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = 'Please enter a valid 16-digit card number';
      }

      if (!formData.paymentDetails.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(formData.paymentDetails.expiryDate)) {
        newErrors.expiryDate = 'Please enter expiry date in MM/YY format';
      }

      if (!formData.paymentDetails.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (!/^\d{3,4}$/.test(formData.paymentDetails.cvv)) {
        newErrors.cvv = 'Please enter a valid CVV';
      }

      if (!formData.paymentDetails.cardholderName) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
    }

    if (!formData.paymentDetails.billingAddress?.street) {
      newErrors.billingStreet = 'Billing address is required';
    }

    if (!formData.paymentDetails.billingAddress?.city) {
      newErrors.billingCity = 'City is required';
    }

    if (!formData.paymentDetails.billingAddress?.country) {
      newErrors.billingCountry = 'Country is required';
    }

    if (!formData.agreedToTerms) {
      newErrors.terms = 'Please agree to the terms and conditions';
    }

    if (!formData.agreedToEscrow) {
      newErrors.escrow = 'Please agree to the escrow payment terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext?.();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="space-y-10">
      {/* Payment Summary */}
      <section className="bg-neutral-50 rounded-xl p-6" aria-labelledby="payment-summary-heading">
        <h2 id="payment-summary-heading" className="text-xl font-semibold text-neutral-900 mb-6">
          Payment Summary
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span className="text-neutral-700">Rental Amount:</span>
            <span className="font-semibold text-neutral-900">{formatCurrency(totalAmount)}</span>
          </div>
          {processingFee > 0 && (
            <div className="flex justify-between items-center text-neutral-600">
              <span>Processing Fee ({selectedMethod?.processing_fee}%):</span>
              <span>{formatCurrency(processingFee)}</span>
            </div>
          )}
          <div className="border-t border-neutral-200 pt-4 flex justify-between items-center text-xl font-bold">
            <span className="text-neutral-900">Total Amount:</span>
            <span className="text-primary-600">{formatCurrency(finalAmount)}</span>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <fieldset className="space-y-6">
        <legend className="text-xl font-semibold text-neutral-900 mb-6">
          Select Payment Method
        </legend>
        
        {errors.paymentMethod && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <p className="text-red-700 font-medium">{errors.paymentMethod}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PAYMENT_METHODS.map(method => (
            <label
              key={method.id}
              className={`
                border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-md
                ${formData.selectedPaymentMethod === method.id
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }
              `}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={formData.selectedPaymentMethod === method.id}
                onChange={() => handlePaymentMethodSelect(method.id)}
                className="sr-only"
                aria-describedby={`payment-method-${method.id}-description`}
              />
              <div className="flex items-start space-x-4">
                <div className="text-neutral-600 mt-1" aria-hidden="true">{method.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-1">{method.name}</h3>
                  <p id={`payment-method-${method.id}-description`} className="text-sm text-neutral-600 mb-2">
                    {method.description}
                  </p>
                  {method.processing_fee > 0 && (
                    <p className="text-xs text-neutral-500">
                      {method.processing_fee}% processing fee
                    </p>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Payment Details Form */}
      {(formData.selectedPaymentMethod === 'credit_card' || formData.selectedPaymentMethod === 'debit_card') && (
        <fieldset className="space-y-6">
          <legend className="text-xl font-semibold text-neutral-900 flex items-center mb-6">
            <Lock className="h-6 w-6 mr-3 text-primary-600" aria-hidden="true" />
            Card Details
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Card Number"
                value={formData.paymentDetails.cardNumber || ''}
                onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                error={errors.cardNumber}
                leftIcon={<CreditCard className="h-5 w-5" />}
                required
                aria-describedby={errors.cardNumber ? 'card-number-error' : 'card-number-help'}
                autoComplete="cc-number"
              />
              <p id="card-number-help" className="text-sm text-neutral-500 mt-1">
                Enter your 16-digit card number
              </p>
            </div>

            <Input
              label="Expiry Date"
              value={formData.paymentDetails.expiryDate || ''}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                  value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                handleInputChange('expiryDate', value);
              }}
              placeholder="MM/YY"
              maxLength={5}
              error={errors.expiryDate}
              required
              aria-describedby={errors.expiryDate ? 'expiry-date-error' : 'expiry-date-help'}
              autoComplete="cc-exp"
            />

            <Input
              label="CVV"
              value={formData.paymentDetails.cvv || ''}
              onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
              placeholder="123"
              maxLength={4}
              error={errors.cvv}
              required
              aria-describedby={errors.cvv ? 'cvv-error' : 'cvv-help'}
              autoComplete="cc-csc"
            />

            <div className="md:col-span-2">
              <Input
                label="Cardholder Name"
                value={formData.paymentDetails.cardholderName || ''}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                placeholder="John Doe"
                error={errors.cardholderName}
                required
                aria-describedby={errors.cardholderName ? 'cardholder-name-error' : 'cardholder-name-help'}
                autoComplete="cc-name"
              />
              <p id="cardholder-name-help" className="text-sm text-neutral-500 mt-1">
                Name as it appears on your card
              </p>
            </div>
          </div>
        </fieldset>
      )}

      {/* Billing Address */}
      <fieldset className="space-y-6">
        <legend className="text-xl font-semibold text-neutral-900 mb-6">
          Billing Address
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Street Address"
              value={formData.paymentDetails.billingAddress?.street || ''}
              onChange={(e) => handleBillingAddressChange('street', e.target.value)}
              placeholder="123 Main Street"
              error={errors.billingStreet}
              required
              autoComplete="billing street-address"
            />
          </div>

          <Input
            label="City"
            value={formData.paymentDetails.billingAddress?.city || ''}
            onChange={(e) => handleBillingAddressChange('city', e.target.value)}
            placeholder="Cape Town"
            error={errors.billingCity}
            required
            autoComplete="billing address-level2"
          />

          <Input
            label="State/Province"
            value={formData.paymentDetails.billingAddress?.state || ''}
            onChange={(e) => handleBillingAddressChange('state', e.target.value)}
            placeholder="Western Cape"
            autoComplete="billing address-level1"
          />

          <Input
            label="Postal Code"
            value={formData.paymentDetails.billingAddress?.postalCode || ''}
            onChange={(e) => handleBillingAddressChange('postalCode', e.target.value)}
            placeholder="8001"
            autoComplete="billing postal-code"
          />

          <Input
            label="Country"
            value={formData.paymentDetails.billingAddress?.country || ''}
            onChange={(e) => handleBillingAddressChange('country', e.target.value)}
            placeholder="South Africa"
            error={errors.billingCountry}
            required
            autoComplete="billing country"
          />
        </div>
      </fieldset>

      {/* Escrow Information */}
      <div className="bg-primary-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-primary-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-primary-800 mb-2">Secure Escrow Payment</h4>
            <p className="text-sm text-primary-700 mb-3">
              Your payment will be held securely in escrow until you complete your rental. 
              This protects both you and the vehicle operator.
            </p>
            <ul className="text-sm text-primary-700 space-y-1">
              <li>• Funds are released to the operator after successful vehicle return</li>
              <li>• Disputes are handled fairly with funds held until resolution</li>
              <li>• Your money is protected by bank-level security</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Agreements */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-neutral-900 mb-4">
          Terms and Agreements
        </legend>
        
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={formData.agreedToTerms}
            onChange={() => handleAgreementChange('agreedToTerms')}
            className="mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            aria-describedby="terms-description"
          />
          <label htmlFor="agreeTerms" className="text-sm text-neutral-700">
            <span id="terms-description">
              I agree to the{' '}
              <a href="#" className="text-primary-600 hover:underline">Terms and Conditions</a>
              {' '}and{' '}
              <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
            </span>
          </label>
        </div>
        {errors.terms && (
          <div className="text-sm text-red-600" role="alert">
            {errors.terms}
          </div>
        )}

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="agreeEscrow"
            checked={formData.agreedToEscrow}
            onChange={() => handleAgreementChange('agreedToEscrow')}
            className="mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            aria-describedby="escrow-description"
          />
          <label htmlFor="agreeEscrow" className="text-sm text-neutral-700">
            <span id="escrow-description">
              I understand and agree to the escrow payment terms and authorize 
              AutoLodge to hold my payment until rental completion
            </span>
          </label>
        </div>
        {errors.escrow && (
          <div className="text-sm text-red-600" role="alert">
            {errors.escrow}
          </div>
        )}
      </fieldset>

      {/* Security Notice */}
      <aside className="bg-neutral-50 rounded-xl p-4">
        <div className="flex items-center space-x-2 text-sm text-neutral-600">
          <Lock className="h-4 w-4" aria-hidden="true" />
          <span>Your payment information is encrypted and secure</span>
        </div>
      </aside>

      {/* Continue Button */}
      <div className="flex justify-end pt-6">
        <Button 
          variant="accent" 
          onClick={handleSubmit}
          disabled={!formData.selectedPaymentMethod || !formData.agreedToTerms || !formData.agreedToEscrow}
          className="px-10 py-3 text-lg font-semibold"
        >
          Secure Payment - {formatCurrency(finalAmount)}
        </Button>
      </div>
    </div>
  );
};