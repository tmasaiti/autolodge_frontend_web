import React, { useState, useEffect } from 'react';
import { Shield, Check, AlertCircle, Info } from 'lucide-react';
import { Button } from '../../ui/Button';
import { WizardStepProps } from '../../wizard/WizardStepWrapper';

export interface InsuranceProduct {
  id: number;
  name: string;
  coverage_type: 'basic' | 'comprehensive' | 'third_party' | 'collision' | 'theft';
  description: string;
  coverage_limits: {
    liability_limit: number;
    collision_deductible: number;
    comprehensive_deductible: number;
    personal_injury: number;
  };
  premium_amount: number;
  currency: string;
  features: string[];
  recommended?: boolean;
}

export interface InsuranceStepData {
  selectedInsuranceId?: number;
  selectedInsurance?: InsuranceProduct;
  skipInsurance: boolean;
  acknowledgedRisks: boolean;
}

export interface InsuranceStepProps extends WizardStepProps {
  booking: any; // BookingData from previous steps
}

// Mock insurance products - in real app, these would come from API
const INSURANCE_PRODUCTS: InsuranceProduct[] = [
  {
    id: 1,
    name: 'Basic Protection',
    coverage_type: 'basic',
    description: 'Essential coverage for peace of mind',
    coverage_limits: {
      liability_limit: 100000,
      collision_deductible: 1000,
      comprehensive_deductible: 500,
      personal_injury: 50000
    },
    premium_amount: 15,
    currency: 'USD',
    features: [
      'Third-party liability coverage',
      'Basic collision protection',
      'Theft protection',
      '24/7 roadside assistance'
    ]
  },
  {
    id: 2,
    name: 'Comprehensive Coverage',
    coverage_type: 'comprehensive',
    description: 'Complete protection with minimal deductibles',
    coverage_limits: {
      liability_limit: 250000,
      collision_deductible: 250,
      comprehensive_deductible: 100,
      personal_injury: 100000
    },
    premium_amount: 35,
    currency: 'USD',
    features: [
      'Full liability coverage',
      'Low deductible collision',
      'Comprehensive theft & damage',
      'Personal injury protection',
      'Emergency medical coverage',
      'Rental car replacement',
      '24/7 premium roadside assistance'
    ],
    recommended: true
  },
  {
    id: 3,
    name: 'Premium Plus',
    coverage_type: 'comprehensive',
    description: 'Maximum protection with zero deductible',
    coverage_limits: {
      liability_limit: 500000,
      collision_deductible: 0,
      comprehensive_deductible: 0,
      personal_injury: 200000
    },
    premium_amount: 55,
    currency: 'USD',
    features: [
      'Maximum liability coverage',
      'Zero deductible protection',
      'Full comprehensive coverage',
      'Enhanced personal injury',
      'International coverage extension',
      'Concierge roadside service',
      'Trip interruption coverage',
      'Personal effects protection'
    ]
  }
];

