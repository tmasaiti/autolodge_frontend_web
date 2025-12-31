/**
 * Premium Calculator Component
 * Displays detailed premium calculation breakdown with real-time updates
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Badge } from '../ui';
import { Calculator, TrendingUp, TrendingDown, Info, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { insuranceService } from '../../services/insuranceService';
import { InsuranceProduct } from './InsuranceSelectionModal';

export interface PremiumCalculatorProps {
  product: InsuranceProduct;
  bookingDetails: {
    vehicle_category: string;
    rental_duration_days: number;
    renter_age: number;
    countries: string[];
    pickup_date: string;
    total_amount: number;
    currency: string;
  };
  onPremiumCalculated?: (premium: number, breakdown: PremiumBreakdown) => void;
  showBreakdown?: boolean;
  className?: string;
}

export interface PremiumBreakdown {
  base_premium: number;
  daily_rate: number;
  duration_discount: number;
  age_adjustment: number;
  location_adjustment: number;
  seasonal_adjustment: number;
  risk_adjustment: number;
  total_premium: number;
  currency: string;
  adjustments: {
    type: string;
    description: string;
    amount: number;
    multiplier?: number;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

export const PremiumCalculator: React.FC<PremiumCalculatorProps> = ({
  product,
  bookingDetails,
  onPremiumCalculated,
  showBreakdown = true,
  className
}) => {
  const [breakdown, setBreakdown] = useState<PremiumBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate premium whenever inputs change
  useEffect(() => {
    calculatePremium();
  }, [product.id, bookingDetails]);

  const calculatePremium = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await insuranceService.calculatePremium({
        product_id: product.id,
        vehicle_category: bookingDetails.vehicle_category,
        rental_duration_days: bookingDetails.rental_duration_days,
        renter_age: bookingDetails.renter_age,
        countries: bookingDetails.countries,
        pickup_date: bookingDetails.pickup_date
      });

      const calculatedBreakdown: PremiumBreakdown = {
        base_premium: response.base_premium,
        daily_rate: response.breakdown.daily_rate,
        duration_discount: response.breakdown.duration_discount,
        age_adjustment: response.breakdown.age_adjustment,
        location_adjustment: response.breakdown.location_adjustment,
        seasonal_adjustment: response.breakdown.seasonal_adjustment,
        risk_adjustment: response.breakdown.risk_adjustment,
        total_premium: response.total_premium,
        currency: response.currency,
        adjustments: response.adjustments.map(adj => ({
          ...adj,
          impact: (adj.amount > 0 ? 'negative' : adj.amount < 0 ? 'positive' : 'neutral') as 'positive' | 'negative' | 'neutral'
        }))
      };

      setBreakdown(calculatedBreakdown);
      onPremiumCalculated?.(response.total_premium, calculatedBreakdown);
    } catch (err) {
      console.error('Error calculating premium:', err);
      setError('Unable to calculate premium. Using estimated values.');
      
      // Fallback to client-side calculation
      const fallbackBreakdown = performClientSideCalculation();
      setBreakdown(fallbackBreakdown);
      onPremiumCalculated?.(fallbackBreakdown.total_premium, fallbackBreakdown);
    } finally {
      setLoading(false);
    }
  };

  const performClientSideCalculation = (): PremiumBreakdown => {
    const baseDailyRate = product.premium_calculation.base_rate;
    const days = bookingDetails.rental_duration_days;
    
    // Age adjustment
    const ageMultiplier = bookingDetails.renter_age < 25 ? 1.2 : 
                         bookingDetails.renter_age > 65 ? 1.1 : 1.0;
    
    // Duration discount
    const durationDiscount = days >= 7 ? 0.1 : days >= 14 ? 0.15 : 0;
    
    // Vehicle category adjustment
    const vehicleMultiplier = product.premium_calculation.vehicle_category_multiplier || 1.0;
    
    // Cross-border adjustment
    const crossBorderMultiplier = bookingDetails.countries.length > 1 ? 1.15 : 1.0;
    
    // Seasonal adjustment (simplified)
    const month = new Date(bookingDetails.pickup_date).getMonth();
    const seasonalMultiplier = [11, 0, 1].includes(month) ? 1.1 : // Dec, Jan, Feb
                              [5, 6, 7].includes(month) ? 1.05 : 1.0; // Jun, Jul, Aug
    
    const basePremium = baseDailyRate * days;
    const adjustedPremium = basePremium * ageMultiplier * vehicleMultiplier * 
                           crossBorderMultiplier * seasonalMultiplier * (1 - durationDiscount);
    
    const adjustments = [
      {
        type: 'age_adjustment',
        description: `Driver age ${bookingDetails.renter_age}`,
        amount: basePremium * (ageMultiplier - 1),
        multiplier: ageMultiplier,
        impact: ageMultiplier > 1 ? 'negative' : 'neutral' as const
      },
      {
        type: 'duration_discount',
        description: `${days}-day rental discount`,
        amount: -basePremium * durationDiscount,
        multiplier: 1 - durationDiscount,
        impact: durationDiscount > 0 ? 'positive' : 'neutral' as const
      },
      {
        type: 'vehicle_category',
        description: `${bookingDetails.vehicle_category} vehicle`,
        amount: basePremium * (vehicleMultiplier - 1),
        multiplier: vehicleMultiplier,
        impact: vehicleMultiplier > 1 ? 'negative' : 'neutral' as const
      },
      {
        type: 'location_adjustment',
        description: bookingDetails.countries.length > 1 ? 'Cross-border travel' : 'Domestic travel',
        amount: basePremium * (crossBorderMultiplier - 1),
        multiplier: crossBorderMultiplier,
        impact: crossBorderMultiplier > 1 ? 'negative' : 'neutral' as const
      },
      {
        type: 'seasonal_adjustment',
        description: 'Seasonal pricing',
        amount: basePremium * (seasonalMultiplier - 1),
        multiplier: seasonalMultiplier,
        impact: seasonalMultiplier > 1 ? 'negative' : 'neutral' as const
      }
    ].filter(adj => Math.abs(adj.amount) > 0.01);

    return {
      base_premium: basePremium,
      daily_rate: baseDailyRate,
      duration_discount: durationDiscount,
      age_adjustment: ageMultiplier - 1,
      location_adjustment: crossBorderMultiplier - 1,
      seasonal_adjustment: seasonalMultiplier - 1,
      risk_adjustment: 0,
      total_premium: adjustedPremium,
      currency: bookingDetails.currency,
      adjustments
    };
  };

  const formatCurrency = (amount: number, currency: string = bookingDetails.currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const totalSavings = useMemo(() => {
    if (!breakdown) return 0;
    return breakdown.adjustments
      .filter(adj => adj.impact === 'positive')
      .reduce((sum, adj) => sum + Math.abs(adj.amount), 0);
  }, [breakdown]);

  const totalSurcharges = useMemo(() => {
    if (!breakdown) return 0;
    return breakdown.adjustments
      .filter(adj => adj.impact === 'negative')
      .reduce((sum, adj) => sum + adj.amount, 0);
  }, [breakdown]);

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error && !breakdown) {
    return (
      <Card className={cn('p-6 border-red-200 bg-red-50', className)}>
        <div className="flex items-center space-x-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Calculation Error</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <Button variant="outline" size="sm" onClick={calculatePremium} className="mt-3">
          Retry Calculation
        </Button>
      </Card>
    );
  }

  if (!breakdown) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Premium Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Premium Calculation</h3>
          </div>
          {error && (
            <Badge variant="warning" size="sm">Estimated</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(breakdown.total_premium)}
            </div>
            <p className="text-sm text-gray-500">Total Premium</p>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">
              {formatCurrency(breakdown.daily_rate)}
            </div>
            <p className="text-sm text-gray-500">Per Day</p>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">
              {bookingDetails.rental_duration_days} days
            </div>
            <p className="text-sm text-gray-500">Coverage Period</p>
          </div>
        </div>

        {/* Savings/Surcharges Summary */}
        {(totalSavings > 0 || totalSurcharges > 0) && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            {totalSavings > 0 && (
              <div className="flex items-center space-x-2 text-green-700">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">
                  You save {formatCurrency(totalSavings)}
                </span>
              </div>
            )}
            
            {totalSurcharges > 0 && (
              <div className="flex items-center space-x-2 text-orange-700">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Additional {formatCurrency(totalSurcharges)}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Detailed Breakdown */}
      {showBreakdown && breakdown.adjustments.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Premium Breakdown</h4>
          
          {/* Base Premium */}
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-700">Base Premium ({bookingDetails.rental_duration_days} days)</span>
            <span className="font-medium">{formatCurrency(breakdown.base_premium)}</span>
          </div>

          {/* Adjustments */}
          <div className="space-y-2 mt-3">
            {breakdown.adjustments.map((adjustment, index) => (
              <div key={index} className="flex justify-between items-center py-2">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">{adjustment.description}</span>
                  {adjustment.multiplier && adjustment.multiplier !== 1 && (
                    <Badge variant="outline" size="sm">
                      {adjustment.multiplier > 1 ? '+' : ''}{formatPercentage(adjustment.multiplier - 1)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    'font-medium',
                    adjustment.impact === 'positive' ? 'text-green-600' :
                    adjustment.impact === 'negative' ? 'text-red-600' : 'text-gray-600'
                  )}>
                    {adjustment.amount > 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                  </span>
                  
                  {adjustment.impact === 'positive' && (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  {adjustment.impact === 'negative' && (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-3 mt-3 border-t border-gray-200 font-semibold text-lg">
            <span className="text-gray-900">Total Premium</span>
            <span className="text-gray-900">{formatCurrency(breakdown.total_premium)}</span>
          </div>
        </Card>
      )}

      {/* Calculation Notes */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Premium Calculation Notes</p>
            <ul className="space-y-1 text-xs">
              <li>• Premium is calculated based on rental duration, vehicle category, and driver profile</li>
              <li>• Cross-border travel may include additional coverage requirements</li>
              <li>• Seasonal adjustments reflect varying risk levels throughout the year</li>
              <li>• Longer rentals typically qualify for duration discounts</li>
              {error && <li>• This is an estimated calculation - final premium may vary</li>}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};