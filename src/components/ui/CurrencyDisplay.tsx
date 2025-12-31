/**
 * Currency Display Components
 * Handles multi-currency display with exchange rates and timestamps
 */

import React, { useState, useEffect } from 'react';
import { CurrencyCode } from '@autolodge/shared';
import { currencyService, CurrencyDisplayConfig, ExchangeRate } from '../../services/currencyService';
import { Button } from './Button';
import { Badge } from './Badge';

interface CurrencyDisplayProps {
  amount: number;
  currency: CurrencyCode;
  config?: CurrencyDisplayConfig;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showToggle?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  config,
  className = '',
  size = 'md',
  showToggle = false,
}) => {
  const [displayConfig, setDisplayConfig] = useState<CurrencyDisplayConfig>(
    config || { primary_currency: currency, show_secondary: false }
  );
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [secondaryAmount, setSecondaryAmount] = useState<number | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) {
      setDisplayConfig(config);
    }
  }, [config]);

  useEffect(() => {
    const loadSecondaryAmount = async () => {
      if (displayConfig.show_secondary && displayConfig.secondary_currency) {
        setLoading(true);
        try {
          const result = await currencyService.convertCurrency(
            amount,
            displayConfig.primary_currency,
            displayConfig.secondary_currency
          );
          setSecondaryAmount(result.amount);
          setExchangeRate(result.rate);
        } catch (error) {
          console.error('Failed to load secondary currency amount:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadSecondaryAmount();
  }, [amount, displayConfig]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
  };

  const primaryFormatted = currencyService.formatCurrency(
    amount,
    displayConfig.primary_currency
  );

  const secondaryFormatted = secondaryAmount && displayConfig.secondary_currency
    ? currencyService.formatCurrency(secondaryAmount, displayConfig.secondary_currency)
    : null;

  const handleToggleSecondary = () => {
    setShowSecondary(!showSecondary);
  };

  return (
    <div className={`currency-display ${className}`}>
      <div className={`primary-amount ${sizeClasses[size]}`}>
        {primaryFormatted}
        {displayConfig.primary_currency !== 'USD' && (
          <span className="ml-1 text-xs text-gray-500">
            {displayConfig.primary_currency}
          </span>
        )}
      </div>

      {displayConfig.show_secondary && (showSecondary || !showToggle) && (
        <div className="secondary-amount mt-1">
          {loading ? (
            <div className="text-xs text-gray-400">Converting...</div>
          ) : secondaryFormatted ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                ≈ {secondaryFormatted}
              </span>
              {displayConfig.show_exchange_rate && exchangeRate && (
                <Badge variant="secondary" size="sm">
                  1 {displayConfig.primary_currency} = {exchangeRate.rate.toFixed(4)} {displayConfig.secondary_currency}
                </Badge>
              )}
            </div>
          ) : null}

          {displayConfig.show_timestamp && exchangeRate && (
            <div className="text-xs text-gray-400 mt-1">
              Rate updated: {new Date(exchangeRate.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {showToggle && displayConfig.show_secondary && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleSecondary}
          className="mt-1 text-xs"
        >
          {showSecondary ? 'Hide' : 'Show'} {displayConfig.secondary_currency} equivalent
        </Button>
      )}
    </div>
  );
};

interface PriceComparisonProps {
  prices: Array<{
    amount: number;
    currency: CurrencyCode;
    label?: string;
  }>;
  baseCurrency?: CurrencyCode;
  className?: string;
}

export const PriceComparison: React.FC<PriceComparisonProps> = ({
  prices,
  baseCurrency = 'USD',
  className = '',
}) => {
  const [convertedPrices, setConvertedPrices] = useState<Array<{
    original: number;
    converted: number;
    currency: CurrencyCode;
    label?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const convertPrices = async () => {
      setLoading(true);
      try {
        const converted = await Promise.all(
          prices.map(async (price) => {
            if (price.currency === baseCurrency) {
              return {
                original: price.amount,
                converted: price.amount,
                currency: price.currency,
                label: price.label,
              };
            }

            const result = await currencyService.convertCurrency(
              price.amount,
              price.currency,
              baseCurrency
            );

            return {
              original: price.amount,
              converted: result.amount,
              currency: price.currency,
              label: price.label,
            };
          })
        );

        setConvertedPrices(converted);
      } catch (error) {
        console.error('Failed to convert prices:', error);
      } finally {
        setLoading(false);
      }
    };

    convertPrices();
  }, [prices, baseCurrency]);

  if (loading) {
    return (
      <div className={`price-comparison ${className}`}>
        <div className="text-sm text-gray-500">Converting prices...</div>
      </div>
    );
  }

  return (
    <div className={`price-comparison ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-2">
        Price Comparison (in {baseCurrency})
      </div>
      <div className="space-y-2">
        {convertedPrices.map((price, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {price.label || `Option ${index + 1}`}
            </span>
            <div className="text-right">
              <div className="font-medium">
                {currencyService.formatCurrency(price.converted, baseCurrency)}
              </div>
              {price.currency !== baseCurrency && (
                <div className="text-xs text-gray-500">
                  ({currencyService.formatCurrency(price.original, price.currency)})
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CurrencyConverterProps {
  amount: number;
  fromCurrency: CurrencyCode;
  toCurrencies: CurrencyCode[];
  className?: string;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  amount,
  fromCurrency,
  toCurrencies,
  className = '',
}) => {
  const [conversions, setConversions] = useState<Array<{
    currency: CurrencyCode;
    amount: number;
    rate: ExchangeRate | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const convertToAll = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          toCurrencies.map(async (currency) => {
            const result = await currencyService.convertCurrency(
              amount,
              fromCurrency,
              currency
            );
            return {
              currency,
              amount: result.amount,
              rate: result.rate,
            };
          })
        );

        setConversions(results);
      } catch (error) {
        console.error('Failed to convert currencies:', error);
      } finally {
        setLoading(false);
      }
    };

    convertToAll();
  }, [amount, fromCurrency, toCurrencies]);

  if (loading) {
    return (
      <div className={`currency-converter ${className}`}>
        <div className="text-sm text-gray-500">Loading conversions...</div>
      </div>
    );
  }

  return (
    <div className={`currency-converter ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-3">
        {currencyService.formatCurrency(amount, fromCurrency)} converts to:
      </div>
      <div className="grid grid-cols-2 gap-3">
        {conversions.map((conversion) => (
          <div key={conversion.currency} className="bg-gray-50 p-3 rounded-lg">
            <div className="font-medium">
              {currencyService.formatCurrency(conversion.amount, conversion.currency)}
            </div>
            {conversion.rate && (
              <div className="text-xs text-gray-500 mt-1">
                Rate: {conversion.rate.rate.toFixed(4)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyDisplay;