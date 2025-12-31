import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Download, 
  Eye,
  RefreshCw,
  Calendar,
  DollarSign,
  MapPin,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { SADCCountryCode } from '../../schemas/common-schemas';

// Enhanced permit interfaces
export interface CrossBorderPermit {
  id?: number;
  permit_number?: string;
  from_country: SADCCountryCode;
  to_country: SADCCountryCode;
  status: 'draft' | 'pending' | 'processing' | 'issued' | 'expired' | 'rejected' | 'cancelled';
  application_date?: string;
  issue_date?: string;
  expiry_date?: string;
  fees_paid: number;
  currency: string;
  document_url?: string;
  requirements_met: boolean;
  processing_notes?: string;
  rejection_reason?: string;
  renewal_eligible?: boolean;
  tracking_number?: string;
  estimated_completion?: string;
}

export interface PermitRequirement {
  country_code: SADCCountryCode;
  country_name: string;
  permit_type: 'temporary_import' | 'transit' | 'tourist_vehicle' | 'commercial';
  required_documents: string[];
  processing_fee: number;
  processing_days: number;
  validity_days: number;
  auto_renewable: boolean;
  restrictions: string[];
  urgent_processing_available: boolean;
  urgent_processing_fee?: number;
  urgent_processing_days?: number;
}

export interface PermitApplication {
  id?: number;
  permit_requirement: PermitRequirement;
  applicant_details: {
    full_name: string;
    passport_number: string;
    license_number: string;
    contact_email: string;
    contact_phone: string;
  };
  vehicle_details: {
    registration_number: string;
    make: string;
    model: string;
    year: number;
    vin: string;
  };
  travel_details: {
    purpose: string;
    entry_date: string;
    exit_date: string;
    border_crossing_points: string[];
  };
  documents: {
    document_type: string;
    file_url: string;
    upload_date: string;
    verification_status: 'pending' | 'verified' | 'rejected';
  }[];
  urgent_processing: boolean;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submission_date?: string;
  review_notes?: string;
}

export interface CrossBorderPermitManagementProps {
  permits: CrossBorderPermit[];
  permitRequirements: PermitRequirement[];
  onPermitApplication: (application: PermitApplication) => Promise<CrossBorderPermit>;
  onPermitRenewal: (permitId: number) => Promise<CrossBorderPermit>;
  onPermitCancellation: (permitId: number) => Promise<void>;
  onDocumentUpload: (file: File, permitId: string, documentType: string) => Promise<string>;
  onStatusRefresh: (permitId: number) => Promise<CrossBorderPermit>;
  onViewDocument: (documentUrl: string) => void;
  disabled?: boolean;
}

const COUNTRY_NAMES: Record<SADCCountryCode, string> = {
  'AO': 'Angola',
  'BW': 'Botswana',
  'CD': 'Democratic Republic of Congo',
  'SZ': 'Eswatini',
  'LS': 'Lesotho',
  'MG': 'Madagascar',
  'MW': 'Malawi',
  'MU': 'Mauritius',
  'MZ': 'Mozambique',
  'NA': 'Namibia',
  'SC': 'Seychelles',
  'ZA': 'South Africa',
  'TZ': 'Tanzania',
  'ZM': 'Zambia',
  'ZW': 'Zimbabwe'
};

