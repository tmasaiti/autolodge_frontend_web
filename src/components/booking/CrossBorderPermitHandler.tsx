import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Upload, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { SADCCountryCode } from '../../schemas/common-schemas';

export interface CrossBorderPermit {
  id?: number;
  permit_number?: string;
  from_country: SADCCountryCode;
  to_country: SADCCountryCode;
  status: 'pending' | 'processing' | 'issued' | 'expired' | 'rejected';
  issue_date?: string;
  expiry_date?: string;
  fees_paid: number;
  currency: string;
  document_url?: string;
  requirements_met: boolean;
  processing_notes?: string;
}

export interface PermitRequirement {
  country_code: SADCCountryCode;
  country_name: string;
  permit_type: 'temporary_import' | 'transit' | 'tourist_vehicle';
  required_documents: string[];
  processing_fee: number;
  processing_days: number;
  validity_days: number;
  auto_renewable: boolean;
  restrictions: string[];
}

export interface CrossBorderPermitHandlerProps {
  destinationCountries: SADCCountryCode[];
  originCountry: SADCCountryCode;
  permitRequirements: PermitRequirement[];
  existingPermits?: CrossBorderPermit[];
  onPermitStatusChange: (permits: CrossBorderPermit[]) => void;
  onDocumentUpload: (file: File, permitId: string) => Promise<string>;
  onPermitApplication: (requirement: PermitRequirement) => Promise<CrossBorderPermit>;
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

export const CrossBorderPermitHandler: React.FC<CrossBorderPermitHandlerProps> = ({
  destinationCountries,
  originCountry,
  permitRequirements,
  existingPermits = [],
  onPermitStatusChange,
  onDocumentUpload,
  onPermitApplication,
  disabled = false
}) => {
  const [permits, setPermits] = useState<CrossBorderPermit[]>(existingPermits);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [processingApplications, setProcessingApplications] = useState<Set<string>>(new Set());

  // Update parent when permits change
  useEffect(() => {
    onPermitStatusChange(permits);
  }, [permits, onPermitStatusChange]);

  // Get permit requirements for selected destinations
  const getRequiredPermits = (): PermitRequirement[] => {
    return permitRequirements.filter(req => 
      destinationCountries.includes(req.country_code)
    );
  };

  // Check if permit exists for a country
  const getPermitForCountry = (countryCode: SADCCountryCode): CrossBorderPermit | undefined => {
    return permits.find(permit => 
      permit.to_country === countryCode && 
      permit.from_country === originCountry
    );
  };

  // Handle permit application
  const handlePermitApplication = async (requirement: PermitRequirement) => {
    const applicationKey = `${originCountry}-${requirement.country_code}`;
    setProcessingApplications(prev => new Set(prev).add(applicationKey));

    try {
      const newPermit = await onPermitApplication(requirement);
      setPermits(prev => [...prev, newPermit]);
    } catch (error) {
      console.error('Failed to apply for permit:', error);
      // Handle error (show toast, etc.)
    } finally {
      setProcessingApplications(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationKey);
        return newSet;
      });
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (file: File, permitId: string) => {
    setUploadingFiles(prev => new Set(prev).add(permitId));

    try {
      const documentUrl = await onDocumentUpload(file, permitId);
      
      setPermits(prev => prev.map(permit => 
        permit.id?.toString() === permitId 
          ? { ...permit, document_url: documentUrl }
          : permit
      ));
    } catch (error) {
      console.error('Failed to upload document:', error);
      // Handle error
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(permitId);
        return newSet;
      });
    }
  };

  // Get status color and icon
  const getStatusDisplay = (status: CrossBorderPermit['status']) => {
    switch (status) {
      case 'pending':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock };
      case 'processing':
        return { color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock };
      case 'issued':
        return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
      case 'expired':
        return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle };
      case 'rejected':
        return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle };
      default:
        return { color: 'text-neutral-600', bg: 'bg-neutral-50', icon: FileText };
    }
  };

  const requiredPermits = getRequiredPermits();
  const totalFees = requiredPermits.reduce((sum, req) => sum + req.processing_fee, 0);
  const maxProcessingDays = Math.max(...requiredPermits.map(req => req.processing_days), 0);

  if (requiredPermits.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <div className="p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="font-medium text-green-900">No Permits Required</h4>
            <p className="text-sm text-green-700">
              Your selected destinations do not require additional permits for cross-border travel.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <FileText className="h-6 w-6 text-primary-600" />
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            Cross-Border Permits
          </h3>
          <p className="text-sm text-neutral-600">
            Required permits for your selected destinations
          </p>
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <h4 className="font-medium text-blue-900 mb-3">Permit Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Required Permits:</span>
              <div className="font-medium text-blue-900">
                {requiredPermits.length} permit{requiredPermits.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <span className="text-blue-700">Total Fees:</span>
              <div className="font-medium text-blue-900">
                ${totalFees}
              </div>
            </div>
            <div>
              <span className="text-blue-700">Max Processing Time:</span>
              <div className="font-medium text-blue-900">
                {maxProcessingDays} business days
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Permit Requirements */}
      <div className="space-y-4">
        {requiredPermits.map(requirement => {
          const existingPermit = getPermitForCountry(requirement.country_code);
          const applicationKey = `${originCountry}-${requirement.country_code}`;
          const isProcessing = processingApplications.has(applicationKey);
          const isUploading = existingPermit?.id && uploadingFiles.has(existingPermit.id.toString());
          
          return (
            <Card key={requirement.country_code} className="border-neutral-200">
              <div className="p-6">
                {/* Permit Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-neutral-900">
                      {COUNTRY_NAMES[requirement.country_code]} Travel Permit
                    </h4>
                    <p className="text-sm text-neutral-600">
                      {requirement.permit_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                  
                  {existingPermit && (
                    <div className={`
                      flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium
                      ${getStatusDisplay(existingPermit.status).bg} ${getStatusDisplay(existingPermit.status).color}
                    `}>
                      {React.createElement(getStatusDisplay(existingPermit.status).icon, { 
                        className: "h-4 w-4" 
                      })}
                      <span>{existingPermit.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                  )}
                </div>

                {/* Permit Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Requirements */}
                  <div>
                    <h5 className="font-medium text-neutral-900 mb-3">Required Documents:</h5>
                    <ul className="space-y-2 text-sm text-neutral-600">
                      {requirement.required_documents.map((doc, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Permit Info */}
                  <div>
                    <h5 className="font-medium text-neutral-900 mb-3">Permit Information:</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Processing Fee:</span>
                        <span className="font-medium">${requirement.processing_fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Processing Time:</span>
                        <span className="font-medium">{requirement.processing_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Validity:</span>
                        <span className="font-medium">{requirement.validity_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Auto-renewable:</span>
                        <span className="font-medium">{requirement.auto_renewable ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restrictions */}
                {requirement.restrictions.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Restrictions & Conditions:
                    </h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {requirement.restrictions.map((restriction, index) => (
                        <li key={index}>• {restriction}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Existing Permit Details */}
                {existingPermit && (
                  <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                    <h5 className="font-medium text-neutral-900 mb-3">Permit Details:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {existingPermit.permit_number && (
                        <div>
                          <span className="text-neutral-600">Permit Number:</span>
                          <div className="font-medium">{existingPermit.permit_number}</div>
                        </div>
                      )}
                      {existingPermit.issue_date && (
                        <div>
                          <span className="text-neutral-600">Issue Date:</span>
                          <div className="font-medium">
                            {new Date(existingPermit.issue_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      {existingPermit.expiry_date && (
                        <div>
                          <span className="text-neutral-600">Expiry Date:</span>
                          <div className="font-medium">
                            {new Date(existingPermit.expiry_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-neutral-600">Fees Paid:</span>
                        <div className="font-medium">
                          {existingPermit.fees_paid} {existingPermit.currency}
                        </div>
                      </div>
                    </div>

                    {/* Document Upload/Download */}
                    <div className="mt-4 flex items-center space-x-3">
                      {existingPermit.document_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(existingPermit.document_url, '_blank')}
                          className="flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download Permit</span>
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && existingPermit.id) {
                                handleDocumentUpload(file, existingPermit.id.toString());
                              }
                            }}
                            disabled={disabled || !!isUploading}
                            className="text-sm"
                          />
                          {isUploading && (
                            <span className="text-sm text-neutral-600">Uploading...</span>
                          )}
                        </div>
                      )}
                    </div>

                    {existingPermit.processing_notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <h6 className="font-medium text-blue-900 mb-1">Processing Notes:</h6>
                        <p className="text-sm text-blue-700">{existingPermit.processing_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex justify-end">
                  {!existingPermit ? (
                    <Button
                      onClick={() => handlePermitApplication(requirement)}
                      disabled={disabled || isProcessing}
                      className="flex items-center space-x-2"
                    >
                      {isProcessing ? (
                        <>
                          <Clock className="h-4 w-4 animate-spin" />
                          <span>Applying...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          <span>Apply for Permit</span>
                        </>
                      )}
                    </Button>
                  ) : existingPermit.status === 'rejected' ? (
                    <Button
                      onClick={() => handlePermitApplication(requirement)}
                      disabled={disabled || isProcessing}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Reapply</span>
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};