/**
 * Policy Status Tracker Component
 * Displays insurance policy status with timeline and key information
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';
import { Shield, Clock, CheckCircle, XCircle, AlertCircle, FileText, Phone, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { insuranceService } from '../../services/insuranceService';

export interface InsurancePolicy {
  id: number;
  booking_id: number;
  product_id: number;
  policy_number: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'claimed';
  coverage_details: {
    policy_number: string;
    coverage_type: 'basic' | 'comprehensive' | 'third_party' | 'collision' | 'theft';
    effective_date: string;
    expiry_date: string;
    emergency_contacts: {
      claims_hotline: string;
      roadside_assistance: string;
      emergency_services: string;
    };
  };
  premium_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    name: string;
    provider: {
      id: number;
      name: string;
      logo_url?: string;
    };
  };
  booking?: {
    id: number;
    vehicle: {
      make: string;
      model: string;
      year: number;
    };
    date_range: {
      start_date: string;
      end_date: string;
    };
  };
}

export interface PolicyStatusTrackerProps {
  policyId?: number;
  policy?: InsurancePolicy;
  onPolicyUpdate?: (policy: InsurancePolicy) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending Activation',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Policy is being processed and will be active soon'
  },
  active: {
    label: 'Active Coverage',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Policy is active and providing coverage'
  },
  expired: {
    label: 'Expired',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
    description: 'Policy coverage has ended'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    description: 'Policy has been cancelled'
  },
  claimed: {
    label: 'Claim Filed',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle,
    description: 'A claim has been filed under this policy'
  }
};

export const PolicyStatusTracker: React.FC<PolicyStatusTrackerProps> = ({
  policyId,
  policy: initialPolicy,
  onPolicyUpdate,
  showActions = true,
  compact = false,
  className
}) => {
  const [policy, setPolicy] = useState<InsurancePolicy | null>(initialPolicy || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policyId && !initialPolicy) {
      fetchPolicy();
    }
  }, [policyId, initialPolicy]);

  const fetchPolicy = async () => {
    if (!policyId) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedPolicy = await insuranceService.getPolicy(policyId);
      setPolicy(fetchedPolicy);
      onPolicyUpdate?.(fetchedPolicy);
    } catch (err) {
      console.error('Error fetching policy:', err);
      setError('Unable to load policy details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: InsurancePolicy['status'], reason?: string) => {
    if (!policy) return;

    setLoading(true);
    try {
      const updatedPolicy = await insuranceService.updatePolicyStatus(policy.id, newStatus, reason);
      setPolicy(updatedPolicy);
      onPolicyUpdate?.(updatedPolicy);
    } catch (err) {
      console.error('Error updating policy status:', err);
      setError('Unable to update policy status');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const isActive = () => {
    if (!policy) return false;
    const now = new Date();
    const effectiveDate = new Date(policy.coverage_details.effective_date);
    const expiryDate = new Date(policy.coverage_details.expiry_date);
    return policy.status === 'active' && now >= effectiveDate && now <= expiryDate;
  };

  const getDaysRemaining = () => {
    if (!policy) return 0;
    const now = new Date();
    const expiryDate = new Date(policy.coverage_details.expiry_date);
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading && !policy) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error && !policy) {
    return (
      <Card className={cn('p-6 border-red-200 bg-red-50', className)}>
        <div className="flex items-center space-x-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Error Loading Policy</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchPolicy} className="mt-3">
          Retry
        </Button>
      </Card>
    );
  }

  if (!policy) return null;

  const statusConfig = STATUS_CONFIG[policy.status];
  const IconComponent = statusConfig.icon;
  const daysRemaining = getDaysRemaining();

  if (compact) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">{policy.product.name}</div>
              <div className="text-sm text-gray-500">Policy #{policy.policy_number}</div>
            </div>
          </div>
          
          <div className="text-right">
            <Badge className={statusConfig.color} size="sm">
              {statusConfig.label}
            </Badge>
            {isActive() && daysRemaining > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {daysRemaining} days left
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={cn('p-2 rounded-lg', statusConfig.color.replace('text-', 'bg-').replace('border-', ''))}>
            <IconComponent className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{policy.product.name}</h3>
            <p className="text-gray-600">{policy.product.provider.name}</p>
          </div>
        </div>
        
        <Badge className={statusConfig.color}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Policy Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Policy Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Policy Number:</span>
              <span className="font-medium">{policy.policy_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Coverage Type:</span>
              <span className="font-medium capitalize">{policy.coverage_details.coverage_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Premium:</span>
              <span className="font-medium">{formatCurrency(policy.premium_amount, policy.currency)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Coverage Period</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Effective Date:</span>
              <span className="font-medium">{formatDate(policy.coverage_details.effective_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expiry Date:</span>
              <span className="font-medium">{formatDate(policy.coverage_details.expiry_date)}</span>
            </div>
            {isActive() && (
              <div className="flex justify-between">
                <span className="text-gray-500">Days Remaining:</span>
                <span className={cn(
                  'font-medium',
                  daysRemaining <= 7 ? 'text-red-600' : 
                  daysRemaining <= 30 ? 'text-yellow-600' : 'text-green-600'
                )}>
                  {daysRemaining} days
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Information */}
      {policy.booking && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Associated Booking</h4>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">
                {policy.booking.vehicle.make} {policy.booking.vehicle.model} {policy.booking.vehicle.year}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(policy.booking.date_range.start_date)} - {formatDate(policy.booking.date_range.end_date)}
              </div>
            </div>
            <Button variant="outline" size="sm">
              View Booking
            </Button>
          </div>
        </div>
      )}

      {/* Emergency Contacts */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Emergency Contacts</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <Phone className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-xs text-blue-600 font-medium">Claims Hotline</div>
              <div className="text-sm font-medium">{policy.coverage_details.emergency_contacts.claims_hotline}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
            <Phone className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-xs text-green-600 font-medium">Roadside Assistance</div>
              <div className="text-sm font-medium">{policy.coverage_details.emergency_contacts.roadside_assistance}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
            <Phone className="h-4 w-4 text-red-600" />
            <div>
              <div className="text-xs text-red-600 font-medium">Emergency Services</div>
              <div className="text-sm font-medium">{policy.coverage_details.emergency_contacts.emergency_services}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Description */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <IconComponent className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <div className="font-medium text-gray-900 mb-1">Policy Status</div>
            <p className="text-sm text-gray-600">{statusConfig.description}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Download Policy
          </Button>
          
          {isActive() && (
            <>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                File Claim
              </Button>
              <Button variant="outline" size="sm">
                Request Assistance
              </Button>
            </>
          )}
          
          {policy.status === 'pending' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleStatusUpdate('cancelled', 'User requested cancellation')}
              disabled={loading}
            >
              Cancel Policy
            </Button>
          )}
          
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            View Timeline
          </Button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </Card>
  );
};