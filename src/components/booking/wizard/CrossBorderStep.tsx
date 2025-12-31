import React, { useState, useEffect } from 'react';
import { Globe, AlertTriangle, FileText, DollarSign } from 'lucide-react';
import { Button } from '../../ui/Button';
import { WizardStepProps } from '../../wizard/WizardStepWrapper';
import { CrossBorderDetails } from '../../../schemas/booking-schemas';
import { Vehicle } from '../../../types/vehicle';
import { CrossBorderDestinationSelector, CrossBorderDestination } from '../CrossBorderDestinationSelector';
import { CrossBorderPermitHandler, PermitRequirement, CrossBorderPermit } from '../CrossBorderPermitHandler';
import { CrossBorderSurchargeCalculator, SurchargeBreakdown } from '../CrossBorderSurchargeCalculator';
import { SADCCountryCode } from '../../../schemas/common-schemas';

export interface CrossBorderStepData {
  crossBorderRequired: boolean;
  crossBorderDetails?: CrossBorderDetails;
  acknowledgedRequirements: boolean;
  documentsUploaded: boolean;
  selectedCountries: SADCCountryCode[];
  permits: CrossBorderPermit[];
  totalSurcharge: number;
  surchargeBreakdown: SurchargeBreakdown[];
}

export interface CrossBorderStepProps extends WizardStepProps {
  vehicle: Vehicle;
  baseDailyRate: number;
  totalDays: number;
  baseCurrency: string;
  onSkip?: () => void;
}

const SADC_COUNTRIES = [
  { code: 'AO' as SADCCountryCode, name: 'Angola' },
  { code: 'BW' as SADCCountryCode, name: 'Botswana' },
  { code: 'CD' as SADCCountryCode, name: 'Democratic Republic of Congo' },
  { code: 'SZ' as SADCCountryCode, name: 'Eswatini' },
  { code: 'LS' as SADCCountryCode, name: 'Lesotho' },
  { code: 'MG' as SADCCountryCode, name: 'Madagascar' },
  { code: 'MW' as SADCCountryCode, name: 'Malawi' },
  { code: 'MU' as SADCCountryCode, name: 'Mauritius' },
  { code: 'MZ' as SADCCountryCode, name: 'Mozambique' },
  { code: 'NA' as SADCCountryCode, name: 'Namibia' },
  { code: 'SC' as SADCCountryCode, name: 'Seychelles' },
  { code: 'ZA' as SADCCountryCode, name: 'South Africa' },
  { code: 'TZ' as SADCCountryCode, name: 'Tanzania' },
  { code: 'ZM' as SADCCountryCode, name: 'Zambia' },
  { code: 'ZW' as SADCCountryCode, name: 'Zimbabwe' }
];

