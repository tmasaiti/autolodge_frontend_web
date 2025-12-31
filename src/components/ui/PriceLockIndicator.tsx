/**
 * Price Lock Indicator Component
 * Shows locked price status and time remaining during booking flow
 */

import React, { useState, useEffect } from 'react';
import { CurrencyCode } from '@autolodge/shared';
import { PriceLock, priceLockService } from '../../services/priceLockService';
import { currencyService } from '../../services/currencyService';
import { Button } from './Button';
import { Badge } from './Badge';

interface PriceLockIndicatorProps {
  priceLock: PriceLock;
  onExtend?: () => void;
  onCancel?: () => void;
  className?: string;
  showActions?: boolean;
}

export const PriceLockIndicator: React.FC<PriceLockIndicatorProps> = ({
  priceLock,
  onExtend,
  onCancel,
  className = '',
  showActions = true,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = priceLockService.getTimeRemaining(priceLock);
      setTimeRemaining(remaining);
      setIsExpired(remaining <= 0);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [priceLock]);

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes <= 0) return 'Expired';
    
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getStatusColor = (): 'success' | 'warning' | 'error' => {
    if (isExpired) return 'error';
    if (timeRemaining <= 2) return 'warning';
    return 'success';
  };

  const handleExtend = async () => {
    try {
      await priceLockService.extendPriceLock(priceLock.id);
      onExtend?.();
    } catch (error) {
      console.error('Failed to extend price lock:', error);
    }
  };

  const handleCancel = async () => {
    try {
      await priceLockService.cancelPriceLock(priceLock.id);
      onCancel?.();
    } catch (error) {
      console.error('Failed to cancel price lock:', error);
    }
  };

  return (
    <div className={`price-lock-indicator bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-blue-900">Price Locked</span>
            <Badge variant={getStatusColor()} size="sm">
              {isExpired ? 'Expired' : 'Active'}
            </Badge>
          </div>
          
          <div className="text-sm text-blue-800 mb-2">
            <div className="font-medium">
              {currencyService.formatCurrency(priceLock.locked_price.amount, priceLock.locked_price.currency)}
            </div>
            <div className="text-xs text-blue-600">
              Locked at {new Date(priceLock.locked_at).toLocaleTimeString()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">
              Time remaining:
            </span>
            <Badge variant={getStatusColor()} size="sm">
              {formatTimeRemaining(timeRemaining)}
            </Badge>
          </div>

          {priceLock.exchange_rates.length > 0 && (
            <div className="mt-2 text-xs text-blue-600">
              Exchange rate locked: 1 {priceLock.exchange_rates[0].from_currency} = {priceLock.exchange_rates[0].rate.toFixed(4)} {priceLock.exchange_rates[0].to_currency}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex flex-col gap-2 ml-4">
            {!isExpired && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExtend}
                className="text-xs"
              >
                Extend +15min
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Cancel Lock
            </Button>
          </div>
        )}
      </div>

      {isExpired && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <strong>Price lock expired!</strong> The price may have changed. Please refresh to get current pricing.
        </div>
      )}

      {timeRemaining <= 2 && timeRemaining > 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <strong>Price lock expiring soon!</strong> Extend the lock or complete your booking quickly.
        </div>
      )}
    </div>
  );
};

interface PriceLockBannerProps {
  vehicleId: number;
  startDate: string;
  endDate: string;
  currency: CurrencyCode;
  onPriceLocked?: (priceLock: PriceLock) => void;
  className?: string;
}

export const PriceLockBanner: React.FC<PriceLockBannerProps> = ({
  vehicleId,
  startDate,
  endDate,
  currency,
  onPriceLocked,
  className = '',
}) => {
  const [isLocking, setIsLocking] = useState(false);
  const [priceLock, setPriceLock] = useState<PriceLock | null>(null);

  const handleLockPrice = async () => {
    setIsLocking(true);
    try {
      const response = await priceLockService.createPriceLock({
        vehicle_id: vehicleId,
        booking_dates: {
          start_date: startDate,
          end_date: endDate,
        },
        user_currency: currency,
        operator_currency: 'USD', // This would come from vehicle data
        base_amount: 0, // This would be calculated by the backend
      });

      setPriceLock(response.price_lock);
      onPriceLocked?.(response.price_lock);
    } catch (error) {
      console.error('Failed to lock price:', error);
    } finally {
      setIsLocking(false);
    }
  };

  if (priceLock) {
    return (
      <PriceLockIndicator
        priceLock={priceLock}
        onExtend={() => {
          // Refresh the price lock data
          priceLockService.getPriceLock(priceLock.id).then(updated => {
            if (updated) setPriceLock(updated);
          });
        }}
        onCancel={() => setPriceLock(null)}
        className={className}
      />
    );
  }

  return (
    <div className={`price-lock-banner bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-yellow-900 mb-1">
            Lock Your Price
          </div>
          <div className="text-sm text-yellow-800">
            Protect yourself from price changes during booking. Lock expires in 15 minutes.
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleLockPrice}
          disabled={isLocking}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          {isLocking ? 'Locking...' : 'Lock Price'}
        </Button>
      </div>
    </div>
  );
};

interface PriceLockSummaryProps {
  priceLock: PriceLock;
  className?: string;
}

export const PriceLockSummary: React.FC<PriceLockSummaryProps> = ({
  priceLock,
  className = '',
}) => {
  return (
    <div className={`price-lock-summary bg-green-50 border border-green-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-green-900">Price Protected</span>
      </div>
      
      <div className="text-sm text-green-800">
        <div className="font-medium">
          {currencyService.formatCurrency(priceLock.locked_price.amount, priceLock.locked_price.currency)}
        </div>
        <div className="text-xs">
          Locked on {new Date(priceLock.locked_at).toLocaleDateString()} at {new Date(priceLock.locked_at).toLocaleTimeString()}
        </div>
      </div>

      {priceLock.exchange_rates.length > 0 && (
        <div className="text-xs text-green-600 mt-1">
          Rate: {priceLock.exchange_rates[0].rate.toFixed(4)} {priceLock.exchange_rates[0].to_currency}/{priceLock.exchange_rates[0].from_currency}
        </div>
      )}
    </div>
  );
};

export default PriceLockIndicator;