/**
 * Claims Submission Form Component
 * Comprehensive form for submitting insurance claims with document upload
 */

import React, { useState, useRef } from 'react';
import { Card, Button, Input, Modal } from '../ui';
import { 
  FileText, Upload, Camera, MapPin, Clock, AlertTriangle, 
  User, Car, Phone, Mail, Plus, X, Check 
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { insuranceService } from '../../services/insuranceService';
import { InsuranceClaimData } from '../../schemas/insurance-schemas';

export interface ClaimsSubmissionFormProps {
  policyId: number;
  bookingId: number;
  onClaimSubmitted?: (claimId: number) => void;
  onCancel?: () => void;
  className?: string;
}

interface ClaimFormData {
  claim_type: 'damage' | 'theft' | 'accident' | 'liability' | 'medical' | 'other';
  incident_date: string;
  incident_time: string;
  claim_amount?: number;
  currency?: string;
  description: string;
  claim_data: InsuranceClaimData;
}

interface UploadedDocument {
  id: string;
  file: File;
  type: string;
  description: string;
  preview?: string;
}

const CLAIM_TYPES = [
  { value: 'damage', label: 'Vehicle Damage', description: 'Damage to the rental vehicle' },
  { value: 'theft', label: 'Theft', description: 'Vehicle or personal items stolen' },
  { value: 'accident', label: 'Traffic Accident', description: 'Collision or traffic incident' },
  { value: 'liability', label: 'Third Party Liability', description: 'Damage to third party property or injury' },
  { value: 'medical', label: 'Medical Emergency', description: 'Medical expenses due to incident' },
  { value: 'other', label: 'Other', description: 'Other type of claim' }
];

const INCIDENT_TYPES = [
  'accident', 'theft', 'vandalism', 'natural_disaster', 'mechanical_failure', 'other'
];

const DOCUMENT_TYPES = [
  { value: 'police_report', label: 'Police Report', required: true },
  { value: 'photos_damage', label: 'Damage Photos', required: true },
  { value: 'photos_scene', label: 'Scene Photos', required: false },
  { value: 'medical_report', label: 'Medical Report', required: false },
  { value: 'repair_estimate', label: 'Repair Estimate', required: false },
  { value: 'towing_receipt', label: 'Towing Receipt', required: false },
  { value: 'witness_statement', label: 'Witness Statement', required: false },
  { value: 'other_document', label: 'Other Document', required: false }
];

export const ClaimsSubmissionForm: React.FC<ClaimsSubmissionFormProps> = ({
  policyId,
  bookingId,
  onClaimSubmitted,
  onCancel,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ClaimFormData>({
    claim_type: 'damage',
    incident_date: '',
    incident_time: '',
    description: '',
    claim_data: {
      incident_details: {
        date_time: '',
        location: {
          latitude: 0,
          longitude: 0,
          address: ''
        },
        description: '',
        incident_type: 'accident',
        witnesses: []
      },
      damage_assessment: {
        estimated_cost: 0,
        currency: 'USD',
        damage_photos: [],
        repair_estimates: []
      },
      parties_involved: {
        driver_details: {
          name: '',
          license_number: '',
          contact: ''
        }
      },
      supporting_documents: {}
    }
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [witnesses, setWitnesses] = useState<{ name: string; contact: string; statement?: string }[]>([]);
  const [repairEstimates, setRepairEstimates] = useState<{ provider: string; estimate_amount: number; estimate_date: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locationLoading, setLocationLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFormData = (updates: Partial<ClaimFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateClaimData = (path: string, value: any) => {
    setFormData(prev => {
      const newClaimData = { ...prev.claim_data };
      const keys = path.split('.');
      let current: any = newClaimData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      return { ...prev, claim_data: newClaimData };
    });
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateClaimData('incident_details.location.latitude', position.coords.latitude);
          updateClaimData('incident_details.location.longitude', position.coords.longitude);
          
          // Reverse geocoding would happen here in a real app
          updateClaimData('incident_details.location.address', 'Current location detected');
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
        }
      );
    } else {
      setLocationLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const id = Math.random().toString(36).substr(2, 9);
      const newDocument: UploadedDocument = {
        id,
        file,
        type: 'other_document',
        description: ''
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedDocuments(prev => 
            prev.map(doc => 
              doc.id === id ? { ...doc, preview: e.target?.result as string } : doc
            )
          );
        };
        reader.readAsDataURL(file);
      }

      setUploadedDocuments(prev => [...prev, newDocument]);
    });
  };

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const updateDocumentType = (documentId: string, type: string) => {
    setUploadedDocuments(prev => 
      prev.map(doc => doc.id === documentId ? { ...doc, type } : doc)
    );
  };

  const updateDocumentDescription = (documentId: string, description: string) => {
    setUploadedDocuments(prev => 
      prev.map(doc => doc.id === documentId ? { ...doc, description } : doc)
    );
  };

  const addWitness = () => {
    setWitnesses(prev => [...prev, { name: '', contact: '' }]);
  };

  const updateWitness = (index: number, field: string, value: string) => {
    setWitnesses(prev => 
      prev.map((witness, i) => 
        i === index ? { ...witness, [field]: value } : witness
      )
    );
  };

  const removeWitness = (index: number) => {
    setWitnesses(prev => prev.filter((_, i) => i !== index));
  };

  const addRepairEstimate = () => {
    setRepairEstimates(prev => [...prev, { 
      provider: '', 
      estimate_amount: 0, 
      estimate_date: new Date().toISOString().split('T')[0] 
    }]);
  };

  const updateRepairEstimate = (index: number, field: string, value: string | number) => {
    setRepairEstimates(prev => 
      prev.map((estimate, i) => 
        i === index ? { ...estimate, [field]: value } : estimate
      )
    );
  };

  const removeRepairEstimate = (index: number) => {
    setRepairEstimates(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.claim_type) newErrors.claim_type = 'Please select a claim type';
        if (!formData.incident_date) newErrors.incident_date = 'Please select the incident date';
        if (!formData.incident_time) newErrors.incident_time = 'Please select the incident time';
        if (!formData.description.trim()) newErrors.description = 'Please provide a description';
        break;
      
      case 2:
        if (!formData.claim_data.incident_details.location.address.trim()) {
          newErrors.location = 'Please provide the incident location';
        }
        if (!formData.claim_data.parties_involved.driver_details.name.trim()) {
          newErrors.driver_name = 'Please provide the driver name';
        }
        if (!formData.claim_data.parties_involved.driver_details.license_number.trim()) {
          newErrors.license_number = 'Please provide the license number';
        }
        if (!formData.claim_data.parties_involved.driver_details.contact.trim()) {
          newErrors.driver_contact = 'Please provide driver contact information';
        }
        break;
      
      case 3:
        if (formData.claim_data.damage_assessment.estimated_cost <= 0) {
          newErrors.estimated_cost = 'Please provide an estimated cost';
        }
        break;
      
      case 4:
        const requiredDocs = DOCUMENT_TYPES.filter(doc => doc.required);
        const uploadedTypes = uploadedDocuments.map(doc => doc.type);
        
        for (const requiredDoc of requiredDocs) {
          if (!uploadedTypes.includes(requiredDoc.value)) {
            newErrors.documents = `Missing required document: ${requiredDoc.label}`;
            break;
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitClaim = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      // Prepare claim data
      const claimRequest = {
        policy_id: policyId,
        booking_id: bookingId,
        claim_type: formData.claim_type,
        incident_date: `${formData.incident_date}T${formData.incident_time}:00.000Z`,
        claim_amount: formData.claim_amount,
        currency: formData.currency,
        description: formData.description,
        claim_data: {
          ...formData.claim_data,
          incident_details: {
            ...formData.claim_data.incident_details,
            date_time: `${formData.incident_date}T${formData.incident_time}:00.000Z`,
            witnesses
          },
          damage_assessment: {
            ...formData.claim_data.damage_assessment,
            repair_estimates: repairEstimates
          }
        }
      };

      // Submit claim
      const claim = await insuranceService.createClaim(claimRequest);

      // Upload documents
      for (const document of uploadedDocuments) {
        await insuranceService.uploadClaimDocument(
          claim.id,
          document.file,
          document.type,
          document.description
        );
      }

      onClaimSubmitted?.(claim.id);
    } catch (error) {
      console.error('Error submitting claim:', error);
      setErrors({ submit: 'Failed to submit claim. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Claim Information</h3>
            
            {/* Claim Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type of Claim *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CLAIM_TYPES.map(type => (
                  <label
                    key={type.value}
                    className={cn(
                      'relative rounded-lg border p-4 cursor-pointer transition-colors',
                      formData.claim_type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="claim_type"
                      value={type.value}
                      checked={formData.claim_type === type.value}
                      onChange={(e) => updateFormData({ claim_type: e.target.value as any })}
                      className="sr-only"
                    />
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </label>
                ))}
              </div>
              {errors.claim_type && (
                <p className="mt-1 text-sm text-red-600">{errors.claim_type}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Date *
                </label>
                <Input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => updateFormData({ incident_date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  error={errors.incident_date}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Time *
                </label>
                <Input
                  type="time"
                  value={formData.incident_time}
                  onChange={(e) => updateFormData({ incident_time: e.target.value })}
                  error={errors.incident_time}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description of Incident *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={4}
                className={cn(
                  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
                  errors.description && 'border-red-500'
                )}
                placeholder="Please provide a detailed description of what happened..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Location & Parties Involved</h3>
            
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incident Location *
              </label>
              <div className="flex space-x-2">
                <Input
                  value={formData.claim_data.incident_details.location.address}
                  onChange={(e) => updateClaimData('incident_details.location.address', e.target.value)}
                  placeholder="Enter the address where the incident occurred"
                  error={errors.location}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="flex-shrink-0"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Driver Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Driver Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Driver Name *"
                  value={formData.claim_data.parties_involved.driver_details.name}
                  onChange={(e) => updateClaimData('parties_involved.driver_details.name', e.target.value)}
                  error={errors.driver_name}
                />
                
                <Input
                  label="License Number *"
                  value={formData.claim_data.parties_involved.driver_details.license_number}
                  onChange={(e) => updateClaimData('parties_involved.driver_details.license_number', e.target.value)}
                  error={errors.license_number}
                />
                
                <Input
                  label="Contact Information *"
                  value={formData.claim_data.parties_involved.driver_details.contact}
                  onChange={(e) => updateClaimData('parties_involved.driver_details.contact', e.target.value)}
                  placeholder="Phone number or email"
                  error={errors.driver_contact}
                />
              </div>
            </div>

            {/* Witnesses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Witnesses</h4>
                <Button type="button" variant="outline" size="sm" onClick={addWitness}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Witness
                </Button>
              </div>
              
              {witnesses.map((witness, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                  <Input
                    label="Name"
                    value={witness.name}
                    onChange={(e) => updateWitness(index, 'name', e.target.value)}
                  />
                  
                  <Input
                    label="Contact"
                    value={witness.contact}
                    onChange={(e) => updateWitness(index, 'contact', e.target.value)}
                  />
                  
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeWitness(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Damage Assessment</h3>
            
            {/* Estimated Cost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Estimated Repair Cost *"
                type="number"
                value={formData.claim_data.damage_assessment.estimated_cost}
                onChange={(e) => updateClaimData('damage_assessment.estimated_cost', parseFloat(e.target.value) || 0)}
                error={errors.estimated_cost}
              />
              
              <Input
                label="Currency"
                value={formData.claim_data.damage_assessment.currency}
                onChange={(e) => updateClaimData('damage_assessment.currency', e.target.value)}
              />
            </div>

            {/* Repair Estimates */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Repair Estimates</h4>
                <Button type="button" variant="outline" size="sm" onClick={addRepairEstimate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Estimate
                </Button>
              </div>
              
              {repairEstimates.map((estimate, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                  <Input
                    label="Provider"
                    value={estimate.provider}
                    onChange={(e) => updateRepairEstimate(index, 'provider', e.target.value)}
                  />
                  
                  <Input
                    label="Amount"
                    type="number"
                    value={estimate.estimate_amount}
                    onChange={(e) => updateRepairEstimate(index, 'estimate_amount', parseFloat(e.target.value) || 0)}
                  />
                  
                  <Input
                    label="Date"
                    type="date"
                    value={estimate.estimate_date}
                    onChange={(e) => updateRepairEstimate(index, 'estimate_date', e.target.value)}
                  />
                  
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRepairEstimate(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
            
            {/* File Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-dashed border-2 border-gray-300 hover:border-gray-400"
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    Click to upload documents or drag and drop
                  </div>
                  <div className="text-xs text-gray-500">
                    Images, PDF, Word documents
                  </div>
                </div>
              </Button>
            </div>

            {/* Document List */}
            {uploadedDocuments.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Uploaded Documents</h4>
                {uploadedDocuments.map(document => (
                  <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {document.preview ? (
                          <img src={document.preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <FileText className="h-12 w-12 text-gray-400" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{document.file.name}</div>
                          <div className="text-sm text-gray-500">
                            {(document.file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(document.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Document Type
                        </label>
                        <select
                          value={document.type}
                          onChange={(e) => updateDocumentType(document.id, e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {DOCUMENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label} {type.required && '*'}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <Input
                        label="Description"
                        value={document.description}
                        onChange={(e) => updateDocumentDescription(document.id, e.target.value)}
                        placeholder="Brief description of this document"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Required Documents Checklist */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Required Documents</h4>
              <div className="space-y-1">
                {DOCUMENT_TYPES.filter(doc => doc.required).map(doc => {
                  const hasDocument = uploadedDocuments.some(uploaded => uploaded.type === doc.value);
                  return (
                    <div key={doc.value} className="flex items-center space-x-2">
                      {hasDocument ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className={cn(
                        'text-sm',
                        hasDocument ? 'text-green-800' : 'text-yellow-800'
                      )}>
                        {doc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {errors.documents && (
                <p className="mt-2 text-sm text-red-600">{errors.documents}</p>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
            
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Claim Summary</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Claim Type:</span>
                  <span className="ml-2 font-medium">
                    {CLAIM_TYPES.find(t => t.value === formData.claim_type)?.label}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Incident Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(`${formData.incident_date}T${formData.incident_time}`).toLocaleString()}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Estimated Cost:</span>
                  <span className="ml-2 font-medium">
                    {formData.claim_data.damage_assessment.currency} {formData.claim_data.damage_assessment.estimated_cost}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Documents:</span>
                  <span className="ml-2 font-medium">{uploadedDocuments.length} uploaded</span>
                </div>
              </div>
              
              <div className="mt-4">
                <span className="text-gray-500">Description:</span>
                <p className="mt-1 text-gray-900">{formData.description}</p>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Information</p>
                  <ul className="space-y-1 text-xs">
                    <li>• All information provided must be accurate and truthful</li>
                    <li>• False claims may result in policy cancellation</li>
                    <li>• You will receive a claim reference number after submission</li>
                    <li>• Processing typically takes 3-5 business days</li>
                  </ul>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Submission Error</span>
                </div>
                <p className="text-red-700 mt-1">{errors.submit}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn('max-w-4xl mx-auto', className)}>
      <div className="p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map(step => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {step}
                </div>
                {step < 5 && (
                  <div className={cn(
                    'w-16 h-1 mx-2',
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Claim Info</span>
            <span>Location</span>
            <span>Assessment</span>
            <span>Documents</span>
            <span>Review</span>
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep} disabled={loading}>
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            
            {currentStep < 5 ? (
              <Button onClick={nextStep} disabled={loading}>
                Next
              </Button>
            ) : (
              <Button onClick={submitClaim} loading={loading}>
                Submit Claim
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};