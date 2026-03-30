/**
 * Molecule: PhoneNumberInput
 * Combina el Atom PhoneInput con un botón de validación
 * 
 * Regla FSD: Moléculas combinan átomos y pueden ser stateless (puro)
 */

import React, { useState } from 'react';
import { PhoneInput } from '../atoms';
import styles from './PhoneNumberInput.module.css';

export interface PhoneNumberInputProps {
  onValidate: (phoneNumber: string, countryCode?: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  label?: string;
  helperText?: string;
  placeholder?: string;
}

export const PhoneNumberInput = React.forwardRef<
  HTMLInputElement,
  PhoneNumberInputProps
>(
  (
    {
      onValidate,
      isLoading = false,
      error,
      label = 'Número Telefónico',
      helperText = 'Ej: +34 628 123 456',
      placeholder,
    },
    ref
  ) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('');

    const handleValidate = async () => {
      await onValidate(phoneNumber, countryCode || undefined);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleValidate();
      }
    };

    return (
      <div className={styles.container}>
        <div className={styles.inputGroup}>
          <PhoneInput
            ref={ref}
            label={label}
            helperText={helperText}
            placeholder={placeholder}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            error={error}
          />
        </div>

        <div className={styles.countryGroup}>
          <label htmlFor="countryCode" className={styles.label}>
            País (opcional, ISO 3166-1 alpha-2)
          </label>
          <input
            id="countryCode"
            type="text"
            maxLength={2}
            placeholder="ES"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            disabled={isLoading}
            className={styles.countryInput}
          />
        </div>

        <button
          type="button"
          onClick={handleValidate}
          disabled={isLoading || !phoneNumber.trim()}
          className={styles.button}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner} />
              Validando...
            </>
          ) : (
            'Validar'
          )}
        </button>
      </div>
    );
  }
);

PhoneNumberInput.displayName = 'PhoneNumberInput';
