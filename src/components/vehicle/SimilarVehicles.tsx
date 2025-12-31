import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Vehicle, VehicleLocation } from '../../types/vehicle';
import { CurrencyCode } from '@autolodge/shared';
import { vehicleService } from '../../services/vehicleService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Users, 
  Fuel, 
  MapPin,
  Eye
} from 'lucide-react';

interface SimilarVehiclesProps {
  category: string;
  currentVehicleId: number;
  location: VehicleLocation;
}

export const SimilarVehicles: React.FC<SimilarVehiclesProps> = ({
  category,
  currentVehicleId,
  location
}) => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadSimilarVehicles();
  }, [category, currentVehicleId, location]);

  const loadSimilarVehicles = async () => {
    setLoading(true);
    
    try {
      // Mock data - in real implementation, search for similar vehicles
      const mockVehicles: Vehicle[] = [
        {
          id: 2,
          operator_id: 1,
          registration: 'CA 123 456',
          category: category,
          make: 'Toyota',
          model: 'Corolla',
          year: 2022,
          color: 'Silver',
          vin: 'ABC123456789',
          specifications: {
            engine: { type: 'Inline-4', displacement: 1.8, fuel_type: 'Petrol' },
            transmission: 'Automatic',
            seats: 5,
            doors: 4,
            features: ['GPS', 'Air Conditioning', 'Bluetooth'],
            safety_features: ['ABS', 'Airbags'],
            entertainment: ['Radio', 'USB']
          },
          pricing: {
            base_daily_rate: 450,
            currency: 'ZAR',
            seasonal_adjustments: { peak_multiplier: 1.2, off_peak_multiplier: 0.9 },
            distance_pricing: { included_km_per_day: 200, excess_km_rate: 2.5 },
            cross_border_surcharge: 50,
            security_deposit: 2000
          },
          availability: {
            calendar_type: 'calendar_based',
            advance_booking_days: 30,
            minimum_rental_days: 1,
            maximum_rental_days: 30,
            blocked_dates: [],
            available_times: { start_time: '09:00', end_time: '17:00' }
          },
          cross_border_config: {
            allowed: true,
            countries: ['ZA', 'BW', 'NA'],
            surcharge_percentage: 10,
            required_documents: ['passport', 'license'],
            insurance_requirements: ['third_party']
          },
          verification: { status: 'verified', verified_at: '2024-01-01', documents_verified: ['registration'] },
          status: 'available',
          location: location,
          description: 'Reliable and fuel-efficient sedan perfect for city driving.',
          photos: [
            { id: 1, url: '/vehicle-2-1.jpg', caption: 'Front view', is_primary: true, order_index: 0 },
            { id: 2, url: '/vehicle-2-2.jpg', caption: 'Interior', is_primary: false, order_index: 1 }
          ],
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: 3,
          operator_id: 2,
          registration: 'CA 789 012',
          category: category,
          make: 'Nissan',
          model: 'Sentra',
          year: 2023,
          color: 'White',
          vin: 'DEF123456789',
          specifications: {
            engine: { type: 'Inline-4', displacement: 1.6, fuel_type: 'Petrol' },
            transmission: 'CVT',
            seats: 5,
            doors: 4,
            features: ['GPS', 'Air Conditioning', 'Bluetooth', 'Backup Camera'],
            safety_features: ['ABS', 'Airbags', 'Stability Control'],
            entertainment: ['Touchscreen', 'USB', 'Apple CarPlay']
          },
          pricing: {
            base_daily_rate: 420,
            currency: 'ZAR',
            seasonal_adjustments: { peak_multiplier: 1.15, off_peak_multiplier: 0.85 },
            distance_pricing: { included_km_per_day: 180, excess_km_rate: 3.0 },
            cross_border_surcharge: 45,
            security_deposit: 1800
          },
          availability: {
            calendar_type: 'always_available',
            advance_booking_days: 60,
            minimum_rental_days: 1,
            maximum_rental_days: 45,
            blocked_dates: [],
            available_times: { start_time: '08:00', end_time: '18:00' }
          },
          cross_border_config: {
            allowed: false,
            countries: [],
            surcharge_percentage: 0,
            required_documents: [],
            insurance_requirements: []
          },
          verification: { status: 'verified', verified_at: '2024-01-15', documents_verified: ['registration', 'insurance'] },
          status: 'available',
          location: location,
          description: 'Modern sedan with latest safety features and technology.',
          photos: [
            { id: 3, url: '/vehicle-3-1.jpg', caption: 'Front view', is_primary: true, order_index: 0 }
          ],
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        }
      ];

      // Filter out current vehicle
      const filteredVehicles = mockVehicles.filter(v => v.id !== currentVehicleId);
      
      setVehicles(filteredVehicles);
    } catch (error) {
      console.error('Failed to load similar vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, vehicles.length - 2));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, vehicles.length - 2)) % Math.max(1, vehicles.length - 2));
  };

  const handleVehicleClick = (vehicleId: number) => {
    navigate(`/vehicles/${vehicleId}`);
  };

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Similar Vehicles</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Similar Vehicles</Card.Title>
        </Card.Header>
        <Card.Content>
          <p className="text-gray-500 text-center py-8">
            No similar vehicles found in this area.
          </p>
        </Card.Content>
      </Card>
    );
  }

  const visibleVehicles = vehicles.slice(currentIndex, currentIndex + 3);

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title>Similar Vehicles</Card.Title>
          
          {vehicles.length > 3 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevSlide}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500">
                {currentIndex + 1}-{Math.min(currentIndex + 3, vehicles.length)} of {vehicles.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextSlide}
                disabled={currentIndex >= vehicles.length - 3}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card.Header>
      
      <Card.Content>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="group cursor-pointer"
              onClick={() => handleVehicleClick(vehicle.id)}
            >
              <div className="relative overflow-hidden rounded-lg mb-3">
                <img
                  src={vehicle.photos[0]?.url || '/placeholder-vehicle.jpg'}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-vehicle.jpg';
                  }}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button size="sm" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <Badge 
                    variant={vehicle.status === 'available' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {vehicle.status === 'available' ? 'Available' : 'Limited'}
                  </Badge>
                </div>

                {/* Cross-border Badge */}
                {vehicle.cross_border_config.allowed && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="info" size="sm">
                      Cross-Border
                    </Badge>
                  </div>
                )}
              </div>

              {/* Vehicle Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{vehicle.specifications.seats}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Fuel className="w-4 h-4" />
                    <span>{vehicle.specifications.engine.fuel_type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>4.5</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{vehicle.location.city}</span>
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      <CurrencyDisplay
                        amount={vehicle.pricing.base_daily_rate}
                        currency={vehicle.pricing.currency as CurrencyCode}
                        size="md"
                      />
                    </div>
                    <p className="text-sm text-gray-500">per day</p>
                  </div>
                  
                  {vehicle.verification.status === 'verified' && (
                    <Badge variant="success" size="sm">
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Features Preview */}
                <div className="flex flex-wrap gap-1">
                  {vehicle.specifications.features.slice(0, 3).map((feature, index) => (
                    <Badge key={index} variant="secondary" size="sm">
                      {feature}
                    </Badge>
                  ))}
                  {vehicle.specifications.features.length > 3 && (
                    <Badge variant="gray" size="sm">
                      +{vehicle.specifications.features.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {vehicles.length > 3 && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => navigate(`/search?category=${category}&location=${location.city}`)}
            >
              View All Similar Vehicles
            </Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};