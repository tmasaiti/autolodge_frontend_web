import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, CreditCard, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { BookingData } from '../dashboard/BookingList';
import { AvailabilityValidator } from './AvailabilityValidator';
import { PricingBreakdown } from './PricingBreakdown';
import { bookingService } from '../../services/bookingService';
import { AvailabilityResult, PricingCalculationResult } from '../../services/bookingService';

export interface BookingModificationFlowProps {
  bookingId?: number;
}

enum ModificationType {
  DATES = 'dates',
  LOCATIONS = 'locations',
  EXTRAS = 'extras'
}

interface ModificationData {
  type: ModificationType;
  originalBooking: BookingData;
  newDates?: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  newLocations?: {
    pickup?: {
      address: string;
      city: string;
      country: string;
      instructions?: string;
    };
    dropoff?: {
      address: string;
      city: string;
      country: string;
      instructions?: string;
    };
    sameLocation: boolean;
  };
  newExtras?: {
    gpsNavigation: boolean;
    childSeat: { enabled: boolean; quantity: number; ageGroup: string };
    additionalDriver: boolean;
  };
  priceDifference: number;
  newTotalAmount: number;
}

export const BookingModificationFlow: React.FC<BookingModificationFlowProps> = ({ 
  bookingId: propBookingId 
}) => {
  const { bookingId: paramBookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  
  const bookingId = propBookingId || (paramBookingId ? parseInt(paramBookingId) : null);
  
  const [originalBooking, setOriginalBooking] = useState<BookingData | null>(null);
  const [modificationType, setModificationType] = useState<ModificationType | null>(null);
  const [modificationData, setModificationData] = useState<Partial<ModificationData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [pricingResult, setPricingResult] = useState<PricingCalculationResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load original booking
  useEffect(() => {
    if (!bookingId) {
      setError('Invalid booking ID');
      setLoading(false);
      return;
    }

    const loadBooking = async () => {
      try {
        setLoading(true);
        const bookingData = await bookingService.getBooking(bookingId) as BookingData;
        setOriginalBooking(bookingData);
        
        // Initialize modification data with current values
        const typedBookingData = bookingData as BookingData;
        setModificationData({
          originalBooking: typedBookingData,
          newDates: {
            startDate: typedBookingData.date_range.start_date,
            endDate: typedBookingData.date_range.end_date,
            startTime: '10:00',
            endTime: '10:00'
          },
          newLocations: {
            pickup: {
              address: typedBookingData.locations.pickup.address || '',
              city: typedBookingData.locations.pickup.city || '',
              country: typedBookingData.locations.pickup.country || '',
              instructions: typedBookingData.locations.pickup.instructions || ''
            },
            dropoff: {
              address: typedBookingData.locations.dropoff.address || '',
              city: typedBookingData.locations.dropoff.city || '',
              country: typedBookingData.locations.dropoff.country || '',
              instructions: typedBookingData.locations.dropoff.instructions || ''
            },
            sameLocation: typedBookingData.locations.same_location
          },
          priceDifference: 0,
          newTotalAmount: typedBookingData.pricing.total_amount
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId]);

  const handleModificationTypeSelect = (type: ModificationType) => {
    setModificationType(type);
  };

  const handleDateChange = (field: 'startDate' | 'endDate' | 'startTime' | 'endTime', value: string) => {
    setModificationData(prev => ({
      ...prev,
      newDates: {
        ...prev.newDates!,
        [field]: value
      }
    }));
  };

  const handleLocationChange = (
    type: 'pickup' | 'dropoff',
    field: string,
    value: string
  ) => {
    setModificationData(prev => ({
      ...prev,
      newLocations: {
        ...prev.newLocations!,
        [type]: {
          ...prev.newLocations![type]!,
          [field]: value
        }
      }
    }));
  };

  const handleSameLocationToggle = () => {
    setModificationData(prev => ({
      ...prev,
      newLocations: {
        ...prev.newLocations!,
        sameLocation: !prev.newLocations!.sameLocation,
        dropoff: !prev.newLocations!.sameLocation 
          ? prev.newLocations!.pickup 
          : prev.newLocations!.dropoff
      }
    }));
  };

  const handleAvailabilityChange = (available: boolean, result?: AvailabilityResult) => {
    setIsAvailable(available);
  };

  const handlePricingCalculated = (result: PricingCalculationResult) => {
    setPricingResult(result);
    if (originalBooking) {
      const priceDifference = result.pricing.total_amount - originalBooking.pricing.total_amount;
      setModificationData(prev => ({
        ...prev,
        priceDifference,
        newTotalAmount: result.pricing.total_amount
      }));
    }
  };

  const handleConfirmModification = async () => {
    if (!originalBooking || !pricingResult) return;

    setProcessing(true);
    try {
      // Simulate modification API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate back to booking detail with success message
      navigate(`/bookings/${bookingId}`, { 
        state: { message: 'Booking modified successfully!' }
      });
    } catch (err) {
      console.error('Failed to modify booking:', err);
    } finally {
      setProcessing(false);
    }
  };

  const canProceedToConfirmation = () => {
    switch (modificationType) {
      case ModificationType.DATES:
        return isAvailable && pricingResult !== null;
      case ModificationType.LOCATIONS:
        return pricingResult !== null;
      case ModificationType.EXTRAS:
        return pricingResult !== null;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !originalBooking) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            {error || 'Booking not found'}
          </h2>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/bookings/${bookingId}`)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Booking</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Modify Booking #{originalBooking.id}
          </h1>
          <p className="text-neutral-600">
            {originalBooking.vehicle.make} {originalBooking.vehicle.model}
          </p>
        </div>
      </div>

      {/* Modification Type Selection */}
      {!modificationType && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              What would you like to modify?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleModificationTypeSelect(ModificationType.DATES)}
                className="p-6 border-2 border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
              >
                <Calendar className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Change Dates</h3>
                <p className="text-sm text-neutral-600">
                  Modify pickup and return dates or times
                </p>
              </button>
              
              <button
                onClick={() => handleModificationTypeSelect(ModificationType.LOCATIONS)}
                className="p-6 border-2 border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
              >
                <MapPin className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Change Locations</h3>
                <p className="text-sm text-neutral-600">
                  Update pickup or drop-off locations
                </p>
              </button>
              
              <button
                onClick={() => handleModificationTypeSelect(ModificationType.EXTRAS)}
                className="p-6 border-2 border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
              >
                <CreditCard className="h-8 w-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-neutral-900 mb-2">Add/Remove Extras</h3>
                <p className="text-sm text-neutral-600">
                  Modify add-ons and additional services
                </p>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Date Modification */}
      {modificationType === ModificationType.DATES && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Change Rental Dates
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <Input
                    type="date"
                    label="New Pickup Date"
                    value={modificationData.newDates?.startDate || ''}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    label="New Return Date"
                    value={modificationData.newDates?.endDate || ''}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    min={modificationData.newDates?.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    label="Pickup Time"
                    value={modificationData.newDates?.startTime || ''}
                    onChange={(e) => handleDateChange('startTime', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    label="Return Time"
                    value={modificationData.newDates?.endTime || ''}
                    onChange={(e) => handleDateChange('endTime', e.target.value)}
                  />
                </div>
              </div>

              {modificationData.newDates?.startDate && modificationData.newDates?.endDate && (
                <AvailabilityValidator
                  vehicleId={originalBooking.vehicle.id}
                  startDate={modificationData.newDates.startDate}
                  endDate={modificationData.newDates.endDate}
                  startTime={modificationData.newDates.startTime}
                  endTime={modificationData.newDates.endTime}
                  onAvailabilityChange={handleAvailabilityChange}
                />
              )}
            </div>
          </Card>

          {isAvailable && modificationData.newDates && (
            <PricingBreakdown
              vehicleId={originalBooking.vehicle.id}
              startDate={modificationData.newDates.startDate}
              endDate={modificationData.newDates.endDate}
              locations={originalBooking.locations}
              onPricingCalculated={handlePricingCalculated}
            />
          )}
        </div>
      )}

      {/* Location Modification */}
      {modificationType === ModificationType.LOCATIONS && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Change Pickup/Drop-off Locations
            </h2>
            
            <div className="space-y-6">
              {/* Pickup Location */}
              <div>
                <h3 className="font-medium text-neutral-900 mb-3">Pickup Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Address"
                    value={modificationData.newLocations?.pickup?.address || ''}
                    onChange={(e) => handleLocationChange('pickup', 'address', e.target.value)}
                    placeholder="Enter new pickup address"
                  />
                  <Input
                    label="City"
                    value={modificationData.newLocations?.pickup?.city || ''}
                    onChange={(e) => handleLocationChange('pickup', 'city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="mt-4">
                  <Input
                    label="Special Instructions (Optional)"
                    value={modificationData.newLocations?.pickup?.instructions || ''}
                    onChange={(e) => handleLocationChange('pickup', 'instructions', e.target.value)}
                    placeholder="Any special pickup instructions..."
                  />
                </div>
              </div>

              {/* Same Location Toggle */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sameLocation"
                  checked={modificationData.newLocations?.sameLocation || false}
                  onChange={handleSameLocationToggle}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="sameLocation" className="text-sm font-medium text-neutral-700">
                  Return to the same location
                </label>
              </div>

              {/* Drop-off Location */}
              {!modificationData.newLocations?.sameLocation && (
                <div>
                  <h3 className="font-medium text-neutral-900 mb-3">Drop-off Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Address"
                      value={modificationData.newLocations?.dropoff?.address || ''}
                      onChange={(e) => handleLocationChange('dropoff', 'address', e.target.value)}
                      placeholder="Enter new drop-off address"
                    />
                    <Input
                      label="City"
                      value={modificationData.newLocations?.dropoff?.city || ''}
                      onChange={(e) => handleLocationChange('dropoff', 'city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="mt-4">
                    <Input
                      label="Special Instructions (Optional)"
                      value={modificationData.newLocations?.dropoff?.instructions || ''}
                      onChange={(e) => handleLocationChange('dropoff', 'instructions', e.target.value)}
                      placeholder="Any special drop-off instructions..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Price Difference Display */}
      {pricingResult && modificationData.priceDifference !== undefined && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Price Changes
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Original Total:</span>
                <span className="font-medium">
                  {originalBooking.pricing.currency} {originalBooking.pricing.total_amount.toFixed(0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">New Total:</span>
                <span className="font-medium">
                  {pricingResult.pricing.currency} {pricingResult.pricing.total_amount.toFixed(0)}
                </span>
              </div>
              
              <div className="border-t pt-3 flex justify-between items-center text-lg font-bold">
                <span>Price Difference:</span>
                <span className={modificationData.priceDifference! >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {modificationData.priceDifference! >= 0 ? '+' : ''}
                  {originalBooking.pricing.currency} {modificationData.priceDifference!.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setModificationType(null)}
        >
          Change Modification Type
        </Button>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/bookings/${bookingId}`)}
          >
            Cancel
          </Button>
          
          <Button
            variant="primary"
            onClick={() => setShowConfirmation(true)}
            disabled={!canProceedToConfirmation()}
          >
            Review Changes
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        size="lg"
      >
        <Modal.Header>
          <h3 className="text-lg font-semibold text-neutral-900">Confirm Modification</h3>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium">Modification Summary</p>
                  <p className="text-blue-700 text-sm mt-1">
                    Please review your changes before confirming.
                  </p>
                </div>
              </div>
            </div>
            
            {modificationData.priceDifference !== undefined && (
              <div className="text-center">
                <p className="text-neutral-600 mb-2">
                  {modificationData.priceDifference >= 0 
                    ? 'Additional payment required:' 
                    : 'Refund amount:'
                  }
                </p>
                <p className="text-2xl font-bold text-primary-600">
                  {modificationData.priceDifference >= 0 ? '+' : ''}
                  {originalBooking.pricing.currency} {Math.abs(modificationData.priceDifference).toFixed(0)}
                </p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline" onClick={() => setShowConfirmation(false)}>
            Review Again
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmModification}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Confirm Modification'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};