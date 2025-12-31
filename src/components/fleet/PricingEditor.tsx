import React, { useState } from 'react';
import { CurrencyCode } from '@autolodge/shared';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Shield,
  Calculator,
  AlertCircle
} from 'lucide-react';

interface PricingData {
  base_daily_rate: number;
  currency: CurrencyCode;
  seasonal_adjustments: {
    peak_multiplier: number;
    off_peak_multiplier: number;
  };
  distance_pricing: {
    included_km_per_day: number;
    excess_km_rate: number;
  };
  cross_border_surcharge: number;
  security_deposit: number;
}

interface PricingEditorProps {
  pricing: PricingData;
  onChange: (pricing: PricingData) => void;
  error?: string;
}

export const PricingEditor: React.FC<PricingEditorProps> = ({
  pricing,
  onChange,
  error
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (field: keyof PricingData, value: any) => {
    onChange({ ...pricing, [field]: value });
  };

  const handleNestedChange = (
    parent: keyof PricingData,
    field: string,
    value: any
  ) => {
    onChange({
      ...pricing,
      [parent]: {
        ...(pricing[parent] as any),
        [field]: value
      }
    });
  };

  // Currency options for SADC region
  const currencies: { code: CurrencyCode; name: string; symbol: string }[] = [
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
    { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$' },
    { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'L' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'LSL', name: 'Lesotho Loti', symbol: 'L' }
  ];

  // Calculate pricing examples
  const calculateExamples = () => {
    const baseRate = pricing.base_daily_rate;
    const peakRate = baseRate * pricing.seasonal_adjustments.peak_multiplier;
    const offPeakRate = baseRate * pricing.seasonal_adjustments.off_peak_multiplier;
    
    return {
      regular: baseRate,
      peak: peakRate,
      offPeak: offPeakRate,
      weekly: baseRate * 7 * 0.9, // 10% weekly discount
      monthly: baseRate * 30 * 0.8 // 20% monthly discount
    };
  };

  const examples = calculateExamples();

  return (
    <div className="space-y-6">
      {/* Base Pricing */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Base Pricing
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Rate *
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={pricing.base_daily_rate}
              onChange={(e) => handleChange('base_daily_rate', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Base rate per day before adjustments
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency *
            </label>
            <select
              value={pricing.currency}
              onChange={(e) => handleChange('currency', e.target.value as CurrencyCode)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Primary currency for pricing
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Deposit
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={pricing.security_deposit}
              onChange={(e) => handleChange('security_deposit', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Refundable security deposit amount
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cross-Border Surcharge
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={pricing.cross_border_surcharge}
              onChange={(e) => handleChange('cross_border_surcharge', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Additional fee for cross-border rentals
            </p>
          </div>
        </div>
      </Card>

      {/* Seasonal Adjustments */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Seasonal Adjustments
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peak Season Multiplier
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="3"
                step="0.1"
                value={pricing.seasonal_adjustments.peak_multiplier}
                onChange={(e) => handleNestedChange('seasonal_adjustments', 'peak_multiplier', parseFloat(e.target.value) || 1)}
              />
              <span className="text-sm text-gray-500">×</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Multiply base rate during peak season (e.g., 1.3 = 30% increase)
            </p>
            <div className="mt-2 p-2 bg-green-50 rounded text-sm">
              Peak rate: <CurrencyDisplay 
                amount={examples.peak} 
                currency={pricing.currency} 
                size="sm" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Off-Peak Multiplier
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0.5"
                max="1"
                step="0.1"
                value={pricing.seasonal_adjustments.off_peak_multiplier}
                onChange={(e) => handleNestedChange('seasonal_adjustments', 'off_peak_multiplier', parseFloat(e.target.value) || 1)}
              />
              <span className="text-sm text-gray-500">×</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Multiply base rate during off-peak season (e.g., 0.8 = 20% discount)
            </p>
            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
              Off-peak rate: <CurrencyDisplay 
                amount={examples.offPeak} 
                currency={pricing.currency} 
                size="sm" 
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Distance Pricing */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Distance Pricing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Included KM per Day
            </label>
            <Input
              type="number"
              min="0"
              value={pricing.distance_pricing.included_km_per_day}
              onChange={(e) => handleNestedChange('distance_pricing', 'included_km_per_day', parseInt(e.target.value) || 0)}
              placeholder="200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Kilometers included in daily rate
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excess KM Rate
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={pricing.distance_pricing.excess_km_rate}
              onChange={(e) => handleNestedChange('distance_pricing', 'excess_km_rate', parseFloat(e.target.value) || 0)}
              placeholder="3.50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Rate per kilometer over the included amount
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Distance Pricing Example</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Daily allowance: {pricing.distance_pricing.included_km_per_day} km</div>
            <div>• Excess rate: <CurrencyDisplay 
              amount={pricing.distance_pricing.excess_km_rate} 
              currency={pricing.currency} 
              size="sm" 
            /> per km</div>
            <div>• If customer drives 300 km in one day:</div>
            <div className="ml-4">
              - Included: {pricing.distance_pricing.included_km_per_day} km (free)
            </div>
            <div className="ml-4">
              - Excess: {300 - pricing.distance_pricing.included_km_per_day} km × <CurrencyDisplay 
                amount={pricing.distance_pricing.excess_km_rate} 
                currency={pricing.currency} 
                size="sm" 
              /> = <CurrencyDisplay 
                amount={(300 - pricing.distance_pricing.included_km_per_day) * pricing.distance_pricing.excess_km_rate} 
                currency={pricing.currency} 
                size="sm" 
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Pricing Preview */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Pricing Preview
          </h3>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>

        {showPreview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Regular Rate</div>
              <div className="text-lg font-semibold">
                <CurrencyDisplay 
                  amount={examples.regular} 
                  currency={pricing.currency} 
                />
              </div>
              <div className="text-xs text-gray-500">per day</div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Peak Season
              </div>
              <div className="text-lg font-semibold text-green-800">
                <CurrencyDisplay 
                  amount={examples.peak} 
                  currency={pricing.currency} 
                />
              </div>
              <div className="text-xs text-green-600">
                +{Math.round((pricing.seasonal_adjustments.peak_multiplier - 1) * 100)}%
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700 mb-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Off-Peak
              </div>
              <div className="text-lg font-semibold text-blue-800">
                <CurrencyDisplay 
                  amount={examples.offPeak} 
                  currency={pricing.currency} 
                />
              </div>
              <div className="text-xs text-blue-600">
                {Math.round((pricing.seasonal_adjustments.off_peak_multiplier - 1) * 100)}%
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-700 mb-1">Weekly Rate</div>
              <div className="text-lg font-semibold text-purple-800">
                <CurrencyDisplay 
                  amount={examples.weekly} 
                  currency={pricing.currency} 
                />
              </div>
              <div className="text-xs text-purple-600">7 days (10% discount)</div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-700 mb-1">Monthly Rate</div>
              <div className="text-lg font-semibold text-orange-800">
                <CurrencyDisplay 
                  amount={examples.monthly} 
                  currency={pricing.currency} 
                />
              </div>
              <div className="text-xs text-orange-600">30 days (20% discount)</div>
            </div>

            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-700 mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Security Deposit
              </div>
              <div className="text-lg font-semibold text-gray-800">
                <CurrencyDisplay 
                  amount={pricing.security_deposit} 
                  currency={pricing.currency} 
                />
              </div>
              <div className="text-xs text-gray-600">Refundable</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};