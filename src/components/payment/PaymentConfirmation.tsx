/**
 * Payment Confirmation Component
 * Shows payment success and escrow status
 * Implements requirement 6.2 (escrow explanation and status display)
 */

import React from 'react';
import { CheckCircle, Shield, Clock, Download, ArrowRight, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PaymentTransaction, EscrowAccount } from '../../schemas/payment-schemas';
import { paymentService } from '../../services/paymentService';

export interface PaymentConfirmationProps {
  transaction: PaymentTransaction;
  escrowAccount: EscrowAccount;
  onContinue: () => void;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  transaction,
  escrowAccount,
  onContinue
}) => {
  const formatCurrency = (amount: number) => {
    return paymentService.formatCurrency(amount, transaction.currency);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const copyTransactionId = () => {
    if (transaction.transaction_id) {
      navigator.clipboard.writeText(transaction.transaction_id);
      // In a real app, you'd show a toast notification here
    }
  };

  const downloadReceipt = () => {
    // In a real app, this would generate and download a PDF receipt
    console.log('Downloading receipt for transaction:', transaction.id);
  };

  const getEscrowStatusColor = (status: string) => {
    switch (status) {
      case 'funded':
        return 'text-green-600 bg-green-100';
      case 'created':
        return 'text-blue-600 bg-blue-100';
      case 'disputed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getAutoReleaseDate = () => {
    if (escrowAccount.release_scheduled_at) {
      return new Date(escrowAccount.release_scheduled_at);
    }
    
    // Calculate based on auto_release_hours
    const releaseDate = new Date(escrowAccount.funded_at || escrowAccount.created_at);
    releaseDate.setHours(releaseDate.getHours() + escrowAccount.release_conditions.auto_release_hours);
    return releaseDate;
  };

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">
          Payment Successful!
        </h2>
        <p className="text-lg text-neutral-600">
          Your payment has been processed and secured in escrow
        </p>
      </div>

      {/* Transaction Summary */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-neutral-900 mb-4">
          Transaction Summary
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Transaction ID:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm text-neutral-900">
                {transaction.transaction_id || `TXN-${transaction.id}`}
              </span>
              {transaction.transaction_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyTransactionId}
                  className="p-1 h-auto"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Amount Paid:</span>
            <span className="font-semibold text-lg text-neutral-900">
              {formatCurrency(transaction.total_amount)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Processing Fee:</span>
            <span className="text-neutral-900">
              {formatCurrency(transaction.processing_fee)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Payment Method:</span>
            <span className="text-neutral-900 capitalize">
              {transaction.payment_method_id.replace('_', ' ')}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Date & Time:</span>
            <span className="text-neutral-900">
              {formatDateTime(transaction.processed_at || transaction.created_at)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Status:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {transaction.status}
            </span>
          </div>
        </div>
      </Card>

      {/* Escrow Status */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Escrow Protection Active
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-800">Escrow Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEscrowStatusColor(escrowAccount.status)}`}>
                  {escrowAccount.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-blue-800">Protected Amount:</span>
                <span className="font-semibold text-blue-900">
                  {formatCurrency(escrowAccount.amount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-blue-800">Auto-Release Date:</span>
                <span className="text-blue-900">
                  {formatDateTime(getAutoReleaseDate().toISOString())}
                </span>
              </div>

              {escrowAccount.release_conditions.dispute_period_hours > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-blue-800">Dispute Period:</span>
                  <span className="text-blue-900">
                    {escrowAccount.release_conditions.dispute_period_hours} hours after completion
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">What happens next?</span>
              </div>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Your funds are securely held until rental completion</li>
                <li>• The operator will be notified of your confirmed booking</li>
                <li>• Funds will be automatically released after successful return</li>
                <li>• You can raise disputes if any issues occur</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Fee Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Fee Breakdown
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Rental Amount:</span>
            <span className="text-neutral-900">
              {formatCurrency(transaction.amount)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Platform Fee:</span>
            <span className="text-neutral-900">
              {formatCurrency(escrowAccount.fees.platform_fee)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Processing Fee:</span>
            <span className="text-neutral-900">
              {formatCurrency(escrowAccount.fees.processing_fee)}
            </span>
          </div>

          <div className="border-t border-neutral-200 pt-3 flex justify-between items-center font-semibold">
            <span className="text-neutral-900">Total Paid:</span>
            <span className="text-lg text-primary-600">
              {formatCurrency(transaction.total_amount)}
            </span>
          </div>

          <div className="text-sm text-neutral-500">
            Operator receives: {formatCurrency(transaction.amount - escrowAccount.fees.total_fees)}
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          Next Steps
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div>
              <p className="font-medium text-green-900">Check Your Email</p>
              <p className="text-sm text-green-700">
                We've sent a confirmation email with your booking details and receipt
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div>
              <p className="font-medium text-green-900">Contact the Operator</p>
              <p className="text-sm text-green-700">
                The vehicle operator will contact you within 24 hours to arrange pickup
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div>
              <p className="font-medium text-green-900">Prepare for Pickup</p>
              <p className="text-sm text-green-700">
                Have your ID, driving license, and booking confirmation ready
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={downloadReceipt}
          className="flex items-center justify-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download Receipt</span>
        </Button>
        
        <Button
          variant="primary"
          onClick={onContinue}
          className="flex items-center justify-center space-x-2 flex-1"
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Support Information */}
      <Card className="p-4 bg-neutral-50 border-neutral-200">
        <div className="text-center">
          <p className="text-sm text-neutral-600">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@autolodge.com" className="text-primary-600 hover:underline">
              support@autolodge.com
            </a>
            {' '}or call +27 11 123 4567
          </p>
        </div>
      </Card>
    </div>
  );
};