export const InsuranceStep: React.FC<InsuranceStepProps> = ({
  booking,
  data,
  onDataChange,
  onNext
}) => {
  const [formData, setFormData] = useState<InsuranceStepData>({
    selectedInsuranceId: data.selectedInsuranceId,
    selectedInsurance: data.selectedInsurance,
    skipInsurance: data.skipInsurance || false,
    acknowledgedRisks: data.acknowledgedRisks || false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update parent data when form changes
  useEffect(() => {
    const selectedProduct = INSURANCE_PRODUCTS.find(p => p.id === formData.selectedInsuranceId);
    const updatedData = {
      ...formData,
      selectedInsurance: selectedProduct
    };
    
    setFormData(updatedData);
    onDataChange(updatedData);
  }, [formData.selectedInsuranceId, formData.skipInsurance, formData.acknowledgedRisks, onDataChange]);

  const handleInsuranceSelect = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedInsuranceId: productId,
      skipInsurance: false
    }));
  };

  const handleSkipInsurance = () => {
    setFormData(prev => ({
      ...prev,
      selectedInsuranceId: undefined,
      selectedInsurance: undefined,
      skipInsurance: true
    }));
  };

  const handleAcknowledgeRisks = () => {
    setFormData(prev => ({
      ...prev,
      acknowledgedRisks: !prev.acknowledgedRisks
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.skipInsurance && !formData.acknowledgedRisks) {
      newErrors.acknowledgment = 'Please acknowledge the risks of proceeding without insurance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onNext?.();
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="text-center">
        <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
          Protect Your Journey
        </h2>
        <p className="text-neutral-600">
          Choose insurance coverage that gives you peace of mind during your rental.
        </p>
      </header>

      {/* Insurance Products */}
      <fieldset className="space-y-6">
        <legend className="text-xl font-semibold text-neutral-900 mb-6">
          Select Insurance Coverage
        </legend>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INSURANCE_PRODUCTS.map(product => (
            <label
              key={product.id}
              className={`
                relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-md
                ${formData.selectedInsuranceId === product.id
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }
                ${product.recommended ? 'ring-2 ring-primary-200' : ''}
              `}
            >
              <input
                type="radio"
                name="insuranceProduct"
                value={product.id}
                checked={formData.selectedInsuranceId === product.id}
                onChange={() => handleInsuranceSelect(product.id)}
                className="sr-only"
                aria-describedby={`insurance-${product.id}-description insurance-${product.id}-features insurance-${product.id}-coverage`}
              />
              {product.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Recommended
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {product.name}
                </h3>
                <p id={`insurance-${product.id}-description`} className="text-sm text-neutral-600 mb-4">
                  {product.description}
                </p>
                <div className="text-3xl font-bold text-neutral-900">
                  {formatCurrency(product.premium_amount, product.currency)}
                  <span className="text-sm font-normal text-neutral-500">/day</span>
                </div>
              </div>

              <div id={`insurance-${product.id}-features`} className="space-y-3">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Coverage Details */}
              <div id={`insurance-${product.id}-coverage`} className="mt-4 pt-4 border-t border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-900 mb-2">Coverage Limits</h4>
                <div className="space-y-1 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>Liability:</span>
                    <span>{formatCurrency(product.coverage_limits.liability_limit, product.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collision Deductible:</span>
                    <span>{formatCurrency(product.coverage_limits.collision_deductible, product.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Personal Injury:</span>
                    <span>{formatCurrency(product.coverage_limits.personal_injury, product.currency)}</span>
                  </div>
                </div>
              </div>

              {formData.selectedInsuranceId === product.id && (
                <div className="absolute top-4 right-4" aria-hidden="true">
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Skip Insurance Option */}
      <section className="border-t border-neutral-200 pt-8">
        <div className="bg-yellow-50 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 mb-2">
                Decline Insurance Coverage
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                You can proceed without additional insurance, but you'll be responsible 
                for any damages, theft, or liability claims during your rental period.
              </p>
              
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="skipInsurance"
                  checked={formData.skipInsurance}
                  onChange={handleSkipInsurance}
                  className="mt-1 rounded border-neutral-300 text-yellow-600 focus:ring-yellow-500"
                  aria-describedby="skip-insurance-description"
                />
                <label htmlFor="skipInsurance" className="text-sm text-yellow-800">
                  <span id="skip-insurance-description">
                    I understand the risks and want to proceed without additional insurance coverage
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {formData.skipInsurance && (
          <div className="mt-6">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="acknowledgeRisks"
                checked={formData.acknowledgedRisks}
                onChange={handleAcknowledgeRisks}
                className="mt-1 rounded border-neutral-300 text-red-600 focus:ring-red-500"
                aria-describedby="acknowledge-risks-description"
              />
              <label htmlFor="acknowledgeRisks" className="text-sm text-neutral-700">
                <span id="acknowledge-risks-description">
                  I acknowledge that I will be fully responsible for any damages, theft, 
                  accidents, or liability claims that may occur during the rental period. 
                  I understand that this may result in significant financial liability.
                </span>
              </label>
            </div>
            
            {errors.acknowledgment && (
              <div className="mt-2 text-sm text-red-600" role="alert">
                {errors.acknowledgment}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Information Box */}
      <aside className="bg-primary-50 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-primary-600 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-medium text-primary-800 mb-1">Good to Know</h3>
            <ul className="text-sm text-primary-700 space-y-1">
              <li>• Insurance coverage is valid across all SADC countries</li>
              <li>• Claims can be filed 24/7 through our mobile app</li>
              <li>• Coverage begins immediately upon vehicle pickup</li>
              <li>• You can upgrade your coverage anytime during the rental</li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Continue Button */}
      <div className="flex justify-end pt-6">
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={formData.skipInsurance && !formData.acknowledgedRisks}
          className="px-8 py-3"
        >
          {formData.selectedInsuranceId 
            ? `Continue with ${INSURANCE_PRODUCTS.find(p => p.id === formData.selectedInsuranceId)?.name}`
            : 'Continue Without Insurance'
          }
        </Button>
      </div>
    </div>
  );
};