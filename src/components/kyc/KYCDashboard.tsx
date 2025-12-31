/**
 * KYC Dashboard Component
 * Main interface for KYC verification process with document upload and status tracking
 */

import React, { useState, useEffect } from 'react';
import { kycService, VerificationRequirements, UploadedDocument } from '../../services/kycService';
import { DocumentUpload } from './DocumentUpload';
import { VerificationStatus } from './VerificationStatus';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Star,
  Award,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface KYCDashboardProps {
  targetVerificationLevel?: string;
}

export function KYCDashboard({ targetVerificationLevel = 'standard' }: KYCDashboardProps) {
  const [requirements, setRequirements] = useState<VerificationRequirements | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'upload'>('status');
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(targetVerificationLevel);

  useEffect(() => {
    loadRequirements();
  }, [selectedLevel]);

  const loadRequirements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [reqData, docsData] = await Promise.all([
        kycService.getVerificationRequirements(selectedLevel),
        kycService.getDocuments()
      ]);
      
      setRequirements(reqData);
      setUploadedDocuments(docsData);
    } catch (error: any) {
      setError(error.message || 'Failed to load KYC requirements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = (document: UploadedDocument) => {
    setUploadedDocuments(prev => {
      const existing = prev.find(doc => doc.document_type === document.document_type);
      if (existing) {
        return prev.map(doc => 
          doc.document_type === document.document_type ? document : doc
        );
      }
      return [...prev, document];
    });
  };

  const handleUploadError = (error: string) => {
    setError(error);
  };

  const getExistingDocument = (documentType: string) => {
    return uploadedDocuments.find(doc => doc.document_type === documentType);
  };

  const getVerificationLevelInfo = (level: string) => {
    const levels = {
      basic: {
        icon: Shield,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        title: 'Basic Verification',
        description: 'Email and phone verification only',
        benefits: ['Access to basic features', 'Browse vehicles', 'Contact operators']
      },
      standard: {
        icon: Award,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        title: 'Standard Verification',
        description: 'Identity document and license verification',
        benefits: ['Make bookings', 'Access all features', 'Higher trust score', 'Priority support']
      },
      premium: {
        icon: Star,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        title: 'Premium Verification',
        description: 'Enhanced verification with address proof',
        benefits: ['Instant bookings', 'Premium vehicles', 'Reduced deposits', 'VIP support']
      },
      operator: {
        icon: TrendingUp,
        color: 'text-gold-600',
        bgColor: 'bg-gold-100',
        title: 'Operator Verification',
        description: 'Business verification for vehicle operators',
        benefits: ['List vehicles', 'Receive bookings', 'Business analytics', 'Operator tools']
      }
    };
    
    return levels[level as keyof typeof levels] || levels.basic;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
          <p className="text-gray-600 mt-1">
            Complete your verification to unlock all platform features
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowLevelModal(true)}
          className="flex items-center space-x-1"
        >
          <Info className="w-4 h-4" />
          <span>Verification Levels</span>
        </Button>
      </div>

      {/* Current Target Level */}
      {requirements && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {React.createElement(getVerificationLevelInfo(selectedLevel).icon, {
                className: `w-6 h-6 ${getVerificationLevelInfo(selectedLevel).color}`
              })}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getVerificationLevelInfo(selectedLevel).title}
                </h2>
                <p className="text-gray-600">
                  {getVerificationLevelInfo(selectedLevel).description}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Processing Time</p>
              <p className="font-medium text-gray-900">{requirements.estimated_processing_time}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Required Documents</h3>
              <ul className="space-y-1">
                {requirements.required_documents.map((doc, index) => {
                  const existing = getExistingDocument(doc.document_type);
                  return (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      {existing?.status === 'verified' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : existing ? (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                      )}
                      <span className={existing?.status === 'verified' ? 'text-green-700' : 'text-gray-700'}>
                        {doc.display_name}
                        {doc.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Benefits</h3>
              <ul className="space-y-1">
                {requirements.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'status'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Verification Status
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload Documents
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'status' && (
        <VerificationStatus 
          onDocumentUploadClick={() => setActiveTab('upload')}
        />
      )}

      {activeTab === 'upload' && requirements && (
        <div className="space-y-6">
          {requirements.required_documents.map((docReq) => (
            <DocumentUpload
              key={docReq.document_type}
              documentType={docReq.document_type}
              displayName={docReq.display_name}
              description={docReq.description}
              required={docReq.required}
              acceptedFormats={docReq.accepted_formats}
              maxFileSize={docReq.max_file_size}
              existingDocument={getExistingDocument(docReq.document_type)}
              onUploadComplete={handleDocumentUpload}
              onUploadError={handleUploadError}
            />
          ))}
        </div>
      )}

      {/* Verification Levels Modal */}
      <Modal 
        isOpen={showLevelModal} 
        onClose={() => setShowLevelModal(false)}
        size="xl"
      >
        <Modal.Header>
          <h2 className="text-xl font-semibold">Verification Levels</h2>
        </Modal.Header>
        
        <Modal.Body>
          <div className="space-y-4">
            {['basic', 'standard', 'premium', 'operator'].map((level) => {
              const info = getVerificationLevelInfo(level);
              const Icon = info.icon;
              
              return (
                <Card 
                  key={level}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedLevel === level 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLevel(level)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${info.bgColor}`}>
                        <Icon className={`w-5 h-5 ${info.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{info.title}</h3>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>
                    
                    {selectedLevel === level && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Benefits:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {info.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center space-x-1">
                          <span className="text-green-600">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowLevelModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowLevelModal(false);
                loadRequirements();
              }}
              className="flex items-center space-x-1"
            >
              <span>Continue with {getVerificationLevelInfo(selectedLevel).title}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}