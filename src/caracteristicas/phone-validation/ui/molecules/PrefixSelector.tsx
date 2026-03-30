/**
 * Componente PrefixSelector - Input de prefijo telefónico con validación Numverify
 * Carácter minimalista: solo devuelve country_prefix y country_code
 * 
 * Ubicación: src/caracteristicas/phone-validation/ui/molecules/PrefixSelector.tsx
 * 
 * FSD: Feature-Sliced Design
 * - Input simple que valida número de teléfono
 * - Extrae prefijo y código país de Numverify
 * - Devuelve `country_prefix` (ej: +34) y `country_code` (ej: ES)
 */

import React, { useState } from 'react';
import { validatePhone } from '../../api/phoneValidation.api';
import styles from './PrefixSelector.module.css';

export interface PrefixSelectorProps {
  value?: string;
  onChange: (prefix: string) => void;
  label?: string;
  placeholder?: string;
  error?: string | null;
}

interface PrefixData {
  prefix: string; // ej: +34
  code: string;   // ej: ES
  country: string; // ej: Spain
}

/**
 * Selector de prefijo telefónico
 * 1. Usuario ingresa un número
 * 2. Click en "Detectar"
 * 3. API Numverify devuelve country_prefix y country_code
 * 4. Se guarda en el formulario
 */
export const PrefixSelector = React.forwardRef<
  HTMLInputElement,
  PrefixSelectorProps
>(
  (
    {
      value = '',
      onChange,
      label = 'Prefijo Telefónico',
      placeholder = 'Ej: +34 o 628123456',
      error,
    },
    ref
  ) => {
    const [phoneInput, setPhoneInput] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectionError, setDetectionError] = useState<string | null>(null);
    const [detectedPrefix, setDetectedPrefix] = useState<PrefixData | null>(null);

    const handleDetect = async () => {
      if (!phoneInput.trim()) {
        setDetectionError('Ingresa un número para detectar el país');
        return;
      }

      setIsDetecting(true);
      setDetectionError(null);

      try {
        const result = await validatePhone({ number: phoneInput });

        if (!result.valid) {
          setDetectionError('Número no válido. Prueba con otro.');
          setDetectedPrefix(null);
          return;
        }

        const prefix: PrefixData = {
          prefix: result.country_prefix,
          code: result.country_code,
          country: result.country_name,
        };

        setDetectedPrefix(prefix);
        onChange(result.country_prefix);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Error desconocido al validar';
        setDetectionError(errorMsg);
        setDetectedPrefix(null);
      } finally {
        setIsDetecting(false);
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleDetect();
      }
    };

    const handleClearDetection = () => {
      setPhoneInput('');
      setDetectedPrefix(null);
      setDetectionError(null);
      onChange('');
    };

    return (
      <div className={styles.container}>
        <label htmlFor="prefixInput" className={styles.label}>
          {label}
        </label>

        <div className={styles.inputGroup}>
          <input
            id="prefixInput"
            ref={ref}
            type="text"
            className={[
              styles.display,
              error ? styles.displayError : '',
              detectedPrefix ? styles.displaySuccess : '',
            ]
              .filter(Boolean)
              .join(' ')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled
          />
        </div>

        <div className={styles.detectionContainer}>
          <h4 className={styles.sectionTitle}>Detectar prefijo</h4>

          <div className={styles.detectionInputGroup}>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value);
                setDetectionError(null);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa un número completo"
              disabled={isDetecting}
              className={styles.detectionInput}
            />

            <button
              type="button"
              onClick={handleDetect}
              disabled={isDetecting || !phoneInput.trim()}
              className={styles.detectButton}
              aria-busy={isDetecting}
            >
              {isDetecting ? (
                <>
                  <span className={styles.spinner} />
                  Validando...
                </>
              ) : (
                '🔍 Detectar'
              )}
            </button>

            {phoneInput && (
              <button
                type="button"
                onClick={handleClearDetection}
                className={styles.clearButton}
                title="Limpiar"
              >
                ✕
              </button>
            )}
          </div>

          {detectionError && (
            <div className={styles.errorMessage}>{detectionError}</div>
          )}

          {detectedPrefix && (
            <div className={styles.resultBox}>
              <p className={styles.resultLabel}>✓ Detectado:</p>
              <div className={styles.resultData}>
                <span className={styles.prefix}>{detectedPrefix.prefix}</span>
                <span className={styles.code}>{detectedPrefix.code}</span>
                <span className={styles.country}>{detectedPrefix.country}</span>
              </div>
            </div>
          )}
        </div>

        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  }
);

PrefixSelector.displayName = 'PrefixSelector';
