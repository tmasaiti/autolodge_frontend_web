/**
 * Payment Page
 * Demonstrates the complete payment system with SADC-specific methods
 * Implements requirements 6.1, 6.2, 6.4, 6.5
 */

import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PaymentInterface, PaymentDashboard } from '../components/payment';
import { PaymentTransaction, EscrowAccount } from '../schemas/payment-schemas';
import { SADCCountryCode } from '../schemas/common-schemas';

export interface PaymentPageProps {
  // Optional props for when used in booking flow
  bookingId?: number;
  amount?: number;
  currency?: string;
  onPaymentComplete?: (transaction: PaymentTransaction, escrow: EscrowAccount) => void;
  onCancel?: () => void;
}

type PaymentView = 'dashboard' | 'payment_interface';

export const PaymentPage: React.FC<PaymentPageProps> = ({
  bookingId,
  amount,
  currency = 'USD',
  onPaymentComplete,
  onCancel
}) => {
  const [currentView, setCurrentView] = useState<PaymentView>(
    bookingId ? 'payment_interface' : 'dashboard'
  );
  const [userCountry] = useState<SADCCountryCode>('ZA'); // In real app, get from user profile

  const handlePaymentComplete = (transaction: PaymentTransaction, escrow: EscrowAccount) => {
    if (onPaymentComplete) {
      onPaymentComplete(transaction, escrow);
    } else {
      // Navigate to dashboard view to show the completed payment
      setCurrentView('dashboard');
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // In a real app, you might show a toast notification or error modal
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setCurrentView('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {currentView === 'payment_interface' && (
            <div className="flex items-center space-x-4 mb-6">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="h-6 w-px bg-neutral-300" />
              <h1 className="text-2xl font-bold text-neutral-900">
                Complete Payment
              </h1>
            </div>
          )}

          {currentView === 'dashboard' && (
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-neutral-900">
                Payment Management
              </h1>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => window.open('/zimbabwe-payment-demo', '_blank')}
                  className="flex items-center space-x-2"
                >
                  <Globe className="h-4 w-4" />
                  <span>🇿🇼 Zimbabwe Demo</span>
                </Button>
                {!bookingId && (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentView('payment_interface')}
                    className="flex items-center space-x-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Make a Payment</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {currentView === 'payment_interface' && (
          <div className="max-w-4xl mx-auto">
            {bookingId && amount ? (
              <PaymentInterface
                bookingId={bookingId}
                amount={amount}
                currency={currency}
                userCountry={userCountry}
                onPaymentComplete={handlePaymentComplete}
                onPaymentError={handlePaymentError}
                onCancel={handleCancel}
              />
            ) : (
              <Card className="p-8 text-center">
                <CreditCard className="h-16 w-16 text-neutral-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                  Payment Interface Demo
                </h2>
                <p className="text-neutral-600 mb-6">
                  This is a demonstration of the payment interface. In a real booking flow, 
                  this would be populated with actual booking and payment details.
                </p>
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Demo Features</h3>
                    <ul className="text-sm text-blue-800 space-y-1 text-left">
                      <li>• SADC-specific payment methods</li>
                      <li>• Secure escrow payment processing</li>
                      <li>• Transparent fee breakdown</li>
                      <li>• Multi-currency support</li>
                      <li>• Payment method management</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">🇿🇼 Zimbabwe Integration</h3>
                    <p className="text-sm text-green-800 mb-3">
                      Comprehensive Zimbabwe payment support addressing bias towards South African methods.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.open('/zimbabwe-payment-demo', '_blank')}
                      className="w-full text-green-700 border-green-300 hover:bg-green-100"
                    >
                      View Zimbabwe Payment Demo
                    </Button>
                  </div>
                  
                  <Button
                    variant="primary"
                    onClick={() => setCurrentView('dashboard')}
                    className="w-full"
                  >
                    View Payment Dashboard
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {currentView === 'dashboard' && (
          <PaymentDashboard
            userCountry={userCountry}
            userId={1} // In real app, get from auth context
          />
        )}
      </div>
    </div>
  );
};