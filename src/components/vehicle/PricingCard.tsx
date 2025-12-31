import React, { useState } from 'react';
import { VehiclePricing } from '../../types/vehicle';
import { CurrencyCode } from '@autolodge/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { 
  DollarSign, 
  Calendar, 
  MapPin, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Shield
} from 'lucide-react';

interface PricingCardProps {
  pricing: VehiclePricing;
}

export const PricingCard: React.FC<PricingCardProps> = ({ pricing }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Calculate seasonal pricing examples
  const peakPrice = pricing.base_daily_rate * pricing.seasonal_adjustments.peak_multiplier;
  const offPeakPrice = pricing.base_daily_rate * pricing.seasonal_adjustments.off_peak_multiplier;

  const toggleBreakdown = () => {
    setShowBreakdown(!showBreakdown);
  };

  return (
    <Card className="sticky top-6">
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Pricing
        </Card.Title>
      </Card.Header>
      
      <Card.Content>
        <div className="space-y-4">
          {/* Base Daily Rate */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              <CurrencyDisplay
                amount={pricing.base_daily_rate}
                currency={pricing.currency as CurrencyCode}
                size="lg"
              />
            </div>
            <p className="text-sm text-gray-600">per day</p>
          </div>

          {/* Seasonal Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Peak</span>
              </div>
              <div className="font-semibold text-orange-900">
                <CurrencyDisplay
                  amount={peakPrice}
                  currency={pricing.currency as CurrencyCode}
                  size="sm"
                />
              </div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Off-Peak</span>
              </div>
              <div className="font-semibold text-green-900">
                <CurrencyDisplay
                  amount={offPeakPrice}
                  currency={pricing.currency as CurrencyCode}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Distance Pricing */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Distance Included</span>
            </div>
            <p className="text-sm text-blue-800">
              {pricing.distance_pricing.included_km_per_day} km/day included
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Extra: <CurrencyDisplay
                amount={pricing.distance_pricing.excess_km_rate}
                currency={pricing.currency as CurrencyCode}
                size="sm"
              /> per km
            </p>
          </div>

          {/* Security Deposit */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Security Deposit</span>
            </div>
            <div className="font-semibold text-gray-900">
              <CurrencyDisplay
                amount={pricing.security_deposit}
                currency={pricing.currency as CurrencyCode}
                size="sm"
              />
            </div>
          </div>

          {/* Cross-Border Surcharge */}
          {pricing.cross_border_surcharge > 0 && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Cross-Border Travel</span>
              </div>
              <p className="text-sm text-yellow-800">
                Additional <CurrencyDisplay
                  amount={pricing.cross_border_surcharge}
                  currency={pricing.currency as CurrencyCode}
                  size="sm"
                /> per day
              </p>
            </div>
          )}

          {/* Pricing Breakdown Toggle */}
          <button
            onClick={toggleBreakdown}
            className="w-full flex items-center justify-center gap-2 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Info className="w-4 h-4" />
            {showBreakdown ? 'Hide' : 'Show'} pricing breakdown
          </button>

          {/* Detailed Breakdown */}
          {showBreakdown && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <h4 className="font-medium text-gray-900">Pricing Details</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base rate</span>
                  <span className="font-medium">
                    <CurrencyDisplay
                      amount={pricing.base_daily_rate}
                      currency={pricing.currency as CurrencyCode}
                      size="sm"
                    />
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Peak season (+{((pricing.seasonal_adjustments.peak_multiplier - 1) * 100).toFixed(0)}%)</span>
                  <span className="font-medium">
                    <CurrencyDisplay
                      amount={peakPrice}
                      currency={pricing.currency as CurrencyCode}
                      size="sm"
                    />
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Off-peak ({((1 - pricing.seasonal_adjustments.off_peak_multiplier) * 100).toFixed(0)}% off)</span>
                  <span className="font-medium">
                    <CurrencyDisplay
                      amount={offPeakPrice}
                      currency={pricing.currency as CurrencyCode}
                      size="sm"
                    />
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  * Prices exclude taxes and fees. Final price calculated at booking.
                </p>
              </div>
            </div>
          )}

          {/* Pricing Notes */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Prices may vary based on season and demand</p>
            <p>• Security deposit is refundable</p>
            <p>• Additional fees may apply for extras</p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};