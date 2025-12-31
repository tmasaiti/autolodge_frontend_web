/**
 * Admin Protected Route Component
 * Handles role-based access control for admin pages
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

export function AdminProtectedRoute({ 
  children, 
  requiredRole = 'admin' 
}: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has admin role
  // Note: This is a simplified check. In a real app, you'd check against
  // proper role/permission system from the backend
  const hasAdminAccess = () => {
    if (!user) return false;
    
    // Check verification level for admin access
    const verificationLevel = user.verification_status?.verification_level;
    
    // For now, we'll consider 'operator' level and above as having potential admin access
    // In a real system, you'd have a separate admin role system
    if (verificationLevel === 'operator') {
      return true;
    }
    
    // You could also check for specific admin flags in user profile
    // or make an API call to verify admin permissions
    return false;
  };

  // Check for super admin access
  const hasSuperAdminAccess = () => {
    if (!hasAdminAccess()) return false;
    
    // Additional checks for super admin
    // This would typically involve checking specific permissions or roles
    return true; // Simplified for demo
  };

  const hasRequiredAccess = requiredRole === 'super_admin' 
    ? hasSuperAdminAccess() 
    : hasAdminAccess();

  // Show access denied if user doesn't have required permissions
  if (!hasRequiredAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin panel. 
            Please contact your system administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
            <Navigate to="/dashboard" replace />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}