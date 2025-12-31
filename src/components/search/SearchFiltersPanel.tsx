import React, { useState, useCallback } from 'react';
import { SearchFilters } from '../../store/slices/searchSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Car, 
  DollarSign, 
  Users, 
  Fuel, 
  Settings, 
  Shield, 
  Globe,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SearchFiltersPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

interface FilterSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
}

export const SearchFiltersPanel: React.FC<SearchFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  className = ""
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    features: false,
    specifications: false,
    crossBorder: false,
    operator: false
  });

  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  // SADC-specific vehicle categories
  const vehicleCategories = [
    { id: 'economy', label: 'Economy', description: 'Fuel-efficient city cars' },
    { id: 'compact', label: 'Compact', description: 'Small to medium cars' },
    { id: 'standard', label: 'Standard', description: 'Mid-size comfortable cars' },
    { id: 'suv', label: 'SUV', description: 'Sport utility vehicles' },
    { id: '4x4', label: '4x4', description: 'Off-road capable vehicles' },
    { id: 'luxury', label: 'Luxury', description: 'Premium vehicles' },
    { id: 'van', label: 'Van/Minibus', description: 'Large passenger vehicles' },
    { id: 'truck', label: 'Pickup Truck', description: 'Utility vehicles' }
  ];

  // SADC-specific features
  const vehicleFeatures = [
    { id: 'air_conditioning', label: 'Air Conditioning', essential: true },
    { id: 'gps_navigation', label: 'GPS Navigation' },
    { id: 'bluetooth', label: 'Bluetooth' },
    { id: 'usb_charging', label: 'USB Charging Ports' },
    { id: 'backup_camera', label: 'Backup Camera' },
    { id: 'cruise_control', label: 'Cruise Control' },
    { id: 'keyless_entry', label: 'Keyless Entry' },
    { id: 'child_seats', label: 'Child Seats Available' },
    { id: 'roof_rack', label: 'Roof Rack' },
    { id: 'tow_hitch', label: 'Tow Hitch' },
    { id: 'spare_tire', label: 'Spare Tire & Tools' },
    { id: 'first_aid_kit', label: 'First Aid Kit' }
  ];

  // Transmission options
  const transmissionOptions = [
    { id: 'automatic', label: 'Automatic' },
    { id: 'manual', label: 'Manual' }
  ];

  // Fuel type options
  const fuelTypes = [
    { id: 'petrol', label: 'Petrol/Gasoline' },
    { id: 'diesel', label: 'Diesel' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'electric', label: 'Electric' }
  ];

  // Operator verification levels
  const verificationLevels = [
    { id: 'basic', label: 'Basic Verified', description: 'Identity and license verified' },
    { id: 'enhanced', label: 'Enhanced Verified', description: 'Business registration verified' },
    { id: 'premium', label: 'Premium Verified', description: 'Full compliance verification' }
  ];

  // SADC currencies for price range
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'BWP', symbol: 'P', name: 'Botswana Pula' },
    { code: 'NAD', symbol: 'N$', name: 'Namibian Dollar' }
  ];

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  }, [localFilters, onFiltersChange]);

  const toggleFeature = useCallback((featureId: string) => {
    const currentFeatures = localFilters.features || [];
    const updatedFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter(f => f !== featureId)
      : [...currentFeatures, featureId];
    
    updateFilter('features', updatedFeatures);
  }, [localFilters.features, updateFilter]);

  const clearAllFilters = useCallback(() => {
    const clearedFilters: SearchFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [onFiltersChange]);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.vehicle_category) count++;
    if (localFilters.price_range) count++;
    if (localFilters.cross_border_capable) count++;
    if (localFilters.features && localFilters.features.length > 0) count++;
    if (localFilters.transmission) count++;
    if (localFilters.fuel_type) count++;
    if (localFilters.seats) count++;
    if (localFilters.operator_verification_level) count++;
    return count;
  };

  const FilterSection: React.FC<{ 
    id: string; 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode;
  }> = ({ id, title, icon, children }) => (
    <Card className="mb-4">
      <div
        className="flex items-center justify-between p-4 cursor-pointer border-b border-gray-100"
        onClick={() => toggleSection(id)}
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-2 font-medium text-gray-900">{title}</span>
        </div>
        {expandedSections[id] ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </div>
      {expandedSections[id] && (
        <div className="p-4">
          {children}
        </div>
      )}
    </Card>
  );

  return (
    <div className={`search-filters-panel ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Settings className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {getActiveFiltersCount() > 0 && (
            <Badge variant="primary" className="ml-2">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </div>
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Vehicle Category */}
      <FilterSection id="category" title="Vehicle Category" icon={<Car className="w-4 h-4 text-gray-600" />}>
        <div className="grid grid-cols-1 gap-2">
          {vehicleCategories.map(category => (
            <label key={category.id} className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="vehicle_category"
                value={category.id}
                checked={localFilters.vehicle_category === category.id}
                onChange={(e) => updateFilter('vehicle_category', e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{category.label}</div>
                <div className="text-sm text-gray-500">{category.description}</div>
              </div>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection id="price" title="Price Range" icon={<DollarSign className="w-4 h-4 text-gray-600" />}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={localFilters.price_range?.currency || 'USD'}
              onChange={(e) => updateFilter('price_range', {
                ...localFilters.price_range,
                currency: e.target.value
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
              <Input
                type="number"
                placeholder="0"
                value={localFilters.price_range?.min || ''}
                onChange={(e) => updateFilter('price_range', {
                  ...localFilters.price_range,
                  min: parseInt(e.target.value) || 0,
                  currency: localFilters.price_range?.currency || 'USD'
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
              <Input
                type="number"
                placeholder="1000"
                value={localFilters.price_range?.max || ''}
                onChange={(e) => updateFilter('price_range', {
                  ...localFilters.price_range,
                  max: parseInt(e.target.value) || 1000,
                  currency: localFilters.price_range?.currency || 'USD'
                })}
              />
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Cross-Border Travel */}
      <FilterSection id="crossBorder" title="Cross-Border Travel" icon={<Globe className="w-4 h-4 text-gray-600" />}>
        <label className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={localFilters.cross_border_capable || false}
            onChange={(e) => updateFilter('cross_border_capable', e.target.checked)}
            className="mr-3"
          />
          <div>
            <div className="font-medium text-gray-900">Cross-Border Capable</div>
            <div className="text-sm text-gray-500">Vehicle can travel between SADC countries</div>
          </div>
        </label>
      </FilterSection>

      {/* Vehicle Features */}
      <FilterSection id="features" title="Features & Equipment" icon={<Shield className="w-4 h-4 text-gray-600" />}>
        <div className="grid grid-cols-1 gap-2">
          {vehicleFeatures.map(feature => (
            <label key={feature.id} className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.features?.includes(feature.id) || false}
                onChange={() => toggleFeature(feature.id)}
                className="mr-3"
              />
              <span className="text-gray-900">{feature.label}</span>
              {feature.essential && (
                <Badge variant="secondary" size="sm" className="ml-2">Essential</Badge>
              )}
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Vehicle Specifications */}
      <FilterSection id="specifications" title="Specifications" icon={<Settings className="w-4 h-4 text-gray-600" />}>
        <div className="space-y-4">
          {/* Transmission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
            <div className="space-y-2">
              {transmissionOptions.map(option => (
                <label key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    name="transmission"
                    value={option.id}
                    checked={localFilters.transmission === option.id}
                    onChange={(e) => updateFilter('transmission', e.target.value)}
                    className="mr-2"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
            <div className="space-y-2">
              {fuelTypes.map(fuel => (
                <label key={fuel.id} className="flex items-center">
                  <input
                    type="radio"
                    name="fuel_type"
                    value={fuel.id}
                    checked={localFilters.fuel_type === fuel.id}
                    onChange={(e) => updateFilter('fuel_type', e.target.value)}
                    className="mr-2"
                  />
                  {fuel.label}
                </label>
              ))}
            </div>
          </div>

          {/* Number of Seats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              Minimum Seats
            </label>
            <select
              value={localFilters.seats || ''}
              onChange={(e) => updateFilter('seats', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Any</option>
              <option value="2">2+ seats</option>
              <option value="4">4+ seats</option>
              <option value="5">5+ seats</option>
              <option value="7">7+ seats</option>
              <option value="9">9+ seats</option>
            </select>
          </div>
        </div>
      </FilterSection>

      {/* Operator Verification */}
      <FilterSection id="operator" title="Operator Verification" icon={<Shield className="w-4 h-4 text-gray-600" />}>
        <div className="space-y-2">
          {verificationLevels.map(level => (
            <label key={level.id} className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="operator_verification_level"
                value={level.id}
                checked={localFilters.operator_verification_level === level.id}
                onChange={(e) => updateFilter('operator_verification_level', e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{level.label}</div>
                <div className="text-sm text-gray-500">{level.description}</div>
              </div>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Active Filters Summary */}
      {getActiveFiltersCount() > 0 && (
        <Card className="mt-6 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {localFilters.vehicle_category && (
              <Badge variant="primary" className="flex items-center">
                {vehicleCategories.find(c => c.id === localFilters.vehicle_category)?.label}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('vehicle_category', undefined)}
                />
              </Badge>
            )}
            {localFilters.cross_border_capable && (
              <Badge variant="primary" className="flex items-center">
                Cross-Border
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('cross_border_capable', false)}
                />
              </Badge>
            )}
            {localFilters.features && localFilters.features.length > 0 && (
              <Badge variant="primary" className="flex items-center">
                {localFilters.features.length} Features
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('features', [])}
                />
              </Badge>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};