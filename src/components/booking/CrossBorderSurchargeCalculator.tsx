import React, { useState, useEffect } from 'react';
import { DollarSign, Calculator, Info, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SADCCountryCode } from '../../schemas/common-schemas';

export interface SurchargeBreakdown {
  country_code: SADCCountryCode;
  country_name: string;
  base_surcharge: number;
  permit_fee: number;
  insurance_surcharge: number;
  processing_fee: number;
  total_country_surcharge: number;
}

export interface CrossBorderSurchargeCalculatorProps {
  selectedCountries: SADCCountryCode[];
  baseDailyRate: number;
  totalDays: number;
  baseCurrency: string;
  exchangeRate?: number;
  displayCurrency?: string;
  surchargeBreakdown: SurchargeBreakdown[];
  onSurchargeCalculated: (totalSurcharge: number, breakdown: SurchargeBreakdown[]) => void;
  showDetailedBreakdown?: boolean;
}

const COUNTRY_NAMES: Record<SADCCountryCode, string> = {
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

export const CrossBorderSurchargeCalculator: React.FC<CrossBorderSurchargeCalculatorProps> = ({
  selectedCountries,
  baseDailyRate,
  totalDays,
  baseCurrency,
  exchangeRate = 1,
  displayCurrency,
  surchargeBreakdown,
  onSurchargeCalculated,
  showDetailedBreakdown = true
}) => {
  const [expandedBreakdown, setExpandedBreakdown] = useState(false);

  // Calculate total surcharge
  const calculateTotalSurcharge = (): number => {
    return surchargeBreakdown.reduce((total, breakdown) => {
      return total + breakdown.total_country_surcharge;
    }, 0);
  };

  // Format currency amount
  const formatCurrency = (amount: number, currency?: string): string => {
    const currencyCode = currency || baseCurrency;
    const convertedAmount = currency === displayCurrency && exchangeRate !== 1 
      ? amount * exchangeRate 
      : amount;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(convertedAmount);
  };

  // Calculate percentage of base rental cost
  const calculateSurchargePercentage = (): number => {
    const baseRentalCost = baseDailyRate * totalDays;
    const totalSurcharge = calculateTotalSurcharge();
    
    if (baseRentalCost === 0) return 0;
    return (totalSurcharge / baseRentalCost) * 100;
  };

  // Update parent component when calculation changes
  useEffect(() => {
    const totalSurcharge = calculateTotalSurcharge();
    onSurchargeCalculated(totalSurcharge, surchargeBreakdown);
  }, [surchargeBreakdown, onSurchargeCalculated]);

  const totalSurcharge = calculateTotalSurcharge();
  const surchargePercentage = calculateSurchargePercentage();
  const baseRentalCost = baseDailyRate * totalDays;

  if (selectedCountries.length === 0 || totalSurcharge === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <div className="p-4 flex items-center space-x-3">
          <DollarSign className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="font-medium text-green-900">No Additional Charges</h4>
            <p className="text-sm text-green-700">
              No cross-border surcharges apply to your selected destinations.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Surcharge Display */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Calculator className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Cross-Border Surcharge
                </h3>
                <p className="text-sm text-blue-700">
                  Additional fees for {selectedCountries.length} destination{selectedCountries.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(totalSurcharge, displayCurrency)}
              </div>
              <div className="text-sm text-blue-700">
                {surchargePercentage.toFixed(1)}% of base rental
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3">
              <span className="text-blue-700">Base Rental:</span>
              <div className="font-medium text-blue-900">
                {formatCurrency(baseRentalCost, displayCurrency)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="text-blue-700">Cross-Border Fees:</span>
              <div className="font-medium text-blue-900">
                {formatCurrency(totalSurcharge, displayCurrency)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="text-blue-700">New Total:</span>
              <div className="font-medium text-blue-900">
                {formatCurrency(baseRentalCost + totalSurcharge, displayCurrency)}
              </div>
            </div>
          </div>

          {/* Toggle Detailed Breakdown */}
          {showDetailedBreakdown && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedBreakdown(!expandedBreakdown)}
                className="text-blue-700 hover:text-blue-900"
              >
                {expandedBreakdown ? 'Hide' : 'Show'} Detailed Breakdown
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Detailed Breakdown */}
      {expandedBreakdown && showDetailedBreakdown && (
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Surcharge Breakdown by Country
            </h4>
            
            <div className="space-y-4">
              {surchargeBreakdown.map(breakdown => (
                <div key={breakdown.country_code} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-neutral-900">
                      {breakdown.country_name}
                    </h5>
                    <div className="text-lg font-semibold text-neutral-900">
                      {formatCurrency(breakdown.total_country_surcharge, displayCurrency)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-neutral-600">Base Surcharge:</span>
                      <div className="font-medium">
                        {formatCurrency(breakdown.base_surcharge, displayCurrency)}
                      </div>
                    </div>
                    <div>
                      <span className="text-neutral-600">Permit Fee:</span>
                      <div className="font-medium">
                        {formatCurrency(breakdown.permit_fee, displayCurrency)}
                      </div>
                    </div>
                    <div>
                      <span className="text-neutral-600">Insurance:</span>
                      <div className="font-medium">
                        {formatCurrency(breakdown.insurance_surcharge, displayCurrency)}
                      </div>
                    </div>
                    <div>
                      <span className="text-neutral-600">Processing:</span>
                      <div className="font-medium">
                        {formatCurrency(breakdown.processing_fee, displayCurrency)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Exchange Rate Notice */}
            {displayCurrency && displayCurrency !== baseCurrency && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-yellow-800 font-medium">Currency Conversion Notice</p>
                    <p className="text-yellow-700">
                      Amounts shown in {displayCurrency} are converted from {baseCurrency} at 
                      an exchange rate of {exchangeRate.toFixed(4)}. Final charges will be 
                      processed in {baseCurrency}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fee Explanation */}
            <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
              <h5 className="font-medium text-neutral-900 mb-2">What's Included in Cross-Border Fees:</h5>
              <ul className="text-sm text-neutral-700 space-y-1">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Administrative processing for cross-border documentation
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Government permit and customs fees
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Additional insurance coverage for international travel
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  24/7 cross-border support and assistance
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Important Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium text-amber-800 mb-1">Important Notice</h4>
              <p className="text-amber-700">
                Cross-border surcharges are non-refundable once permits are processed. 
                Please ensure your travel plans are confirmed before proceeding. 
                Additional fees may apply at border crossings depending on local regulations.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};