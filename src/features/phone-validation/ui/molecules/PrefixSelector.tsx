/**
 * Componente PrefixSelector - Select de prefijo telefónico
 * Selector simple que devuelve country_prefix y country_code
 * 
 * Ubicación: src/caracteristicas/phone-validation/ui/molecules/PrefixSelector.tsx
 * 
 * FSD: Feature-Sliced Design
 * - Select con lista de países (con banderas 🇪🇸 🇺🇸 🇲🇽 etc.)
 * - Devuelve `country_prefix` (ej: +34) y `country_code` (ej: ES)
 */

import React from 'react';
import { FormSelect } from '@shared/ui/form-select/FormSelect';
import { getCountryOptions } from '../../model/countries';

export interface PrefixSelectorProps {
  value?: string;
  onChange: (prefix: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

/**
 * Selector de prefijo telefónico con lista de países (con banderas)
 * Devuelve el prefijo (ej: +34) al seleccionar
 */
export const PrefixSelector = React.forwardRef<
  HTMLSelectElement,
  PrefixSelectorProps
>(
  (
    {
      value = '',
      onChange,
      label = 'País - Prefijo Telefónico',
      placeholder = 'Selecciona un país',
      error,
      required = false,
    },
    ref
  ) => {
    const countryOptions = getCountryOptions();

    return (
      <FormSelect
        ref={ref}
        label={label}
        name="prefijo"
        value={value}
        onChange={onChange}
        options={countryOptions}
        placeholder={placeholder}
        required={required}
        error={error}
      />
    );
  }
);

PrefixSelector.displayName = 'PrefixSelector';
