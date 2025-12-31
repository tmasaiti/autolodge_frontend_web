import React from 'react';
import { Vehicle } from '../../types/vehicle';
import { CurrencyCode } from '@autolodge/shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  MapPin, 
  Users, 
  Fuel,
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface VehicleListingCardProps {
  vehicle: Vehicle;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onDelete: () => void;
}

export const VehicleListingCard: React.FC<VehicleListingCardProps> = ({
  vehicle,
  viewMode,
  onEdit,
  onDelete
}) => {
  // Mock booking data - in real app this would come from API
  const mockBookingStats = {
    upcoming_bookings: Math.floor(Math.random() * 5),
    monthly_revenue: Math.floor(Math.random() * 10000) + 5000,
    occupancy_rate: Math.floor(Math.random() * 40) + 60
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'booked': return 'info';
      case 'maintenance': return 'warning';
      case 'inactive': return 'error';
      default: return 'secondary';
    }
  };

  const getVerificationIcon = () => {
    if (vehicle.verification.status === 'verified') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-orange-500" />;
  };

  if (viewMode === 'list') {
    return (
      <Card padding="md" className="hover:shadow-md transition-shadow">
        <div className="flex items-center gap-6">
          {/* Vehicle Image */}
          <div className="flex-shrink-0 w-24 h-16 bg-gray-200 rounded-lg overflow-hidden">
            <img
              src={vehicle.photos[0]?.url || '/placeholder-vehicle.jpg'}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-vehicle.jpg';
              }}
            />
          </div>

          {/* Vehicle Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <Badge variant={getStatusColor(vehicle.status) as any} size="sm">
                {vehicle.status}
              </Badge>
              {getVerificationIcon()}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <span>{vehicle.registration}</span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {vehicle.specifications.seats} seats
              </span>
              <span className="flex items-center gap-1">
                <Fuel className="w-4 h-4" />
                {vehicle.specifications.engine.fuel_type}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {vehicle.location.city}
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Daily Rate: </span>
                <span className="font-medium">
                  <CurrencyDisplay
                    amount={vehicle.pricing.base_daily_rate}
                    currency={vehicle.pricing.currency as CurrencyCode}
                    size="sm"
                  />
                </span>
              </div>
              <div>
                <span className="text-gray-500">Bookings: </span>
                <span className="font-medium">{mockBookingStats.upcoming_bookings}</span>
              </div>
              <div>
                <span className="text-gray-500">Occupancy: </span>
                <span className="font-medium">{mockBookingStats.occupancy_rate}%</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none" className="hover:shadow-lg transition-shadow">
      {/* Vehicle Image */}
      <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
        <img
          src={vehicle.photos[0]?.url || '/placeholder-vehicle.jpg'}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-vehicle.jpg';
          }}
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={getStatusColor(vehicle.status) as any} size="sm">
            {vehicle.status}
          </Badge>
        </div>

        {/* Verification Badge */}
        <div className="absolute top-3 right-3">
          {getVerificationIcon()}
        </div>

        {/* Cross-border Badge */}
        {vehicle.cross_border_config.allowed && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="info" size="sm">
              Cross-Border
            </Badge>
          </div>
        )}
      </div>

      {/* Vehicle Details */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <span className="text-sm text-gray-500">{vehicle.registration}</span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Users className="w-4 h-4" />
            </div>
            <div className="font-medium">{vehicle.specifications.seats}</div>
            <div className="text-xs text-gray-500">Seats</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Fuel className="w-4 h-4" />
            </div>
            <div className="font-medium">{vehicle.specifications.engine.fuel_type}</div>
            <div className="text-xs text-gray-500">Fuel</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="font-medium">{mockBookingStats.upcoming_bookings}</div>
            <div className="text-xs text-gray-500">Bookings</div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-4">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              <CurrencyDisplay
                amount={vehicle.pricing.base_daily_rate}
                currency={vehicle.pricing.currency as CurrencyCode}
                size="md"
              />
            </div>
            <div className="text-sm text-gray-500">per day</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium text-green-600">
              <CurrencyDisplay
                amount={mockBookingStats.monthly_revenue}
                currency={vehicle.pricing.currency as CurrencyCode}
                size="sm"
              />
            </div>
            <div className="text-xs text-gray-500">Monthly Revenue</div>
          </div>
          
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium text-blue-600">{mockBookingStats.occupancy_rate}%</div>
            <div className="text-xs text-gray-500">Occupancy Rate</div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4" />
          <span>{vehicle.location.city}, {vehicle.location.country}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};