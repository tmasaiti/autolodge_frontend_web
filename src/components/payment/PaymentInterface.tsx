/**
 * Payment Processing Interface
 * Main component for handling payment processing with SADC-specific methods
 * Implements requirements 6.1, 6.2, 6.4 (payment processing and escrow)
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, AlertCircle, CheckCircle, Clock, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentForm } from './PaymentForm';
import { ZimbabwePaymentForm } from './ZimbabwePaymentForm';
import { EscrowExplanation } from './EscrowExplanation';
import { FeeBreakdown } from './FeeBreakdown';
import { PaymentConfirmation } from './PaymentConfirmation';
import { paymentService } from '../../services/paymentService';
import { 
  PaymentMethod, 
  PaymentTransaction, 
  EscrowAccount,
  PaymentDetails,
  BillingAddress,
  FeeBreakdown as FeeBreakdownType
} from '../../schemas/payment-schemas';
import { SADCCountryCode } from '../../schemas/common-schemas';

export interface PaymentInterfaceProps {
  bookingId: number;
  amount: number;
  currency: string;
  userCountry: SADCCountryCode;
  onPaymentComplete: (transaction: PaymentTransaction, escrow: EscrowAccount) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

type PaymentStep = 'method_selection' | 'payment_form' | 'processing' | 'confirmation' | 'error';

export const PaymentInterface: React.FC<PaymentInterfaceProps> = ({
  bookingId,
  amount,
  currency,
  userCountry,
  onPaymentComplete,
  onPaymentError,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>('method_selection');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdownType | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    street: '',
    city: '',
    postal_code: '',
    country: userCountry
  });
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [escrowAccount, setEscrowAccount] = useState<EscrowAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('');

  // Load payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, [userCountry, amount, currency]);

  // Calculate fees when payment method is selected
  useEffect(() => {
    if (selectedMethod) {
      calculateFees();
    }
  }, [selectedMethod, amount, currency]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await paymentService.getPaymentMethods(userCountry, amount, currency);
      setPaymentMethods(methods);
    } catch (error: any) {
      setError(error.message);
      setCurrentStep('error');
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = async () => {
    if (!selectedMethod) return;

    try {
      const fees = await paymentService.calculateFees(
        amount,
        currency,
        selectedMethod.id,
        userCountry
      );
      setFeeBreakdown(fees);
    } catch (error: any) {
      console.error('Failed to calculate fees:', error);
      // Don't block the flow, just show base amount
    }
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setCurrentStep('payment_form');
  };

  const handlePaymentSubmit = async (
    paymentDetails: PaymentDetails,
    billingAddress: BillingAddress,
    saveMethod: boolean = false
  ) => {
    if (!selectedMethod) return;

    try {
      setLoading(true);
      setCurrentStep('processing');
      setProcessingMessage('Validating payment details...');

      // Validate payment details
      const validation = paymentService.validatePaymentDetails(
        selectedMethod.type,
        paymentDetails
      );

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      setProcessingMessage('Processing payment...');

      // Process payment
      const response = await paymentService.processPayment({
        booking_id: bookingId,
        payment_method_id: selectedMethod.id,
        amount: feeBreakdown?.net_amount || amount,
        currency,
        payment_details: paymentDetails,
        billing_address: billingAddress,
        save_payment_method: saveMethod
      });

      setTransaction(response.transaction);
      setEscrowAccount(response.escrow_account);

      // Handle 3DS redirect if required
      if (response.requires_3ds && response.redirect_url) {
        setProcessingMessage('Redirecting for 3D Secure verification...');
        window.location.href = response.redirect_url;
        return;
      }

      setCurrentStep('confirmation');
      onPaymentComplete(response.transaction, response.escrow_account);

    } catch (error: any) {
      setError(error.message);
      setCurrentStep('error');
      onPaymentError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if selected method is a Zimbabwe-specific payment method
  const isZimbabwePaymentMethod = (method: PaymentMethod): boolean => {
    const zimbabweProviders = ['paynow_zimbabwe', 'ecocash', 'onemoney', 'telecash', 'zipit'];
    return zimbabweProviders.includes(method.provider);
  };

  const handleRetry = () => {
    setError(null);
    setCurrentStep('method_selection');
  };

  const handleBackToMethodSelection = () => {
    setSelectedMethod(null);
    setFeeBreakdown(null);
    setCurrentStep('method_selection');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'method_selection':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Choose Payment Method
              </h2>
              <p className="text-neutral-600">
                Select your preferred payment method for {paymentService.formatCurrency(amount, currency)}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <PaymentMethodSelector
                methods={paymentMethods}
                selectedMethod={selectedMethod}
                onMethodSelect={handleMethodSelect}
                amount={amount}
                currency={currency}
              />
            )}

            <EscrowExplanation />
          </div>
        );

      case 'payment_form':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neutral-900">
                Payment Details
              </h2>
              <Button
                variant="ghost"
                onClick={handleBackToMethodSelection}
                className="text-primary-600"
              >
                Change Method
              </Button>
            </div>

            {selectedMethod && (
              <Card className="p-4 bg-primary-50 border-primary-200">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {paymentService.getPaymentMethodIcon(selectedMethod.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900">{selectedMethod.name}</h3>
                    <p className="text-sm text-primary-700">{selectedMethod.description}</p>
                  </div>
                </div>
              </Card>
            )}

            {feeBreakdown && (
              <FeeBreakdown breakdown={feeBreakdown} />
            )}

            {selectedMethod && isZimbabwePaymentMethod(selectedMethod) ? (
              <ZimbabwePaymentForm
                paymentMethod={selectedMethod}
                onSubmit={(details, address) => handlePaymentSubmit(details, address, false)}
                loading={loading}
              />
            ) : (
              <PaymentForm
                paymentMethod={selectedMethod!}
                onSubmit={handlePaymentSubmit}
                initialBillingAddress={billingAddress}
                loading={loading}
              />
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Processing Payment
            </h2>
            <p className="text-neutral-600 mb-4">{processingMessage}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center space-x-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Please do not close this window or navigate away
                </span>
              </div>
            </div>
          </div>
        );

      case 'confirmation':
        return transaction && escrowAccount ? (
          <PaymentConfirmation
            transaction={transaction}
            escrowAccount={escrowAccount}
            onContinue={() => onPaymentComplete(transaction, escrowAccount)}
          />
        ) : null;

      case 'error':
        return (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              {error || 'An unexpected error occurred while processing your payment.'}
            </p>
            <div className="space-x-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${
            ['method_selection', 'payment_form', 'processing', 'confirmation'].includes(currentStep)
              ? 'text-primary-600' : 'text-neutral-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              ['method_selection', 'payment_form', 'processing', 'confirmation'].includes(currentStep)
                ? 'bg-primary-600 text-white' : 'bg-neutral-200'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">Payment Method</span>
          </div>

          <div className={`w-8 h-0.5 ${
            ['payment_form', 'processing', 'confirmation'].includes(currentStep)
              ? 'bg-primary-600' : 'bg-neutral-200'
          }`} />

          <div className={`flex items-center space-x-2 ${
            ['payment_form', 'processing', 'confirmation'].includes(currentStep)
              ? 'text-primary-600' : 'text-neutral-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              ['payment_form', 'processing', 'confirmation'].includes(currentStep)
                ? 'bg-primary-600 text-white' : 'bg-neutral-200'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Payment Details</span>
          </div>

          <div className={`w-8 h-0.5 ${
            ['confirmation'].includes(currentStep)
              ? 'bg-primary-600' : 'bg-neutral-200'
          }`} />

          <div className={`flex items-center space-x-2 ${
            ['confirmation'].includes(currentStep)
              ? 'text-primary-600' : 'text-neutral-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              ['confirmation'].includes(currentStep)
                ? 'bg-primary-600 text-white' : 'bg-neutral-200'
            }`}>
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Confirmation</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-8">
        {renderStepContent()}
      </Card>

      {/* Security Notice */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500">
          <Lock className="h-4 w-4" />
          <span>Your payment is secured with bank-level encryption</span>
        </div>
      </div>
    </div>
  );
};