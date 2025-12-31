/**
 * Fee Breakdown Component
 * Displays transparent fee breakdown for payments
 * Implements requirement 6.5 (transparent fee breakdown)
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Calculator } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FeeBreakdown as FeeBreakdownType } from '../../schemas/payment-schemas';
import { paymentService } from '../../services/paymentService';

export interface FeeBreakdownProps {
  breakdown: FeeBreakdownType;
  className?: string;
  showDetails?: boolean;
}

export const FeeBreakdown: React.FC<FeeBreakdownProps> = ({
  breakdown,
  className = '',
  showDetails = false
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const formatCurrency = (amount: number) => {
    return paymentService.formatCurrency(amount, breakdown.currency);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  return (
    <Card className={`p-6 bg-neutral-50 border-neutral-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-primary-600" />
          <span>Fee Breakdown</span>
        </h3>
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-neutral-600 hover:text-neutral-800 p-1"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Summary View */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-lg">
          <span className="text-neutral-700">Base Amount:</span>
          <span className="font-semibold text-neutral-900">
            {formatCurrency(breakdown.base_amount)}
          </span>
        </div>

        <div className="flex justify-between items-center text-neutral-600">
          <span>Total Fees:</span>
          <span>{formatCurrency(breakdown.total_fees)}</span>
        </div>

        <div className="border-t border-neutral-300 pt-3 flex justify-between items-center text-xl font-bold">
          <span className="text-neutral-900">You Pay:</span>
          <span className="text-primary-600">
            {formatCurrency(breakdown.base_amount + breakdown.total_fees)}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm text-neutral-500">
          <span>Operator Receives:</span>
          <span>{formatCurrency(breakdown.net_amount)}</span>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-neutral-200 space-y-4">
          <h4 className="font-medium text-neutral-900 mb-3">Detailed Fee Breakdown</h4>

          {/* Platform Fee */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-neutral-900">Platform Fee</span>
              <span className="font-semibold text-neutral-900">
                {formatCurrency(breakdown.platform_fee.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-neutral-600">
              <span>{formatPercentage(breakdown.platform_fee.percentage)} of base amount</span>
              <span>
                {formatPercentage(breakdown.platform_fee.percentage)} × {formatCurrency(breakdown.base_amount)}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              {breakdown.platform_fee.description}
            </p>
          </div>

          {/* Payment Processing Fee */}
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-neutral-900">Payment Processing Fee</span>
              <span className="font-semibold text-neutral-900">
                {formatCurrency(breakdown.payment_processing_fee.total_amount)}
              </span>
            </div>
            <div className="space-y-1 text-sm text-neutral-600">
              {breakdown.payment_processing_fee.percentage > 0 && (
                <div className="flex justify-between">
                  <span>{formatPercentage(breakdown.payment_processing_fee.percentage)} of total</span>
                  <span>
                    {formatCurrency(
                      (breakdown.base_amount * breakdown.payment_processing_fee.percentage) / 100
                    )}
                  </span>
                </div>
              )}
              {breakdown.payment_processing_fee.fixed_amount > 0 && (
                <div className="flex justify-between">
                  <span>Fixed fee</span>
                  <span>{formatCurrency(breakdown.payment_processing_fee.fixed_amount)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              {breakdown.payment_processing_fee.description}
            </p>
          </div>

          {/* Taxes */}
          {(breakdown.taxes.vat_amount || breakdown.taxes.other_taxes.length > 0) && (
            <div className="bg-white rounded-lg p-4 border border-neutral-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-neutral-900">Taxes</span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(
                    (breakdown.taxes.vat_amount || 0) +
                    breakdown.taxes.other_taxes.reduce((sum, tax) => sum + tax.amount, 0)
                  )}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-neutral-600">
                {breakdown.taxes.vat_amount && breakdown.taxes.vat_percentage && (
                  <div className="flex justify-between">
                    <span>VAT ({formatPercentage(breakdown.taxes.vat_percentage)})</span>
                    <span>{formatCurrency(breakdown.taxes.vat_amount)}</span>
                  </div>
                )}
                
                {breakdown.taxes.other_taxes.map((tax, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{tax.name} ({formatPercentage(tax.percentage)})</span>
                    <span>{formatCurrency(tax.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escrow Fee */}
          {breakdown.escrow_fee.amount > 0 && (
            <div className="bg-white rounded-lg p-4 border border-neutral-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-neutral-900">Escrow Protection Fee</span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(breakdown.escrow_fee.amount)}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {breakdown.escrow_fee.description}
              </p>
            </div>
          )}

          {/* Fee Explanation */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-blue-900 mb-2">Why These Fees?</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    <strong>Platform Fee:</strong> Covers insurance, customer support, dispute resolution, 
                    and platform maintenance to ensure a safe rental experience.
                  </li>
                  <li>
                    <strong>Processing Fee:</strong> Charged by payment providers (banks, card companies) 
                    for secure transaction processing.
                  </li>
                  <li>
                    <strong>Taxes:</strong> Government-mandated taxes based on your location and 
                    local regulations.
                  </li>
                  {breakdown.escrow_fee.amount > 0 && (
                    <li>
                      <strong>Escrow Fee:</strong> Covers the cost of secure fund management and 
                      dispute protection services.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Comparison with Competitors */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-start space-x-2">
              <div className="text-green-600 mt-0.5">✓</div>
              <div>
                <h5 className="font-medium text-green-900 mb-2">Competitive & Transparent</h5>
                <p className="text-sm text-green-800">
                  Our fees are competitive with industry standards and fully transparent. 
                  Unlike many platforms, we show you exactly what you're paying for with no hidden charges.
                </p>
              </div>
            </div>
          </div>

          {/* Regional Information */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-start space-x-2">
              <div className="text-yellow-600 mt-0.5">🌍</div>
              <div>
                <h5 className="font-medium text-yellow-900 mb-2">SADC Regional Rates</h5>
                <p className="text-sm text-yellow-800">
                  Fees are optimized for the Southern African Development Community region, 
                  with competitive rates for local payment methods and currencies.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};