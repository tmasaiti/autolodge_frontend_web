/**
 * Profile Management Page
 * User profile, security settings, and account management
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MFASetup } from '../components/auth/MFASetup';
import { SessionManager } from '../components/auth/SessionManager';
import { 
  User, 
  Shield, 
  Settings, 
  Key, 
  Smartphone, 
  Monitor, 
  Bell,
  Eye,
  Lock,
  CheckCircle,
  AlertCircle,
  Edit
} from 'lucide-react';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  const getVerificationBadge = (verified: boolean, label: string) => (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-700">{label}</span>
      {verified ? (
        <div className="flex items-center space-x-1 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Verified</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-yellow-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Pending</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile, security, and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <p className="text-gray-900">{user.profile.first_name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <p className="text-gray-900">{user.profile.last_name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nationality
                      </label>
                      <p className="text-gray-900">{user.profile.nationality}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <p className="text-gray-900">
                        {new Date(user.profile.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Verification Status */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Verification Status</h2>
                  
                  <div className="space-y-4">
                    {getVerificationBadge(user.verification_status.email_verified, 'Email Address')}
                    {getVerificationBadge(user.verification_status.phone_verified, 'Phone Number')}
                    {getVerificationBadge(user.verification_status.identity_verified, 'Identity Document')}
                    {getVerificationBadge(user.verification_status.license_verified, 'Driver\'s License')}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">Verification Level: {user.verification_status.verification_level}</p>
                        <p className="mt-1 text-sm text-blue-800">
                          Complete KYC verification to unlock all platform features and increase your trust score.
                        </p>
                        <Link to="/kyc" className="mt-2 inline-block">
                          <Button size="sm" className="flex items-center space-x-1">
                            <Shield className="w-3 h-3" />
                            <span>Complete Verification</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowMFASetup(true)}
                      className="flex items-center space-x-1"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Setup MFA</span>
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Status: <span className="font-medium text-red-600">Not Enabled</span>
                  </div>
                </Card>

                {/* Active Sessions */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
                        <p className="text-sm text-gray-600">Manage devices signed into your account</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowSessionManager(true)}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Sessions</span>
                    </Button>
                  </div>
                </Card>

                {/* Password Management */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Key className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Password</h3>
                        <p className="text-sm text-gray-600">Change your account password</p>
                      </div>
                    </div>
                    <Button variant="outline" className="flex items-center space-x-1">
                      <Lock className="w-4 h-4" />
                      <span>Change Password</span>
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Last changed: {new Date(user.updated_at).toLocaleDateString()}
                  </div>
                </Card>

                {/* Account Actions */}
                <Card className="p-6 border-red-200">
                  <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Sign out all devices</p>
                        <p className="text-sm text-gray-600">This will sign you out of all devices except this one</p>
                      </div>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        Sign Out All
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Delete Account</p>
                        <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive booking updates and important announcements</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={user.profile.preferences?.notifications?.email}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">SMS Notifications</p>
                        <p className="text-sm text-gray-600">Get text messages for urgent updates</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={user.profile.preferences?.notifications?.sms}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Push Notifications</p>
                        <p className="text-sm text-gray-600">Browser and mobile app notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={user.profile.preferences?.notifications?.push}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Display Preferences</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="en">English</option>
                        <option value="af">Afrikaans</option>
                        <option value="pt">Portuguese</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={user.profile.preferences?.currency}
                      >
                        <option value="USD">US Dollar (USD)</option>
                        <option value="ZAR">South African Rand (ZAR)</option>
                        <option value="BWP">Botswana Pula (BWP)</option>
                        <option value="ZWL">Zimbabwean Dollar (ZWL)</option>
                      </select>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <MFASetup
        isOpen={showMFASetup}
        onClose={() => setShowMFASetup(false)}
        onComplete={() => {
          setShowMFASetup(false);
          // Refresh user data to show MFA enabled
        }}
      />
      
      <SessionManager
        isOpen={showSessionManager}
        onClose={() => setShowSessionManager(false)}
      />
    </div>
  );
}