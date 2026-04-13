/**
 * Página de ejemplo para Phone Validation Feature
 * 
 * Ubicación: src/pages/PhoneValidationPage.tsx
 * Demuestra cómo consumir la feature desde una página (capa superior)
 * 
 * Regla FSD:
 * - Pages importa desde @features (capa inferior)
 * - Pages NO importa de capas superiores (@pages, @widgets, etc.)
 */

import React from 'react';
import {
  usePhoneValidation,
  PhoneNumberInput,
  PhoneValidationResult,
  type PhoneValidationResultType,
} from '@features/phone-validation';
import styles from './PhoneValidationPage.module.css';

export const PhoneValidationPage: React.FC = () => {
  const {
    data,
    loading,
    error,
    validate,
    reset,
  } = usePhoneValidation({
    onSuccess: (result: PhoneValidationResultType) => {
      console.log('✓ Teléfono validado:', result);
    },
    onError: (error: string) => {
      console.error('✗ Error en validación:', error);
    },
  });

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <h1>Validador de Números Telefónicos</h1>
          <p className={styles.subtitle}>
            Verifica números telefónicos con Numverify para obtener información
            del país, operador y más.
          </p>
        </header>

        {/* Main Content */}
        <main className={styles.main}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Ingresa un número</h2>

            <PhoneNumberInput
              onValidate={validate}
              isLoading={loading}
              error={error}
              label="Número Telefónico"
              helperText="Ej: +34 628 123 456 o 628123456"
              placeholder="+34 628 123 456"
            />
          </div>

          {/* Results */}
          {(data || error) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Resultado</h2>
              <PhoneValidationResult
                data={data}
                isLoading={loading}
                error={error}
                onReset={reset}
              />
            </div>
          )}

          {/* Information */}
          <aside className={styles.info}>
            <h3>ℹ️ Información</h3>
            <ul>
              <li>
                Introduce un número con prefijo internacional (ej: +34) o con
                el código de país (ej: ES).
              </li>
              <li>
                La API devuelve: prefijo, país, operador, ubicación, tipo de
                línea.
              </li>
              <li>
                Los datos se obtienen en tiempo real de la base de datos de
                Numverify.
              </li>
            </ul>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default PhoneValidationPage;
