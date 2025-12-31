/**
 * Currency Context Provider
 * Manages currency settings and display configuration across the application
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CurrencyCode } from '@autolodge/shared';
import { currencyService, CurrencyDisplayConfig, PriceDisplayOptions } from '../services/currencyService';

interface CurrencyState {
  userCountry: string | null;
  userCurrency: CurrencyCode | null;
  displayConfig: CurrencyDisplayConfig;
  crossBorderDisplay: 'USD' | 'operator_currency';
  loading: boolean;
  error: string | null;
}

type CurrencyAction =
  | { type: 'SET_USER_COUNTRY'; payload: string | null }
  | { type: 'SET_USER_CURRENCY'; payload: CurrencyCode | null }
  | { type: 'SET_DISPLAY_CONFIG'; payload: CurrencyDisplayConfig }
  | { type: 'SET_CROSS_BORDER_DISPLAY'; payload: 'USD' | 'operator_currency' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

const initialState: CurrencyState = {
  userCountry: null,
  userCurrency: null,
  displayConfig: {
    primary_currency: 'USD',
    show_secondary: false,
  },
  crossBorderDisplay: 'USD',
  loading: false,
  error: null,
};

function currencyReducer(state: CurrencyState, action: CurrencyAction): CurrencyState {
  switch (action.type) {
    case 'SET_USER_COUNTRY':
      return { ...state, userCountry: action.payload };
    case 'SET_USER_CURRENCY':
      return { ...state, userCurrency: action.payload };
    case 'SET_DISPLAY_CONFIG':
      return { ...state, displayConfig: action.payload };
    case 'SET_CROSS_BORDER_DISPLAY':
      return { ...state, crossBorderDisplay: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

interface CurrencyContextType {
  state: CurrencyState;
  updateDisplayConfig: (operatorCountry?: string, operatorCurrency?: CurrencyCode) => void;
  setCrossBorderDisplay: (mode: 'USD' | 'operator_currency') => void;
  getUserCurrency: () => CurrencyCode | null;
  formatPrice: (amount: number, currency: CurrencyCode) => string;
  getDisplayConfig: (operatorCountry?: string, operatorCurrency?: CurrencyCode) => CurrencyDisplayConfig;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(currencyReducer, initialState);

  // Initialize user location and currency on mount
  useEffect(() => {
    const initializeCurrency = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Get user country
        const userCountry = await currencyService.getUserCountry();
        dispatch({ type: 'SET_USER_COUNTRY', payload: userCountry });

        // Determine user's default currency
        if (userCountry) {
          const userCurrency = currencyService.getCountryCurrency(userCountry);
          dispatch({ type: 'SET_USER_CURRENCY', payload: userCurrency });
        }

        // Set initial display config
        const config = currencyService.determineDisplayCurrency({
          user_country: userCountry || undefined,
        });
        dispatch({ type: 'SET_DISPLAY_CONFIG', payload: config });

      } catch (error) {
        console.error('Failed to initialize currency:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize currency settings' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeCurrency();
  }, []);

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('currency_preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        if (preferences.crossBorderDisplay) {
          dispatch({ type: 'SET_CROSS_BORDER_DISPLAY', payload: preferences.crossBorderDisplay });
        }
      } catch (error) {
        console.error('Failed to load currency preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    const preferences = {
      crossBorderDisplay: state.crossBorderDisplay,
    };
    localStorage.setItem('currency_preferences', JSON.stringify(preferences));
  }, [state.crossBorderDisplay]);

  const updateDisplayConfig = (operatorCountry?: string, operatorCurrency?: CurrencyCode) => {
    const options: PriceDisplayOptions = {
      user_country: state.userCountry || undefined,
      operator_country: operatorCountry,
      operator_currency: operatorCurrency,
      cross_border_display: state.crossBorderDisplay,
    };

    const config = currencyService.determineDisplayCurrency(options);
    dispatch({ type: 'SET_DISPLAY_CONFIG', payload: config });
  };

  const setCrossBorderDisplay = (mode: 'USD' | 'operator_currency') => {
    dispatch({ type: 'SET_CROSS_BORDER_DISPLAY', payload: mode });
  };

  const getUserCurrency = (): CurrencyCode | null => {
    return state.userCurrency;
  };

  const formatPrice = (amount: number, currency: CurrencyCode): string => {
    return currencyService.formatCurrency(amount, currency);
  };

  const getDisplayConfig = (operatorCountry?: string, operatorCurrency?: CurrencyCode): CurrencyDisplayConfig => {
    const options: PriceDisplayOptions = {
      user_country: state.userCountry || undefined,
      operator_country: operatorCountry,
      operator_currency: operatorCurrency,
      cross_border_display: state.crossBorderDisplay,
    };

    return currencyService.determineDisplayCurrency(options);
  };

  const contextValue: CurrencyContextType = {
    state,
    updateDisplayConfig,
    setCrossBorderDisplay,
    getUserCurrency,
    formatPrice,
    getDisplayConfig,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyContext;