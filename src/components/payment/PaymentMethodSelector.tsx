/**
 * Payment Method Selector
 * Displays available SADC-specific payment methods
 * Implements requirement 6.1 (SADC-specific payment methods)
 */

import React from 'react';
import { CreditCard, Smartphone, Building2, Wallet, Banknote } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PaymentMethod } from '../../schemas/payment-schemas';
import { paymentService } from '../../services/paymentService';

export interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  amount: number;
  currency: string;
}

const getPaymentMethodIcon = (type: string, provider?: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'credit_card': <CreditCard className="h-6 w-6" />,
    'debit_card': <CreditCard className="h-6 w-6" />,
    'bank_transfer': <Building2 className="h-6 w-6" />,
    'mobile_money': <Smartphone className="h-6 w-6" />,
    'digital_wallet': <Wallet className="h-6 w-6" />,
    'cash_deposit': <Banknote className="h-6 w-6" />
  };

  return iconMap[type] || <CreditCard className="h-6 w-6" />;
};

const getProviderLogo = (provider: string) => {
  // In a real app, these would be actual logo images
  const logoMap: Record<string, string> = {
    // International cards
    'visa': '💳',
    'mastercard': '💳',
    'american_express': '💳',
    // Zimbabwe providers
    'paynow_zimbabwe': '🇿🇼',
    'ecocash': '📱',
    'onemoney': '📱',
    'telecash': '📱',
    'zipit': '🏦',
    'stripe': '💰',
    'flutterwave': '🌊',
    // South Africa providers
    'fnb': '🏦',
    'standard_bank': '🏦',
    'absa': '🏦',
    'nedbank': '🏦',
    'payfast': '💰',
    'peach_payments': '💰',
    // Other SADC
    'mpesa': '📱',
    'orange_money': '📱',
    'paypal': '💰'
  };

  return logoMap[provider] || '💳';
};

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  methods,
  selectedMethod,
  onMethodSelect,
  amount,
  currency
}) => {
  const calculateTotalAmount = (method: PaymentMethod) => {
    const processingFee = (amount * method.processing_fee_percent / 100) + method.fixed_fee;
    return amount + processingFee;
  };

  const formatProcessingTime = (hours: number) => {
    if (hours === 0) return 'Instant';
    if (hours < 24) return `${hours} hours`;
    const days = Math.ceil(hours / 24);
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  // Group methods by type for better organization
  const groupedMethods = methods.reduce((groups, method) => {
    const type = method.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(method);
    return groups;
  }, {} as Record<string, PaymentMethod[]>);

  const typeLabels: Record<string, string> = {
    'credit_card': 'Credit Cards',
    'debit_card': 'Debit Cards',
    'bank_transfer': 'Bank Transfers',
    'mobile_money': 'Mobile Money',
    'digital_wallet': 'Digital Wallets',
    'cash_deposit': 'Cash Deposits'
  };

  if (methods.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CreditCard className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          No Payment Methods Available
        </h3>
        <p className="text-neutral-600">
          No payment methods are currently available for your location and amount.
          Please contact support for assistance.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedMethods).map(([type, typeMethods]) => (
        <div key={type}>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {typeLabels[type] || type}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {typeMethods.map((method) => {
              const totalAmount = calculateTotalAmount(method);
              const isSelected = selectedMethod?.id === method.id;
              
              return (
                <Card
                  key={method.id}
                  className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => method.enabled && onMethodSelect(method)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {getPaymentMethodIcon(method.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-900 flex items-center space-x-2">
                          <span>{method.name}</span>
                          <span className="text-lg">{getProviderLogo(method.provider)}</span>
                        </h4>
                        <p className="text-sm text-neutral-600">{method.description}</p>
                      </div>
                    </div>
                    
                    {!method.enabled && (
                      <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                        Unavailable
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Processing Fee */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Base Amount:</span>
                      <span className="font-medium">
                        {paymentService.formatCurrency(amount, currency)}
                      </span>
                    </div>
                    
                    {(method.processing_fee_percent > 0 || method.fixed_fee > 0) && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-600">Processing Fee:</span>
                        <span className="text-neutral-800">
                          {method.processing_fee_percent > 0 && `${method.processing_fee_percent}%`}
                          {method.processing_fee_percent > 0 && method.fixed_fee > 0 && ' + '}
                          {method.fixed_fee > 0 && paymentService.formatCurrency(method.fixed_fee, currency)}
                        </span>
                      </div>
                    )}
                    
                    <div className="border-t border-neutral-200 pt-3 flex justify-between items-center">
                      <span className="font-semibold text-neutral-900">Total Amount:</span>
                      <span className="font-bold text-lg text-primary-600">
                        {paymentService.formatCurrency(totalAmount, currency)}
                      </span>
                    </div>

                    {/* Processing Time */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-600">Processing Time:</span>
                      <span className="text-neutral-800 font-medium">
                        {formatProcessingTime(method.processing_time_hours)}
                      </span>
                    </div>

                    {/* Amount Limits */}
                    {(method.min_amount > 0 || method.max_amount > 0) && (
                      <div className="text-xs text-neutral-500">
                        Limits: {paymentService.formatCurrency(method.min_amount, currency)} - {' '}
                        {paymentService.formatCurrency(method.max_amount, currency)}
                      </div>
                    )}

                    {/* Verification Required */}
                    {method.requires_verification && (
                      <div className="flex items-center space-x-1 text-xs text-amber-600">
                        <span>⚠️</span>
                        <span>Identity verification required</span>
                      </div>
                    )}
                  </div>

                  {method.enabled && (
                    <Button
                      variant={isSelected ? "primary" : "outline"}
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMethodSelect(method);
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select This Method'}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Payment Security Notice */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 mt-0.5">
            🔒
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Secure Payment Processing</h4>
            <p className="text-sm text-blue-800">
              All payments are processed securely using industry-standard encryption. 
              Your payment information is never stored on our servers.
            </p>
          </div>
        </div>
      </Card>

      {/* SADC Region Notice */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <div className="text-green-600 mt-0.5">
            🌍
          </div>
          <div>
            <h4 className="font-medium text-green-900 mb-1">SADC Regional Support</h4>
            <p className="text-sm text-green-800">
              Payment methods are optimized for each SADC country. Zimbabwe users get access to 
              Paynow, EcoCash, OneMoney, Telecash, ZipIt, Stripe, and Flutterwave. 
              Other countries have their local payment options available.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};