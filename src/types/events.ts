/**
 * Tipos seguros para eventos globales de la aplicación
 * Previene errores de tipo en event listeners y dispatch
 */

import type { Applicant, Employee } from './index';

/**
 * Event names tipados y seguros
 */
export const EVENT_NAMES = {
  APPLICANTS_UPDATED: 'applicantsUpdated',
  EMPLOYEES_UPDATED: 'employeesUpdated',
} as const;

/**
 * Custom event types con payloads tipados
 */
export interface ApplicantsUpdatedEvent extends CustomEvent {
  type: typeof EVENT_NAMES.APPLICANTS_UPDATED;
  detail: {
    applicants: Applicant[];
  };
}

export interface EmployeesUpdatedEvent extends CustomEvent {
  type: typeof EVENT_NAMES.EMPLOYEES_UPDATED;
  detail: {
    employees: Employee[];
  };
}

/**
 * Union de todos los eventos de la aplicación
 */
export type AppEvent = ApplicantsUpdatedEvent | EmployeesUpdatedEvent;

/**
 * Helper tipado para disparar eventos
 * Asegura que los tipos de evento y payload sean consistentes
 */
export const dispatchAppEvent = <T extends AppEvent>(
  eventName: T['type'],
  detail: T['detail']
): void => {
  const event = new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
};

/**
 * Helper para escuchar eventos con tipos seguros
 * Uso: listenAppEvent(EVENT_NAMES.APPLICANTS_UPDATED, (applicants) => { ... })
 */
export const listenAppEvent = <T extends AppEvent>(
  eventName: T['type'],
  handler: (detail: T['detail']) => void
): (() => void) => {
  const listener = (event: Event) => {
    if (event instanceof CustomEvent) {
      handler(event.detail as T['detail']);
    }
  };

  window.addEventListener(eventName, listener);

  // Retornar función para unsubscribirse
  return () => window.removeEventListener(eventName, listener);
};
