import React, { useState } from 'react';
import { Modal, Button, Input, Card } from '../ui';
import { Upload, X, FileText, Image, Video, Receipt, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DisputeEvidence {
  id?: number;
  evidence_type: 'photo' | 'document' | 'video' | 'text' | 'receipt' | 'inspection_report';
  title: string;
  description?: string;
  file_url?: string;
  file?: File;
  submitted_by_type: 'renter' | 'operator' | 'admin';
  verification_status?: 'pending' | 'verified' | 'rejected';
}

export interface DisputeEvidenceModalProps {
  isOpen: boolean;
  disputeId: number;
  onClose: () => void;
  onEvidenceSubmitted: (evidence: DisputeEvidence) => void;
  userType: 'renter' | 'operator' | 'admin';
  loading?: boolean;
}

const evidenceTypes = [
  { type: 'photo' as const, label: 'Photo', icon: Image, description: 'Upload photos of damage, condition, or other visual evidence' },
  { type: 'document' as const, label: 'Document', icon: FileText, description: 'Upload contracts, agreements, or other documents' },
  { type: 'video' as const, label: 'Video', icon: Video, description: 'Upload video evidence of condition or incidents' },
  { type: 'receipt' as const, label: 'Receipt', icon: Receipt, description: 'Upload receipts for repairs, fees, or other expenses' },
  { type: 'inspection_report' as const, label: 'Inspection Report', icon: FileText, description: 'Upload official inspection or assessment reports' },
  { type: 'text' as const, label: 'Text Evidence', icon: FileText, description: 'Provide written testimony or description' }
];

export const DisputeEvidenceModal: React.FC<DisputeEvidenceModalProps> = ({
  isOpen,
  disputeId,
  onClose,
  onEvidenceSubmitted,
  userType,
  loading = false
}) => {
  const [selectedType, setSelectedType] = useState<DisputeEvidence['evidence_type']>('photo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = {
      photo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      receipt: ['image/jpeg', 'image/png', 'application/pdf'],
      inspection_report: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      text: []
    };

    if (file.size > maxSize) {
      setErrors({ file: 'File size must be less than 10MB' });
      return;
    }

    if (selectedType !== 'text' && !allowedTypes[selectedType].includes(file.type)) {
      setErrors({ file: `Invalid file type for ${selectedType}` });
      return;
    }

    setSelectedFile(file);
    setErrors({});
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (selectedType !== 'text' && !selectedFile) {
      newErrors.file = 'File is required for this evidence type';
    }

    if (selectedType === 'text' && !description.trim()) {
      newErrors.description = 'Description is required for text evidence';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const evidence: DisputeEvidence = {
      evidence_type: selectedType,
      title: title.trim(),
      description: description.trim() || undefined,
      file: selectedFile || undefined,
      submitted_by_type: userType
    };

    onEvidenceSubmitted(evidence);
  };

  const handleClose = () => {
    setSelectedType('photo');
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setErrors({});
    onClose();
  };

  const selectedTypeConfig = evidenceTypes.find(t => t.type === selectedType);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <Modal.Header>
        <h2 className="text-xl font-semibold text-gray-900">Submit Evidence</h2>
        <p className="text-sm text-gray-500 mt-1">
          Dispute #{disputeId} - Add supporting evidence for your case
        </p>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-6">
          {/* Evidence Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Evidence Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evidenceTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    'p-3 border rounded-lg text-left transition-colors',
                    selectedType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={cn(
                      'h-5 w-5 mt-0.5',
                      selectedType === type ? 'text-blue-600' : 'text-gray-400'
                    )} />
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-500 mt-1">{description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <Input
            label="Evidence Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            placeholder="Brief title describing this evidence"
            required
          />

          {/* File Upload (for non-text evidence) */}
          {selectedType !== 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                  dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300',
                  errors.file && 'border-red-300 bg-red-50'
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {selectedTypeConfig?.icon && (
                        <selectedTypeConfig.icon className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      Drop your file here, or{' '}
                      <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                        browse
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                          accept={selectedType === 'photo' ? 'image/*' : 
                                 selectedType === 'video' ? 'video/*' : 
                                 '.pdf,.doc,.docx'}
                        />
                      </label>
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedTypeConfig?.description}
                    </p>
                  </div>
                )}
              </div>
              {errors.file && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.file}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description {selectedType === 'text' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={cn(
                'block w-full rounded-md border-gray-300 shadow-sm',
                'focus:border-blue-500 focus:ring-blue-500',
                errors.description && 'border-red-300 focus:border-red-500 focus:ring-red-500'
              )}
              placeholder={
                selectedType === 'text' 
                  ? 'Provide detailed written testimony or description of events...'
                  : 'Optional: Provide additional context or explanation for this evidence...'
              }
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Guidelines */}
          <Card variant="outlined" padding="sm">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Evidence Guidelines</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Ensure all evidence is relevant to your dispute</li>
                  <li>• Photos should be clear and well-lit</li>
                  <li>• Documents should be legible and complete</li>
                  <li>• Maximum file size: 10MB per file</li>
                  <li>• All evidence will be reviewed by our dispute team</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          Submit Evidence
        </Button>
      </Modal.Footer>
    </Modal>
  );
};