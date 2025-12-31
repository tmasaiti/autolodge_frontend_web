/**
 * Registration Form Component
 * Handles user registration with progressive information collection
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info, Shield } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    profile: {
      first_name: '',
      last_name: '',
      nationality: '',
      date_of_birth: ''
    },
    terms_accepted: false,
    marketing_consent: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Check password strength
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
    
    if (error) {
      clearError();
    }
  };

  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }
    
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }
    
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }
    
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }
    
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character');
    }
    
    return {
      score,
      feedback,
      isValid: score >= 4
    };
  };

  const validateStep1 = () => {
    return (
      formData.email &&
      formData.password &&
      formData.confirm_password &&
      passwordStrength.isValid &&
      formData.password === formData.confirm_password
    );
  };

  const validateStep2 = () => {
    return (
      formData.profile.first_name &&
      formData.profile.last_name &&
      formData.profile.nationality &&
      formData.profile.date_of_birth &&
      formData.terms_accepted
    );
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !validateStep2()) return;
    
    setIsSubmitting(true);
    
    try {
      // Transform formData to match RegisterData interface
      const registerData = {
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        firstName: formData.profile.first_name,
        lastName: formData.profile.last_name,
        role: 'renter' as const,
        profile: formData.profile,
        terms_accepted: formData.terms_accepted,
        marketing_consent: formData.marketing_consent
      };
      
      await register(registerData);
      
      onSuccess?.();
      navigate('/dashboard');
      
    } catch (error) {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Medium';
    return 'Strong';
  };

  // Step 1: Account Information
  if (step === 1) {
    return (
      <Card className="w-full max-w-md mx-auto p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Step 1 of 2: Account Security</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {getPasswordStrengthText()}
                  </span>
                </div>
                
                {passwordStrength.feedback.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <p>Password needs:</p>
                    <ul className="list-disc list-inside ml-2">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirm_password"
                name="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            
            {formData.confirm_password && formData.password !== formData.confirm_password && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!validateStep1()}
          >
            Continue
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    );
  }

  // Step 2: Personal Information
  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-gray-600 mt-2">Step 2 of 2: Complete Your Profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <Input
              id="first_name"
              name="profile.first_name"
              type="text"
              value={formData.profile.first_name}
              onChange={handleInputChange}
              placeholder="First name"
              required
              autoComplete="given-name"
            />
          </div>
          
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <Input
              id="last_name"
              name="profile.last_name"
              type="text"
              value={formData.profile.last_name}
              onChange={handleInputChange}
              placeholder="Last name"
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
            Nationality
          </label>
          <select
            id="nationality"
            name="profile.nationality"
            value={formData.profile.nationality}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select nationality</option>
            <option value="ZA">South African</option>
            <option value="BW">Botswanan</option>
            <option value="ZW">Zimbabwean</option>
            <option value="ZM">Zambian</option>
            <option value="NA">Namibian</option>
            <option value="MW">Malawian</option>
            <option value="MZ">Mozambican</option>
            <option value="SZ">Swazi</option>
            <option value="LS">Lesothan</option>
            <option value="AO">Angolan</option>
            <option value="CD">Congolese (DRC)</option>
            <option value="MG">Malagasy</option>
            <option value="MU">Mauritian</option>
            <option value="SC">Seychellois</option>
            <option value="TZ">Tanzanian</option>
          </select>
        </div>

        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <Input
            id="date_of_birth"
            name="profile.date_of_birth"
            type="date"
            value={formData.profile.date_of_birth}
            onChange={handleInputChange}
            required
            autoComplete="bday"
            max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          />
          <p className="mt-1 text-xs text-gray-500">You must be at least 18 years old</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <input
              id="terms_accepted"
              name="terms_accepted"
              type="checkbox"
              checked={formData.terms_accepted}
              onChange={handleInputChange}
              required
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="terms_accepted" className="text-sm text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </Link>
            </label>
          </div>
          
          <div className="flex items-start space-x-3">
            <input
              id="marketing_consent"
              name="marketing_consent"
              type="checkbox"
              checked={formData.marketing_consent}
              onChange={handleInputChange}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="marketing_consent" className="text-sm text-gray-700">
              I would like to receive marketing communications and updates about AutoLodge services
            </label>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handlePrevStep}
          >
            Back
          </Button>
          
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || isLoading || !validateStep2()}
          >
            {isSubmitting || isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-medium">Account Security</p>
            <p>Your account will be created with basic verification. Complete KYC verification to unlock all features.</p>
          </div>
        </div>
      </div>
    </Card>
  );
}