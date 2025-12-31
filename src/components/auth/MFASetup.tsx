/**
 * Multi-Factor Authentication Setup Component
 * Handles MFA configuration and backup codes
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Shield, Smartphone, Key, Download, Copy, CheckCircle, AlertCircle, QrCode } from 'lucide-react';

interface MFASetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function MFASetup({ isOpen, onClose, onComplete }: MFASetupProps) {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [codesDownloaded, setCodesDownloaded] = useState(false);
  const [codesCopied, setCodesCopied] = useState(false);
  
  const { setupMFA, verifyMFA, error, clearError } = useAuth();

  useEffect(() => {
    if (isOpen && step === 1) {
      initializeMFASetup();
    }
  }, [isOpen]);

  const initializeMFASetup = async () => {
    try {
      clearError();
      if (setupMFA) {
        await setupMFA();
        // Mock QR code and backup codes for demo
        setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        setBackupCodes(['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345', 'PQR678', 'STU901', 'VWX234']);
      }
    } catch (error) {
      console.error('MFA setup initialization failed:', error);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) return;
    
    setIsVerifying(true);
    
    try {
      if (verifyMFA) {
        await verifyMFA(verificationCode);
      }
      setStep(3); // Move to backup codes step
    } catch (error) {
      // Error handled by context
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([`AutoLodge MFA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${codesText}\n\nKeep these codes safe and secure. Each code can only be used once.`], 
      { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'autolodge-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setCodesDownloaded(true);
  };

  const handleCopyCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setCodesCopied(true);
      setTimeout(() => setCodesCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy codes:', error);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
    
    // Reset state
    setStep(1);
    setQrCode('');
    setBackupCodes([]);
    setVerificationCode('');
    setCodesDownloaded(false);
    setCodesCopied(false);
  };

  const handleClose = () => {
    onClose();
    
    // Reset state
    setStep(1);
    setQrCode('');
    setBackupCodes([]);
    setVerificationCode('');
    setCodesDownloaded(false);
    setCodesCopied(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <Modal.Header>
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Set Up Two-Factor Authentication</h2>
        </div>
      </Modal.Header>
      
      <Modal.Body>
        {/* Step 1: QR Code Setup */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Scan QR Code
              </h3>
              <p className="text-gray-600">
                Use your authenticator app to scan this QR code
              </p>
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img 
                    src={qrCode} 
                    alt="MFA QR Code" 
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Recommended Apps:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Google Authenticator</li>
                <li>• Microsoft Authenticator</li>
                <li>• Authy</li>
                <li>• 1Password</li>
              </ul>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full"
              disabled={!qrCode}
            >
              I've Scanned the Code
            </Button>
          </div>
        )}

        {/* Step 2: Verify Code */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Verify Setup
              </h3>
              <p className="text-gray-600">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <Input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={verificationCode.length !== 6 || isVerifying}
                className="flex-1"
              >
                {isVerifying ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Save Backup Codes
              </h3>
              <p className="text-gray-600">
                Store these codes safely. Each can only be used once.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Backup Codes</h4>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyCodes}
                    className="flex items-center space-x-1"
                  >
                    {codesCopied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{codesCopied ? 'Copied!' : 'Copy'}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadCodes}
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-white border rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Important Security Notice:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Store these codes in a secure location</li>
                    <li>• Each code can only be used once</li>
                    <li>• Don't share these codes with anyone</li>
                    <li>• You can generate new codes anytime</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                id="codesAcknowledged"
                type="checkbox"
                checked={codesDownloaded}
                onChange={(e) => setCodesDownloaded(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="codesAcknowledged" className="text-sm text-gray-700">
                I have safely stored my backup codes
              </label>
            </div>

            <Button
              onClick={handleComplete}
              disabled={!codesDownloaded}
              className="w-full"
            >
              Complete Setup
            </Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}