/**
 * Document Upload Component
 * Handles KYC document upload with OCR integration and quality validation
 */

import React, { useState, useRef, useCallback } from 'react';
import { kycService, DocumentUpload as DocumentUploadType, UploadedDocument } from '../../services/kycService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { 
  Upload, 
  File, 
  Image, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Camera,
  RefreshCw,
  Eye,
  Download
} from 'lucide-react';

interface DocumentUploadProps {
  documentType: string;
  displayName: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxFileSize: number;
  existingDocument?: UploadedDocument;
  onUploadComplete: (document: UploadedDocument) => void;
  onUploadError: (error: string) => void;
}

export function DocumentUpload({
  documentType,
  displayName,
  description,
  required,
  acceptedFormats,
  maxFileSize,
  existingDocument,
  onUploadComplete,
  onUploadError
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Listen for upload progress events
  React.useEffect(() => {
    const handleProgress = (event: CustomEvent) => {
      if (event.detail.documentType === documentType) {
        setUploadProgress(event.detail.progress);
      }
    };

    window.addEventListener('kyc-upload-progress', handleProgress as EventListener);
    return () => {
      window.removeEventListener('kyc-upload-progress', handleProgress as EventListener);
    };
  }, [documentType]);

  const validateAndSetFile = useCallback((file: File) => {
    const validation = kycService.validateDocument(file, documentType);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return false;
    }

    setValidationErrors([]);
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    
    return true;
  }, [documentType]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    validateAndSetFile(file);
  }, [validateAndSetFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadData: DocumentUploadType = {
        file: selectedFile,
        document_type: documentType as any,
        description: `${displayName} uploaded via web interface`
      };

      const uploadedDocument = await kycService.uploadDocument(uploadData);
      
      onUploadComplete(uploadedDocument);
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);
      
    } catch (error: any) {
      onUploadError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReupload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationErrors([]);
    fileInputRef.current?.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    if (!existingDocument) return null;
    
    switch (existingDocument.status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusText = () => {
    if (!existingDocument) return 'Not uploaded';
    
    switch (existingDocument.status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending Review';
      default:
        return 'Unknown Status';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <span>{displayName}</span>
            {required && <span className="text-red-500 text-sm">*</span>}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Existing Document Display */}
      {existingDocument && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {existingDocument.file_name}
                </p>
                <p className="text-xs text-gray-600">
                  Uploaded {new Date(existingDocument.upload_date).toLocaleDateString()} • 
                  {formatFileSize(existingDocument.file_size)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(existingDocument.file_url, '_blank')}
                className="flex items-center space-x-1"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </Button>
              
              {existingDocument.status === 'rejected' && (
                <Button
                  size="sm"
                  onClick={handleReupload}
                  className="flex items-center space-x-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Reupload</span>
                </Button>
              )}
            </div>
          </div>
          
          {existingDocument.verification_notes && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> {existingDocument.verification_notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      {(!existingDocument || existingDocument.status === 'rejected') && (
        <div>
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop your document here, or
              </p>
              
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1"
                >
                  <File className="w-4 h-4" />
                  <span>Choose File</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center space-x-1"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo</span>
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                Accepted formats: {acceptedFormats.join(', ')} • 
                Max size: {formatFileSize(maxFileSize)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {previewUrl ? (
                      <Image className="w-5 h-5 text-blue-600" />
                    ) : (
                      <File className="w-5 h-5 text-gray-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearSelection}
                    className="flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Remove</span>
                  </Button>
                </div>
                
                {previewUrl && (
                  <div className="mt-3">
                    <img
                      src={previewUrl}
                      alt="Document preview"
                      className="max-w-full h-48 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
              
              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading || validationErrors.length > 0}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          )}
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Please fix the following issues:
                  </p>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Quality Requirements */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Document Quality Requirements:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              {kycService.getQualityRequirements(documentType).map((requirement, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-blue-600">•</span>
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </Card>
  );
}