export const CrossBorderPermitManagement: React.FC<CrossBorderPermitManagementProps> = ({
  permits,
  permitRequirements,
  onPermitApplication,
  onPermitRenewal,
  onPermitCancellation,
  onDocumentUpload,
  onStatusRefresh,
  onViewDocument,
  disabled = false
}) => {
  const [selectedTab, setSelectedTab] = useState<'active' | 'applications' | 'expired'>('active');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<PermitRequirement | null>(null);
  const [showPermitDetails, setShowPermitDetails] = useState<CrossBorderPermit | null>(null);
  const [refreshingPermits, setRefreshingPermits] = useState<Set<number>>(new Set());
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set());

  // Filter permits by status
  const activePermits = permits.filter(p => 
    ['issued', 'processing', 'pending'].includes(p.status)
  );
  const expiredPermits = permits.filter(p => 
    ['expired', 'rejected', 'cancelled'].includes(p.status)
  );
  const draftApplications = permits.filter(p => p.status === 'draft');

  // Get status display properties
  const getStatusDisplay = (status: CrossBorderPermit['status']) => {
    switch (status) {
      case 'draft':
        return { color: 'text-neutral-600', bg: 'bg-neutral-50', icon: FileText, label: 'Draft' };
      case 'pending':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock, label: 'Pending' };
      case 'processing':
        return { color: 'text-blue-600', bg: 'bg-blue-50', icon: RefreshCw, label: 'Processing' };
      case 'issued':
        return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, label: 'Issued' };
      case 'expired':
        return { color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle, label: 'Expired' };
      case 'rejected':
        return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle, label: 'Rejected' };
      case 'cancelled':
        return { color: 'text-neutral-600', bg: 'bg-neutral-50', icon: AlertCircle, label: 'Cancelled' };
      default:
        return { color: 'text-neutral-600', bg: 'bg-neutral-50', icon: FileText, label: 'Unknown' };
    }
  };

  // Handle permit status refresh
  const handleStatusRefresh = async (permitId: number) => {
    setRefreshingPermits(prev => new Set(prev).add(permitId));
    try {
      await onStatusRefresh(permitId);
    } catch (error) {
      console.error('Failed to refresh permit status:', error);
    } finally {
      setRefreshingPermits(prev => {
        const newSet = new Set(prev);
        newSet.delete(permitId);
        return newSet;
      });
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (file: File, permitId: string, documentType: string) => {
    const uploadKey = `${permitId}-${documentType}`;
    setUploadingDocuments(prev => new Set(prev).add(uploadKey));
    
    try {
      await onDocumentUpload(file, permitId, documentType);
    } catch (error) {
      console.error('Failed to upload document:', error);
    } finally {
      setUploadingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadKey);
        return newSet;
      });
    }
  };

  // Check if permit is expiring soon (within 30 days)
  const isExpiringSoon = (permit: CrossBorderPermit): boolean => {
    if (!permit.expiry_date) return false;
    const expiryDate = new Date(permit.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
  };

  // Render permit card
  const renderPermitCard = (permit: CrossBorderPermit) => {
    const statusDisplay = getStatusDisplay(permit.status);
    const isRefreshing = permit.id && refreshingPermits.has(permit.id);
    const expiringSoon = isExpiringSoon(permit);

    return (
      <Card key={permit.id || `${permit.from_country}-${permit.to_country}`} className="border-neutral-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h4 className="text-lg font-medium text-neutral-900">
                  {COUNTRY_NAMES[permit.from_country]} → {COUNTRY_NAMES[permit.to_country]}
                </h4>
                {expiringSoon && (
                  <Badge variant="warning" className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Expiring Soon</span>
                  </Badge>
                )}
              </div>
              {permit.permit_number && (
                <p className="text-sm text-neutral-600">
                  Permit #{permit.permit_number}
                </p>
              )}
              {permit.tracking_number && (
                <p className="text-sm text-neutral-600">
                  Tracking: {permit.tracking_number}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`
                flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium
                ${statusDisplay.bg} ${statusDisplay.color}
              `}>
                {React.createElement(statusDisplay.icon, { 
                  className: `h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}` 
                })}
                <span>{statusDisplay.label}</span>
              </div>
              
              {permit.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStatusRefresh(permit.id!)}
                  disabled={disabled || !!isRefreshing}
                  className="p-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>

          {/* Permit Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {permit.application_date && (
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <div>
                  <span className="text-neutral-600">Applied:</span>
                  <div className="font-medium">
                    {new Date(permit.application_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
            
            {permit.issue_date && (
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <span className="text-neutral-600">Issued:</span>
                  <div className="font-medium">
                    {new Date(permit.issue_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
            
            {permit.expiry_date && (
              <div className="flex items-center space-x-2 text-sm">
                <AlertTriangle className={`h-4 w-4 ${expiringSoon ? 'text-orange-500' : 'text-neutral-400'}`} />
                <div>
                  <span className="text-neutral-600">Expires:</span>
                  <div className={`font-medium ${expiringSoon ? 'text-orange-600' : ''}`}>
                    {new Date(permit.expiry_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-sm">
              <DollarSign className="h-4 w-4 text-neutral-400" />
              <div>
                <span className="text-neutral-600">Fees:</span>
                <div className="font-medium">
                  {permit.fees_paid} {permit.currency}
                </div>
              </div>
            </div>
          </div>

          {/* Processing Notes */}
          {permit.processing_notes && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <h6 className="font-medium text-blue-900 mb-1">Processing Notes:</h6>
                  <p className="text-sm text-blue-700">{permit.processing_notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {permit.rejection_reason && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <h6 className="font-medium text-red-900 mb-1">Rejection Reason:</h6>
                  <p className="text-sm text-red-700">{permit.rejection_reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Estimated Completion */}
          {permit.estimated_completion && permit.status === 'processing' && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <span className="text-yellow-700 text-sm">
                    Estimated completion: {new Date(permit.estimated_completion).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {permit.document_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDocument(permit.document_url!)}
                  className="flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Document</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPermitDetails(permit)}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Details</span>
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              {permit.status === 'expired' && permit.renewal_eligible && (
                <Button
                  size="sm"
                  onClick={() => permit.id && onPermitRenewal(permit.id)}
                  disabled={disabled}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Renew</span>
                </Button>
              )}
              
              {permit.status === 'rejected' && (
                <Button
                  size="sm"
                  onClick={() => {
                    const requirement = permitRequirements.find(r => r.country_code === permit.to_country);
                    if (requirement) {
                      setSelectedRequirement(requirement);
                      setShowApplicationModal(true);
                    }
                  }}
                  disabled={disabled}
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Reapply</span>
                </Button>
              )}
              
              {['pending', 'processing'].includes(permit.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => permit.id && onPermitCancellation(permit.id)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Cross-Border Permit Management
            </h3>
            <p className="text-sm text-neutral-600">
              Manage your cross-border travel permits and applications
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowApplicationModal(true)}
          disabled={disabled}
          className="flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>New Application</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Active Permits</p>
              <p className="text-xl font-semibold text-neutral-900">
                {activePermits.length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Processing</p>
              <p className="text-xl font-semibold text-neutral-900">
                {permits.filter(p => p.status === 'processing').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Expiring Soon</p>
              <p className="text-xl font-semibold text-neutral-900">
                {activePermits.filter(p => isExpiringSoon(p)).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <FileText className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Draft Applications</p>
              <p className="text-xl font-semibold text-neutral-900">
                {draftApplications.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'active', label: 'Active Permits', count: activePermits.length },
            { key: 'applications', label: 'Applications', count: draftApplications.length },
            { key: 'expired', label: 'Expired/Rejected', count: expiredPermits.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${selectedTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`
                  ml-2 py-0.5 px-2 rounded-full text-xs
                  ${selectedTab === tab.key
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-neutral-100 text-neutral-600'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {selectedTab === 'active' && (
          <>
            {activePermits.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-neutral-900 mb-2">
                  No Active Permits
                </h4>
                <p className="text-neutral-600 mb-4">
                  You don't have any active cross-border permits yet.
                </p>
                <Button
                  onClick={() => setShowApplicationModal(true)}
                  disabled={disabled}
                >
                  Apply for Permit
                </Button>
              </Card>
            ) : (
              activePermits.map(renderPermitCard)
            )}
          </>
        )}

        {selectedTab === 'applications' && (
          <>
            {draftApplications.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-neutral-900 mb-2">
                  No Draft Applications
                </h4>
                <p className="text-neutral-600 mb-4">
                  You don't have any draft permit applications.
                </p>
                <Button
                  onClick={() => setShowApplicationModal(true)}
                  disabled={disabled}
                >
                  Start New Application
                </Button>
              </Card>
            ) : (
              draftApplications.map(renderPermitCard)
            )}
          </>
        )}

        {selectedTab === 'expired' && (
          <>
            {expiredPermits.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-neutral-900 mb-2">
                  No Expired Permits
                </h4>
                <p className="text-neutral-600">
                  All your permits are current and valid.
                </p>
              </Card>
            ) : (
              expiredPermits.map(renderPermitCard)
            )}
          </>
        )}
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <PermitApplicationModal
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedRequirement(null);
          }}
          permitRequirements={permitRequirements}
          selectedRequirement={selectedRequirement}
          onSubmit={onPermitApplication}
          disabled={disabled}
        />
      )}

      {/* Permit Details Modal */}
      {showPermitDetails && (
        <PermitDetailsModal
          isOpen={!!showPermitDetails}
          onClose={() => setShowPermitDetails(null)}
          permit={showPermitDetails}
          onDocumentUpload={handleDocumentUpload}
          onViewDocument={onViewDocument}
          uploadingDocuments={uploadingDocuments}
          disabled={disabled}
        />
      )}
    </div>
  );
};

// Permit Application Modal Component
interface PermitApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  permitRequirements: PermitRequirement[];
  selectedRequirement?: PermitRequirement | null;
  onSubmit: (application: PermitApplication) => Promise<CrossBorderPermit>;
  disabled?: boolean;
}

const PermitApplicationModal: React.FC<PermitApplicationModalProps> = ({
  isOpen,
  onClose,
  permitRequirements,
  selectedRequirement,
  onSubmit,
  disabled = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<PermitRequirement | null>(
    selectedRequirement || null
  );
  const [formData, setFormData] = useState<Partial<PermitApplication>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    'Select Destination',
    'Applicant Details',
    'Vehicle Details',
    'Travel Details',
    'Documents',
    'Review & Submit'
  ];

  const handleSubmit = async () => {
    if (!selectedCountry || !formData.applicant_details || !formData.vehicle_details || !formData.travel_details) {
      return;
    }

    setIsSubmitting(true);
    try {
      const application: PermitApplication = {
        permit_requirement: selectedCountry,
        applicant_details: formData.applicant_details,
        vehicle_details: formData.vehicle_details,
        travel_details: formData.travel_details,
        documents: formData.documents || [],
        urgent_processing: formData.urgent_processing || false,
        status: 'submitted'
      };

      await onSubmit(application);
      onClose();
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <Modal.Header>
        <h2>Apply for Cross-Border Permit</h2>
        <div className="mt-2">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${index <= currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                  }
                `}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 h-0.5
                    ${index < currentStep ? 'bg-primary-600' : 'bg-neutral-200'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-neutral-600 mt-2">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </p>
        </div>
      </Modal.Header>
      
      <Modal.Body>
        {/* Step content would go here - this is a simplified version */}
        <div className="space-y-6">
          {currentStep === 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Select Destination Country</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permitRequirements.map(requirement => (
                  <Card
                    key={requirement.country_code}
                    className={`
                      p-4 cursor-pointer border-2 transition-colors
                      ${selectedCountry?.country_code === requirement.country_code
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                      }
                    `}
                    onClick={() => setSelectedCountry(requirement)}
                  >
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-neutral-600" />
                      <div>
                        <h4 className="font-medium">{requirement.country_name}</h4>
                        <p className="text-sm text-neutral-600">
                          ${requirement.processing_fee} • {requirement.processing_days} days
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Other steps would be implemented similarly */}
          {currentStep > 0 && (
            <div className="text-center py-8">
              <p className="text-neutral-600">
                Step {currentStep + 1} content would be implemented here
              </p>
            </div>
          )}
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onClose()}
            disabled={disabled || isSubmitting}
          >
            {currentStep > 0 ? 'Previous' : 'Cancel'}
          </Button>
          
          <Button
            onClick={() => {
              if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
              } else {
                handleSubmit();
              }
            }}
            disabled={disabled || isSubmitting || (currentStep === 0 && !selectedCountry)}
          >
            {isSubmitting ? 'Submitting...' : currentStep < steps.length - 1 ? 'Next' : 'Submit Application'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

// Permit Details Modal Component
interface PermitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permit: CrossBorderPermit;
  onDocumentUpload: (file: File, permitId: string, documentType: string) => Promise<void>;
  onViewDocument: (documentUrl: string) => void;
  uploadingDocuments: Set<string>;
  disabled?: boolean;
}

const PermitDetailsModal: React.FC<PermitDetailsModalProps> = ({
  isOpen,
  onClose,
  permit,
  onDocumentUpload,
  onViewDocument,
  uploadingDocuments,
  disabled = false
}) => {
  const statusDisplay = {
    draft: { color: 'text-neutral-600', bg: 'bg-neutral-50', icon: FileText },
    pending: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
    processing: { color: 'text-blue-600', bg: 'bg-blue-50', icon: RefreshCw },
    issued: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
    expired: { color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
    rejected: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
    cancelled: { color: 'text-neutral-600', bg: 'bg-neutral-50', icon: AlertCircle }
  }[permit.status];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header>
        <div className="flex items-center justify-between">
          <div>
            <h2>Permit Details</h2>
            <p className="text-sm text-neutral-600 mt-1">
              {COUNTRY_NAMES[permit.from_country]} → {COUNTRY_NAMES[permit.to_country]}
            </p>
          </div>
          
          <div className={`
            flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium
            ${statusDisplay.bg} ${statusDisplay.color}
          `}>
            {React.createElement(statusDisplay.icon, { className: "h-4 w-4" })}
            <span>{permit.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          </div>
        </div>
      </Modal.Header>
      
      <Modal.Body>
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permit.permit_number && (
                <div>
                  <label className="text-sm font-medium text-neutral-700">Permit Number</label>
                  <p className="text-neutral-900">{permit.permit_number}</p>
                </div>
              )}
              
              {permit.tracking_number && (
                <div>
                  <label className="text-sm font-medium text-neutral-700">Tracking Number</label>
                  <p className="text-neutral-900">{permit.tracking_number}</p>
                </div>
              )}
              
              {permit.application_date && (
                <div>
                  <label className="text-sm font-medium text-neutral-700">Application Date</label>
                  <p className="text-neutral-900">
                    {new Date(permit.application_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {permit.issue_date && (
                <div>
                  <label className="text-sm font-medium text-neutral-700">Issue Date</label>
                  <p className="text-neutral-900">
                    {new Date(permit.issue_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {permit.expiry_date && (
                <div>
                  <label className="text-sm font-medium text-neutral-700">Expiry Date</label>
                  <p className="text-neutral-900">
                    {new Date(permit.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-neutral-700">Fees Paid</label>
                <p className="text-neutral-900">{permit.fees_paid} {permit.currency}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-lg font-medium mb-4">Documents</h3>
            {permit.document_url ? (
              <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="font-medium">Permit Document</p>
                    <p className="text-sm text-neutral-600">Official permit document</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDocument(permit.document_url!)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-neutral-300 rounded-lg">
                <FileText className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600">No documents available</p>
              </div>
            )}
          </div>

          {/* Status Information */}
          {(permit.processing_notes || permit.rejection_reason || permit.estimated_completion) && (
            <div>
              <h3 className="text-lg font-medium mb-4">Status Information</h3>
              
              {permit.processing_notes && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Processing Notes</h4>
                  <p className="text-blue-700">{permit.processing_notes}</p>
                </div>
              )}
              
              {permit.rejection_reason && (
                <div className="mb-4 p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Rejection Reason</h4>
                  <p className="text-red-700">{permit.rejection_reason}</p>
                </div>
              )}
              
              {permit.estimated_completion && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Estimated Completion</h4>
                  <p className="text-yellow-700">
                    {new Date(permit.estimated_completion).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};