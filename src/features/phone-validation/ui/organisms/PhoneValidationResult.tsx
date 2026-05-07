/**
 * Organism: PhoneValidationResult
 * Muestra los datos enriquecidos de la validación
 * Maneja estados: loading, error, success (valid/invalid)
 * 
 * Regla FSD: Organismos combinan moléculas/átomos
 */

import React from 'react';
import type { NumverifyResponse } from '../../model/types';
import styles from './PhoneValidationResult.module.css';

export interface PhoneValidationResultProps {
  data: NumverifyResponse | null;
  isLoading: boolean;
  error: string | null;
  onReset?: () => void;
}

export const PhoneValidationResult: React.FC<
  PhoneValidationResultProps
> = ({ data, isLoading, error, onReset }) => {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Validando número...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={[styles.resultPanel, styles.error].join(' ')}>
          <div className={styles.errorHeader}>
            <span className={styles.errorIcon}>⚠️</span>
            <h3>Error en la validación</h3>
          </div>
          <p className={styles.errorMessage}>{error}</p>
          {onReset && (
            <button className={styles.resetButton} onClick={onReset}>
              Intentar de nuevo
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const statusClass = data.valid ? styles.valid : styles.invalid;

  return (
    <div className={styles.container}>
      <div className={[styles.resultPanel, statusClass].join(' ')}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>
            {data.valid ? (
              <>
                <span className={styles.successIcon}>✓</span>
                Número válido
              </>
            ) : (
              <>
                <span className={styles.invalidIcon}>✗</span>
                Número inválido
              </>
            )}
          </h3>
        </div>

        {/* Main Data */}
        <div className={styles.mainData}>
          <div className={styles.dataRow}>
            <span className={styles.label}>Número:</span>
            <span className={styles.value}>{data.number}</span>
          </div>

          <div className={styles.dataRow}>
            <span className={styles.label}>Formato local:</span>
            <span className={styles.value}>{data.local_format}</span>
          </div>

          <div className={styles.dataRow}>
            <span className={styles.label}>Formato internacional:</span>
            <span className={styles.value}>{data.international_format}</span>
          </div>

          <div className={styles.dataRow}>
            <span className={styles.label}>Prefijo de país:</span>
            <span className={styles.value}>{data.country_prefix}</span>
          </div>
        </div>

        {/* Country Info */}
        {(data.country_name || data.country_code) && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Información del país</h4>
            <div className={styles.dataRow}>
              <span className={styles.label}>País:</span>
              <span className={styles.value}>{data.country_name}</span>
            </div>
            {data.country_code && (
              <div className={styles.dataRow}>
                <span className={styles.label}>Código ISO:</span>
                <span className={styles.value}>{data.country_code}</span>
              </div>
            )}
            {data.location && (
              <div className={styles.dataRow}>
                <span className={styles.label}>Ubicación:</span>
                <span className={styles.value}>{data.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Network Info */}
        {(data.carrier || data.line_type) && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Información de red</h4>
            {data.carrier && (
              <div className={styles.dataRow}>
                <span className={styles.label}>Operador:</span>
                <span className={styles.value}>{data.carrier}</span>
              </div>
            )}
            {data.line_type && (
              <div className={styles.dataRow}>
                <span className={styles.label}>Tipo de línea:</span>
                <span className={styles.value}>{data.line_type}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {onReset && (
          <div className={styles.actions}>
            <button className={styles.resetButton} onClick={onReset}>
              Nueva validación
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
