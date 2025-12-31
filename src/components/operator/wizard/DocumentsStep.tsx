import React, { useState, useEffect } from 'react';
import { Upload, FileText, Check, AlertCircle, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { WizardStepProps } from '../../wizard/WizardStepWrapper';

export interface DocumentUpload {
  id: string;
  type: string;
  name: string;
  file?: File;
  url?: string;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  required: boolean;
  description: string;
  acceptedFormats: string[];
  maxSize: number; // in MB
}

export interface DocumentsStepData {
  documents: DocumentUpload[];
  acknowledgedRequirements: boolean;
}

export const DocumentsStep: React.FC<WizardStepProps> = ({
  data,
  allData,
  onDataChange,
  onNext
}) => {
  const businessType = allData.business_info?.businessType || 'individual';

  // Define required documents based on business type
  const getRequiredDocuments = (): DocumentUpload[] => {
    const baseDocuments: DocumentUpload[] = [
      {
        id: 'identity_document',
        type: 'identity',
        name: 'Identity Document',
        status: 'pending',
        required: true,
        description: 'Valid passport or national ID card',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5
      },
      {
        id: 'drivers_license',
        type: 'license',
        name: 'Driver\'s License',
        status: 'pending',
        required: true,
        description: 'Valid driver\'s license (front and back)',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5
      },
      {
        id: 'proof_of_address',
        type: 'address',
        name: 'Proof of Address',
        status: 'pending',
        required: true,
        description: 'Utility bill or bank statement (not older than 3 months)',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5
      },
      {
        id: 'insurance_certificate',
        type: 'insurance',
        name: 'Insurance Certificate',
        status: 'pending',
        required: true,
        description: 'Valid vehicle rental insurance certificate',
        acceptedFormats: ['PDF'],
        maxSize: 10
      }
    ];

    if (businessType === 'company') {
      baseDocuments.push(
        {
          id: 'business_registration',
          type: 'business',
          name: 'Business Registration',
          status: 'pending',
          required: true,
          description: 'Certificate of incorporation or business registration',
          acceptedFormats: ['PDF'],
          maxSize: 10
        },
        {
          id: 'tax_certificate',
          type: 'tax',
          name: 'Tax Certificate',
          status: 'pending',
          required: true,
          description: 'Tax clearance certificate or VAT registration',
          acceptedFormats: ['PDF'],
          maxSize: 10
        }
      );
    }

    baseDocuments.push(
      {
        id: 'operating_license',
        type: 'license',
        name: 'Operating License',
        status: 'pending',
        required: false,
        description: 'Vehicle rental operating license (if applicable)',
        acceptedFormats: ['PDF'],
        maxSize: 10
      },
      {
        id: 'bank_statement',
        type: 'financial',
        name: 'Bank Statement',
        status: 'pending',
        required: false,
        description: 'Recent bank statement for financial verification',
        acceptedFormats: ['PDF'],
        maxSize: 10
      }
    );

    return baseDocuments;
  };

  const [formData, setFormData] = useState<DocumentsStepData>({
    documents: data.documents || getRequiredDocuments(),
    acknowledgedRequirements: data.acknowledgedRequirements || false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Update parent data when form changes
  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const requiredDocuments = formData.documents.filter(doc => doc.required);
    const uploadedRequired = requiredDocuments.filter(doc => doc.status === 'uploaded' || doc.file);

    if (uploadedRequired.length < requiredDocuments.length) {
      newErrors.documents = 'Please upload all required documents';
    }

    if (!formData.acknowledgedRequirements) {
      newErrors.acknowledgment = 'Please acknowledge the document requirements';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (documentId: string, file: File) => {
    const document = formData.documents.find(doc => doc.id === documentId);
    if (!document) return;

    // Validate file size
    if (file.size > document.maxSize * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [documentId]: `File size must be less than ${document.maxSize}MB`
      }));
      return;
    }

    // Validate file format
    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    if (!fileExtension || !document.acceptedFormats.includes(fileExtension)) {
      setErrors(prev => ({
        ...prev,
        [documentId]: `File must be in one of these formats: ${document.acceptedFormats.join(', ')}`
      }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[documentId];
      return newErrors;
    });

    // Simulate upload progress
    setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));
    
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(prev => ({ ...prev, [documentId]: progress }));
    }

    // Update document status
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, file, status: 'uploaded' as const }
          : doc
      )
    }));

    // Clear upload progress
    setTimeout(() => {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[documentId];
        return newProgress;
      });
    }, 500);
  };

  const handleFileRemove = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, file: undefined, status: 'pending' as const }
          : doc
      )
    }));
  };

  const handleAcknowledgeRequirements = () => {
    setFormData(prev => ({
      ...prev,
      acknowledgedRequirements: !prev.acknowledgedRequirements
    }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext?.();
    }
  };

  const getStatusIcon = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'uploaded':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'verified':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const requiredDocuments = formData.documents.filter(doc => doc.required);
  const optionalDocuments = formData.documents.filter(doc => !doc.required);
  const uploadedRequired = requiredDocuments.filter(doc => doc.status === 'uploaded' || doc.file);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-primary-50 rounded-lg p-4">
        <h3 className="font-medium text-primary-800 mb-2">Document Upload Progress</h3>
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-primary-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(uploadedRequired.length / requiredDocuments.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-primary-800">
            {uploadedRequired.length} of {requiredDocuments.length} required documents
          </span>
        </div>
      </div>

      {errors.documents && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700">{errors.documents}</p>
          </div>
        </div>
      )}

      {/* Required Documents */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Required Documents</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredDocuments.map(document => (
            <DocumentUploadCard
              key={document.id}
              document={document}
              uploadProgress={uploadProgress[document.id]}
              error={errors[document.id]}
              onFileUpload={(file) => handleFileUpload(document.id, file)}
              onFileRemove={() => handleFileRemove(document.id)}
            />
          ))}
        </div>
      </div>

      {/* Optional Documents */}
      {optionalDocuments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Optional Documents</h3>
          <p className="text-sm text-gray-600">
            These documents can help speed up your verification process.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalDocuments.map(document => (
              <DocumentUploadCard
                key={document.id}
                document={document}
                uploadProgress={uploadProgress[document.id]}
                error={errors[document.id]}
                onFileUpload={(file) => handleFileUpload(document.id, file)}
                onFileRemove={() => handleFileRemove(document.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Requirements Acknowledgment */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="acknowledgeRequirements"
            checked={formData.acknowledgedRequirements}
            onChange={handleAcknowledgeRequirements}
            className="mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="acknowledgeRequirements" className="text-sm text-gray-700">
            I confirm that all uploaded documents are authentic, current, and belong to me or my business. 
            I understand that providing false information may result in account suspension and legal action.
          </label>
        </div>
        
        {errors.acknowledgment && (
          <p className="text-sm text-red-600 mt-2">{errors.acknowledgment}</p>
        )}
      </div>

      {/* Information Notice */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Document Verification Process</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Documents are typically verified within 24-48 hours</li>
          <li>• You'll receive email notifications about verification status</li>
          <li>• Rejected documents can be re-uploaded with corrections</li>
          <li>• All documents are stored securely and encrypted</li>
        </ul>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={uploadedRequired.length < requiredDocuments.length || !formData.acknowledgedRequirements}
        >
          Continue to Verification
        </Button>
      </div>
    </div>
  );
};

// Document Upload Card Component
interface DocumentUploadCardProps {
  document: DocumentUpload;
  uploadProgress?: number;
  error?: string;
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  document,
  uploadProgress,
  error,
  onFileUpload,
  onFileRemove
}) => {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const getStatusIcon = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'uploaded':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'verified':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className={`
      border-2 border-dashed rounded-lg p-4 transition-colors
      ${document.status === 'uploaded' ? 'border-green-300 bg-green-50' : 
        error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon(document.status)}
          <div>
            <h4 className="font-medium text-gray-900">
              {document.name}
              {document.required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            <p className="text-sm text-gray-600">{document.description}</p>
          </div>
        </div>
        
        {document.file && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onFileRemove}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {uploadProgress !== undefined ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : document.file ? (
        <div className="flex items-center space-x-2 text-sm text-green-700">
          <Check className="h-4 w-4" />
          <span>{document.file.name}</span>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="file"
            id={`file-${document.id}`}
            accept={document.acceptedFormats.map(format => `.${format.toLowerCase()}`).join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <label
            htmlFor={`file-${document.id}`}
            className="flex items-center justify-center w-full p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Choose file or drag here</span>
          </label>
          
          <div className="text-xs text-gray-500">
            Accepted formats: {document.acceptedFormats.join(', ')} • Max size: {document.maxSize}MB
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
};