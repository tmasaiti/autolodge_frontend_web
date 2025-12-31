import React, { useState, useEffect } from 'react';
import { Calculator, Clock, Shield, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { bookingService, PricingCalculationRequest, PricingCalculationResult } from '../../services/bookingService';
import { BookingLocations, CrossBorderDetails, BookingAddOns } from '../../schemas/booking-schemas';
import { Button } from '../ui/Button';

export interface PricingBreakdownProps {
  vehicleId: number;
  startDate: string;
  endDate: string;
  locations: BookingLocations;
  crossBorder?: CrossBorderDetails;
  addOns?: BookingAddOns;
  userCountry?: string;
  onPricingCalculated: (result: PricingCalculationResult) => void;
  className?: string;
}

export const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  vehicleId,
  startDate,
  endDate,
  locations,
  crossBorder,
  addOns,
  userCountry,
  onPricingCalculated,
  className = ''
}) => {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<PricingCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [priceLockTimeLeft, setPriceLockTimeLeft] = useState<number>(0);

  // Calculate pricing when inputs change
  useEffect(() => {
    if (!startDate || !endDate || !vehicleId) return;

    const calculatePricing = async () => {
      setCalculating(true);
      setError(null);

      try {
        const request: PricingCalculationRequest = {
          vehicle_id: vehicleId,
          start_date: startDate,
          end_date: endDate,
          locations,
          cross_border: crossBorder,
          add_ons: addOns,
          user_country: userCountry
        };

        const pricingResult = await bookingService.calculatePricing(request);
        setResult(pricingResult);
        onPricingCalculated(pricingResult);

        // Start price lock countdown
        const lockExpiry = new Date(pricingResult.price_lock_expires_at);
        const now = new Date();
        const timeLeft = Math.max(0, lockExpiry.getTime() - now.getTime());
        setPriceLockTimeLeft(timeLeft);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to calculate pricing';
        setError(errorMessage);
      } finally {
        setCalculating(false);
      }
    };

    const timeoutId = setTimeout(calculatePricing, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [vehicleId, startDate, endDate, locations, crossBorder, addOns, userCountry, onPricingCalculated]);

  // Price lock countdown timer
  useEffect(() => {
    if (priceLockTimeLeft <= 0) return;

    const interval = setInterval(() => {
      setPriceLockTimeLeft(prev => {
        const newTime = prev - 1000;
        return newTime <= 0 ? 0 : newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [priceLockTimeLeft]);

  const formatCurrency = (amount: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTimeLeft = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (calculating) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <Calculator className="h-6 w-6 text-blue-600 animate-pulse" />
          <div>
            <p className="text-blue-800 font-medium">Calculating pricing...</p>
            <p className="text-blue-600 text-sm">Getting the best rates for your dates</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start space-x-3">
          <Calculator className="h-6 w-6 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Pricing calculation failed</p>
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { pricing, breakdown } = result;
  const hasDiscounts = Object.values(pricing.discounts).some(discount => discount && discount > 0);

  return (
    <div className={`bg-white border border-neutral-200 rounded-lg shadow-sm ${className}`}>
      {/* Header with Price Lock */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-primary-600" />
            Pricing Breakdown
          </h3>
          {priceLockTimeLeft > 0 && (
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Price locked: {formatTimeLeft(priceLockTimeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Total Amount */}
        <div className="bg-primary-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-700">Total Amount</p>
              <p className="text-2xl font-bold text-primary-900">
                {formatCurrency(pricing.total_amount, pricing.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-700">For {breakdown.days} days</p>
              <p className="text-sm text-primary-600">
                {formatCurrency(breakdown.daily_rate, pricing.currency)}/day
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Breakdown */}
      <div className="p-6 space-y-4">
        {/* Base Rental */}
        <div className="flex justify-between items-center">
          <span className="text-neutral-700">
            Base rental ({breakdown.days} days × {formatCurrency(breakdown.daily_rate, pricing.currency)})
          </span>
          <span className="font-medium text-neutral-900">
            {formatCurrency(breakdown.base_rental, pricing.currency)}
          </span>
        </div>

        {/* Seasonal Adjustment */}
        {breakdown.seasonal_adjustment > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-neutral-700 flex items-center">
              Peak season adjustment
              <Info className="h-4 w-4 ml-1 text-neutral-400" />
            </span>
            <span className="font-medium text-orange-600">
              +{formatCurrency(breakdown.seasonal_adjustment, pricing.currency)}
            </span>
          </div>
        )}

        {/* Cross-border Surcharge */}
        {breakdown.cross_border_surcharge > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-neutral-700">Cross-border surcharge</span>
            <span className="font-medium text-neutral-900">
              +{formatCurrency(breakdown.cross_border_surcharge, pricing.currency)}
            </span>
          </div>
        )}

        {/* Insurance Premium */}
        {breakdown.insurance_premium > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-neutral-700 flex items-center">
              <Shield className="h-4 w-4 mr-1 text-blue-500" />
              Insurance premium
            </span>
            <span className="font-medium text-neutral-900">
              +{formatCurrency(breakdown.insurance_premium, pricing.currency)}
            </span>
          </div>
        )}

        {/* Add-ons */}
        {breakdown.add_ons_total > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-neutral-700">Add-ons & extras</span>
            <span className="font-medium text-neutral-900">
              +{formatCurrency(breakdown.add_ons_total, pricing.currency)}
            </span>
          </div>
        )}

        {/* Discounts */}
        {hasDiscounts && (
          <div className="space-y-2">
            {pricing.discounts.weekly_discount && pricing.discounts.weekly_discount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-green-700">Weekly discount (7+ days)</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(pricing.discounts.weekly_discount, pricing.currency)}
                </span>
              </div>
            )}
            {pricing.discounts.monthly_discount && pricing.discounts.monthly_discount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-green-700">Monthly discount (30+ days)</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(pricing.discounts.monthly_discount, pricing.currency)}
                </span>
              </div>
            )}
            {pricing.discounts.promotional_discount && pricing.discounts.promotional_discount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-green-700">Promotional discount</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(pricing.discounts.promotional_discount, pricing.currency)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Subtotal */}
        <div className="border-t border-neutral-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-neutral-700">Subtotal</span>
            <span className="font-medium text-neutral-900">
              {formatCurrency(breakdown.total_before_tax, pricing.currency)}
            </span>
          </div>
        </div>

        {/* Taxes */}
        {pricing.taxes.map((tax, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-neutral-700">
              {tax.description || tax.tax_type} ({tax.rate_percent}%)
            </span>
            <span className="font-medium text-neutral-900">
              +{formatCurrency(tax.amount, tax.currency)}
            </span>
          </div>
        ))}

        {/* Platform Fee */}
        <div className="flex justify-between items-center">
          <span className="text-neutral-700">Platform fee</span>
          <span className="font-medium text-neutral-900">
            +{formatCurrency(breakdown.platform_fee, pricing.currency)}
          </span>
        </div>

        {/* Security Deposit */}
        <div className="flex justify-between items-center bg-yellow-50 -mx-6 px-6 py-3 rounded-lg">
          <span className="text-yellow-800 flex items-center">
            <Shield className="h-4 w-4 mr-1" />
            Security deposit (refundable)
          </span>
          <span className="font-medium text-yellow-900">
            +{formatCurrency(pricing.security_deposit, pricing.currency)}
          </span>
        </div>
      </div>

      {/* Detailed Breakdown Toggle */}
      <div className="border-t border-neutral-200">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-4 flex items-center justify-between text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          <span>View detailed breakdown</span>
          {showDetails ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showDetails && (
          <div className="px-6 pb-6 space-y-3 bg-neutral-50">
            <h4 className="font-medium text-neutral-900 mb-3">Additional Details</h4>
            
            {/* Additional Fees Breakdown */}
            {Object.entries(pricing.additional_fees).some(([_, fee]) => fee && fee > 0) && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Additional Fees:</p>
                <div className="space-y-1 text-sm">
                  {Object.entries(pricing.additional_fees).map(([key, fee]) => {
                    if (!fee || fee <= 0) return null;
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-neutral-600 capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span>{formatCurrency(fee, pricing.currency)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Exchange Rate Info */}
            {pricing.exchange_rate && (
              <div className="text-sm">
                <p className="text-neutral-600">
                  Exchange rate: 1 USD = {pricing.exchange_rate} {pricing.currency}
                </p>
                <p className="text-neutral-500 text-xs">
                  Rate locked at: {new Date(pricing.locked_at!).toLocaleString()}
                </p>
              </div>
            )}

            {/* Price Lock Info */}
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-1">Price Protection</p>
              <p className="text-xs text-blue-600">
                This price is guaranteed for the next {formatTimeLeft(priceLockTimeLeft)}. 
                Complete your booking to secure this rate.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};