/**
 * Price Lock Service
 * Implements price consistency during booking flow per brief.md requirements
 * Integrates with existing backend pricing and booking services
 */

import { CurrencyCode } from '@autolodge/shared';
import { currencyService, ExchangeRate } from './currencyService';
import { api } from './api';

export interface PriceLock {
  id: string;
  booking_session_id: string;
  vehicle_id: number;
  locked_at: string;
  expires_at: string;
  locked_price: {
    amount: number;
    currency: CurrencyCode;
  };
  exchange_rates: ExchangeRate[];
  status: 'active' | 'expired' | 'used' | 'cancelled';
  user_id?: number;
}

export interface PriceLockRequest {
  vehicle_id: number;
  booking_dates: {
    start_date: string;
    end_date: string;
  };
  user_currency?: CurrencyCode;
  operator_currency: CurrencyCode;
  base_amount: number;
}

export interface PriceLockResponse {
  price_lock: PriceLock;
  locked_until: string;
  price_breakdown: {
    base_amount: number;
    currency: CurrencyCode;
    exchange_rate?: ExchangeRate;
    converted_amount?: number;
    converted_currency?: CurrencyCode;
  };
}

class PriceLockService {
  private activeLocks: Map<string, PriceLock> = new Map();
  private readonly LOCK_DURATION_MINUTES = 15; // 15 minutes default lock duration

