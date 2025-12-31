import React, { useState } from 'react';
import { Vehicle } from '../../types/vehicle';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Calendar, 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Car
} from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface BookingCTAProps {
  vehicle: Vehicle;
  onBookingStart: (dates: DateRange) => void;
}

export const BookingCTA: React.FC<BookingCTAProps> = ({ vehicle, onBookingStart }) => {
  const [selectedDates, setSelectedDates] = useState<DateRange | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuickBook = () => {
    if (!selectedDates) {
      // If no dates selected, use default dates (today + minimum rental period)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + 1); // Tomorrow
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + vehicle.availability.minimum_rental_days);
      
      const defaultDates = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      
      onBookingStart(defaultDates);
    } else {
      onBookingStart(selectedDates);
    }
  };

  const handleInstantBook = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate instant booking process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (selectedDates) {
        onBookingStart(selectedDates);
      } else {
        handleQuickBook();
      }
    } catch (error) {
      console.error('Instant booking failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isInstantBookAvailable = vehicle.availability.calendar_type === 'always_available' && 
                                vehicle.verification.status === 'verified';

  const isAvailable = vehicle.status === 'available';

  return (
    <Card>
      <Card.Content className="space-y-4">
        {/* Availability Status */}
        <div className="text-center">
          {isAvailable ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Available for Booking</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Limited Availability</span>
            </div>
          )}
        </div>

        {/* Booking Options */}
        {isAvailable && (
          <div className="space-y-3">
            {/* Instant Book Option */}
            {isInstantBookAvailable && (
              <Button
                onClick={handleInstantBook}
                loading={isProcessing}
                className="w-full"
                size="lg"
              >
                <Car className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Book Instantly'}
              </Button>
            )}

            {/* Regular Booking */}
            <Button
              onClick={handleQuickBook}
              variant={isInstantBookAvailable ? "outline" : "primary"}
              className="w-full"
              size="lg"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {vehicle.availability.calendar_type === 'request_based' ? 'Request to Book' : 'Book Now'}
            </Button>
          </div>
        )}

        {/* Booking Features */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secure payment with escrow protection</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Free cancellation up to 24 hours</span>
          </div>
          
          {vehicle.verification.status === 'verified' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Verified vehicle and operator</span>
            </div>
          )}
        </div>

        {/* Booking Requirements */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Booking Requirements</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>• Valid driver's license required</p>
            <p>• Minimum age: 21 years</p>
            <p>• Security deposit: Refundable upon return</p>
            {vehicle.cross_border_config.allowed && (
              <p>• Cross-border travel: Additional documentation required</p>
            )}
          </div>
        </div>

        {/* Rental Terms */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Rental Terms</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Min rental:</span>
              <span className="ml-1 font-medium">{vehicle.availability.minimum_rental_days} days</span>
            </div>
            <div>
              <span className="text-gray-500">Max rental:</span>
              <span className="ml-1 font-medium">{vehicle.availability.maximum_rental_days} days</span>
            </div>
            <div>
              <span className="text-gray-500">Pickup time:</span>
              <span className="ml-1 font-medium">{vehicle.availability.available_times.start_time}</span>
            </div>
            <div>
              <span className="text-gray-500">Return time:</span>
              <span className="ml-1 font-medium">{vehicle.availability.available_times.end_time}</span>
            </div>
          </div>
        </div>

        {/* Special Badges */}
        <div className="flex flex-wrap gap-2">
          {isInstantBookAvailable && (
            <Badge variant="success" size="sm">
              Instant Book
            </Badge>
          )}
          
          {vehicle.cross_border_config.allowed && (
            <Badge variant="info" size="sm">
              Cross-Border OK
            </Badge>
          )}
          
          {vehicle.specifications.features.includes('GPS') && (
            <Badge variant="secondary" size="sm">
              GPS Included
            </Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="text-center pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Questions? Contact the operator directly
          </p>
          <Button variant="ghost" size="sm" className="mt-1 text-xs">
            Send Message
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
};