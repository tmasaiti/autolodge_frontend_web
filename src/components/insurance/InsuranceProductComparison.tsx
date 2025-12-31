/**
 * Insurance Product Comparison Component
 * Provides detailed side-by-side comparison of insurance products
 */

import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Grid } from '../ui';
import { Shield, Check, X, Star, Info, AlertTriangle, Calculator } from 'lucide-react';
import { cn } from '../../utils/cn';
import { InsuranceProduct } from '../insurance/InsuranceSelectionModal';

export interface InsuranceProductComparisonProps {
  products: (InsuranceProduct & { calculatedPremium: number })[];
  selectedProductIds: number[];
  onProductSelect: (productId: number) => void;
  onProductDeselect: (productId: number) => void;
  formatCurrency: (amount: number, currency?: string) => string;
  bookingDetails: {
    duration_days: number;
    vehicle_category: string;
    countries: string[];
  };
}

interface ComparisonFeature {
  category: string;
  features: {
    name: string;
    key: string;
    type: 'boolean' | 'currency' | 'text' | 'number';
    description?: string;
  }[];
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    category: 'Coverage Limits',
    features: [
      { name: 'Liability Coverage', key: 'coverage_limits.liability_limit', type: 'currency' },
      { name: 'Personal Injury', key: 'coverage_limits.personal_injury', type: 'currency' },
      { name: 'Collision Deductible', key: 'coverage_limits.collision_deductible', type: 'currency' },
      { name: 'Comprehensive Deductible', key: 'coverage_limits.comprehensive_deductible', type: 'currency' }
    ]
  },
  {
    category: 'Key Features',
    features: [
      { name: '24/7 Roadside Assistance', key: 'features.roadside_assistance', type: 'boolean' },
      { name: 'Rental Car Replacement', key: 'features.rental_replacement', type: 'boolean' },
      { name: 'International Coverage', key: 'features.international_coverage', type: 'boolean' },
      { name: 'Personal Effects Coverage', key: 'features.personal_effects', type: 'boolean' },
      { name: 'Medical Expense Coverage', key: 'features.medical_expenses', type: 'boolean' },
      { name: 'Trip Interruption Coverage', key: 'features.trip_interruption', type: 'boolean' }
    ]
  },
  {
    category: 'Provider Information',
    features: [
      { name: 'Provider Rating', key: 'provider.rating', type: 'number' },
      { name: 'Claims Processing Time', key: 'provider.avg_claim_processing_days', type: 'text' },
      { name: 'Customer Support', key: 'provider.support_availability', type: 'text' }
    ]
  }
];

export const InsuranceProductComparison: React.FC<InsuranceProductComparisonProps> = ({
  products,
  selectedProductIds,
  onProductSelect,
  onProductDeselect,
  formatCurrency,
  bookingDetails
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(COMPARISON_FEATURES.map(cat => cat.category))
  );

  // Filter products to show only selected ones for comparison
  const comparisonProducts = useMemo(() => {
    return products.filter(product => selectedProductIds.includes(product.id));
  }, [products, selectedProductIds]);

  // Get feature value from product object using dot notation
  const getFeatureValue = (product: InsuranceProduct & { calculatedPremium: number }, key: string): any => {
    const keys = key.split('.');
    let value: any = product;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  };

  // Check if a feature exists in product features array
  const hasFeature = (product: InsuranceProduct, featureKey: string): boolean => {
    const featureName = featureKey.replace('features.', '');
    return product.features.some(feature => 
      feature.toLowerCase().includes(featureName.replace('_', ' ').toLowerCase())
    );
  };

  // Render feature value based on type
  const renderFeatureValue = (
    product: InsuranceProduct & { calculatedPremium: number }, 
    feature: { name: string; key: string; type: string }
  ) => {
    if (feature.key.startsWith('features.')) {
      const hasIt = hasFeature(product, feature.key);
      return (
        <div className="flex justify-center">
          {hasIt ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-gray-300" />
          )}
        </div>
      );
    }

    const value = getFeatureValue(product, feature.key);
    
    if (value === undefined || value === null) {
      return <span className="text-gray-400">N/A</span>;
    }

    switch (feature.type) {
      case 'currency':
        return formatCurrency(value);
      case 'boolean':
        return (
          <div className="flex justify-center">
            {value ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-gray-300" />
            )}
          </div>
        );
      case 'number':
        if (feature.key.includes('rating')) {
          return (
            <div className="flex items-center justify-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span>{value.toFixed(1)}</span>
            </div>
          );
        }
        return value.toString();
      case 'text':
      default:
        return value.toString();
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  if (comparisonProducts.length === 0) {
    return (
      <Card className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Selected</h3>
        <p className="text-gray-500 mb-4">
          Select insurance products to compare their features and coverage side by side.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Product Selection
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Insurance Comparison</h2>
          <p className="text-gray-600 mt-1">
            Compare {comparisonProducts.length} insurance products side by side
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {bookingDetails.duration_days} days • {bookingDetails.vehicle_category}
          </span>
        </div>
      </div>

      {/* Product Headers */}
      <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: `300px repeat(${comparisonProducts.length}, 1fr)` }}>
        <div></div> {/* Empty cell for feature names column */}
        {comparisonProducts.map(product => (
          <Card key={product.id} className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-between mb-2">
                <Badge 
                  variant={product.recommended ? 'success' : 'default'}
                  size="sm"
                >
                  {product.recommended ? 'Recommended' : product.coverage_type}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onProductDeselect(product.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{product.provider.name}</p>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(product.calculatedPremium)}
                </div>
                <p className="text-xs text-gray-500">total premium</p>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full mt-3"
                onClick={() => onProductSelect(product.id)}
              >
                Select This Plan
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {COMPARISON_FEATURES.map(category => (
          <div key={category.category} className="border-b border-gray-200 last:border-b-0">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.category)}
              className="w-full px-6 py-4 bg-gray-50 text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{category.category}</h3>
                <div className={cn(
                  'transform transition-transform',
                  expandedCategories.has(category.category) ? 'rotate-180' : ''
                )}>
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Category Features */}
            {expandedCategories.has(category.category) && (
              <div className="divide-y divide-gray-100">
                {category.features.map(feature => (
                  <div 
                    key={feature.key}
                    className="grid gap-4 px-6 py-3"
                    style={{ gridTemplateColumns: `300px repeat(${comparisonProducts.length}, 1fr)` }}
                  >
                    {/* Feature Name */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                      {feature.description && (
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {feature.description}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Feature Values */}
                    {comparisonProducts.map(product => (
                      <div key={product.id} className="text-center py-2">
                        {renderFeatureValue(product, feature)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Coverage Gap Analysis */}
      <Card className="p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Coverage Analysis</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Recommendation:</strong> Based on your {bookingDetails.duration_days}-day rental 
                in {bookingDetails.countries.join(', ')}, we recommend comprehensive coverage for optimal protection.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Cross-border travel requires enhanced liability coverage</li>
                <li>Extended rentals benefit from lower deductibles</li>
                <li>Consider personal effects coverage for valuable items</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Selection
        </Button>
        <div className="flex space-x-3">
          <Button variant="outline">
            Save Comparison
          </Button>
          <Button variant="primary" disabled={comparisonProducts.length === 0}>
            Continue with Selected
          </Button>
        </div>
      </div>
    </div>
  );
};