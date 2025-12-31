/**
 * Payment Dashboard Component
 * Comprehensive payment management interface
 * Implements requirement 6.5 (transparent fee breakdown and payment method management)
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, RefreshCw, TrendingUp, AlertCircle, Download } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PaymentMethodManager } from './PaymentMethodManager';
import { RefundManager } from './RefundManager';
import { FeeBreakdown } from './FeeBreakdown';
import { paymentService } from '../../services/paymentService';
import { PaymentTransaction, EscrowAccount, FeeBreakdown as FeeBreakdownType } from '../../schemas/payment-schemas';
import { SADCCountryCode } from '../../schemas/common-schemas';

export interface PaymentDashboardProps {
  userCountry: SADCCountryCode;
  userId?: number;
}

interface PaymentSummary {
  total_payments: number;
  total_amount: number;
  total_refunds: number;
  refund_amount: number;
  pending_payments: number;
  currency: string;
}

interface RecentTransaction extends PaymentTransaction {
  booking_reference?: string;
  vehicle_name?: string;
}

export const PaymentDashboard: React.FC<PaymentDashboardProps> = ({
  userCountry,
  userId
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'methods' | 'transactions' | 'refunds'>('overview');
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<RecentTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentData();
  }, [userId]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      // In a real app, these would be actual API calls
      // For now, we'll simulate the data
      const mockSummary: PaymentSummary = {
        total_payments: 12,
        total_amount: 15750.00,
        total_refunds: 2,
        refund_amount: 850.00,
        pending_payments: 1,
        currency: 'USD'
      };

      const mockTransactions: RecentTransaction[] = [
        {
          id: 1,
          booking_id: 101,
          payment_method_id: 'credit_card_visa',
          amount: 1200.00,
          currency: 'USD',
          processing_fee: 36.00,
          total_amount: 1236.00,
          status: 'completed',
          payment_details: {},
          billing_address: {
            street: '123 Main St',
            city: 'Cape Town',
            postal_code: '8001',
            country: 'ZA'
          },
          created_at: '2024-01-15T10:30:00Z',
          processed_at: '2024-01-15T10:31:00Z',
          booking_reference: 'BK-2024-001',
          vehicle_name: '2023 Toyota Corolla'
        }
      ];

      setPaymentSummary(mockSummary);
      setRecentTransactions(mockTransactions);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return paymentService.formatCurrency(amount, currency);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-neutral-600 bg-neutral-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const downloadTransactionHistory = () => {
    // In a real app, this would generate and download a CSV/PDF report
    console.log('Downloading transaction history...');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'methods', label: 'Payment Methods', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'refunds', label: 'Refunds', icon: RefreshCw }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-neutral-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center border-red-200 bg-red-50">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Failed to Load Payment Data
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <Button variant="outline" onClick={loadPaymentData}>
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">
          Payment Dashboard
        </h1>
        <Button
          variant="outline"
          onClick={downloadTransactionHistory}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export History</span>
        </Button>
      </div>

      {/* Summary Cards */}
      {paymentSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Payments</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {paymentSummary.total_payments}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Spent</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(paymentSummary.total_amount, paymentSummary.currency)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Refunds</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(paymentSummary.refund_amount, paymentSummary.currency)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Pending</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {paymentSummary.pending_payments}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Recent Transactions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Recent Transactions
              </h3>
              
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors"
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900">
                            {transaction.booking_reference} - {transaction.vehicle_name}
                          </div>
                          <div className="text-sm text-neutral-600">
                            {formatDateTime(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-neutral-900">
                          {formatCurrency(transaction.total_amount, transaction.currency)}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Payment Method Summary */}
            <PaymentMethodManager
              userCountry={userCountry}
              showAddButton={false}
              allowDelete={false}
              allowSetDefault={false}
            />
          </div>
        )}

        {activeTab === 'methods' && (
          <PaymentMethodManager
            userCountry={userCountry}
            showAddButton={true}
            allowDelete={true}
            allowSetDefault={true}
          />
        )}

        {activeTab === 'transactions' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Transaction History
            </h3>
            
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border border-neutral-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-neutral-900">
                          Transaction #{transaction.id}
                        </h4>
                        <p className="text-sm text-neutral-600">
                          {transaction.booking_reference} - {transaction.vehicle_name}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-neutral-600">Amount:</span>
                        <span className="ml-2 font-semibold">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Processing Fee:</span>
                        <span className="ml-2 font-semibold">
                          {formatCurrency(transaction.processing_fee, transaction.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Total:</span>
                        <span className="ml-2 font-semibold">
                          {formatCurrency(transaction.total_amount, transaction.currency)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-neutral-500">
                      Created: {formatDateTime(transaction.created_at)}
                      {transaction.processed_at && (
                        <span className="ml-4">
                          Processed: {formatDateTime(transaction.processed_at)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'refunds' && selectedTransaction && (
          <RefundManager
            paymentId={selectedTransaction.id}
            transaction={selectedTransaction}
            allowPartialRefund={true}
            showRefundHistory={true}
          />
        )}

        {activeTab === 'refunds' && !selectedTransaction && (
          <Card className="p-8 text-center">
            <RefreshCw className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Select a Transaction
            </h3>
            <p className="text-neutral-600">
              Choose a transaction from the overview or transactions tab to manage refunds.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};