/**
 * Verification Status Component
 * Displays KYC verification progress and status tracking
 */

import React, { useState, useEffect } from 'react';
import { kycService, KYCStatus, TrustScoreBreakdown } from '../../services/kycService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  Award,
  Eye,
  RefreshCw,
  FileText,
  Star
} from 'lucide-react';

interface VerificationStatusProps {
  onDocumentUploadClick?: () => void;
}

export function VerificationStatus({ onDocumentUploadClick }: VerificationStatusProps) {
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [trustScore, setTrustScore] = useState<TrustScoreBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrustScoreModal, setShowTrustScoreModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);

  useEffect(() => {
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [statusData, scoreData] = await Promise.all([
        kycService.getKYCStatus(),
        kycService.getTrustScore()
      ]);
      
      setKycStatus(statusData);
      setTrustScore(scoreData);
    } catch (error: any) {
      setError(error.message || 'Failed to load verification status');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVerificationHistory = async () => {
    try {
      const history = await kycService.getVerificationHistory();
      setVerificationHistory(history);
      setShowHistoryModal(true);
    } catch (error: any) {
      setError(error.message || 'Failed to load verification history');
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await kycService.submitForReview();
      await loadKYCData(); // Refresh status
    } catch (error: any) {
      setError(error.message || 'Failed to submit for review');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'in_progress':
        return <Clock className="w-6 h-6 text-blue-600" />;
      case 'expired':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'in_progress':
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'expired':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVerificationLevelBadge = (level: string) => {
    const badges = {
      basic: { color: 'bg-gray-100 text-gray-800', icon: Shield },
      standard: { color: 'bg-blue-100 text-blue-800', icon: Award },
      premium: { color: 'bg-purple-100 text-purple-800', icon: Star },
      operator: { color: 'bg-gold-100 text-gold-800', icon: TrendingUp }
    };
    
    const badge = badges[level as keyof typeof badges] || badges.basic;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading verification status...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <Button variant="outline" onClick={loadKYCData}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!kycStatus) return null;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getStatusIcon(kycStatus.overall_status)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Verification Status
              </h2>
              <p className="text-gray-600">
                Current level: {getVerificationLevelBadge(kycStatus.verification_level)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadVerificationHistory}
              className="flex items-center space-x-1"
            >
              <FileText className="w-4 h-4" />
              <span>History</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadKYCData}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Status Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {kycStatus.submitted_documents.length}
            </p>
            <p className="text-sm text-gray-600">Documents Submitted</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {kycStatus.missing_documents.length}
            </p>
            <p className="text-sm text-gray-600">Documents Missing</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className={`text-2xl font-bold ${getTrustScoreColor(kycStatus.trust_score)}`}>
              {kycStatus.trust_score}
            </p>
            <p className="text-sm text-gray-600">Trust Score</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Verification Progress</span>
            <span>
              {Math.round(
                ((kycStatus.submitted_documents.length) / 
                (kycStatus.submitted_documents.length + kycStatus.missing_documents.length)) * 100
              )}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${Math.round(
                  ((kycStatus.submitted_documents.length) / 
                  (kycStatus.submitted_documents.length + kycStatus.missing_documents.length)) * 100
                )}%`
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {kycStatus.missing_documents.length > 0 && (
            <Button onClick={onDocumentUploadClick}>
              Upload Missing Documents
            </Button>
          )}
          
          {kycStatus.missing_documents.length === 0 && 
           kycStatus.overall_status === 'not_started' && (
            <Button onClick={handleSubmitForReview}>
              Submit for Review
            </Button>
          )}
          
          {trustScore && (
            <Button
              variant="outline"
              onClick={() => setShowTrustScoreModal(true)}
              className="flex items-center space-x-1"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View Trust Score</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Document Status */}
      {kycStatus.submitted_documents.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Submitted Documents
          </h3>
          
          <div className="space-y-3">
            {kycStatus.submitted_documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {doc.document_type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Uploaded {new Date(doc.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(doc.file_url, '_blank')}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Missing Documents */}
      {kycStatus.missing_documents.length > 0 && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">
                Missing Documents
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please upload the following documents to complete your verification:
              </p>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                {kycStatus.missing_documents.map((docType, index) => (
                  <li key={index}>
                    {docType.replace('_', ' ').toUpperCase()}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Trust Score Modal */}
      {trustScore && (
        <Modal 
          isOpen={showTrustScoreModal} 
          onClose={() => setShowTrustScoreModal(false)}
          size="lg"
        >
          <Modal.Header>
            <h2 className="text-xl font-semibold">Trust Score Breakdown</h2>
          </Modal.Header>
          
          <Modal.Body>
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getTrustScoreColor(trustScore.total_score)}`}>
                  {trustScore.total_score}
                </div>
                <p className="text-gray-600">Overall Trust Score</p>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Score Components</h3>
                
                {Object.entries({
                  'Identity Verification': trustScore.identity_verification,
                  'Document Authenticity': trustScore.document_authenticity,
                  'Address Verification': trustScore.address_verification,
                  'Phone Verification': trustScore.phone_verification,
                  'Email Verification': trustScore.email_verification,
                  'Behavioral Score': trustScore.behavioral_score
                }).map(([label, score]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{label}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            score >= 80 ? 'bg-green-500' : 
                            score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{score}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Positive Factors</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {trustScore.factors.positive.map((factor, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <CheckCircle className="w-3 h-3 mt-0.5" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Areas for Improvement</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {trustScore.factors.negative.map((factor, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <AlertCircle className="w-3 h-3 mt-0.5" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              {trustScore.factors.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {trustScore.factors.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <TrendingUp className="w-3 h-3 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* Verification History Modal */}
      <Modal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)}
        size="lg"
      >
        <Modal.Header>
          <h2 className="text-xl font-semibold">Verification History</h2>
        </Modal.Header>
        
        <Modal.Body>
          <div className="space-y-4">
            {verificationHistory.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                No verification history available
              </p>
            ) : (
              verificationHistory.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.action}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {event.notes && (
                      <p className="text-sm text-gray-700 mt-1">{event.notes}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      By: {event.performed_by}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}