import React, { useState, useMemo } from 'react';
import { Modal, Button, Card, Badge, Grid } from '../ui';
import { BookingData } from '../dashboard/BookingList';
import { Shield, Check, X, Info, Star, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface InsuranceProduct {
  id: number;
  provider_id: number;
  name: string;
  coverage_type: 'basic' | 'comprehensive' | 'third_party' | 'collision' | 'theft';
  description: string;
  coverage_limits: {
    liability_limit: number;
    collision_deductible: number;
    comprehensive_deductible: number;
    personal_injury: number;
  };
  premium_calculation: {
    base_rate: number;
    age_multiplier: number;
    vehicle_category_multiplier: number;
    duration_discount: number;
  };
  countries: string[];
  vehicle_categories: string[];
  provider: {
    id: number;
    name: string;
    rating: number;
    logo_url?: string;
  };
  features: string[];
  exclusions: string[];
  popular?: boolean;
  recommended?: boolean;
}

export interface InsuranceSelectionModalProps {
  isOpen: boolean;
  availableProducts: InsuranceProduct[];
  booking: BookingData;
  onProductSelect: (product: InsuranceProduct) => void;
  onClose: () => void;
  loading?: boolean;
}

const coverageTypeConfig = {
  basic: { label: 'Basic', color: 'bg-gray-100 text-gray-800' },
  comprehensive: { label: 'Comprehensive', color: 'bg-green-100 text-green-800' },
  third_party: { label: 'Third Party', color: 'bg-blue-100 text-blue-800' },
  collision: { label: 'Collision', color: 'bg-orange-100 text-orange-800' },
  theft: { label: 'Theft Protection', color: 'bg-purple-100 text-purple-800' }
};

export const InsuranceSelectionModal: React.FC<InsuranceSelectionModalProps> = ({
  isOpen,
  availableProducts,
  booking,
  onProductSelect,
  onClose,
  loading = false
}) => {
  const [selectedProduct, setSelectedProduct] = useState<(InsuranceProduct & { calculatedPremium: number }) | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Calculate premium for each product based on booking details
  const productsWithPremiums = useMemo(() => {
    return availableProducts.map(product => {
      const basePremium = product.premium_calculation.base_rate;
      const durationDays = booking.pricing.total_days;
      const vehicleMultiplier = product.premium_calculation.vehicle_category_multiplier;
      const durationDiscount = durationDays >= 7 ? product.premium_calculation.duration_discount : 0;
      
      const premium = basePremium * durationDays * vehicleMultiplier * (1 - durationDiscount);
      
      return {
        ...product,
        calculatedPremium: Math.round(premium * 100) / 100
      };
    });
  }, [availableProducts, booking]);

  // Sort products: recommended first, then by premium
  const sortedProducts = useMemo(() => {
    return [...productsWithPremiums].sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return a.calculatedPremium - b.calculatedPremium;
    });
  }, [productsWithPremiums]);

  const handleProductSelect = (product: InsuranceProduct & { calculatedPremium: number }) => {
    setSelectedProduct(product);
  };

  const handleConfirmSelection = () => {
    if (selectedProduct) {
      onProductSelect(selectedProduct);
    }
  };

  const formatCurrency = (amount: number, currency: string = booking.pricing.currency) => {
    return `${currency} ${amount.toFixed(0)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <Modal.Header>
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Select Insurance Coverage</h2>
            <p className="text-sm text-gray-500 mt-1">
              Protect your rental with comprehensive insurance coverage
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-6">
          {/* Booking Summary */}
          <Card variant="outlined" padding="sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900">
                  {booking.vehicle.make} {booking.vehicle.model} {booking.vehicle.year}
                </h3>
                <p className="text-sm text-gray-500">
                  {booking.pricing.total_days} days • {formatCurrency(booking.pricing.total_amount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Coverage Period</p>
                <p className="font-medium">
                  {new Date(booking.date_range.start_date).toLocaleDateString()} - {' '}
                  {new Date(booking.date_range.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          {/* View Toggle */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Available Insurance Products</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
            >
              {showComparison ? 'Card View' : 'Compare All'}
            </Button>
          </div>

          {/* Insurance Products */}
          {showComparison ? (
            <ComparisonTable 
              products={sortedProducts} 
              selectedProduct={selectedProduct}
              onProductSelect={handleProductSelect}
              formatCurrency={formatCurrency}
            />
          ) : (
            <Grid cols={1} responsive={{ md: 2 }} gap="lg">
              {sortedProducts.map(product => (
                <InsuranceProductCard
                  key={product.id}
                  product={product}
                  isSelected={selectedProduct?.id === product.id}
                  onSelect={() => handleProductSelect(product)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </Grid>
          )}

          {/* Selected Product Details */}
          {selectedProduct && (
            <Card variant="elevated" padding="md">
              <h4 className="font-medium text-gray-900 mb-3">Selected Coverage Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Coverage Limits</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Liability: {formatCurrency(selectedProduct.coverage_limits.liability_limit)}</li>
                    <li>Collision Deductible: {formatCurrency(selectedProduct.coverage_limits.collision_deductible)}</li>
                    <li>Comprehensive Deductible: {formatCurrency(selectedProduct.coverage_limits.comprehensive_deductible)}</li>
                    <li>Personal Injury: {formatCurrency(selectedProduct.coverage_limits.personal_injury)}</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">What's Included</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedProduct.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex justify-between items-center w-full">
          <div className="text-sm text-gray-500">
            {selectedProduct && (
              <span>
                Premium: {formatCurrency(selectedProduct.calculatedPremium)} for {booking.pricing.total_days} days
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Skip Insurance
            </Button>
            <Button 
              onClick={handleConfirmSelection} 
              disabled={!selectedProduct}
              loading={loading}
            >
              Add to Booking
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

// Individual Insurance Product Card
const InsuranceProductCard: React.FC<{
  product: InsuranceProduct & { calculatedPremium: number };
  isSelected: boolean;
  onSelect: () => void;
  formatCurrency: (amount: number) => string;
}> = ({ product, isSelected, onSelect, formatCurrency }) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'
      )}
      onClick={onSelect}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div>
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.provider.name}</p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {product.recommended && (
              <Badge variant="success" size="sm">Recommended</Badge>
            )}
            {product.popular && (
              <Badge variant="info" size="sm">Popular</Badge>
            )}
            <Badge className={coverageTypeConfig[product.coverage_type].color} size="sm">
              {coverageTypeConfig[product.coverage_type].label}
            </Badge>
          </div>
        </div>

        {/* Provider Rating */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium ml-1">{product.provider.rating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-gray-500">Provider Rating</span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">{product.description}</p>

        {/* Key Features */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Features</h4>
          <ul className="space-y-1">
            {product.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <Check className="h-3 w-3 text-green-500 mr-2" />
                {feature}
              </li>
            ))}
            {product.features.length > 3 && (
              <li className="text-sm text-gray-500">
                +{product.features.length - 3} more features
              </li>
            )}
          </ul>
        </div>

        {/* Exclusions Warning */}
        {product.exclusions.length > 0 && (
          <div className="mb-4 p-2 bg-yellow-50 rounded border border-yellow-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-yellow-800">Important Exclusions</p>
                <p className="text-xs text-yellow-700">
                  {product.exclusions.slice(0, 2).join(', ')}
                  {product.exclusions.length > 2 && '...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Premium */}
        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-sm text-gray-500">Premium</span>
          <div className="text-right">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(product.calculatedPremium)}
            </span>
            <p className="text-xs text-gray-500">for entire rental</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Comparison Table Component
const ComparisonTable: React.FC<{
  products: (InsuranceProduct & { calculatedPremium: number })[];
  selectedProduct: (InsuranceProduct & { calculatedPremium: number }) | null;
  onProductSelect: (product: InsuranceProduct & { calculatedPremium: number }) => void;
  formatCurrency: (amount: number) => string;
}> = ({ products, selectedProduct, onProductSelect, formatCurrency }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
              Product
            </th>
            <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
              Coverage Type
            </th>
            <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
              Liability Limit
            </th>
            <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
              Deductible
            </th>
            <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
              Premium
            </th>
            <th className="border border-gray-200 p-3 text-center text-sm font-medium text-gray-700">
              Select
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr 
              key={product.id}
              className={cn(
                'hover:bg-gray-50',
                selectedProduct?.id === product.id && 'bg-blue-50'
              )}
            >
              <td className="border border-gray-200 p-3">
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.provider.name}</div>
                  {product.recommended && (
                    <Badge variant="success" size="sm" className="mt-1">Recommended</Badge>
                  )}
                </div>
              </td>
              <td className="border border-gray-200 p-3">
                <Badge className={coverageTypeConfig[product.coverage_type].color} size="sm">
                  {coverageTypeConfig[product.coverage_type].label}
                </Badge>
              </td>
              <td className="border border-gray-200 p-3 text-sm">
                {formatCurrency(product.coverage_limits.liability_limit)}
              </td>
              <td className="border border-gray-200 p-3 text-sm">
                {formatCurrency(product.coverage_limits.collision_deductible)}
              </td>
              <td className="border border-gray-200 p-3">
                <div className="font-medium text-gray-900">
                  {formatCurrency(product.calculatedPremium)}
                </div>
              </td>
              <td className="border border-gray-200 p-3 text-center">
                <Button
                  size="sm"
                  variant={selectedProduct?.id === product.id ? 'primary' : 'outline'}
                  onClick={() => onProductSelect(product)}
                >
                  {selectedProduct?.id === product.id ? 'Selected' : 'Select'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};