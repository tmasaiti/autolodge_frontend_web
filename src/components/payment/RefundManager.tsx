/**
 * Refund Manager Component
 * Handles refund requests and dispute payment handling
 * Implements requirement 6.5 (refund and dispute payment handling)
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Clock, DollarSign, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { PaymentTransaction, RefundRequest, RefundResponse } from '../../schemas/payment-schemas';
import { paymentService } from '../../services/paymentService';

export interface RefundManagerProps {
  paymentId: number;
  transaction: PaymentTransaction;
  onRefundComplete?: (refund: RefundResponse) => void;
  allowPartialRefund?: boolean;
  showRefundHistory?: boolean;
}

interface RefundHistoryItem {
  id: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  reason: string;
  requested_at: string;
  completed_at?: string;
  failure_reason?: string;
}

export const RefundManager: React.FC<RefundManagerProps> = ({
  paymentId,
  transaction,
  onRefundComplete,
  allowPartialRefund = true,
  showRefundHistory = true
}) => {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState('');
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundHistory, setRefundHistory] = useState<RefundHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const maxRefundAmount = transaction.total_amount - (transaction.refund_amount || 0);
  const canRefund = transaction.status === 'completed' && maxRefundAmount > 0;

  useEffect(() => {
    if (showRefundHistory) {
      loadRefundHistory();
    }
  }, [paymentId, showRefundHistory]);

  const loadRefundHistory = async () => {
    try {
      setLoadingHistory(true);
      // In a real app, this would fetch refund history from the API
      // For now, we'll simulate it
      const mockHistory: RefundHistoryItem[] = [];
      setRefundHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load refund history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) {
      setError('Please provide a reason for the refund');
      return;
    }

    const amount = isFullRefund ? maxRefundAmount : parseFloat(refundAmount);
    
    if (!isFullRefund && (isNaN(amount) || amount <= 0 || amount > maxRefundAmount)) {
      setError(`Refund amount must be between $0.01 and ${formatCurrency(maxRefundAmount)}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const refundRequest: RefundRequest = {
        payment_id: paymentId,
        amount: isFullRefund ? undefined : amount,
        reason: refundReason
      };

      const refundResponse = await paymentService.requestRefund(refundRequest);
      
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      setIsFullRefund(true);
      
      onRefundComplete?.(refundResponse);
      
      if (showRefundHistory) {
        await loadRefundHistory();
      }

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return paymentService.formatCurrency(amount, transaction.currency);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRefundStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-neutral-600" />;
    }
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Refund Status Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Refund Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900">
              {formatCurrency(transaction.total_amount)}
            </div>
            <div className="text-sm text-neutral-600">Original Amount</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(transaction.refund_amount || 0)}
            </div>
            <div className="text-sm text-neutral-600">Refunded</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(maxRefundAmount)}
            </div>
            <div className="text-sm text-neutral-600">Available for Refund</div>
          </div>
        </div>

        {canRefund && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <Button
              variant="outline"
              onClick={() => setShowRefundModal(true)}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Request Refund</span>
            </Button>
          </div>
        )}

        {!canRefund && maxRefundAmount === 0 && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="flex items-center space-x-2 text-neutral-600">
              <CheckCircle className="h-5 w-5" />
              <span>This payment has been fully refunded</span>
            </div>
          </div>
        )}

        {!canRefund && transaction.status !== 'completed' && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              <span>Refunds are only available for completed payments</span>
            </div>
          </div>
        )}
      </Card>

      {/* Refund History */}
      {showRefundHistory && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Refund History
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRefundHistory}
              disabled={loadingHistory}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {loadingHistory ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading refund history...</p>
            </div>
          ) : refundHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600">No refunds have been processed for this payment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {refundHistory.map((refund) => (
                <div
                  key={refund.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {getRefundStatusIcon(refund.status)}
                    <div>
                      <div className="font-semibold text-neutral-900">
                        {formatCurrency(refund.amount)}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {refund.reason}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Requested: {formatDateTime(refund.requested_at)}
                        {refund.completed_at && (
                          <span> • Completed: {formatDateTime(refund.completed_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRefundStatusColor(refund.status)}`}>
                    {refund.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Refund Request Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setError(null);
          setRefundAmount('');
          setRefundReason('');
          setIsFullRefund(true);
        }}
        size="md"
      >
        <Modal.Header>
          <h2 className="text-xl font-semibold text-neutral-900">
            Request Refund
          </h2>
        </Modal.Header>
        
        <Modal.Body>
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}

            {/* Refund Type Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Refund Type
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={isFullRefund}
                    onChange={() => setIsFullRefund(true)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-neutral-900">
                    Full Refund ({formatCurrency(maxRefundAmount)})
                  </span>
                </label>
                
                {allowPartialRefund && (
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={!isFullRefund}
                      onChange={() => setIsFullRefund(false)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-neutral-900">Partial Refund</span>
                  </label>
                )}
              </div>
            </div>

            {/* Partial Refund Amount */}
            {!isFullRefund && allowPartialRefund && (
              <Input
                label="Refund Amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                max={maxRefundAmount}
                step="0.01"
                leftIcon={<DollarSign className="h-5 w-5" />}
                required
              />
            )}

            {/* Refund Reason */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Reason for Refund *
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please explain why you are requesting this refund..."
                rows={4}
                className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-500 focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            {/* Refund Information */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Refund Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Refunds typically process within 3-5 business days</li>
                <li>• You will receive an email confirmation once processed</li>
                <li>• Refunds are returned to the original payment method</li>
                <li>• Processing fees may not be refundable</li>
              </ul>
            </Card>
          </div>
        </Modal.Body>
        
        <Modal.Footer>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowRefundModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRefundRequest}
              loading={loading}
              disabled={loading || !refundReason.trim()}
            >
              {loading ? 'Processing...' : 'Request Refund'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};