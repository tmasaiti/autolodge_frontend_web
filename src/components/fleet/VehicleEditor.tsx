import React, { useState, useEffect } from 'react';
import { Vehicle } from '../../types/vehicle';
import { CurrencyCode } from '@autolodge/shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { PricingEditor } from './PricingEditor';
import { AvailabilityManager } from './AvailabilityManager';
import { useJSONHandler } from '../../hooks/useJSONHandler';
import { vehicleSpecificationsSchema } from '../../schemas/vehicle-schemas';
import { 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle,
  Car,
  DollarSign,
  Calendar,
  Settings,
  Upload,
  MapPin
} from 'lucide-react';

interface VehicleEditorProps {
  vehicle?: Vehicle | null;
  onSave: (vehicle: Vehicle) => void;
  onCancel: () => void;
}

interface VehicleFormData {
  registration: string;
  category: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  description: string;
  specifications: any;
  location: {
    address: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
    postal_code?: string;
  };
}

export const VehicleEditor: React.FC<VehicleEditorProps> = ({
  vehicle,
  onSave,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'availability' | 'specifications'>('basic');
  const [formData, setFormData] = useState<VehicleFormData>({
    registration: '',
    category: 'Sedan',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vin: '',
    description: '',
    specifications: {
      engine: { type: '', displacement: 0, fuel_type: 'Petrol' },
      transmission: 'Manual',
      seats: 5,
      doors: 4,
      features: [],
      safety_features: [],
      entertainment: []
    },
    location: {
      address: '',
      city: '',
      country: 'South Africa'
    }
  });

  const [pricing, setPricing] = useState(vehicle?.pricing || {
    base_daily_rate: 0,
    currency: 'ZAR' as CurrencyCode,
    seasonal_adjustments: { peak_multiplier: 1.2, off_peak_multiplier: 0.8 },
    distance_pricing: { included_km_per_day: 200, excess_km_rate: 3.0 },
    cross_border_surcharge: 50,
    security_deposit: 2000
  });

  const [availability, setAvailability] = useState(vehicle?.availability || {
    calendar_type: 'calendar_based' as const,
    advance_booking_days: 30,
    minimum_rental_days: 1,
    maximum_rental_days: 30,
    blocked_dates: [],
    available_times: { start_time: '08:00', end_time: '18:00' }
  });

  const [crossBorderConfig, setCrossBorderConfig] = useState(vehicle?.cross_border_config || {
    allowed: false,
    countries: [],
    surcharge_percentage: 10,
    required_documents: [],
    insurance_requirements: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple validation for specifications (temporarily simplified)
  const [specError, setSpecError] = useState<string | null>(null);
  const [specsValid, setSpecsValid] = useState(true);
  
  const validate = (specs: any) => {
    // Simple validation - in a real app this would use proper JSON schema validation
    if (!specs || typeof specs !== 'object') {
      setSpecError('Invalid specifications format');
      setSpecsValid(false);
      return false;
    }
    setSpecError(null);
    setSpecsValid(true);
    return true;
  };

  useEffect(() => {
    if (vehicle) {
      setFormData({
        registration: vehicle.registration,
        category: vehicle.category,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color || '',
        vin: vehicle.vin || '',
        description: vehicle.description || '',
        specifications: vehicle.specifications,
        location: {
          latitude: vehicle.location?.latitude || 0,
          longitude: vehicle.location?.longitude || 0,
          address: vehicle.location?.address || '',
          city: vehicle.location?.city || '',
          country: vehicle.location?.country || '',
          postal_code: vehicle.location?.postal_code
        }
      });
    }
  }, [vehicle]);

  const handleInputChange = (field: keyof VehicleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSpecificationChange = (specs: any) => {
    setFormData(prev => ({ ...prev, specifications: specs }));
    validate(specs);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.registration.trim()) newErrors.registration = 'Registration is required';
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.vin.trim()) newErrors.vin = 'VIN is required';
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Invalid year';
    }

    // Location validation
    if (!formData.location.address.trim()) newErrors.address = 'Address is required';
    if (!formData.location.city.trim()) newErrors.city = 'City is required';

    // Pricing validation
    if (pricing.base_daily_rate <= 0) newErrors.pricing = 'Daily rate must be greater than 0';

    // Specifications validation
    if (!specsValid) {
      newErrors.specifications = 'Vehicle specifications contain errors';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const vehicleData: Vehicle = {
        id: vehicle?.id || Date.now(), // Mock ID generation
        operator_id: vehicle?.operator_id || 1, // Mock operator ID
        ...formData,
        location: {
          latitude: formData.location.latitude || 0,
          longitude: formData.location.longitude || 0,
          address: formData.location.address,
          city: formData.location.city,
          country: formData.location.country,
          postal_code: formData.location.postal_code
        },
        pricing,
        availability,
        cross_border_config: crossBorderConfig,
        verification: vehicle?.verification || {
          status: 'pending',
          verified_at: undefined,
          documents_verified: []
        },
        status: vehicle?.status || 'available',
        photos: vehicle?.photos || [],
        created_at: vehicle?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onSave(vehicleData);
    } catch (error) {
      console.error('Failed to save vehicle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Car },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'specifications', label: 'Specifications', icon: Settings }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          <p className="text-gray-600 mt-1">
            {vehicle ? 'Update vehicle information and settings' : 'Add a new vehicle to your fleet'}
          </p>
        </div>
        
        <Button variant="ghost" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'basic' && (
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <Input
                  value={formData.registration}
                  onChange={(e) => handleInputChange('registration', e.target.value)}
                  placeholder="e.g., CA 123 456"
                  error={errors.registration}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Convertible">Convertible</option>
                  <option value="Wagon">Wagon</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Van">Van</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Make *
                </label>
                <Input
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  placeholder="e.g., BMW"
                  error={errors.make}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model *
                </label>
                <Input
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="e.g., 3 Series"
                  error={errors.model}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  error={errors.year}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <Input
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="e.g., Black"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VIN *
                </label>
                <Input
                  value={formData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value)}
                  placeholder="Vehicle Identification Number"
                  error={errors.vin}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your vehicle..."
                />
              </div>
            </div>

            {/* Location */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <Input
                    value={formData.location.address}
                    onChange={(e) => handleInputChange('location', { ...formData.location, address: e.target.value })}
                    placeholder="Street address"
                    error={errors.address}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <Input
                    value={formData.location.city}
                    onChange={(e) => handleInputChange('location', { ...formData.location, city: e.target.value })}
                    placeholder="City"
                    error={errors.city}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.location.country}
                    onChange={(e) => handleInputChange('location', { ...formData.location, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="South Africa">South Africa</option>
                    <option value="Botswana">Botswana</option>
                    <option value="Namibia">Namibia</option>
                    <option value="Zambia">Zambia</option>
                    <option value="Zimbabwe">Zimbabwe</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'pricing' && (
          <PricingEditor
            pricing={{
              ...pricing,
              currency: pricing.currency as CurrencyCode
            }}
            onChange={setPricing}
            error={errors.pricing}
          />
        )}

        {activeTab === 'availability' && (
          <AvailabilityManager
            availability={{
              calendar_type: availability.calendar_type === 'always_available' ? 'instant_booking' : 'calendar_based',
              advance_booking_days: availability.advance_booking_days,
              minimum_rental_days: availability.minimum_rental_days,
              maximum_rental_days: availability.maximum_rental_days,
              blocked_dates: availability.blocked_dates,
              available_times: availability.available_times
            }}
            onChange={(newAvailability) => {
              setAvailability({
                ...newAvailability,
                calendar_type: newAvailability.calendar_type === 'instant_booking' ? 'always_available' : 'calendar_based'
              });
            }}
            crossBorderConfig={crossBorderConfig}
            onCrossBorderChange={setCrossBorderConfig}
          />
        )}

        {activeTab === 'specifications' && (
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Specifications</h3>
            
            {/* JSON Validation Status */}
            <div className="mb-4">
              {specsValid ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Specifications are valid
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Specifications contain errors
                </div>
              )}
            </div>

            {/* Engine Specifications */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Engine</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Engine Type
                  </label>
                  <Input
                    value={formData.specifications.engine.type}
                    onChange={(e) => handleSpecificationChange({
                      ...formData.specifications,
                      engine: { ...formData.specifications.engine, type: e.target.value }
                    })}
                    placeholder="e.g., V6 Turbo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Displacement (L)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.specifications.engine.displacement}
                    onChange={(e) => handleSpecificationChange({
                      ...formData.specifications,
                      engine: { ...formData.specifications.engine, displacement: parseFloat(e.target.value) }
                    })}
                    placeholder="2.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Type
                  </label>
                  <select
                    value={formData.specifications.engine.fuel_type}
                    onChange={(e) => handleSpecificationChange({
                      ...formData.specifications,
                      engine: { ...formData.specifications.engine, fuel_type: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Basic Specifications */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Basic Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission
                  </label>
                  <select
                    value={formData.specifications.transmission}
                    onChange={(e) => handleSpecificationChange({
                      ...formData.specifications,
                      transmission: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seats
                  </label>
                  <Input
                    type="number"
                    min="2"
                    max="9"
                    value={formData.specifications.seats}
                    onChange={(e) => handleSpecificationChange({
                      ...formData.specifications,
                      seats: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doors
                  </label>
                  <Input
                    type="number"
                    min="2"
                    max="5"
                    value={formData.specifications.doors}
                    onChange={(e) => handleSpecificationChange({
                      ...formData.specifications,
                      doors: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {specError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h5 className="text-sm font-medium text-red-800 mb-2">Specification Errors:</h5>
                <div className="text-sm text-red-700">
                  {specError}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : 'Save Vehicle'}
        </Button>
      </div>
    </div>
  );
};