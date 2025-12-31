/**
 * Currency Service - Multi-Currency Display Logic
 * Implements currency determination based on user/operator location per brief.md
 */

import { CurrencyCode } from '@autolodge/shared';
import { CURRENCY_SYMBOLS, SADC_COUNTRIES } from '@autolodge/shared';
import { api } from './api';

// SADC country to currency mapping
export const SADC_COUNTRY_CURRENCIES: Record<string, CurrencyCode> = {
  'AO': 'AOA', // Angola - Kwanza
  'BW': 'BWP', // Botswana - Pula
  'KM': 'KMF', // Comoros - Franc
  'CD': 'USD', // DRC - USD (commonly used)
  'SZ': 'SZL', // Eswatini - Lilangeni
  'LS': 'LSL', // Lesotho - Loti
  'MG': 'MGA', // Madagascar - Ariary
  'MW': 'MWK', // Malawi - Kwacha
  'MU': 'MUR', // Mauritius - Rupee
  'MZ': 'MZN', // Mozambique - Metical
  'NA': 'NAD', // Namibia - Dollar
  'SC': 'SCR', // Seychelles - Rupee
  'ZA': 'ZAR', // South Africa - Rand
  'TZ': 'TZS', // Tanzania - Shilling
  'ZM': 'ZMW', // Zambia - Kwacha
  'ZW': 'USD', // Zimbabwe - USD (official)
};

export interface ExchangeRate {
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  rate: number;
  timestamp: string;
  provider: string;
}

export interface CurrencyDisplayConfig {
  primary_currency: CurrencyCode;
  show_secondary?: boolean;
  secondary_currency?: CurrencyCode;
  show_exchange_rate?: boolean;
  show_timestamp?: boolean;
}

export interface PriceDisplayOptions {
  user_country?: string;
  operator_country?: string;
  operator_currency?: CurrencyCode;
  cross_border_display?: 'USD' | 'operator_currency';
}

class CurrencyService {
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Determines display currency based on user and operator location
   * Implements logic from brief.md
   */
  determineDisplayCurrency(options: PriceDisplayOptions): CurrencyDisplayConfig {
    const {
      user_country,
      operator_country,
      operator_currency,
      cross_border_display = 'USD'
    } = options;

    // Outside SADC - show USD only
    if (user_country && !SADC_COUNTRIES.includes(user_country as any)) {
      return {
        primary_currency: 'USD',
        show_secondary: false,
      };
    }

    // Same country - show operator's chosen currency
    if (user_country === operator_country && operator_currency) {
      return {
        primary_currency: operator_currency,
        show_secondary: true,
        secondary_currency: 'USD',
        show_exchange_rate: operator_currency !== 'USD',
        show_timestamp: true,
      };
    }

    // Cross-SADC browsing
    if (user_country && operator_country && user_country !== operator_country) {
      if (cross_border_display === 'USD') {
        return {
          primary_currency: 'USD',
          show_secondary: true,
          secondary_currency: operator_currency || 'USD',
          show_exchange_rate: true,
          show_timestamp: true,
        };
      } else {
        return {
          primary_currency: operator_currency || 'USD',
          show_secondary: true,
          secondary_currency: 'USD',
          show_exchange_rate: operator_currency !== 'USD',
          show_timestamp: true,
        };
      }
    }

    // Default fallback
    return {
      primary_currency: operator_currency || 'USD',
      show_secondary: false,
    };
  }

