import React, { useState, useEffect } from 'react';
import { Globe, MapPin, AlertTriangle, Info, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SADCCountryCode } from '../../schemas/common-schemas';

export interface CrossBorderDestination {
  country_code: SADCCountryCode;
  country_name: string;
  permit_required: boolean;
  processing_days: number;
  surcharge_amount: number;
  insurance_requirements: string[];
  border_crossing_points: {
    name: string;
    estimated_crossing_time: string;
    operating_hours: string;
  }[];
  restrictions?: string[];
}

export interface CrossBorderDestinationSelectorProps {
  availableDestinations: CrossBorderDestination[];
  selectedCountries: SADCCountryCode[];
  onSelectionChange: (countries: SADCCountryCode[]) => void;
  baseCurrency: string;
  onSurchargeCalculated: (amount: number) => void;
  disabled?: boolean;
}

const SADC_COUNTRIES: Record<SADCCountryCode, string> = {
  'AO': 'Angola',
  'BW': 'Botswana',
  'CD': 'Democratic Republic of Congo',
  'SZ': 'Eswatini',
  'LS': 'Lesotho',
  'MG': 'Madagascar',
  'MW': 'Malawi',
  'MU': 'Mauritius',
  'MZ': 'Mozambique',
  'NA': 'Namibia',
  'SC': 'Seychelles',
  'ZA': 'South Africa',
  'TZ': 'Tanzania',
  'ZM': 'Zambia',
  'ZW': 'Zimbabwe'
};

export const CrossBorderDestinationSelector: React.FC<CrossBorderDestinationSelectorProps> = ({
  availableDestinations,
  selectedCountries,
  onSelectionChange,
  baseCurrency,
  onSurchargeCalculated,
  disabled = false
}) => {
  const [expandedCountry, setExpandedCountry] = useState<SADCCountryCode | null>(null);

  // Calculate total surcharge when selection changes
  useEffect(() => {
    const totalSurcharge = selectedCountries.reduce((total, countryCode) => {
      const destination = availableDestinations.find(d => d.country_code === countryCode);
      return total + (destination?.surcharge_amount || 0);
    }, 0);
    
    onSurchargeCalculated(totalSurcharge);
  }, [selectedCountries, availableDestinations, onSurchargeCalculated]);

  const handleCountryToggle = (countryCode: SADCCountryCode) => {
    if (disabled) return;
    
    const newSelection = selectedCountries.includes(countryCode)
      ? selectedCountries.filter(c => c !== countryCode)
      : [...selectedCountries, countryCode];
    
    onSelectionChange(newSelection);
  };

  const toggleCountryDetails = (countryCode: SADCCountryCode) => {
    setExpandedCountry(expandedCountry === countryCode ? null : countryCode);
  };

  const getMaxProcessingDays = () => {
    return Math.max(
      ...selectedCountries.map(code => {
        const destination = availableDestinations.find(d => d.country_code === code);
        return destination?.processing_days || 0;
      }),
      0
    );
  };

  const getTotalSurcharge = () => {
    return selectedCountries.reduce((total, countryCode) => {
      const destination = availableDestinations.find(d => d.country_code === countryCode);
      return total + (destination?.surcharge_amount || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Globe className="h-6 w-6 text-primary-600" aria-hidden="true" />
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            Select Destination Countries
          </h3>
          <p className="text-sm text-neutral-600">
            Choose all SADC countries you plan to visit during your rental period
          </p>
        </div>
      </div>

      {/* Country Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableDestinations.map(destination => {
          const isSelected = selectedCountries.includes(destination.country_code);
          const isExpanded = expandedCountry === destination.country_code;
          
          return (
            <Card
              key={destination.country_code}
              className={`
                transition-all duration-200 cursor-pointer
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="p-4">
                {/* Country Header */}
                <div 
                  className="flex items-center justify-between"
                  onClick={() => handleCountryToggle(destination.country_code)}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCountryToggle(destination.country_code)}
                      disabled={disabled}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      aria-describedby={`country-${destination.country_code}-details`}
                    />
                    <div>
                      <h4 className="font-medium text-neutral-900">
                        {destination.country_name}
                      </h4>
                      <p className="text-sm text-neutral-600">
                        {destination.permit_required ? 'Permit required' : 'No permit required'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {destination.surcharge_amount > 0 && (
                      <span className="text-sm font-medium text-neutral-700">
                        +{destination.surcharge_amount} {baseCurrency}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCountryDetails(destination.country_code);
                      }}
                      className="p-1"
                      aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${destination.country_name}`}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div 
                    id={`country-${destination.country_code}-details`}
                    className="mt-4 pt-4 border-t border-neutral-200 space-y-3"
                  >
                    {/* Processing Time */}
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-neutral-500" />
                      <span className="text-neutral-600">
                        Processing time: {destination.processing_days} business days
                      </span>
                    </div>

                    {/* Insurance Requirements */}
                    {destination.insurance_requirements.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-neutral-900 mb-2">
                          Insurance Requirements:
                        </h5>
                        <ul className="text-sm text-neutral-600 space-y-1">
                          {destination.insurance_requirements.map((req, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Border Crossing Points */}
                    {destination.border_crossing_points.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-neutral-900 mb-2">
                          Border Crossing Points:
                        </h5>
                        <div className="space-y-2">
                          {destination.border_crossing_points.map((point, index) => (
                            <div key={index} className="text-sm text-neutral-600">
                              <div className="font-medium">{point.name}</div>
                              <div className="text-xs">
                                Crossing time: {point.estimated_crossing_time} | 
                                Hours: {point.operating_hours}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Restrictions */}
                    {destination.restrictions && destination.restrictions.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h5 className="text-sm font-medium text-yellow-800 mb-1">
                              Restrictions:
                            </h5>
                            <ul className="text-sm text-yellow-700 space-y-1">
                              {destination.restrictions.map((restriction, index) => (
                                <li key={index}>• {restriction}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedCountries.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">
                  Cross-Border Travel Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Selected Countries:</span>
                    <div className="font-medium text-blue-900">
                      {selectedCountries.length} destination{selectedCountries.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700">Total Surcharge:</span>
                    <div className="font-medium text-blue-900">
                      {getTotalSurcharge()} {baseCurrency}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700">Max Processing Time:</span>
                    <div className="font-medium text-blue-900">
                      {getMaxProcessingDays()} business days
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};