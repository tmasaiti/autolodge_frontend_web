import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Card, Badge, Button, CurrencyDisplay } from '../ui';
import { VehicleSpecifications, VehiclePricing, VehicleLocation } from '../../schemas/vehicle-schemas';
import { Star, MapPin, Users, Fuel, Settings, Map, List, Grid3X3 } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { cn } from '../../utils/cn';

export interface Vehicle {
  id: number;
  operator_id: number;
  registration: string;
  category: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  specifications: VehicleSpecifications;
  pricing: VehiclePricing;
  location: VehicleLocation;
  status: string;
  description?: string;
  photos: VehiclePhoto[];
  rating?: number;
  review_count?: number;
  operator_name?: string;
  distance_km?: number;
}

export interface VehiclePhoto {
  id: number;
  url: string;
  alt_text?: string;
  is_primary: boolean;
}

export interface SearchFilters {
  category?: string;
  price_range?: {
    min: number;
    max: number;
  };
  features?: string[];
  cross_border_capable?: boolean;
  fuel_type?: string;
  transmission?: string;
  seats?: number;
}

export interface VehicleListProps {
  vehicles: Vehicle[];
  viewMode: 'grid' | 'list' | 'map';
  onVehicleSelect: (vehicle: Vehicle) => void;
  onFilterChange: (filters: SearchFilters) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  filters?: SearchFilters;
}

// Helper functions
const formatPrice = (pricing: VehiclePricing) => {
  return `${pricing.currency} ${pricing.base_daily_rate.toFixed(0)}/day`;
};

