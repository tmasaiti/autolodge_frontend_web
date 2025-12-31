/**
 * KYC (Know Your Customer) Service
 * Handles document upload, OCR processing, and verification status tracking
 */

import apiClient from './api';

export interface DocumentUpload {
  file: File;
  document_type: 'identity' | 'license' | 'passport' | 'proof_of_address' | 'business_registration' | 'insurance_certificate';
  description?: string;
}

export interface UploadedDocument {
  id: number;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  status: 'pending' | 'processing' | 'verified' | 'rejected' | 'expired';
  ocr_data?: OCRData;
  verification_notes?: string;
  expiry_date?: string;
}

export interface OCRData {
  extracted_text: string;
  confidence_score: number;
  detected_fields: {
    [key: string]: {
      value: string;
      confidence: number;
      bounding_box?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };
  };
  document_quality: {
    blur_score: number;
    brightness_score: number;
    contrast_score: number;
    overall_quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface KYCStatus {
  overall_status: 'not_started' | 'in_progress' | 'completed' | 'rejected' | 'expired';
  verification_level: 'basic' | 'standard' | 'premium' | 'operator';
  trust_score: number;
  required_documents: string[];
  submitted_documents: UploadedDocument[];
  missing_documents: string[];
  verification_date?: string;
  expiry_date?: string;
  rejection_reasons?: string[];
}

export interface TrustScoreBreakdown {
  identity_verification: number;
  document_authenticity: number;
  address_verification: number;
  phone_verification: number;
  email_verification: number;
  behavioral_score: number;
  total_score: number;
  factors: {
    positive: string[];
    negative: string[];
    recommendations: string[];
  };
}

export interface VerificationRequirements {
  verification_level: string;
  required_documents: {
    document_type: string;
    display_name: string;
    description: string;
    required: boolean;
    accepted_formats: string[];
    max_file_size: number;
    quality_requirements: string[];
  }[];
  estimated_processing_time: string;
  benefits: string[];
}

class KYCService {
  /**
   * Get KYC status for current user
   */
  async getKYCStatus(): Promise<KYCStatus> {
    const response = await apiClient.get<KYCStatus>('/kyc/status');
    return response.data;
  }

  /**
   * Get verification requirements for a specific level
   */
  async getVerificationRequirements(level: string): Promise<VerificationRequirements> {
    const response = await apiClient.get<VerificationRequirements>(`/kyc/requirements/${level}`);
    return response.data;
  }

  /**
   * Upload document with OCR processing
   */
  async uploadDocument(upload: DocumentUpload): Promise<UploadedDocument> {
    const formData = new FormData();
    formData.append('file', upload.file);
    formData.append('document_type', upload.document_type);
    if (upload.description) {
      formData.append('description', upload.description);
    }

    const response = await apiClient.post<UploadedDocument>('/kyc/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Emit progress event for UI updates
          window.dispatchEvent(new CustomEvent('kyc-upload-progress', {
            detail: { 
              documentType: upload.document_type,
              progress: percentCompleted 
            }
          }));
        }
      }
    });

    return response.data;
  }

  /**
   * Get uploaded documents
   */
  async getDocuments(): Promise<UploadedDocument[]> {
    const response = await apiClient.get<UploadedDocument[]>('/kyc/documents');
    return response.data;
  }

  /**
   * Delete uploaded document
   */
  async deleteDocument(documentId: number): Promise<void> {
    await apiClient.delete(`/kyc/documents/${documentId}`);
  }

  /**
   * Resubmit rejected document
   */
  async resubmitDocument(documentId: number, upload: DocumentUpload): Promise<UploadedDocument> {
    const formData = new FormData();
    formData.append('file', upload.file);
    formData.append('document_type', upload.document_type);
    if (upload.description) {
      formData.append('description', upload.description);
    }

    const response = await apiClient.put<UploadedDocument>(`/kyc/documents/${documentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    return response.data;
  }

  /**
   * Submit KYC application for review
   */
  async submitForReview(): Promise<void> {
    await apiClient.post('/kyc/submit');
  }

  /**
   * Get trust score breakdown
   */
  async getTrustScore(): Promise<TrustScoreBreakdown> {
    const response = await apiClient.get<TrustScoreBreakdown>('/kyc/trust-score');
    return response.data;
  }

  /**
   * Request manual review
   */
  async requestManualReview(reason: string): Promise<void> {
    await apiClient.post('/kyc/manual-review', { reason });
  }

  /**
   * Get verification history
   */
  async getVerificationHistory(): Promise<{
    id: number;
    action: string;
    status: string;
    timestamp: string;
    notes?: string;
    performed_by: string;
  }[]> {
    const response = await apiClient.get('/kyc/history');
    return response.data;
  }

  /**
   * Validate document before upload
   */
  validateDocument(file: File, documentType: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // File size validation (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('File must be JPEG, PNG, WebP, or PDF');
    }

    // Document type specific validation
    if (documentType === 'identity' || documentType === 'license') {
      if (file.type === 'application/pdf') {
        errors.push('Identity documents and licenses must be image files (JPEG, PNG, WebP)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get document quality requirements
   */
  getQualityRequirements(documentType: string): string[] {
    const commonRequirements = [
      'Image should be clear and well-lit',
      'All text should be readable',
      'Document should be flat (not folded or curved)',
      'No glare or shadows on the document'
    ];

    const specificRequirements: { [key: string]: string[] } = {
      identity: [
        'Photo should be clearly visible',
        'All personal information should be legible',
        'Document should not be expired'
      ],
      license: [
        'License number should be clearly visible',
        'Expiry date should be readable',
        'Photo should match your identity document'
      ],
      passport: [
        'Machine readable zone (MRZ) should be clear',
        'Photo page should be fully visible',
        'Passport should be valid for at least 6 months'
      ],
      proof_of_address: [
        'Document should be dated within the last 3 months',
        'Your name and address should match your profile',
        'Official letterhead or logo should be visible'
      ]
    };

    return [...commonRequirements, ...(specificRequirements[documentType] || [])];
  }
}

export const kycService = new KYCService();