/**
 * Currency Selector Component
 * Allows users to select their preferred currency display options
 */

import React, { useState } from 'react';
import { CurrencyCode } from '@autolodge/shared';
import { CURRENCY_SYMBOLS, SADC_COUNTRIES } from '@autolodge/shared';
import { currencyService, SADC_COUNTRY_CURRENCIES } from '../../services/currencyService';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Button } from './Button';
import { Modal } from './Modal';

interface CurrencySelectorProps {
  value?: CurrencyCode;
  onChange?: (currency: CurrencyCode) => void;
  className?: string;
  disabled?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  showLabel = true,
  size = 'md',
}) => {
  const supportedCurrencies: Array<{ code: CurrencyCode; name: string; symbol: string }> = [
    { code: 'USD', name: 'US Dollar', symbol: CURRENCY_SYMBOLS.USD },
    { code: 'ZAR', name: 'South African Rand', symbol: CURRENCY_SYMBOLS.ZAR },
    { code: 'BWP', name: 'Botswana Pula', symbol: CURRENCY_SYMBOLS.BWP },
    { code: 'NAD', name: 'Namibian Dollar', symbol: CURRENCY_SYMBOLS.NAD },
    { code: 'SZL', name: 'Eswatini Lilangeni', symbol: CURRENCY_SYMBOLS.SZL },
    { code: 'LSL', name: 'Lesotho Loti', symbol: CURRENCY_SYMBOLS.LSL },
    { code: 'MWK', name: 'Malawian Kwacha', symbol: CURRENCY_SYMBOLS.MWK },
    { code: 'ZMW', name: 'Zambian Kwacha', symbol: CURRENCY_SYMBOLS.ZMW },
    { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: CURRENCY_SYMBOLS.ZWL },
    { code: 'MZN', name: 'Mozambican Metical', symbol: CURRENCY_SYMBOLS.MZN },
    { code: 'AOA', name: 'Angolan Kwanza', symbol: CURRENCY_SYMBOLS.AOA },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: CURRENCY_SYMBOLS.TZS },
    { code: 'MUR', name: 'Mauritian Rupee', symbol: CURRENCY_SYMBOLS.MUR },
    { code: 'SCR', name: 'Seychellois Rupee', symbol: CURRENCY_SYMBOLS.SCR },
    { code: 'MGA', name: 'Malagasy Ariary', symbol: CURRENCY_SYMBOLS.MGA },
    { code: 'KMF', name: 'Comorian Franc', symbol: CURRENCY_SYMBOLS.KMF },
  ];

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3',
  };

  return (
    <div className={`currency-selector ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Currency
        </label>
      )}
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value as CurrencyCode)}
        disabled={disabled}
        className={`
          block w-full border border-gray-300 rounded-md shadow-sm
          focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${sizeClasses[size]}
        `}
      >
        <option value="">Select Currency</option>
        {supportedCurrencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code} - {currency.name}
          </option>
        ))}
      </select>
    </div>
  );
};

interface CurrencyPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrencyPreferencesModal: React.FC<CurrencyPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { state, setCrossBorderDisplay } = useCurrency();
  const [crossBorderMode, setCrossBorderMode] = useState<'USD' | 'operator_currency'>(
    state.crossBorderDisplay
  );

  const handleSave = () => {
    setCrossBorderDisplay(crossBorderMode);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <Modal.Header>
        <h2 className="text-lg font-semibold">Currency Display Preferences</h2>
      </Modal.Header>
      
      <Modal.Body>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Your Location
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm">
                <strong>Country:</strong> {state.userCountry || 'Not detected'}
              </div>
              <div className="text-sm mt-1">
                <strong>Default Currency:</strong> {state.userCurrency || 'USD'}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Cross-Border Display Mode
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              When browsing vehicles from other SADC countries, how would you like prices displayed?
            </p>
            
            <div className="space-y-3">
              <label className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="crossBorderMode"
                  value="USD"
                  checked={crossBorderMode === 'USD'}
                  onChange={(e) => setCrossBorderMode(e.target.value as 'USD')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">USD Standard</div>
                  <div className="text-sm text-gray-600">
                    Show all cross-border prices in USD for easy comparison
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="crossBorderMode"
                  value="operator_currency"
                  checked={crossBorderMode === 'operator_currency'}
                  onChange={(e) => setCrossBorderMode(e.target.value as 'operator_currency')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">Operator Currency</div>
                  <div className="text-sm text-gray-600">
                    Show prices in the operator's chosen currency with USD equivalent
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              How Currency Display Works
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div>
                <strong>Same Country:</strong> Prices shown in operator's currency
              </div>
              <div>
                <strong>Cross-SADC:</strong> Based on your preference above
              </div>
              <div>
                <strong>Outside SADC:</strong> All prices shown in USD only
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Preferences
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

interface CountryCurrencyMapProps {
  className?: string;
}

export const CountryCurrencyMap: React.FC<CountryCurrencyMapProps> = ({
  className = '',
}) => {
  const countryNames: Record<string, string> = {
    'AO': 'Angola',
    'BW': 'Botswana',
    'KM': 'Comoros',
    'CD': 'DR Congo',
    'SZ': 'Eswatini',
    'LS': 'Lesotho',
    'MG': 'Madagascar',
    'MW': 'Malawi',
    'MU': 'Mauritius',
    'MZ': 'Mozambique',
    'NA': 'Namibia',
    'SC': 'Seychelles',
    'ZA': 'South Africa',
    'TZ': 'Tanzania',
    'ZM': 'Zambia',
    'ZW': 'Zimbabwe',
  };

  return (
    <div className={`country-currency-map ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        SADC Currency Reference
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {SADC_COUNTRIES.map((countryCode) => {
          const currency = SADC_COUNTRY_CURRENCIES[countryCode];
          const symbol = currency ? CURRENCY_SYMBOLS[currency] : '';
          
          return (
            <div key={countryCode} className="flex justify-between items-center py-1">
              <span className="text-gray-700">
                {countryNames[countryCode] || countryCode}
              </span>
              <span className="font-mono text-gray-600">
                {symbol} {currency}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CurrencySelector;