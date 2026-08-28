import { AbstractControl, ValidationErrors } from '@angular/forms';

const LETTER_REGEX = /\p{L}/u;
const VALID_PERSON_NAME_REGEX = /^\p{L}+(?: \p{L}+)*$/u;

export function normalizePersonNameInput(value: string): string {
  let normalized = '';
  let previousWasSpace = false;

  for (const char of value) {
    if (LETTER_REGEX.test(char)) {
      normalized += char;
      previousWasSpace = false;
      continue;
    }

    if (/\s/u.test(char) && normalized && !previousWasSpace) {
      normalized += ' ';
      previousWasSpace = true;
    }
  }

  return normalized;
}

export function normalizePersonNameFinal(value: string): string {
  return normalizePersonNameInput(value).trim();
}

export function isValidPersonName(value: string | null | undefined): boolean {
  const normalized = value?.trim() ?? '';
  return !normalized || VALID_PERSON_NAME_REGEX.test(normalized);
}

export function personNameValidator(control: AbstractControl<string | null>): ValidationErrors | null {
  return isValidPersonName(control.value) ? null : { personName: true };
}
