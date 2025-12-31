/**
 * KYC Verification Page
 * Dedicated page for identity verification process
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KYCDashboard } from '../components/kyc/KYCDashboard';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function KYCPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link to="/profile">
              <Button variant="outline" size="sm" className="mb-4 flex items-center space-x-1">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Profile</span>
              </Button>
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
                <p className="text-gray-600 mt-1">
                  Secure your account and unlock all platform features
                </p>
              </div>
            </div>
          </div>

          {/* KYC Dashboard */}
          <KYCDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}