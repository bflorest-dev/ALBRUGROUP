import React, { useMemo, useState } from 'react';
import Flatpickr from 'react-flatpickr';
import { FiCalendar } from 'react-icons/fi';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import 'flatpickr/dist/flatpickr.min.css';
import './FlatpickrDateInput.css';

interface FlatpickrDateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  inputClassName?: string;
  wrapperClassName?: string;
  hasError?: boolean;
  errorMessage?: string;
  showRequiredMessage?: boolean;
}

export const FlatpickrDateInput: React.FC<FlatpickrDateInputProps> = ({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  minDate,
  maxDate,
  disabled = false,
  required = false,
  id,
  name,
  inputClassName,
  wrapperClassName,
  hasError = false,
  errorMessage,
  showRequiredMessage = true,
}) => {
  const [touched, setTouched] = useState(false);
  const sourceInputClassName = 'fp-date-source-input';

  const options = useMemo(
    () => ({
      locale: Spanish,
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      altInputClass: `fp-date-input${inputClassName ? ` ${inputClassName}` : ''}`,
      ariaDateFormat: 'd/m/Y',
      monthSelectorType: 'dropdown' as const,
      disableMobile: true,
      minDate,
      maxDate,
      className: 'fp-theme',
      prevArrow: '<span aria-hidden="true">&#10094;</span>',
      nextArrow: '<span aria-hidden="true">&#10095;</span>',
    }),
    [inputClassName, maxDate, minDate],
  );

  const isRequiredInvalid = required && touched && value.trim().length === 0;
  const isInvalid = hasError || isRequiredInvalid;
  const resolvedErrorMessage = errorMessage || (isRequiredInvalid ? 'Este campo es obligatorio.' : '');

  return (
    <div className={`fp-date-field${wrapperClassName ? ` ${wrapperClassName}` : ''}`}>
      <div className={`fp-date-input-wrap${isInvalid ? ' is-invalid' : ''}${disabled ? ' is-disabled' : ''}`}>
        <Flatpickr
          id={id}
          name={name}
          value={value || ''}
          options={options}
          onChange={(_selectedDates, dateStr) => {
            setTouched(true);
            onChange(dateStr);
          }}
          onClose={() => setTouched(true)}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={sourceInputClassName}
          aria-invalid={isInvalid}
        />
        <FiCalendar className="fp-date-icon" />
      </div>
      {(showRequiredMessage || errorMessage) && resolvedErrorMessage && (
        <span className="fp-date-error">{resolvedErrorMessage}</span>
      )}
    </div>
  );
};
