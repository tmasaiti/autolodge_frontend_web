import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { bookingService, AvailabilityCheck, AvailabilityResult } from '../../services/bookingService';
import { Button } from '../ui/Button';

export interface AvailabilityValidatorProps {
  vehicleId: number;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  onAvailabilityChange: (available: boolean, result?: AvailabilityResult) => void;
  className?: string;
}

export const AvailabilityValidator: React.FC<AvailabilityValidatorProps> = ({
  vehicleId,
  startDate,
  endDate,
  startTime,
  endTime,
  onAvailabilityChange,
  className = ''
}) => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<string>('');

  // Debounced availability check
  const checkAvailability = useCallback(async () => {
    if (!startDate || !endDate || !vehicleId) return;

    const checkKey = `${vehicleId}-${startDate}-${endDate}-${startTime}-${endTime}`;
    if (checkKey === lastCheck) return;

    setChecking(true);
    setError(null);
    setLastCheck(checkKey);

    try {
      const request: AvailabilityCheck = {
        vehicle_id: vehicleId,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime
      };

      const availabilityResult = await bookingService.checkAvailability(request);
      setResult(availabilityResult);
      onAvailabilityChange(availabilityResult.available, availabilityResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability';
      setError(errorMessage);
      onAvailabilityChange(false);
    } finally {
      setChecking(false);
    }
  }, [vehicleId, startDate, endDate, startTime, endTime, lastCheck, onAvailabilityChange]);

  // Auto-check availability when dates change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAvailability();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [checkAvailability]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAlternativeDateSelect = (alternativeDate: { start_date: string; end_date: string }) => {
    // This would typically update the parent component's date selection
    console.log('Alternative date selected:', alternativeDate);
    // You could emit an event or call a callback here
  };

  if (checking) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 text-blue-600 animate-spin" />
          <div>
            <p className="text-blue-800 font-medium">Checking availability...</p>
            <p className="text-blue-600 text-sm">
              Verifying dates from {formatDate(startDate)} to {formatDate(endDate)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Availability check failed</p>
            <p className="text-red-600 text-sm mb-3">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkAvailability}
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  if (result.available) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-green-800 font-medium">Vehicle is available!</p>
            <p className="text-green-600 text-sm">
              Ready for pickup on {formatDate(startDate)} and return on {formatDate(endDate)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Vehicle is not available
  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
      <div className="space-y-4">
        {/* Unavailability Notice */}
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="text-orange-800 font-medium">Vehicle not available for selected dates</p>
            <p className="text-orange-600 text-sm">
              There are conflicts with your requested dates from {formatDate(startDate)} to {formatDate(endDate)}
            </p>
          </div>
        </div>

        {/* Conflict Details */}
        {result.conflicts && result.conflicts.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <h4 className="text-sm font-medium text-orange-800 mb-2">Conflicting dates:</h4>
            <div className="space-y-2">
              {result.conflicts.map((conflict, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-orange-700">
                    {formatDate(conflict.start_date)} - {formatDate(conflict.end_date)}
                  </span>
                  <span className="text-orange-600 text-xs bg-orange-100 px-2 py-1 rounded">
                    {conflict.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternative Dates */}
        {result.alternative_dates && result.alternative_dates.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <h4 className="text-sm font-medium text-orange-800 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Suggested alternative dates:
            </h4>
            <div className="space-y-2">
              {result.alternative_dates.map((alternative, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-orange-700">
                    {formatDate(alternative.start_date)} - {formatDate(alternative.end_date)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAlternativeDateSelect(alternative)}
                    className="text-orange-700 border-orange-300 hover:bg-orange-50 text-xs px-3 py-1"
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Refresh */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkAvailability}
            className="text-orange-700 border-orange-300 hover:bg-orange-50"
          >
            Check Again
          </Button>
        </div>
      </div>
    </div>
  );
};