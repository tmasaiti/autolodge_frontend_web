/**
 * Coverage Gap Detector Component
 * Analyzes booking details and existing coverage to identify gaps and recommend products
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';
import { AlertTriangle, Shield, CheckCircle, Info, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { insuranceService } from '../../services/insuranceService';
import { InsuranceProduct } from './InsuranceSelectionModal';

export interface CoverageGap {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  impact: string;
  recommended_products: number[];
}

export interface CoverageRecommendation {
  product_id: number;
  reason: string;
  priority: number;
  addresses_gaps: string[];
}

export interface CoverageGapDetectorProps {
  bookingId?: number;
  bookingDetails: {
    vehicle_category: string;
    countries: string[];
    duration_days: number;
    cross_border: boolean;
    renter_age: number;
    total_amount: number;
    currency: string;
  };
  existingCoverage?: any[];
  availableProducts: InsuranceProduct[];
  onRecommendationSelect: (productId: number) => void;
  className?: string;
}

const SEVERITY_CONFIG = {
  low: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Info,
    label: 'Low Risk'
  },
  medium: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertTriangle,
    label: 'Medium Risk'
  },
  high: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    label: 'High Risk'
  }
};

export const CoverageGapDetector: React.FC<CoverageGapDetectorProps> = ({
  bookingId,
  bookingDetails,
  existingCoverage = [],
  availableProducts,
  onRecommendationSelect,
  className
}) => {
  const [gaps, setGaps] = useState<CoverageGap[]>([]);
  const [recommendations, setRecommendations] = useState<CoverageRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzeGaps();
  }, [bookingDetails, existingCoverage]);

  const analyzeGaps = async () => {
    setLoading(true);
    setError(null);

    try {
      // If we have a booking ID, use the API
      if (bookingId) {
        const analysis = await insuranceService.analyzeCoverageGaps(bookingId, existingCoverage);
        // Add missing impact field to gaps
        const gapsWithImpact = analysis.gaps.map((gap: any) => ({
          ...gap,
          impact: gap.impact || 'Potential financial and legal liability'
        }));
        // Add missing addresses_gaps field to recommendations  
        const recommendationsWithGaps = analysis.recommendations.map((rec: any) => ({
          ...rec,
          addresses_gaps: rec.addresses_gaps || []
        }));
        
        setGaps(gapsWithImpact);
        setRecommendations(recommendationsWithGaps);
      } else {
        // Otherwise, perform client-side analysis
        const clientAnalysis = performClientSideAnalysis();
        setGaps(clientAnalysis.gaps);
        setRecommendations(clientAnalysis.recommendations);
      }
    } catch (err) {
      console.error('Error analyzing coverage gaps:', err);
      setError('Unable to analyze coverage gaps. Please try again.');
      
      // Fallback to client-side analysis
      const clientAnalysis = performClientSideAnalysis();
      setGaps(clientAnalysis.gaps);
      setRecommendations(clientAnalysis.recommendations);
    } finally {
      setLoading(false);
    }
  };

  const performClientSideAnalysis = () => {
    const detectedGaps: CoverageGap[] = [];
    const detectedRecommendations: CoverageRecommendation[] = [];

    // Check for cross-border coverage gaps
    if (bookingDetails.cross_border) {
      detectedGaps.push({
        type: 'cross_border_liability',
        description: 'Cross-border travel requires enhanced liability coverage for international incidents',
        severity: 'high',
        impact: 'Potential legal and financial liability in foreign countries',
        recommended_products: availableProducts
          .filter(p => p.coverage_type === 'comprehensive' && p.countries.length > 1)
          .map(p => p.id)
      });
    }

    // Check for extended rental coverage
    if (bookingDetails.duration_days > 7) {
      detectedGaps.push({
        type: 'extended_rental',
        description: 'Extended rentals benefit from lower deductibles and comprehensive coverage',
        severity: 'medium',
        impact: 'Higher out-of-pocket costs for incidents during long-term rentals',
        recommended_products: availableProducts
          .filter(p => p.coverage_limits.collision_deductible < 500)
          .map(p => p.id)
      });
    }

    // Check for high-value rental protection
    if (bookingDetails.total_amount > 1000) {
      detectedGaps.push({
        type: 'high_value_protection',
        description: 'High-value rentals should have comprehensive theft and damage protection',
        severity: 'high',
        impact: 'Significant financial loss if vehicle is stolen or severely damaged',
        recommended_products: availableProducts
          .filter(p => p.coverage_type === 'comprehensive')
          .map(p => p.id)
      });
    }

    // Check for young driver risks
    if (bookingDetails.renter_age < 25) {
      detectedGaps.push({
        type: 'young_driver_risk',
        description: 'Younger drivers have higher accident rates and may need enhanced coverage',
        severity: 'medium',
        impact: 'Higher likelihood of accidents and insurance claims',
        recommended_products: availableProducts
          .filter(p => p.coverage_limits.personal_injury > 50000)
          .map(p => p.id)
      });
    }

    // Check for basic coverage gaps
    if (existingCoverage.length === 0) {
      detectedGaps.push({
        type: 'no_coverage',
        description: 'No insurance coverage selected - you are fully liable for all damages',
        severity: 'high',
        impact: 'Complete financial responsibility for accidents, theft, and damages',
        recommended_products: availableProducts.map(p => p.id)
      });
    }

    // Generate recommendations based on gaps
    const gapTypes = detectedGaps.map(gap => gap.type);
    
    availableProducts.forEach(product => {
      let priority = 0;
      const addressedGaps: string[] = [];

      if (gapTypes.includes('cross_border_liability') && product.countries.length > 1) {
        priority += 3;
        addressedGaps.push('Cross-border liability coverage');
      }

      if (gapTypes.includes('high_value_protection') && product.coverage_type === 'comprehensive') {
        priority += 3;
        addressedGaps.push('Comprehensive protection for high-value rental');
      }

      if (gapTypes.includes('extended_rental') && product.coverage_limits.collision_deductible < 500) {
        priority += 2;
        addressedGaps.push('Low deductible for extended rental');
      }

      if (gapTypes.includes('young_driver_risk') && product.coverage_limits.personal_injury > 50000) {
        priority += 2;
        addressedGaps.push('Enhanced personal injury coverage');
      }

      if (gapTypes.includes('no_coverage')) {
        priority += 1;
        addressedGaps.push('Basic protection coverage');
      }

      if (priority > 0) {
        detectedRecommendations.push({
          product_id: product.id,
          reason: `Addresses ${addressedGaps.length} coverage gap${addressedGaps.length > 1 ? 's' : ''}`,
          priority,
          addresses_gaps: addressedGaps
        });
      }
    });

    // Sort recommendations by priority
    detectedRecommendations.sort((a, b) => b.priority - a.priority);

    return {
      gaps: detectedGaps,
      recommendations: detectedRecommendations.slice(0, 3) // Top 3 recommendations
    };
  };

  const getProductById = (productId: number) => {
    return availableProducts.find(p => p.id === productId);
  };

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6 border-red-200 bg-red-50', className)}>
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Analysis Error</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <Button variant="outline" size="sm" onClick={analyzeGaps} className="mt-3">
          Retry Analysis
        </Button>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Coverage Status Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Coverage Analysis</h3>
          <Badge variant={gaps.length === 0 ? 'success' : 'warning'}>
            {gaps.length === 0 ? 'Well Protected' : `${gaps.length} Gap${gaps.length > 1 ? 's' : ''} Found`}
          </Badge>
        </div>

        {gaps.length === 0 ? (
          <div className="flex items-center space-x-3 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span>Your current coverage appears adequate for this booking.</span>
          </div>
        ) : (
          <p className="text-gray-600">
            We've identified {gaps.length} potential coverage gap{gaps.length > 1 ? 's' : ''} 
            based on your booking details. Review the recommendations below to enhance your protection.
          </p>
        )}
      </Card>

      {/* Coverage Gaps */}
      {gaps.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Identified Coverage Gaps</h4>
          <div className="space-y-4">
            {gaps.map((gap, index) => {
              const config = SEVERITY_CONFIG[gap.severity];
              const IconComponent = config.icon;

              return (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-lg border',
                    config.color
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{gap.description}</h5>
                        <Badge size="sm" variant="outline">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-90 mb-3">{gap.impact}</p>
                      
                      {gap.recommended_products.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {gap.recommended_products.slice(0, 2).map(productId => {
                            const product = getProductById(productId);
                            return product ? (
                              <Button
                                key={productId}
                                variant="outline"
                                size="sm"
                                onClick={() => onRecommendationSelect(productId)}
                                className="text-xs"
                              >
                                {product.name}
                              </Button>
                            ) : null;
                          })}
                          {gap.recommended_products.length > 2 && (
                            <span className="text-xs opacity-75">
                              +{gap.recommended_products.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Recommended Insurance Products</h4>
          <div className="space-y-4">
            {recommendations.map((rec, index) => {
              const product = getProductById(rec.product_id);
              if (!product) return null;

              return (
                <div
                  key={rec.product_id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <h5 className="font-medium text-gray-900">{product.name}</h5>
                      <Badge variant="outline" size="sm">
                        Priority {rec.priority}
                      </Badge>
                      {product.recommended && (
                        <Badge variant="success" size="sm">Recommended</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {rec.addresses_gaps.map((gap, gapIndex) => (
                        <Badge key={gapIndex} variant="outline" size="sm" className="text-xs">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {product.coverage_type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.provider.name}
                      </div>
                    </div>
                    
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onRecommendationSelect(rec.product_id)}
                      className="flex items-center space-x-1"
                    >
                      <span>Select</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Risk Assessment Summary */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Risk Assessment Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Booking Profile:</strong> {bookingDetails.duration_days}-day rental, 
                {bookingDetails.cross_border ? ' cross-border travel,' : ''} 
                {bookingDetails.vehicle_category} vehicle
              </p>
              <p>
                <strong>Risk Level:</strong> {
                  gaps.some(g => g.severity === 'high') ? 'High' :
                  gaps.some(g => g.severity === 'medium') ? 'Medium' : 'Low'
                } - Based on rental duration, vehicle type, and travel destinations
              </p>
              <p>
                <strong>Recommendation:</strong> {
                  gaps.length === 0 
                    ? 'Your current coverage is adequate for this booking.'
                    : `Consider ${recommendations.length > 0 ? recommendations[0].addresses_gaps.length : 'additional'} coverage enhancement${recommendations.length > 1 ? 's' : ''} for optimal protection.`
                }
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};