  /**
   * Creates a price lock using the existing backend pricing service
   * This integrates with the backend's exchange rate locking mechanism
   */
  async createPriceLock(request: PriceLockRequest): Promise<PriceLockResponse> {
    try {
      // Use existing backend pricing endpoint to get pricing with locked rates
      const pricingResponse = await api.get(`/search/vehicles/${request.vehicle_id}/pricing`, {
        params: {
          startDate: request.booking_dates.start_date,
          endDate: request.booking_dates.end_date,
          currency: request.user_currency || request.operator_currency,
        }
      });

      const pricing = pricingResponse.data as {
        totalAmount: number;
        currency: CurrencyCode;
        exchangeRate?: number;
      };
      
      // Generate unique session ID
      const sessionId = this.generateSessionId();

      // Create price lock object that matches backend expectations
      const priceLock: PriceLock = {
        id: this.generateLockId(),
        booking_session_id: sessionId,
        vehicle_id: request.vehicle_id,
        locked_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000).toISOString(),
        locked_price: {
          amount: pricing.totalAmount,
          currency: pricing.currency,
        },
        exchange_rates: pricing.exchangeRate ? [{
          from_currency: request.operator_currency,
          to_currency: pricing.currency,
          rate: pricing.exchangeRate,
          timestamp: new Date().toISOString(),
          provider: 'backend_pricing_service'
        }] : [],
        status: 'active',
      };

      // Store lock locally for quick access
      this.activeLocks.set(priceLock.id, priceLock);
      
      // Store session info in localStorage for booking flow continuity
      localStorage.setItem(`price_lock_${sessionId}`, JSON.stringify(priceLock));

      return {
        price_lock: priceLock,
        locked_until: priceLock.expires_at,
        price_breakdown: {
          base_amount: pricing.totalAmount,
          currency: pricing.currency,
          exchange_rate: priceLock.exchange_rates[0] || undefined,
          converted_amount: pricing.totalAmount,
          converted_currency: pricing.currency,
        }
      };
    } catch (error) {
      console.error('Failed to create price lock:', error);
      throw new Error('Unable to lock price. Please try again.');
    }
  }

  /**
   * Retrieves an active price lock by ID
   */
  async getPriceLock(lockId: string): Promise<PriceLock | null> {
    try {
      // Check local cache first
      const cachedLock = this.activeLocks.get(lockId);
      if (cachedLock && this.isLockActive(cachedLock)) {
        return cachedLock;
      }

      // Check localStorage for session data
      const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('price_lock_'));
      for (const key of sessionKeys) {
        try {
          const lock = JSON.parse(localStorage.getItem(key) || '{}');
          if (lock.id === lockId && this.isLockActive(lock)) {
            this.activeLocks.set(lockId, lock);
            return lock;
          }
        } catch (e) {
          // Invalid session data, remove it
          localStorage.removeItem(key);
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to retrieve price lock:', error);
      return null;
    }
  }

  /**
   * Extends an existing price lock
   */
  async extendPriceLock(lockId: string, additionalMinutes: number = 15): Promise<PriceLock | null> {
    try {
      const lock = await this.getPriceLock(lockId);
      if (!lock) return null;

      // Extend the expiry time
      const newExpiryTime = new Date(Date.now() + additionalMinutes * 60 * 1000);
      lock.expires_at = newExpiryTime.toISOString();

      // Update cache and localStorage
      this.activeLocks.set(lockId, lock);
      localStorage.setItem(`price_lock_${lock.booking_session_id}`, JSON.stringify(lock));

      return lock;
    } catch (error) {
      console.error('Failed to extend price lock:', error);
      return null;
    }
  }

  /**
   * Uses a price lock during booking creation
   * This will be called when the booking is confirmed to mark the lock as used
   */
  async usePriceLock(lockId: string, bookingId: number): Promise<boolean> {
    try {
      const lock = this.activeLocks.get(lockId);
      if (lock) {
        lock.status = 'used';
        this.activeLocks.set(lockId, lock);
        
        // Remove from localStorage as it's no longer needed
        localStorage.removeItem(`price_lock_${lock.booking_session_id}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to use price lock:', error);
      return false;
    }
  }

  /**
   * Cancels an active price lock
   */
  async cancelPriceLock(lockId: string): Promise<boolean> {
    try {
      const lock = this.activeLocks.get(lockId);
      if (lock) {
        lock.status = 'cancelled';
        this.activeLocks.set(lockId, lock);
        
        // Remove from localStorage
        localStorage.removeItem(`price_lock_${lock.booking_session_id}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to cancel price lock:', error);
      return false;
    }
  }

  /**
   * Checks if a price lock is still active
   */
  isLockActive(lock: PriceLock): boolean {
    const now = new Date();
    const expiresAt = new Date(lock.expires_at);
    return lock.status === 'active' && now < expiresAt;
  }

  /**
   * Gets time remaining for a price lock in minutes
   */
  getTimeRemaining(lock: PriceLock): number {
    const now = new Date();
    const expiresAt = new Date(lock.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }

  /**
   * Calculates the locked price with current exchange rates
   */
  private async calculateLockedPrice(
    request: PriceLockRequest,
    exchangeRates: ExchangeRate[]
  ): Promise<{ amount: number; currency: CurrencyCode }> {
    // If user currency is same as operator currency, no conversion needed
    if (!request.user_currency || request.user_currency === request.operator_currency) {
      return {
        amount: request.base_amount,
        currency: request.operator_currency,
      };
    }

    // Find appropriate exchange rate
    const rate = exchangeRates.find(r => 
      (r.from_currency === request.operator_currency && r.to_currency === request.user_currency) ||
      (r.from_currency === request.user_currency && r.to_currency === request.operator_currency)
    );

    if (!rate) {
      // Fallback to operator currency if no rate available
      return {
        amount: request.base_amount,
        currency: request.operator_currency,
      };
    }

    // Convert to user currency
    const convertedAmount = rate.from_currency === request.operator_currency
      ? request.base_amount * rate.rate
      : request.base_amount / rate.rate;

    return {
      amount: convertedAmount,
      currency: request.user_currency,
    };
  }

  /**
   * Generates a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique lock ID
   */
  private generateLockId(): string {
    return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleans up expired locks from local cache
   */
  cleanupExpiredLocks(): void {
    const now = new Date();
    for (const [lockId, lock] of this.activeLocks.entries()) {
      const expiresAt = new Date(lock.expires_at);
      if (now >= expiresAt || lock.status !== 'active') {
        this.activeLocks.delete(lockId);
      }
    }
  }

  /**
   * Gets all active locks for debugging/admin purposes
   */
  getActiveLocks(): PriceLock[] {
    this.cleanupExpiredLocks();
    return Array.from(this.activeLocks.values());
  }
}

export const priceLockService = new PriceLockService();

// Cleanup expired locks every 5 minutes
setInterval(() => {
  priceLockService.cleanupExpiredLocks();
}, 5 * 60 * 1000);

export default priceLockService;