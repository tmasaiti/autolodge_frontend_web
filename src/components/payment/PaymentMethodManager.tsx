/**
 * Payment Method Manager Component
 * Manages saved payment methods for users
 * Implements requirement 6.5 (payment method selection interface)
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Edit, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { PaymentForm } from './PaymentForm';
import { paymentService } from '../../services/paymentService';
import { PaymentMethod, PaymentDetails, BillingAddress } from '../../schemas/payment-schemas';
import { SADCCountryCode } from '../../schemas/common-schemas';

export interface SavedPaymentMethod extends PaymentMethod {
  saved_id: string;
  masked_details: {
    card_last_four?: string;
    card_brand?: string;
    account_last_four?: string;
    phone_masked?: string;
    wallet_masked?: string;
  };
  billing_address: BillingAddress;
  is_default: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface PaymentMethodManagerProps {
  userCountry: SADCCountryCode;
  onMethodSelect?: (method: SavedPaymentMethod) => void;
  showAddButton?: boolean;
  allowDelete?: boolean;
  allowSetDefault?: boolean;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  userCountry,
  onMethodSelect,
  showAddButton = true,
  allowDelete = true,
  allowSetDefault = true
}) => {
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMethodForAdd, setSelectedMethodForAdd] = useState<PaymentMethod | null>(null);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedMethods();
    loadAvailableMethods();
  }, [userCountry]);

  const loadSavedMethods = async () => {
    try {
      const methods = await paymentService.getSavedPaymentMethods();
      setSavedMethods(methods as SavedPaymentMethod[]);
    } catch (error: any) {
      console.error('Failed to load saved payment methods:', error);
      setError('Failed to load saved payment methods');
    }
  };

  const loadAvailableMethods = async () => {
    try {
      setLoading(true);
      const methods = await paymentService.getPaymentMethods(userCountry, 1000, 'USD'); // Get all available methods
      setAvailableMethods(methods);
    } catch (error: any) {
      console.error('Failed to load available payment methods:', error);
      setError('Failed to load available payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = (method: PaymentMethod) => {
    setSelectedMethodForAdd(method);
    setShowAddModal(true);
  };

  const handleSaveMethod = async (
    paymentDetails: PaymentDetails,
    billingAddress: BillingAddress
  ) => {
    if (!selectedMethodForAdd) return;

    try {
      await paymentService.savePaymentMethod(
        selectedMethodForAdd.id,
        paymentDetails,
        billingAddress
      );
      
      setShowAddModal(false);
      setSelectedMethodForAdd(null);
      await loadSavedMethods(); // Reload the list
    } catch (error: any) {
      console.error('Failed to save payment method:', error);
      setError(error.message);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      setDeletingMethodId(methodId);
      await paymentService.deleteSavedPaymentMethod(methodId);
      await loadSavedMethods(); // Reload the list
    } catch (error: any) {
      console.error('Failed to delete payment method:', error);
      setError(error.message);
    } finally {
      setDeletingMethodId(null);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    // In a real app, this would call an API to set the default method
    console.log('Setting default payment method:', methodId);
  };

  const formatLastUsed = (dateString?: string) => {
    if (!dateString) return 'Never used';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const getMaskedDisplay = (method: SavedPaymentMethod) => {
    const { masked_details } = method;
    
    switch (method.type) {
      case 'credit_card':
      case 'debit_card':
        return `•••• •••• •••• ${masked_details.card_last_four || '****'}`;
      case 'bank_transfer':
        return `Account ending in ${masked_details.account_last_four || '****'}`;
      case 'mobile_money':
        return masked_details.phone_masked || 'Mobile Money Account';
      case 'digital_wallet':
        return masked_details.wallet_masked || 'Digital Wallet';
      default:
        return 'Payment Method';
    }
  };

  const getMethodIcon = (type: string) => {
    return paymentService.getPaymentMethodIcon(type);
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-neutral-600">Loading payment methods...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Error</span>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            loadSavedMethods();
            loadAvailableMethods();
          }}
          className="mt-4"
        >
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">
          Saved Payment Methods
        </h2>
        {showAddButton && (
          <Button
            variant="outline"
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Method</span>
          </Button>
        )}
      </div>

      {/* Saved Methods List */}
      {savedMethods.length === 0 ? (
        <Card className="p-8 text-center">
          <CreditCard className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No Saved Payment Methods
          </h3>
          <p className="text-neutral-600 mb-4">
            Add a payment method to make future bookings faster and easier.
          </p>
          {showAddButton && (
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Method</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {savedMethods.map((method) => (
            <Card
              key={method.saved_id}
              className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                method.is_default ? 'ring-2 ring-primary-500 border-primary-500' : 'border-neutral-200'
              }`}
              onClick={() => onMethodSelect?.(method)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getMethodIcon(method.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-neutral-900">
                        {method.name}
                      </h3>
                      {method.is_default && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                          Default
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-neutral-600 font-mono">
                      {getMaskedDisplay(method)}
                    </p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                      <span>Added {new Date(method.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Last used: {formatLastUsed(method.last_used_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {allowSetDefault && !method.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(method.saved_id);
                      }}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Set Default
                    </Button>
                  )}
                  
                  {allowDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMethod(method.saved_id);
                      }}
                      disabled={deletingMethodId === method.saved_id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deletingMethodId === method.saved_id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Secure Storage</h4>
            <p className="text-sm text-blue-800">
              Your payment information is encrypted and stored securely. We never store complete 
              card numbers or sensitive details on our servers.
            </p>
          </div>
        </div>
      </Card>

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedMethodForAdd(null);
        }}
        size="lg"
      >
        <Modal.Header>
          <h2 className="text-xl font-semibold text-neutral-900">
            Add Payment Method
          </h2>
        </Modal.Header>
        
        <Modal.Body>
          {!selectedMethodForAdd ? (
            <div className="space-y-4">
              <p className="text-neutral-600 mb-6">
                Choose a payment method type to add:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableMethods.map((method) => (
                  <Card
                    key={method.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-neutral-200 hover:border-primary-300"
                    onClick={() => handleAddMethod(method)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">
                        {getMethodIcon(method.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{method.name}</h3>
                        <p className="text-sm text-neutral-600">{method.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <PaymentForm
              paymentMethod={selectedMethodForAdd}
              onSubmit={(paymentDetails, billingAddress) => 
                handleSaveMethod(paymentDetails, billingAddress)
              }
              loading={false}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};