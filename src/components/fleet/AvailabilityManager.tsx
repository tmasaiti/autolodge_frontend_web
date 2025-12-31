import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Calendar, 
  Clock, 
  Globe, 
  Shield, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle,
  MapPin
} from 'lucide-react';

interface AvailabilityData {
  calendar_type: 'calendar_based' | 'instant_booking';
  advance_booking_days: number;
  minimum_rental_days: number;
  maximum_rental_days: number;
  blocked_dates: string[];
  available_times: {
    start_time: string;
    end_time: string;
  };
}

interface CrossBorderConfig {
  allowed: boolean;
  countries: string[];
  surcharge_percentage: number;
  required_documents: string[];
  insurance_requirements: string[];
}

interface AvailabilityManagerProps {
  availability: AvailabilityData;
  onChange: (availability: AvailabilityData) => void;
  crossBorderConfig: CrossBorderConfig;
  onCrossBorderChange: (config: CrossBorderConfig) => void;
}

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({
  availability,
  onChange,
  crossBorderConfig,
  onCrossBorderChange
}) => {
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');

  // SADC countries
  const sadcCountries = [
    { code: 'ZA', name: 'South Africa' },
    { code: 'BW', name: 'Botswana' },
    { code: 'NA', name: 'Namibia' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'AO', name: 'Angola' },
    { code: 'CD', name: 'Democratic Republic of Congo' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'TZ', name: 'Tanzania' }
  ];

  const documentTypes = [
    'passport',
    'international_license',
    'national_id',
    'visa',
    'work_permit'
  ];

  const insuranceTypes = [
    'comprehensive',
    'third_party',
    'collision',
    'theft_protection'
  ];

  const handleAvailabilityChange = (field: keyof AvailabilityData, value: any) => {
    onChange({ ...availability, [field]: value });
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    onChange({
      ...availability,
      available_times: {
        ...availability.available_times,
        [field]: value
      }
    });
  };

  const addBlockedDate = () => {
    if (newBlockedDate && !availability.blocked_dates.includes(newBlockedDate)) {
      onChange({
        ...availability,
        blocked_dates: [...availability.blocked_dates, newBlockedDate].sort()
      });
      setNewBlockedDate('');
    }
  };

  const removeBlockedDate = (date: string) => {
    onChange({
      ...availability,
      blocked_dates: availability.blocked_dates.filter(d => d !== date)
    });
  };

  const handleCrossBorderChange = (field: keyof CrossBorderConfig, value: any) => {
    onCrossBorderChange({ ...crossBorderConfig, [field]: value });
  };

  const addCountry = () => {
    if (selectedCountry && !crossBorderConfig.countries.includes(selectedCountry)) {
      handleCrossBorderChange('countries', [...crossBorderConfig.countries, selectedCountry]);
      setSelectedCountry('');
    }
  };

  const removeCountry = (countryCode: string) => {
    handleCrossBorderChange(
      'countries',
      crossBorderConfig.countries.filter(c => c !== countryCode)
    );
  };

  const toggleDocument = (document: string) => {
    const documents = crossBorderConfig.required_documents;
    if (documents.includes(document)) {
      handleCrossBorderChange(
        'required_documents',
        documents.filter(d => d !== document)
      );
    } else {
      handleCrossBorderChange('required_documents', [...documents, document]);
    }
  };

  const toggleInsurance = (insurance: string) => {
    const insurances = crossBorderConfig.insurance_requirements;
    if (insurances.includes(insurance)) {
      handleCrossBorderChange(
        'insurance_requirements',
        insurances.filter(i => i !== insurance)
      );
    } else {
      handleCrossBorderChange('insurance_requirements', [...insurances, insurance]);
    }
  };

  const getCountryName = (code: string) => {
    return sadcCountries.find(c => c.code === code)?.name || code;
  };

  return (
    <div className="space-y-6">
      {/* Basic Availability Settings */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Availability Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Type
            </label>
            <select
              value={availability.calendar_type}
              onChange={(e) => handleAvailabilityChange('calendar_type', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="calendar_based">Calendar Based</option>
              <option value="instant_booking">Instant Booking</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {availability.calendar_type === 'instant_booking' 
                ? 'Customers can book immediately without approval'
                : 'Bookings require your approval'
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advance Booking Days
            </label>
            <Input
              type="number"
              min="1"
              max="365"
              value={availability.advance_booking_days}
              onChange={(e) => handleAvailabilityChange('advance_booking_days', parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-gray-500 mt-1">
              How far in advance customers can book
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rental Days
            </label>
            <Input
              type="number"
              min="1"
              max="30"
              value={availability.minimum_rental_days}
              onChange={(e) => handleAvailabilityChange('minimum_rental_days', parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum rental period required
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Rental Days
            </label>
            <Input
              type="number"
              min="1"
              max="365"
              value={availability.maximum_rental_days}
              onChange={(e) => handleAvailabilityChange('maximum_rental_days', parseInt(e.target.value) || 30)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum rental period allowed
            </p>
          </div>
        </div>
      </Card>

      {/* Operating Hours */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Operating Hours
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <Input
              type="time"
              value={availability.available_times.start_time}
              onChange={(e) => handleTimeChange('start_time', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <Input
              type="time"
              value={availability.available_times.end_time}
              onChange={(e) => handleTimeChange('end_time', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Operating Hours:</strong> {availability.available_times.start_time} - {availability.available_times.end_time}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Customers can pick up and drop off vehicles during these hours
          </div>
        </div>
      </Card>

      {/* Blocked Dates */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Blocked Dates
        </h3>

        <div className="mb-4">
          <div className="flex gap-2">
            <Input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex-1"
            />
            <Button onClick={addBlockedDate} disabled={!newBlockedDate}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Add dates when the vehicle is not available for rental
          </p>
        </div>

        {availability.blocked_dates.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Blocked Dates:</h4>
            <div className="flex flex-wrap gap-2">
              {availability.blocked_dates.map(date => (
                <Badge
                  key={date}
                  variant="error"
                  className="flex items-center gap-1"
                >
                  {new Date(date).toLocaleDateString()}
                  <button
                    onClick={() => removeBlockedDate(date)}
                    className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No blocked dates set. Vehicle is available all days within operating hours.
          </div>
        )}
      </Card>

      {/* Cross-Border Configuration */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Cross-Border Rentals
        </h3>

        <div className="mb-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={crossBorderConfig.allowed}
              onChange={(e) => handleCrossBorderChange('allowed', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Allow cross-border rentals
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-7">
            Enable customers to take this vehicle across international borders
          </p>
        </div>

        {crossBorderConfig.allowed && (
          <div className="space-y-6">
            {/* Allowed Countries */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Allowed Countries
              </h4>
              
              <div className="mb-4">
                <div className="flex gap-2">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a country</option>
                    {sadcCountries
                      .filter(country => !crossBorderConfig.countries.includes(country.code))
                      .map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                  </select>
                  <Button onClick={addCountry} disabled={!selectedCountry}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {crossBorderConfig.countries.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {crossBorderConfig.countries.map(countryCode => (
                    <Badge
                      key={countryCode}
                      variant="info"
                      className="flex items-center gap-1"
                    >
                      {getCountryName(countryCode)}
                      <button
                        onClick={() => removeCountry(countryCode)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No countries selected. Add countries where this vehicle can travel.
                </div>
              )}
            </div>

            {/* Surcharge Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cross-Border Surcharge (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={crossBorderConfig.surcharge_percentage}
                onChange={(e) => handleCrossBorderChange('surcharge_percentage', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Additional percentage added to base rate for cross-border rentals
              </p>
            </div>

            {/* Required Documents */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Required Documents
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {documentTypes.map(document => (
                  <label key={document} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={crossBorderConfig.required_documents.includes(document)}
                      onChange={() => toggleDocument(document)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {document.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Insurance Requirements */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">
                Insurance Requirements
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {insuranceTypes.map(insurance => (
                  <label key={insurance} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={crossBorderConfig.insurance_requirements.includes(insurance)}
                      onChange={() => toggleInsurance(insurance)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {insurance.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cross-Border Summary */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Cross-Border Configuration Summary</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div>• Allowed in {crossBorderConfig.countries.length} countries</div>
                <div>• {crossBorderConfig.surcharge_percentage}% surcharge applies</div>
                <div>• {crossBorderConfig.required_documents.length} document types required</div>
                <div>• {crossBorderConfig.insurance_requirements.length} insurance types required</div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};