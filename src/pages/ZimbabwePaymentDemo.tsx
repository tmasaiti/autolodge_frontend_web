/**
 * Zimbabwe Payment Demo Page
 * Showcases proper Zimbabwe payment integration
 * Addresses the bias towards South African payment methods
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ZimbabwePaymentForm } from '../components/payment/ZimbabwePaymentForm';
import { PaymentMethodSelector } from '../components/payment/PaymentMethodSelector';
import { zimbabwePaymentService } from '../services/zimbabwePaymentService';
import { PaymentMethod, PaymentDetails, BillingAddress } from '../schemas/payment-schemas';

export const ZimbabwePaymentDemo: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadZimbabwePaymentMethods();
  }, []);

  const loadZimbabwePaymentMethods = () => {
    const methods = zimbabwePaymentService.getZimbabwePaymentMethods();
    setPaymentMethods(methods);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handlePaymentSubmit = async (
    paymentDetails: PaymentDetails,
    billingAddress: BillingAddress
  ) => {
    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      alert(`Payment processed successfully with ${selectedMethod?.name}!`);
      setSelectedMethod(null);
    }, 2000);
  };

  const handleBack = () => {
    setSelectedMethod(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            {selectedMethod && (
              <>
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <div className="h-6 w-px bg-neutral-300" />
              </>
            )}
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🇿🇼</div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Zimbabwe Payment Methods
              </h1>
            </div>
          </div>
          
          <p className="text-lg text-neutral-600">
            Comprehensive payment integration for Zimbabwean users featuring Paynow, 
            EcoCash, OneMoney, Telecash, ZipIt, Stripe, and Flutterwave.
          </p>
        </div>

        {!selectedMethod ? (
          <div className="space-y-8">
            {/* Payment Methods Overview */}
            <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Why Zimbabwe-Specific Integration Matters
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-neutral-900 mb-2">Mobile Money</h3>
                  <p className="text-sm text-neutral-600">
                    EcoCash, OneMoney, and Telecash are the primary payment methods 
                    used by most Zimbabweans for daily transactions.
                  </p>
                </div>
                
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-neutral-900 mb-2">Local Banking</h3>
                  <p className="text-sm text-neutral-600">
                    ZipIt enables instant transfers between all major Zimbabwean banks 
                    including CBZ, Steward Bank, FBC, and others.
                  </p>
                </div>
                
                <div className="text-center">
                  <CreditCard className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-neutral-900 mb-2">International</h3>
                  <p className="text-sm text-neutral-600">
                    Stripe and Flutterwave provide international card processing 
                    and additional payment options for cross-border transactions.
                  </p>
                </div>
              </div>
            </Card>

            {/* Payment Method Selection */}
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
                Choose Your Payment Method
              </h2>
              
              <PaymentMethodSelector
                methods={paymentMethods}
                selectedMethod={selectedMethod}
                onMethodSelect={handleMethodSelect}
                amount={150}
                currency="USD"
              />
            </div>

            {/* Zimbabwe Payment Ecosystem Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Mobile Money Dominance
                </h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>• <strong>EcoCash (Econet):</strong> Most widely used mobile money platform</li>
                  <li>• <strong>OneMoney (NetOne):</strong> Growing user base with competitive rates</li>
                  <li>• <strong>Telecash (Telecel):</strong> Reliable alternative with good coverage</li>
                  <li>• <strong>Paynow:</strong> Aggregates all mobile money and card payments</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Banking & International
                </h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li>• <strong>ZipIt:</strong> Instant inter-bank transfers in Zimbabwe</li>
                  <li>• <strong>Stripe:</strong> International card processing with local support</li>
                  <li>• <strong>Flutterwave:</strong> African-focused payment gateway</li>
                  <li>• <strong>Local Banks:</strong> CBZ, Steward, FBC, Stanbic, and others</li>
                </ul>
              </Card>
            </div>

            {/* Currency Information */}
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                Currency Considerations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
                <div>
                  <h4 className="font-semibold mb-2">USD Transactions</h4>
                  <p>Most digital transactions in Zimbabwe are conducted in USD, 
                     which is widely accepted and preferred for online payments.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">ZWL Support</h4>
                  <p>Local currency (ZWL) is supported for domestic transactions 
                     with real-time exchange rate conversion available.</p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                  Payment with {selectedMethod.name}
                </h2>
                <p className="text-neutral-600">
                  Complete your payment using {selectedMethod.description}
                </p>
              </div>

              <ZimbabwePaymentForm
                paymentMethod={selectedMethod}
                onSubmit={handlePaymentSubmit}
                loading={loading}
              />
            </Card>
          </div>
        )}

        {/* Footer Note */}
        <Card className="mt-8 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 mt-0.5">💡</div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                Addressing Payment Integration Bias
              </h4>
              <p className="text-sm text-blue-800">
                This implementation specifically addresses the common bias in SADC payment integrations 
                that focus primarily on South African methods. Zimbabwe has a unique and sophisticated 
                mobile money ecosystem that requires proper representation and integration.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};