export const CrossBorderStep: React.FC<CrossBorderStepProps> = ({
  vehicle,
  baseDailyRate,
  totalDays,
  baseCurrency,
  data,
  onDataChange,
  onNext,
  onSkip
}) => {
  const [formData, setFormData] = useState<CrossBorderStepData>({
    crossBorderRequired: data.crossBorderRequired || false,
    crossBorderDetails: data.crossBorderDetails,
    acknowledgedRequirements: data.acknowledgedRequirements || false,
    documentsUploaded: data.documentsUploaded || false,
    selectedCountries: data.selectedCountries || [],
    permits: data.permits || [],
    totalSurcharge: data.totalSurcharge || 0,
    surchargeBreakdown: data.surchargeBreakdown || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock data - in real implementation, this would come from API
  const availableDestinations: CrossBorderDestination[] = SADC_COUNTRIES.map(country => ({
    country_code: country.code,
    country_name: country.name,
    permit_required: ['AO', 'CD', 'MG', 'TZ'].includes(country.code),
    processing_days: country.code === 'CD' ? 5 : 2,
    surcharge_amount: country.code === 'CD' ? 150 : 75,
    insurance_requirements: [
      'Third-party liability coverage',
      'Cross-border insurance extension'
    ],
    border_crossing_points: [
      {
        name: `Main Border - ${country.name}`,
        estimated_crossing_time: '2-4 hours',
        operating_hours: '06:00 - 18:00'
      }
    ],
    restrictions: country.code === 'CD' ? ['Commercial vehicles require additional permits'] : []
  }));

  const permitRequirements: PermitRequirement[] = formData.selectedCountries.map(countryCode => {
    const country = SADC_COUNTRIES.find(c => c.code === countryCode);
    return {
      country_code: countryCode,
      country_name: country?.name || '',
      permit_type: 'temporary_import' as const,
      required_documents: [
        'Valid passport',
        'Driver\'s license',
        'Vehicle registration',
        'Insurance certificate'
      ],
      processing_fee: countryCode === 'CD' ? 100 : 50,
      processing_days: countryCode === 'CD' ? 5 : 2,
      validity_days: 90,
      auto_renewable: false,
      restrictions: countryCode === 'CD' ? ['Commercial vehicles require additional permits'] : []
    };
  });

  const surchargeBreakdown: SurchargeBreakdown[] = formData.selectedCountries.map(countryCode => {
    const country = SADC_COUNTRIES.find(c => c.code === countryCode);
    const destination = availableDestinations.find(d => d.country_code === countryCode);
    const requirement = permitRequirements.find(r => r.country_code === countryCode);
    
    const baseSurcharge = destination?.surcharge_amount || 0;
    const permitFee = requirement?.processing_fee || 0;
    const insuranceSurcharge = 25; // Fixed insurance surcharge
    const processingFee = 15; // Fixed processing fee
    
    return {
      country_code: countryCode,
      country_name: country?.name || '',
      base_surcharge: baseSurcharge,
      permit_fee: permitFee,
      insurance_surcharge: insuranceSurcharge,
      processing_fee: processingFee,
      total_country_surcharge: baseSurcharge + permitFee + insuranceSurcharge + processingFee
    };
  });

  // Update parent data when form changes
  useEffect(() => {
    const updatedData = {
      ...formData,
      surchargeBreakdown,
      crossBorderDetails: formData.crossBorderRequired ? {
        destination_countries: formData.selectedCountries,
        permit_required: formData.selectedCountries.length > 0,
        additional_documents: [
          'Valid passport',
          'Driver\'s license',
          'Vehicle registration',
          'Insurance certificate'
        ],
        surcharge_applied: formData.totalSurcharge,
        insurance_requirements: [
          'Third-party liability coverage',
          'Cross-border insurance extension'
        ],
        estimated_processing_days: Math.max(...permitRequirements.map(r => r.processing_days), 0)
      } : undefined
    };
    
    setFormData(updatedData);
    onDataChange(updatedData);
  }, [formData.crossBorderRequired, formData.selectedCountries, formData.totalSurcharge, onDataChange]);

  const handleCrossBorderToggle = () => {
    setFormData(prev => ({
      ...prev,
      crossBorderRequired: !prev.crossBorderRequired,
      selectedCountries: !prev.crossBorderRequired ? [] : prev.selectedCountries
    }));
  };

  const handleCountrySelectionChange = (countries: SADCCountryCode[]) => {
    setFormData(prev => ({
      ...prev,
      selectedCountries: countries
    }));
  };

  const handleSurchargeCalculated = (totalSurcharge: number, breakdown: SurchargeBreakdown[]) => {
    setFormData(prev => ({
      ...prev,
      totalSurcharge,
      surchargeBreakdown: breakdown
    }));
  };

  const handlePermitStatusChange = (permits: CrossBorderPermit[]) => {
    setFormData(prev => ({
      ...prev,
      permits
    }));
  };

  const handleAcknowledgeRequirements = () => {
    setFormData(prev => ({
      ...prev,
      acknowledgedRequirements: !prev.acknowledgedRequirements
    }));
  };

  // Mock functions for permit handling
  const handleDocumentUpload = async (file: File, permitId: string): Promise<string> => {
    // Mock upload - in real implementation, upload to S3 or similar
    return Promise.resolve(`https://example.com/documents/${permitId}/${file.name}`);
  };

  const handlePermitApplication = async (requirement: PermitRequirement): Promise<CrossBorderPermit> => {
    // Mock application - in real implementation, call API
    return Promise.resolve({
      id: Math.floor(Math.random() * 1000),
      from_country: 'ZA' as SADCCountryCode,
      to_country: requirement.country_code,
      status: 'pending' as const,
      fees_paid: requirement.processing_fee,
      currency: baseCurrency,
      requirements_met: false,
      processing_notes: 'Application submitted successfully. Processing will begin within 24 hours.'
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.crossBorderRequired) {
      if (formData.selectedCountries.length === 0) {
        newErrors.countries = 'Please select at least one destination country';
      }

      if (!formData.acknowledgedRequirements) {
        newErrors.acknowledgment = 'Please acknowledge the cross-border requirements';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext?.();
    }
  };

  const handleSkip = () => {
    setFormData(prev => ({ 
      ...prev, 
      crossBorderRequired: false,
      selectedCountries: [],
      totalSurcharge: 0,
      surchargeBreakdown: []
    }));
    onSkip?.();
  };

  // Check if vehicle supports cross-border travel
  const vehicleSupportsCrossBorder = vehicle.cross_border_config?.allowed || false;

  if (!vehicleSupportsCrossBorder) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Cross-Border Travel Not Available
        </h2>
        <p className="text-neutral-600 mb-8">
          This vehicle is not configured for cross-border travel within the SADC region.
        </p>
        <Button onClick={handleSkip} variant="primary" className="px-8 py-3">
          Continue Without Cross-Border Travel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Cross-Border Toggle */}
      <section className="bg-primary-50 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Globe className="h-6 w-6 text-primary-600 mt-1" aria-hidden="true" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Cross-Border Travel
            </h2>
            <p className="text-neutral-600 mb-4">
              Do you plan to travel to other SADC countries during your rental period?
            </p>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="crossBorder"
                checked={formData.crossBorderRequired}
                onChange={handleCrossBorderToggle}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                aria-describedby="cross-border-description"
              />
              <label htmlFor="crossBorder" className="text-sm text-neutral-700">
                <span id="cross-border-description">
                  Yes, I need cross-border travel capability
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {formData.crossBorderRequired && (
        <>
          {/* Country Selection */}
          <CrossBorderDestinationSelector
            availableDestinations={availableDestinations}
            selectedCountries={formData.selectedCountries}
            onSelectionChange={handleCountrySelectionChange}
            baseCurrency={baseCurrency}
            onSurchargeCalculated={(amount) => {}} // Handled by surcharge calculator
          />

          {errors.countries && (
            <div className="text-sm text-red-600" role="alert">
              {errors.countries}
            </div>
          )}

          {/* Surcharge Calculator */}
          {formData.selectedCountries.length > 0 && (
            <CrossBorderSurchargeCalculator
              selectedCountries={formData.selectedCountries}
              baseDailyRate={baseDailyRate}
              totalDays={totalDays}
              baseCurrency={baseCurrency}
              surchargeBreakdown={surchargeBreakdown}
              onSurchargeCalculated={handleSurchargeCalculated}
            />
          )}

          {/* Permit Handler */}
          {formData.selectedCountries.length > 0 && (
            <CrossBorderPermitHandler
              destinationCountries={formData.selectedCountries}
              originCountry={'ZA' as SADCCountryCode} // Mock origin country
              permitRequirements={permitRequirements}
              existingPermits={formData.permits}
              onPermitStatusChange={handlePermitStatusChange}
              onDocumentUpload={handleDocumentUpload}
              onPermitApplication={handlePermitApplication}
            />
          )}

          {/* Acknowledgment */}
          {formData.selectedCountries.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="acknowledge"
                  checked={formData.acknowledgedRequirements}
                  onChange={handleAcknowledgeRequirements}
                  className="mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  aria-describedby="acknowledge-description"
                />
                <label htmlFor="acknowledge" className="text-sm text-neutral-700">
                  <span id="acknowledge-description">
                    I understand and acknowledge the cross-border travel requirements, 
                    additional fees, and processing times. I confirm that I have or will 
                    obtain all necessary documentation for international travel.
                  </span>
                </label>
              </div>
              
              {errors.acknowledgment && (
                <div className="text-sm text-red-600" role="alert">
                  {errors.acknowledgment}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handleSkip} className="px-6 py-3">
              Skip Cross-Border Setup
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              disabled={!formData.acknowledgedRequirements || formData.selectedCountries.length === 0}
              className="px-8 py-3"
            >
              Continue with Cross-Border Travel
            </Button>
          </div>
        </>
      )}

      {!formData.crossBorderRequired && (
        <div className="text-center py-12">
          <p className="text-neutral-600 mb-8 text-lg">
            You can continue without cross-border travel capability, or enable it above if needed.
          </p>
          <Button variant="primary" onClick={handleSubmit} className="px-8 py-3">
            Continue Without Cross-Border Travel
          </Button>
        </div>
      )}
    </div>
  );
};