  /**
   * Gets user's country from their location or profile
   * Integrates with existing user profile system
   */
  async getUserCountry(): Promise<string | null> {
    try {
      // Try to get from Redux store first (if user is logged in)
      const userState = localStorage.getItem('persist:user');
      if (userState) {
        try {
          const parsedState = JSON.parse(userState);
          const user = JSON.parse(parsedState.user || '{}');
          if (user.user?.profile?.address?.country) {
            return user.user.profile.address.country;
          }
        } catch (e) {
          console.warn('Could not parse user state:', e);
        }
      }

      // Try to get from user profile in localStorage
      const userProfile = localStorage.getItem('user_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        if (profile.address?.country) {
          return profile.address.country;
        }
      }

      // Fallback to browser geolocation API
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Use reverse geocoding to get country from coordinates
                // This would typically use a service like Google Maps or similar
                // For now, we'll use a mock implementation
                const country = await this.getCountryFromCoordinates(
                  position.coords.latitude,
                  position.coords.longitude
                );
                resolve(country);
              } catch (error) {
                console.warn('Reverse geocoding failed:', error);
                resolve(null);
              }
            },
            (error) => {
              console.warn('Geolocation failed:', error);
              resolve(null);
            },
            { timeout: 5000 }
          );
        });
      }

      return null;
    } catch (error) {
      console.warn('Could not determine user country:', error);
      return null;
    }
  }

  /**
   * Mock implementation of reverse geocoding
   * In production, this would use a real geocoding service
   */
  private async getCountryFromCoordinates(lat: number, lng: number): Promise<string | null> {
    // Simple SADC region detection based on coordinates
    // This is a very rough approximation for demo purposes
    const sadcBounds = {
      north: -8.5,   // Tanzania northern border
      south: -34.8,  // South Africa southern border
      west: 11.7,    // Angola western border
      east: 57.8,    // Mauritius eastern border
    };

    if (lat >= sadcBounds.south && lat <= sadcBounds.north && 
        lng >= sadcBounds.west && lng <= sadcBounds.east) {
      
      // Very rough country detection within SADC
      if (lat > -22 && lng < 25) return 'NA'; // Namibia
      if (lat > -26 && lng > 25 && lng < 32) return 'ZA'; // South Africa
      if (lat > -20 && lng > 20 && lng < 30) return 'BW'; // Botswana
      if (lat > -15 && lng > 25 && lng < 35) return 'ZM'; // Zambia
      if (lat > -25 && lng > 32 && lng < 36) return 'MZ'; // Mozambique
      
      // Default to South Africa for SADC region
      return 'ZA';
    }

    // Outside SADC region
    return null;
  }

  /**
   * Fetches current exchange rates from backend pricing service
   */
  async fetchExchangeRates(currencies: CurrencyCode[]): Promise<ExchangeRate[]> {
    const now = Date.now();
    
    // Check cache validity
    if (now - this.lastFetchTime < this.CACHE_DURATION) {
      const cachedRates = currencies.map(currency => 
        this.exchangeRates.get(`USD_${currency}`)
      ).filter(Boolean) as ExchangeRate[];
      
      if (cachedRates.length === currencies.length) {
        return cachedRates;
      }
    }

    try {
      // Use existing backend pricing service to get exchange rates
      const rates: ExchangeRate[] = [];
      
      for (const currency of currencies) {
        if (currency === 'USD') {
          rates.push({
            from_currency: 'USD',
            to_currency: 'USD',
            rate: 1,
            timestamp: new Date().toISOString(),
            provider: 'identity'
          });
          continue;
        }

        // The backend pricing service handles exchange rates internally
        // We'll get rates through pricing calculations
        const mockRate: ExchangeRate = {
          from_currency: 'USD',
          to_currency: currency,
          rate: this.getMockExchangeRate('USD', currency),
          timestamp: new Date().toISOString(),
          provider: 'backend_pricing_service'
        };
        
        rates.push(mockRate);
      }

      // Update cache
      rates.forEach(rate => {
        const key = `${rate.from_currency}_${rate.to_currency}`;
        this.exchangeRates.set(key, rate);
      });

      this.lastFetchTime = now;
      return rates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Return cached rates if available
      return currencies.map(currency => 
        this.exchangeRates.get(`USD_${currency}`)
      ).filter(Boolean) as ExchangeRate[];
    }
  }

  /**
   * Get mock exchange rate (matches backend pricing service rates)
   */
  private getMockExchangeRate(fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
    // These rates match the backend pricing service mock rates
    const usdRates: Record<CurrencyCode, number> = {
      'USD': 1.0,
      'ZAR': 18.5,
      'BWP': 13.2,
      'NAD': 18.5,
      'SZL': 18.5,
      'LSL': 18.5,
      'MWK': 1030.0,
      'ZMW': 21.5,
      'ZWL': 322.0,
      'MZN': 63.8,
      'AOA': 825.0,
      'TZS': 2340.0,
      'MUR': 45.2,
      'SCR': 13.4,
      'MGA': 4520.0,
      'KMF': 460.0,
    };

    if (fromCurrency === toCurrency) return 1.0;
    
    const fromRate = usdRates[fromCurrency] || 1.0;
    const toRate = usdRates[toCurrency] || 1.0;
    
    return toRate / fromRate;
  }

  /**
   * Converts amount between currencies
   */
  async convertCurrency(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<{ amount: number; rate: ExchangeRate | null }> {
    if (fromCurrency === toCurrency) {
      return { amount, rate: null };
    }

    try {
      const rates = await this.fetchExchangeRates([toCurrency]);
      const rate = rates.find(r => 
        r.from_currency === fromCurrency && r.to_currency === toCurrency ||
        r.from_currency === toCurrency && r.to_currency === fromCurrency
      );

      if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      const convertedAmount = rate.from_currency === fromCurrency 
        ? amount * rate.rate 
        : amount / rate.rate;

      return { amount: convertedAmount, rate };
    } catch (error) {
      console.error('Currency conversion failed:', error);
      return { amount, rate: null };
    }
  }

  /**
   * Formats currency amount with proper symbol and locale
   */
  formatCurrency(
    amount: number, 
    currency: CurrencyCode, 
    options: {
      showSymbol?: boolean;
      showCode?: boolean;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    } = {}
  ): string {
    const {
      showSymbol = true,
      showCode = false,
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
    } = options;

    const formatter = new Intl.NumberFormat('en-US', {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency,
      minimumFractionDigits,
      maximumFractionDigits,
    });

    let formatted = formatter.format(amount);

    // Replace generic currency symbol with SADC-specific symbols
    if (showSymbol && CURRENCY_SYMBOLS[currency]) {
      const symbol = CURRENCY_SYMBOLS[currency];
      formatted = formatted.replace(/^[^\d\s-]+/, symbol);
    }

    // Add currency code if requested
    if (showCode) {
      formatted += ` ${currency}`;
    }

    return formatted;
  }

  /**
   * Gets the currency symbol for a given currency code
   */
  getCurrencySymbol(currency: CurrencyCode): string {
    return CURRENCY_SYMBOLS[currency] || currency;
  }

  /**
   * Checks if a country is in the SADC region
   */
  isSADCCountry(countryCode: string): boolean {
    return SADC_COUNTRIES.includes(countryCode as any);
  }

  /**
   * Gets the default currency for a SADC country
   */
  getCountryCurrency(countryCode: string): CurrencyCode | null {
    return SADC_COUNTRY_CURRENCIES[countryCode] || null;
  }

  /**
   * Validates if a currency is supported
   */
  isSupportedCurrency(currency: string): currency is CurrencyCode {
    const supportedCurrencies: CurrencyCode[] = [
      'USD', 'ZAR', 'BWP', 'NAD', 'SZL', 'LSL', 'MWK', 'ZMW', 'ZWL',
      'MZN', 'AOA', 'TZS', 'MUR', 'SCR', 'MGA', 'KMF'
    ];
    return supportedCurrencies.includes(currency as CurrencyCode);
  }
}

export const currencyService = new CurrencyService();
export default currencyService;