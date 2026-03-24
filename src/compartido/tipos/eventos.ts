/**
 * Sistema de eventos tipados para la aplicación
 * Permite dispatch y escucha de eventos personalizados de manera type-safe
 */

import type { Applicant, Employee } from '@compartido/tipos';

export const EVENT_NAMES = {
  APPLICANTS_UPDATED: 'applicantsUpdated',
  EMPLOYEES_UPDATED: 'employeesUpdated',
} as const;

/**
 * Evento personalizado cuando los postulantes se actualizan
 */
export interface ApplicantsUpdatedEvent extends CustomEvent {
  detail: Applicant[];
}

/**
 * Evento personalizado cuando los empleados se actualizan
 */
export interface EmployeesUpdatedEvent extends CustomEvent {
  detail: Employee[];
}

/**
 * Union de todos los eventos de la aplicación
 */
export type AppEvent = ApplicantsUpdatedEvent | EmployeesUpdatedEvent;

/**
 * Dispara un evento personalizado de manera type-safe
 * @param eventName - Nombre del evento (del objeto EVENT_NAMES)
 * @param detail - Datos a pasar con el evento
 * @example
 * dispatchAppEvent(EVENT_NAMES.APPLICANTS_UPDATED, applicants);
 */
export const dispatchAppEvent = <T>(eventName: string, detail: T): void => {
  const event = new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
};

/**
 * Escucha un evento personalizado de manera type-safe
 * @param eventName - Nombre del evento (del objeto EVENT_NAMES)
 * @param handler - Función llamada cuando se dispara el evento
 * @returns Función para dejar de escuchar el evento
 * @example
 * const unsubscribe = listenAppEvent(
 *   EVENT_NAMES.APPLICANTS_UPDATED,
 *   (applicants) => console.log(applicants)
 * );
 * unsubscribe(); // Dejar de escuchar
 */
export const listenAppEvent = <T>(
  eventName: string,
  handler: (detail: T) => void
): (() => void) => {
  const listener = (event: Event) => {
    if (event instanceof CustomEvent) {
      handler(event.detail as T);
    }
  };

  window.addEventListener(eventName, listener);

  return () => window.removeEventListener(eventName, listener);
};
