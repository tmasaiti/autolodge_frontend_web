import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { WizardStepProps } from '../../wizard/WizardStepWrapper';
import { BookingLocations } from '../../../schemas/booking-schemas';
import { Vehicle } from '../../../types/vehicle';

export interface DatesLocationStepData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  locations: BookingLocations;
  totalDays: number;
}

export interface DatesLocationStepProps extends WizardStepProps {
  vehicle: Vehicle;
  initialDates?: {
    startDate: string;
    endDate: string;
  };
}

export const DatesLocationStep: React.FC<DatesLocationStepProps> = ({
  vehicle,
  initialDates,
  data,
  onDataChange,
  onNext
}) => {
  const [formData, setFormData] = useState<DatesLocationStepData>({
    startDate: initialDates?.startDate || data.startDate || '',
    endDate: initialDates?.endDate || data.endDate || '',
    startTime: data.startTime || '10:00',
    endTime: data.endTime || '10:00',
    locations: data.locations || {
      pickup: {
        latitude: vehicle.location?.latitude || 0,
        longitude: vehicle.location?.longitude || 0,
        address: vehicle.location?.address || '',
        city: vehicle.location?.city || '',
        country: vehicle.location?.country || '',
        instructions: ''
      },
      dropoff: {
        latitude: vehicle.location?.latitude || 0,
        longitude: vehicle.location?.longitude || 0,
        address: vehicle.location?.address || '',
        city: vehicle.location?.city || '',
        country: vehicle.location?.country || '',
        instructions: ''
      },
      same_location: true
    },
    totalDays: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate total days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setFormData(prev => ({ ...prev, totalDays: diffDays }));
    }
  }, [formData.startDate, formData.endDate]);

  // Update parent data when form changes
  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start >= end) {
        newErrors.endDate = 'End date must be after start date';
      }

      if (start < new Date()) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    if (!formData.locations.pickup.address) {
      newErrors.pickupAddress = 'Pickup address is required';
    }

    if (!formData.locations.same_location && !formData.locations.dropoff.address) {
      newErrors.dropoffAddress = 'Drop-off address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof DatesLocationStepData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (type: 'pickup' | 'dropoff', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      locations: {
        ...prev.locations,
        [type]: {
          ...prev.locations[type],
          [field]: value
        }
      }
    }));
  };

  const handleSameLocationToggle = () => {
    setFormData(prev => ({
      ...prev,
      locations: {
        ...prev.locations,
        same_location: !prev.locations.same_location,
        dropoff: !prev.locations.same_location 
          ? prev.locations.pickup 
          : prev.locations.dropoff
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext?.();
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-10" noValidate>
      {/* Vehicle Info */}
      <section className="bg-neutral-50 rounded-xl p-6" aria-labelledby="vehicle-info-heading">
        <h2 id="vehicle-info-heading" className="text-lg font-semibold text-neutral-900 mb-4">
          Selected Vehicle
        </h2>
        <div className="flex items-center space-x-4">
          <div className="w-20 h-16 bg-neutral-200 rounded-lg flex items-center justify-center">
            <span className="text-sm text-neutral-500" aria-hidden="true">IMG</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-900">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="text-neutral-600">
              {vehicle.year} • {vehicle.category}
            </p>
          </div>
        </div>
      </section>

      {/* Date Selection */}
      <fieldset className="space-y-6">
        <legend className="text-xl font-semibold text-neutral-900 mb-6">
          Rental Dates
        </legend>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              type="date"
              label="Pickup Date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              min={today}
              error={errors.startDate}
              leftIcon={<Calendar className="h-5 w-5" />}
              required
              aria-describedby={errors.startDate ? 'start-date-error' : undefined}
            />
          </div>
          <div>
            <Input
              type="date"
              label="Return Date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              min={formData.startDate || today}
              error={errors.endDate}
              leftIcon={<Calendar className="h-5 w-5" />}
              required
              aria-describedby={errors.endDate ? 'end-date-error' : undefined}
            />
          </div>
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              type="time"
              label="Pickup Time"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              leftIcon={<Clock className="h-5 w-5" />}
              aria-describedby="pickup-time-help"
            />
            <p id="pickup-time-help" className="text-sm text-neutral-500 mt-1">
              Preferred pickup time
            </p>
          </div>
          <div>
            <Input
              type="time"
              label="Return Time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              leftIcon={<Clock className="h-5 w-5" />}
              aria-describedby="return-time-help"
            />
            <p id="return-time-help" className="text-sm text-neutral-500 mt-1">
              Preferred return time
            </p>
          </div>
        </div>
      </fieldset>

      {/* Duration Display */}
      {formData.totalDays > 0 && (
        <div className="bg-primary-50 rounded-xl p-6" role="status" aria-live="polite">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-primary-600" aria-hidden="true" />
            <div>
              <p className="text-lg font-semibold text-primary-800">
                Rental Duration: {formData.totalDays} day{formData.totalDays !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-primary-700">
                From {new Date(formData.startDate).toLocaleDateString()} to {new Date(formData.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Location */}
      <fieldset className="space-y-6">
        <legend className="text-xl font-semibold text-neutral-900 flex items-center mb-6">
          <MapPin className="h-6 w-6 mr-3 text-primary-600" aria-hidden="true" />
          Pickup Location
        </legend>
        
        <div className="space-y-6">
          <Input
            label="Pickup Address"
            value={formData.locations.pickup.address}
            onChange={(e) => handleLocationChange('pickup', 'address', e.target.value)}
            placeholder="Enter pickup address"
            error={errors.pickupAddress}
            required
            aria-describedby={errors.pickupAddress ? 'pickup-address-error' : 'pickup-address-help'}
          />
          <p id="pickup-address-help" className="text-sm text-neutral-500">
            Full street address where you'll collect the vehicle
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="City"
              value={formData.locations.pickup.city}
              onChange={(e) => handleLocationChange('pickup', 'city', e.target.value)}
              placeholder="City"
              required
            />
            <Input
              label="Country"
              value={formData.locations.pickup.country}
              onChange={(e) => handleLocationChange('pickup', 'country', e.target.value)}
              placeholder="Country"
              required
            />
          </div>

          <Input
            label="Special Instructions (Optional)"
            value={formData.locations.pickup.instructions || ''}
            onChange={(e) => handleLocationChange('pickup', 'instructions', e.target.value)}
            placeholder="Any special pickup instructions..."
            aria-describedby="pickup-instructions-help"
          />
          <p id="pickup-instructions-help" className="text-sm text-neutral-500">
            Additional details to help locate the pickup point
          </p>
        </div>
      </fieldset>

      {/* Same Location Toggle */}
      <div className="bg-neutral-50 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="sameLocation"
            checked={formData.locations.same_location}
            onChange={handleSameLocationToggle}
            className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
            aria-describedby="same-location-help"
          />
          <div>
            <label htmlFor="sameLocation" className="text-base font-medium text-neutral-900 cursor-pointer">
              Return to the same location
            </label>
            <p id="same-location-help" className="text-sm text-neutral-600 mt-1">
              Check this if you'll return the vehicle to the same pickup location
            </p>
          </div>
        </div>
      </div>

      {/* Drop-off Location */}
      {!formData.locations.same_location && (
        <fieldset className="space-y-6">
          <legend className="text-xl font-semibold text-neutral-900 flex items-center mb-6">
            <MapPin className="h-6 w-6 mr-3 text-secondary-600" aria-hidden="true" />
            Drop-off Location
          </legend>
          
          <div className="space-y-6">
            <Input
              label="Drop-off Address"
              value={formData.locations.dropoff.address}
              onChange={(e) => handleLocationChange('dropoff', 'address', e.target.value)}
              placeholder="Enter drop-off address"
              error={errors.dropoffAddress}
              required
              aria-describedby={errors.dropoffAddress ? 'dropoff-address-error' : 'dropoff-address-help'}
            />
            <p id="dropoff-address-help" className="text-sm text-neutral-500">
              Full street address where you'll return the vehicle
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="City"
                value={formData.locations.dropoff.city}
                onChange={(e) => handleLocationChange('dropoff', 'city', e.target.value)}
                placeholder="City"
                required
              />
              <Input
                label="Country"
                value={formData.locations.dropoff.country}
                onChange={(e) => handleLocationChange('dropoff', 'country', e.target.value)}
                placeholder="Country"
                required
              />
            </div>

            <Input
              label="Special Instructions (Optional)"
              value={formData.locations.dropoff.instructions || ''}
              onChange={(e) => handleLocationChange('dropoff', 'instructions', e.target.value)}
              placeholder="Any special drop-off instructions..."
              aria-describedby="dropoff-instructions-help"
            />
            <p id="dropoff-instructions-help" className="text-sm text-neutral-500">
              Additional details to help locate the drop-off point
            </p>
          </div>
        </fieldset>
      )}
    </form>
  );
};