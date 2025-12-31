/**
 * Insurance Management Dashboard
 * Comprehensive dashboard for managing insurance policies, claims, and assistance
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Grid } from '../ui';
import { 
  Shield, Plus, FileText, Phone, AlertTriangle, 
  Clock, CheckCircle, TrendingUp, Calendar 
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { insuranceService } from '../../services/insuranceService';
import { PolicyStatusTracker } from './PolicyStatusTracker';
import { ClaimsSubmissionForm } from './ClaimsSubmissionForm';
import { EmergencyAssistanceRequest } from './EmergencyAssistanceRequest';
import { InsuranceSelectionModal } from './InsuranceSelectionModal';

export interface InsuranceManagementDashboardProps {
  userId?: number;
  className?: string;
}

interface InsurancePolicy {
  id: number;
  booking_id: number;
  policy_number: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'claimed';
  premium_amount: number;
  currency: string;
  coverage_details: {
    effective_date: string;
    expiry_date: string;
    coverage_type: string;
  };
  product: {
    name: string;
    provider: {
      name: string;
    };
  };
}

interface InsuranceClaim {
  id: number;
  policy_id: number;
  claim_type: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid' | 'closed';
  claim_amount?: number;
  currency?: string;
  created_at: string;
}

interface InsuranceAnalytics {
  total_policies: number;
  active_policies: number;
  total_claims: number;
  claim_success_rate: number;
  average_claim_amount: number;
  savings_from_insurance: number;
  currency: string;
}

export const InsuranceManagementDashboard: React.FC<InsuranceManagementDashboardProps> = ({
  userId,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'claims' | 'emergency'>('overview');
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [analytics, setAnalytics] = useState<InsuranceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewPolicyModal, setShowNewPolicyModal] = useState(false);
  const [showClaimsForm, setShowClaimsForm] = useState(false);
  const [selectedPolicyForClaim, setSelectedPolicyForClaim] = useState<number | null>(null);
  const [selectedBookingForClaim, setSelectedBookingForClaim] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [policiesData, claimsData, analyticsData] = await Promise.all([
        insuranceService.getPolicies({ user_id: userId }),
        insuranceService.getClaims({ user_id: userId }),
        insuranceService.getInsuranceAnalytics({ user_id: userId })
      ]);

      setPolicies(policiesData);
      setClaims(claimsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewClaim = (policyId: number, bookingId: number) => {
    setSelectedPolicyForClaim(policyId);
    setSelectedBookingForClaim(bookingId);
    setShowClaimsForm(true);
  };

  const handleClaimSubmitted = (claimId: number) => {
    setShowClaimsForm(false);
    setSelectedPolicyForClaim(null);
    setSelectedBookingForClaim(null);
    fetchDashboardData(); // Refresh data
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'claimed': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <Grid cols={1} responsive={{ md: 2, lg: 4 }} gap="lg">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Policies</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.active_policies}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_claims}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.claim_success_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Insurance Savings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.savings_from_insurance, analytics.currency)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </Grid>
      )}

      {/* Recent Policies */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Policies</h3>
          <Button variant="outline" size="sm" onClick={() => setShowNewPolicyModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Button>
        </div>

        {policies.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Insurance Policies</h4>
            <p className="text-gray-500 mb-4">
              You don't have any insurance policies yet. Add coverage to protect your rentals.
            </p>
            <Button onClick={() => setShowNewPolicyModal(true)}>
              Get Insurance Coverage
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.slice(0, 3).map(policy => (
              <PolicyStatusTracker
                key={policy.id}
                policy={policy}
                compact={true}
                showActions={false}
              />
            ))}
            {policies.length > 3 && (
              <Button variant="outline" onClick={() => setActiveTab('policies')} className="w-full">
                View All Policies ({policies.length})
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Recent Claims */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Claims</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('claims')}>
            View All Claims
          </Button>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No claims filed yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.slice(0, 3).map(claim => (
              <div key={claim.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Claim #{claim.id}</div>
                  <div className="text-sm text-gray-500">
                    {claim.claim_type} • {formatDate(claim.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(claim.status)} size="sm">
                    {claim.status.replace('_', ' ')}
                  </Badge>
                  {claim.claim_amount && (
                    <div className="text-sm text-gray-500 mt-1">
                      {formatCurrency(claim.claim_amount, claim.currency || 'USD')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Insurance Policies</h2>
        <Button onClick={() => setShowNewPolicyModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Policy
        </Button>
      </div>

      {policies.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Insurance Policies</h3>
          <p className="text-gray-500 mb-6">
            Protect your rentals with comprehensive insurance coverage
          </p>
          <Button onClick={() => setShowNewPolicyModal(true)}>
            Get Your First Policy
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {policies.map(policy => (
            <PolicyStatusTracker
              key={policy.id}
              policy={policy}
              onPolicyUpdate={(updatedPolicy) => {
                setPolicies(prev => prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderClaims = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Insurance Claims</h2>
        {policies.some(p => p.status === 'active') && (
          <Button onClick={() => setShowClaimsForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            File New Claim
          </Button>
        )}
      </div>

      {claims.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Claims Filed</h3>
          <p className="text-gray-500 mb-6">
            You haven't filed any insurance claims yet
          </p>
          {policies.some(p => p.status === 'active') && (
            <Button onClick={() => setShowClaimsForm(true)}>
              File Your First Claim
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map(claim => (
            <Card key={claim.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">Claim #{claim.id}</h3>
                    <Badge className={getStatusColor(claim.status)}>
                      {claim.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Type: {claim.claim_type}</p>
                    <p>Filed: {formatDate(claim.created_at)}</p>
                    {claim.claim_amount && (
                      <p>Amount: {formatCurrency(claim.claim_amount, claim.currency || 'USD')}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {claim.status === 'submitted' && (
                    <Button variant="outline" size="sm">
                      Add Documents
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderEmergency = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Emergency Assistance</h2>
        <p className="text-gray-600">
          Get immediate help when you need it most during your rental period
        </p>
      </div>

      {policies.some(p => p.status === 'active') ? (
        <div className="space-y-6">
          {policies
            .filter(p => p.status === 'active')
            .map(policy => (
              <EmergencyAssistanceRequest
                key={policy.id}
                policyId={policy.id}
                onRequestSubmitted={(requestId) => {
                  alert(`Emergency assistance request submitted successfully! Request ID: ${requestId}`);
                }}
              />
            ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Active Policies</h3>
          <p className="text-gray-500 mb-6">
            You need an active insurance policy to request emergency assistance
          </p>
          <Button onClick={() => setShowNewPolicyModal(true)}>
            Get Insurance Coverage
          </Button>
        </Card>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'policies', label: 'Policies', icon: FileText },
            { id: 'claims', label: 'Claims', icon: Calendar },
            { id: 'emergency', label: 'Emergency', icon: Phone }
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'policies' && renderPolicies()}
      {activeTab === 'claims' && renderClaims()}
      {activeTab === 'emergency' && renderEmergency()}

      {/* Modals */}
      {showNewPolicyModal && (
        <InsuranceSelectionModal
          isOpen={showNewPolicyModal}
          availableProducts={[]} // Would be fetched from API
          booking={{} as any} // Would be passed from parent
          onProductSelect={(product) => {
            console.log('Selected product:', product);
            setShowNewPolicyModal(false);
          }}
          onClose={() => setShowNewPolicyModal(false)}
        />
      )}

      {showClaimsForm && selectedPolicyForClaim && selectedBookingForClaim && (
        <ClaimsSubmissionForm
          policyId={selectedPolicyForClaim}
          bookingId={selectedBookingForClaim}
          onClaimSubmitted={handleClaimSubmitted}
          onCancel={() => setShowClaimsForm(false)}
        />
      )}
    </div>
  );
};