const getPrimaryPhoto = (photos: VehiclePhoto[]) => {
  const primary = photos.find(p => p.is_primary);
  return primary?.url || photos[0]?.url || '/placeholder-vehicle.jpg';
};

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  viewMode,
  onVehicleSelect,
  onFilterChange,
  loading = false,
  hasMore = false,
  onLoadMore,
  filters = {}
}) => {
  const [displayedVehicles, setDisplayedVehicles] = useState<Vehicle[]>([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    setDisplayedVehicles(vehicles.slice(0, ITEMS_PER_PAGE));
    setPage(1);
  }, [vehicles]);

  const loadMoreVehicles = useCallback(() => {
    const nextPage = page + 1;
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const newVehicles = vehicles.slice(startIndex, endIndex);
    
    setDisplayedVehicles(prev => [...prev, ...newVehicles]);
    setPage(nextPage);
    
    if (onLoadMore && endIndex >= vehicles.length) {
      onLoadMore();
    }
  }, [page, vehicles, onLoadMore]);

  const formatPrice = (pricing: VehiclePricing) => {
    return `${pricing.currency} ${pricing.base_daily_rate.toFixed(0)}/day`;
  };

  const getPrimaryPhoto = (photos: VehiclePhoto[]) => {
    const primary = photos.find(p => p.is_primary);
    return primary?.url || photos[0]?.url || '/placeholder-vehicle.jpg';
  };

  if (loading && displayedVehicles.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <VehicleCardSkeleton key={i} viewMode={viewMode} />
        ))}
      </div>
    );
  }

  if (viewMode === 'map') {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Map view coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === 'grid' && (
        <Grid 
          cols={1} 
          responsive={{ sm: 2, lg: 3, xl: 4 }} 
          gap="lg"
        >
          {displayedVehicles.map(vehicle => (
            <VehicleCard 
              key={vehicle.id} 
              vehicle={vehicle} 
              onSelect={() => onVehicleSelect(vehicle)}
            />
          ))}
        </Grid>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {displayedVehicles.map(vehicle => (
            <VehicleListItem 
              key={vehicle.id} 
              vehicle={vehicle} 
              onSelect={() => onVehicleSelect(vehicle)}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {(hasMore || displayedVehicles.length < vehicles.length) && (
        <div className="flex justify-center pt-6">
          <Button 
            onClick={loadMoreVehicles}
            loading={loading}
            variant="outline"
          >
            Load More Vehicles
          </Button>
        </div>
      )}

      {displayedVehicles.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Grid3X3 className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-500">Try adjusting your search filters or location</p>
        </div>
      )}
    </div>
  );
};

// Vehicle Card Component for Grid View
const VehicleCard: React.FC<{ vehicle: Vehicle; onSelect: () => void }> = ({ 
  vehicle, 
  onSelect 
}) => {
  const { getDisplayConfig } = useCurrency();
  
  // Get currency display configuration for this vehicle
  const displayConfig = getDisplayConfig(
    vehicle.location.country, 
    vehicle.pricing.currency as any
  );

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <div className="aspect-w-16 aspect-h-9 relative">
        <img
          src={getPrimaryPhoto(vehicle.photos)}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-48 object-cover"
        />
        {vehicle.rating && (
          <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs font-medium">{vehicle.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">
            {vehicle.make} {vehicle.model} {vehicle.year}
          </h3>
          <Badge variant="outline" size="sm">
            {vehicle.category}
          </Badge>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{vehicle.location.city}, {vehicle.location.country}</span>
          {vehicle.distance_km && (
            <span className="ml-2">({vehicle.distance_km.toFixed(1)}km away)</span>
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{vehicle.specifications.seats}</span>
          </div>
          <div className="flex items-center">
            <Fuel className="h-4 w-4 mr-1" />
            <span className="capitalize">{vehicle.specifications.engine.fuel_type}</span>
          </div>
          <div className="flex items-center">
            <Settings className="h-4 w-4 mr-1" />
            <span className="capitalize">{vehicle.specifications.transmission}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <CurrencyDisplay
              amount={vehicle.pricing.base_daily_rate}
              currency={vehicle.pricing.currency as any}
              config={displayConfig}
              size="lg"
              showToggle={false}
            />
            <div className="text-xs text-gray-500">per day</div>
            {vehicle.operator_name && (
              <p className="text-xs text-gray-500">by {vehicle.operator_name}</p>
            )}
          </div>
          <Button size="sm">
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Vehicle List Item Component for List View
const VehicleListItem: React.FC<{ vehicle: Vehicle; onSelect: () => void }> = ({ 
  vehicle, 
  onSelect 
}) => {
  const { getDisplayConfig } = useCurrency();
  
  // Get currency display configuration for this vehicle
  const displayConfig = getDisplayConfig(
    vehicle.location.country, 
    vehicle.pricing.currency as any
  );

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <div className="flex">
        <div className="w-48 h-32 flex-shrink-0">
          <img
            src={getPrimaryPhoto(vehicle.photos)}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover rounded-l-lg"
          />
        </div>
        
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {vehicle.make} {vehicle.model} {vehicle.year}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" size="sm">
                  {vehicle.category}
                </Badge>
                {vehicle.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{vehicle.rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({vehicle.review_count} reviews)</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <CurrencyDisplay
                amount={vehicle.pricing.base_daily_rate}
                currency={vehicle.pricing.currency as any}
                config={displayConfig}
                size="lg"
                showToggle={true}
              />
              <div className="text-sm text-gray-500">per day</div>
              {vehicle.operator_name && (
                <p className="text-sm text-gray-500">by {vehicle.operator_name}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{vehicle.location.city}, {vehicle.location.country}</span>
            {vehicle.distance_km && (
              <span className="ml-2">({vehicle.distance_km.toFixed(1)}km away)</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{vehicle.specifications.seats} seats</span>
              </div>
              <div className="flex items-center">
                <Fuel className="h-4 w-4 mr-1" />
                <span className="capitalize">{vehicle.specifications.engine.fuel_type}</span>
              </div>
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-1" />
                <span className="capitalize">{vehicle.specifications.transmission}</span>
              </div>
            </div>
            
            <Button size="sm">
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Skeleton Loading Component
const VehicleCardSkeleton: React.FC<{ viewMode: 'grid' | 'list' | 'map' }> = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <Card>
        <div className="flex animate-pulse">
          <div className="w-48 h-32 bg-gray-200 rounded-l-lg"></div>
          <div className="flex-1 p-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse">
        <div className="w-full h-48 bg-gray-200"></div>
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="flex space-x-4 mb-3">
            <div className="h-4 bg-gray-200 rounded w-12"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    </Card>
  );
};