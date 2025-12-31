import React, { useState, useEffect } from 'react';
import { Building, User, Phone, Mail, MapPin } from 'lucide-react';
import { Input } from '../../ui/Input';
import { WizardStepProps } from '../../wizard/WizardStepWrapper';

export interface BusinessInfoStepData {
  businessType: 'individual' | 'company' | 'partnership';
  businessName: string;
  registrationNumber?: string;
  taxNumber?: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    position: string;
    email: string;
    phone: string;
  };
  businessAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  operatingLicense?: string;
  yearsInBusiness: number;
  description: string;
}

export const BusinessInfoStep: React.FC<WizardStepProps> = ({
  data,
  onDataChange,
  onNext
}) => {
  const [formData, setFormData] = useState<BusinessInfoStepData>({
    businessType: data.businessType || 'individual',
    businessName: data.businessName || '',
    registrationNumber: data.registrationNumber || '',
    taxNumber: data.taxNumber || '',
    contactPerson: data.contactPerson || {
      firstName: '',
      lastName: '',
      position: '',
      email: '',
      phone: ''
    },
    businessAddress: data.businessAddress || {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    operatingLicense: data.operatingLicense || '',
    yearsInBusiness: data.yearsInBusiness || 0,
    description: data.description || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update parent data when form changes
  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (formData.businessType === 'company' && !formData.registrationNumber?.trim()) {
      newErrors.registrationNumber = 'Registration number is required for companies';
    }

    if (!formData.contactPerson.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.contactPerson.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.contactPerson.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPerson.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.contactPerson.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.businessAddress.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.businessAddress.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.businessAddress.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (formData.yearsInBusiness < 0) {
      newErrors.yearsInBusiness = 'Years in business cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof BusinessInfoStepData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContactPersonChange = (field: keyof BusinessInfoStepData['contactPerson'], value: string) => {
    setFormData(prev => ({
      ...prev,
      contactPerson: {
        ...prev.contactPerson,
        [field]: value
      }
    }));
  };

  const handleAddressChange = (field: keyof BusinessInfoStepData['businessAddress'], value: string) => {
    setFormData(prev => ({
      ...prev,
      businessAddress: {
        ...prev.businessAddress,
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Business Type Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Building className="h-5 w-5 mr-2" />
          Business Type
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'individual', label: 'Individual', description: 'Personal vehicle rental' },
            { value: 'company', label: 'Company', description: 'Registered business entity' },
            { value: 'partnership', label: 'Partnership', description: 'Business partnership' }
          ].map(type => (
            <label
              key={type.value}
              className={`
                flex flex-col p-4 rounded-lg border cursor-pointer transition-colors
                ${formData.businessType === type.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300'
                }
              `}
            >
              <input
                type="radio"
                name="businessType"
                value={type.value}
                checked={formData.businessType === type.value}
                onChange={(e) => handleInputChange('businessType', e.target.value as any)}
                className="sr-only"
              />
              <span className="font-medium text-gray-900">{type.label}</span>
              <span className="text-sm text-gray-600 mt-1">{type.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Business Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Business Name"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="Enter your business name"
              error={errors.businessName}
              leftIcon={<Building />}
            />
          </div>

          {formData.businessType === 'company' && (
            <>
              <Input
                label="Registration Number"
                value={formData.registrationNumber || ''}
                onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                placeholder="Company registration number"
                error={errors.registrationNumber}
              />

              <Input
                label="Tax Number"
                value={formData.taxNumber || ''}
                onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                placeholder="Tax identification number"
              />
            </>
          )}

          <Input
            label="Operating License (Optional)"
            value={formData.operatingLicense || ''}
            onChange={(e) => handleInputChange('operatingLicense', e.target.value)}
            placeholder="Vehicle rental license number"
          />

          <Input
            type="number"
            label="Years in Business"
            value={formData.yearsInBusiness.toString()}
            onChange={(e) => handleInputChange('yearsInBusiness', parseInt(e.target.value) || 0)}
            placeholder="0"
            min="0"
            error={errors.yearsInBusiness}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your business and services..."
            rows={4}
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Contact Person */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Primary Contact Person
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.contactPerson.firstName}
            onChange={(e) => handleContactPersonChange('firstName', e.target.value)}
            placeholder="First name"
            error={errors.firstName}
          />

          <Input
            label="Last Name"
            value={formData.contactPerson.lastName}
            onChange={(e) => handleContactPersonChange('lastName', e.target.value)}
            placeholder="Last name"
            error={errors.lastName}
          />

          <Input
            label="Position/Title"
            value={formData.contactPerson.position}
            onChange={(e) => handleContactPersonChange('position', e.target.value)}
            placeholder="e.g., Owner, Manager"
          />

          <Input
            type="email"
            label="Email Address"
            value={formData.contactPerson.email}
            onChange={(e) => handleContactPersonChange('email', e.target.value)}
            placeholder="email@example.com"
            error={errors.email}
            leftIcon={<Mail />}
          />

          <div className="md:col-span-2">
            <Input
              type="tel"
              label="Phone Number"
              value={formData.contactPerson.phone}
              onChange={(e) => handleContactPersonChange('phone', e.target.value)}
              placeholder="+27 12 345 6789"
              error={errors.phone}
              leftIcon={<Phone />}
            />
          </div>
        </div>
      </div>

      {/* Business Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Business Address
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Street Address"
              value={formData.businessAddress.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              placeholder="123 Main Street"
              error={errors.street}
            />
          </div>

          <Input
            label="City"
            value={formData.businessAddress.city}
            onChange={(e) => handleAddressChange('city', e.target.value)}
            placeholder="Cape Town"
            error={errors.city}
          />

          <Input
            label="State/Province"
            value={formData.businessAddress.state}
            onChange={(e) => handleAddressChange('state', e.target.value)}
            placeholder="Western Cape"
          />

          <Input
            label="Postal Code"
            value={formData.businessAddress.postalCode}
            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
            placeholder="8001"
          />

          <Input
            label="Country"
            value={formData.businessAddress.country}
            onChange={(e) => handleAddressChange('country', e.target.value)}
            placeholder="South Africa"
            error={errors.country}
          />
        </div>
      </div>

      {/* Information Notice */}
      <div className="bg-primary-50 rounded-lg p-4">
        <h4 className="font-medium text-primary-800 mb-2">Next Steps</h4>
        <p className="text-sm text-primary-700">
          After completing your business information, you'll need to upload required documents 
          for verification. This includes business registration, insurance certificates, and 
          identification documents.
        </p>
      </div>
    </form>
  );
};