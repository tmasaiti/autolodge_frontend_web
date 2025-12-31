import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/Button';
import { WizardStepProps } from '../../wizard/WizardStepWrapper';

export interface VerificationStepData {
  kycStatus: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'expired';
  verificationLevel: 'basic' | 'standard' | 'premium' | 'operator';
  documentsStatus: {
    identity: 'pending' | 'verified' | 'rejected';
    license: 'pending' | 'verified' | 'rejected';
    address: 'pending' | 'verified' | 'rejected';
    business?: 'pending' | 'verified' | 'rejected';
    insurance: 'pending' | 'verified' | 'rejected';
  };
  trustScore: number;
  verificationNotes?: string[];
  estimatedCompletionTime?: string;
  canProceedToFleetSetup: boolean;
}

export const VerificationStep: React.FC<WizardStepProps> = ({
  data,
  allData,
  onDataChange,
  onNext
}) => {
  const [formData, setFormData] = useState<VerificationStepData>({
    kycStatus: data.kycStatus || 'pending',
    verificationLevel: data.verificationLevel || 'basic',
    documentsStatus: data.documentsStatus || {
      identity: 'pending',
      license: 'pending',
      address: 'pending',
      business: 'pending',
      insurance: 'pending'
    },
    trustScore: data.trustScore || 0,
    verificationNotes: data.verificationNotes || [],
    estimatedCompletionTime: data.estimatedCompletionTime || '24-48 hours',
    canProceedToFleetSetup: data.canProceedToFleetSetup || false
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate verification progress
  useEffect(() => {
    // In a real app, this would poll the backend for verification status
    const timer = setTimeout(() => {
      if (formData.kycStatus === 'pending') {
        setFormData(prev => ({
          ...prev,
          kycStatus: 'in_progress',
          documentsStatus: {
            ...prev.documentsStatus,
            identity: 'verified',
            license: 'verified'
          },
          trustScore: 35
        }));
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Update parent data when form changes
  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    
    // Simulate API call to refresh verification status
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate some progress
    setFormData(prev => ({
      ...prev,
      documentsStatus: {
        ...prev.documentsStatus,
        address: 'verified',
        insurance: 'verified'
      },
      trustScore: Math.min(prev.trustScore + 20, 85),
      kycStatus: prev.trustScore > 60 ? 'completed' : 'in_progress',
      canProceedToFleetSetup: prev.trustScore > 60
    }));
    
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'rejected':
      case 'expired':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'in_progress':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  const businessType = allData.business_info?.businessType || 'individual';
  const documentsData = allData.documents || {};

  const documentItems = [
    { key: 'identity', label: 'Identity Document', required: true },
    { key: 'license', label: 'Driver\'s License', required: true },
    { key: 'address', label: 'Proof of Address', required: true },
    { key: 'insurance', label: 'Insurance Certificate', required: true },
    ...(businessType === 'company' ? [
      { key: 'business', label: 'Business Registration', required: true }
    ] : [])
  ];

  const verifiedCount = Object.values(formData.documentsStatus).filter(status => status === 'verified').length;
  const totalRequired = documentItems.filter(item => item.required).length;

  return (
    <div className="space-y-6">
      {/* Verification Overview */}
      <div className="text-center">
        <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Account Verification
        </h2>
        <p className="text-gray-600">
          We're reviewing your documents and information to ensure platform security.
        </p>
      </div>

      {/* Overall Status */}
      <div className={`rounded-lg border p-6 ${getStatusColor(formData.kycStatus)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(formData.kycStatus)}
            <div>
              <h3 className="font-semibold">
                KYC Verification: {getStatusText(formData.kycStatus)}
              </h3>
              <p className="text-sm opacity-75">
                Verification Level: {formData.verificationLevel.charAt(0).toUpperCase() + formData.verificationLevel.slice(1)}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStatus}
            loading={isRefreshing}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>

        {formData.kycStatus === 'pending' && (
          <div className="space-y-2">
            <p className="text-sm">
              Your verification is in queue. Estimated completion time: {formData.estimatedCompletionTime}
            </p>
            <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
              <div className="bg-current h-2 rounded-full w-1/4 animate-pulse" />
            </div>
          </div>
        )}

        {formData.kycStatus === 'in_progress' && (
          <div className="space-y-2">
            <p className="text-sm">
              Our team is currently reviewing your documents...
            </p>
            <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
              <div 
                className="bg-current h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(verifiedCount / totalRequired) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Trust Score */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Trust Score</h3>
          <span className="text-2xl font-bold text-blue-600">{formData.trustScore}/100</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${formData.trustScore}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-600">
          Your trust score increases as documents are verified and you complete platform activities.
        </p>
      </div>

      {/* Document Verification Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Document Verification Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentItems.map(item => {
            const status = formData.documentsStatus[item.key as keyof typeof formData.documentsStatus];
            return (
              <div
                key={item.key}
                className={`border rounded-lg p-4 ${getStatusColor(status || 'pending')}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status || 'pending')}
                    <div>
                      <h4 className="font-medium">{item.label}</h4>
                      <p className="text-sm opacity-75">
                        {getStatusText(status || 'pending')}
                      </p>
                    </div>
                  </div>
                  
                  {item.required && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
                      Required
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification Notes */}
      {formData.verificationNotes && formData.verificationNotes.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Verification Notes</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {formData.verificationNotes.map((note, index) => (
              <li key={index}>• {note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* What's Next */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-3">What happens next?</h3>
        
        {formData.kycStatus === 'pending' && (
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. Our verification team will review your submitted documents</p>
            <p>2. You'll receive email notifications about the verification progress</p>
            <p>3. Once verified, you can proceed to set up your vehicle fleet</p>
            <p>4. After fleet setup, your operator account will be activated</p>
          </div>
        )}

        {formData.kycStatus === 'in_progress' && (
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. Document verification is currently in progress</p>
            <p>2. You can continue to fleet setup once verification is complete</p>
            <p>3. We'll notify you immediately when verification is finished</p>
          </div>
        )}

        {formData.kycStatus === 'completed' && (
          <div className="space-y-2 text-sm text-green-700">
            <p>✓ Your account has been successfully verified!</p>
            <p>✓ You can now proceed to set up your vehicle fleet</p>
            <p>✓ Your operator account will be activated after fleet setup</p>
          </div>
        )}

        {formData.kycStatus === 'rejected' && (
          <div className="space-y-2 text-sm text-red-700">
            <p>• Some documents were rejected and need to be re-submitted</p>
            <p>• Please check your email for specific feedback</p>
            <p>• You can re-upload corrected documents anytime</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div>
          {formData.kycStatus === 'rejected' && (
            <Button variant="outline">
              Re-upload Documents
            </Button>
          )}
        </div>

        <div className="space-x-3">
          {formData.kycStatus === 'completed' && formData.canProceedToFleetSetup && (
            <Button variant="primary" onClick={onNext}>
              Continue to Fleet Setup
            </Button>
          )}
          
          {formData.kycStatus !== 'completed' && (
            <Button 
              variant="outline" 
              onClick={onNext}
              disabled={!formData.canProceedToFleetSetup}
            >
              {formData.canProceedToFleetSetup ? 'Continue Anyway' : 'Wait for Verification'}
            </Button>
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Having issues with verification?{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
};