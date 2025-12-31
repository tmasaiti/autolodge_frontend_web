import React from 'react';
import { Vehicle } from '../../types/vehicle';
import { Badge } from '../ui/Badge';
import { Star, MapPin, Calendar, Users, Fuel, Cog } from 'lucide-react';

interface VehicleHeaderProps {
  vehicle: Vehicle;
}

export const VehicleHeader: React.FC<VehicleHeaderProps> = ({ vehicle }) => {
  // Mock rating data - in real implementation, this would come from reviews
  const rating = 4.5;
  const reviewCount = 23;

  return (
    <div className="space-y-4">
      {/* Title and Basic Info */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p className="text-lg text-gray-600 mt-1">
          {vehicle.category} • {vehicle.color} • {vehicle.registration}
        </p>
      </div>

      {/* Rating and Location */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="font-medium">{rating}</span>
          <span className="text-gray-500">({reviewCount} reviews)</span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{vehicle.location.city}, {vehicle.location.country}</span>
        </div>
      </div>

      {/* Quick Specs */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          <Users className="w-4 h-4" />
          <span>{vehicle.specifications.seats} seats</span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-600">
          <Cog className="w-4 h-4" />
          <span>{vehicle.specifications.transmission}</span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-600">
          <Fuel className="w-4 h-4" />
          <span>{vehicle.specifications.engine.fuel_type}</span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Min {vehicle.availability.minimum_rental_days} days</span>
        </div>
      </div>

      {/* Verification Status */}
      <div className="flex items-center gap-2">
        <Badge 
          variant={vehicle.verification.status === 'verified' ? 'success' : 'warning'}
          size="sm"
        >
          {vehicle.verification.status === 'verified' ? 'Verified Vehicle' : 'Pending Verification'}
        </Badge>
        
        {vehicle.cross_border_config.allowed && (
          <Badge variant="info" size="sm">
            Cross-Border Travel
          </Badge>
        )}
        
        {vehicle.specifications.features.includes('GPS') && (
          <Badge variant="secondary" size="sm">
            GPS Included
          </Badge>
        )}
      </div>

      {/* Description */}
      {vehicle.description && (
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {vehicle.description}
          </p>
        </div>
      )}
    </div>
  );
};