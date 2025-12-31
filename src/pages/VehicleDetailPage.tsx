import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Vehicle } from '../types/vehicle';
import { vehicleService } from '../services/vehicleService';
import { VehicleImageGallery } from '../components/vehicle/VehicleImageGallery';
import { VehicleHeader } from '../components/vehicle/VehicleHeader';
import { VehicleSpecifications } from '../components/vehicle/VehicleSpecifications';
import { VehicleFeatures } from '../components/vehicle/VehicleFeatures';
import { OperatorProfile } from '../components/vehicle/OperatorProfile';
import { PricingCard } from '../components/vehicle/PricingCard';
import { AvailabilityCalendar } from '../components/vehicle/AvailabilityCalendar';
import { BookingCTA } from '../components/vehicle/BookingCTA';
import { VehicleReviews } from '../components/vehicle/VehicleReviews';
import { SimilarVehicles } from '../components/vehicle/SimilarVehicles';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Share2, Heart, MapPin } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const loadVehicle = async () => {
      if (!id) {
        setError('Vehicle ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const vehicleData = await vehicleService.getVehicle(parseInt(id));
        setVehicle(vehicleData);
      } catch (err) {
        setError('Failed to load vehicle details');
        console.error('Error loading vehicle:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [id]);

  const handleBookingStart = (dates: DateRange) => {
    if (vehicle) {
      navigate(`/booking/${vehicle.id}`, {
        state: { vehicle, selectedDates: dates }
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && vehicle) {
      try {
        await navigator.share({
          title: `${vehicle.make} ${vehicle.model} - AutoLodge`,
          text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} available for rent`,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    // TODO: Implement favorite functionality with backend
  };

  if (loading) {
    return <VehicleDetailSkeleton />;
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vehicle Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested vehicle could not be found.'}</p>
          <Button onClick={() => navigate('/search')}>
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Navigation and Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            variant="ghost"
            onClick={toggleFavorite}
            className={`flex items-center gap-2 ${isFavorited ? 'text-red-500' : ''}`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            {isFavorited ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Vehicle Status Badge */}
      <div className="mb-4">
        <Badge 
          variant={vehicle.status === 'available' ? 'success' : 'warning'}
          size="md"
        >
          {vehicle.status === 'available' ? 'Available' : 'Limited Availability'}
        </Badge>
        {vehicle.cross_border_config.allowed && (
          <Badge variant="info" size="md" className="ml-2">
            Cross-Border Capable
          </Badge>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <VehicleImageGallery images={vehicle.photos} />
          
          {/* Vehicle Header */}
          <VehicleHeader vehicle={vehicle} />
          
          {/* Vehicle Specifications */}
          <VehicleSpecifications specs={vehicle.specifications} />
          
          {/* Vehicle Features */}
          <VehicleFeatures features={vehicle.specifications.features} />
          
          {/* Operator Profile */}
          <OperatorProfile operatorId={vehicle.operator_id} />
          
          {/* Reviews */}
          <VehicleReviews vehicleId={vehicle.id} />
        </div>

        {/* Right Column - Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Pricing Card */}
            <PricingCard pricing={vehicle.pricing} />
            
            {/* Availability Calendar */}
            <AvailabilityCalendar 
              vehicleId={vehicle.id}
              availability={vehicle.availability}
            />
            
            {/* Booking CTA */}
            <BookingCTA 
              vehicle={vehicle}
              onBookingStart={handleBookingStart}
            />
            
            {/* Location Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">Location</span>
              </div>
              <p className="text-sm text-gray-600">
                {vehicle.location.city}, {vehicle.location.country}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {vehicle.location.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Vehicles */}
      <div className="mt-12">
        <SimilarVehicles 
          category={vehicle.category}
          currentVehicleId={vehicle.id}
          location={vehicle.location}
        />
      </div>
    </div>
  );
}

// Loading skeleton component
const VehicleDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="animate-pulse">
        {/* Navigation skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-10 w-20 bg-gray-200 rounded"></div>
          <div className="flex gap-3">
            <div className="h-10 w-16 bg-gray-200 rounded"></div>
            <div className="h-10 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Badge skeleton */}
        <div className="mb-4">
          <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
        </div>

        {/* Main content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Image gallery skeleton */}
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            
            {/* Content blocks skeleton */}
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};