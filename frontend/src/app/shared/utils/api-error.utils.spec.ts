import { describe, expect, it } from 'vitest';
import { formatApiErrorMessage } from './api-error.utils';

describe('formatApiErrorMessage', () => {
  it('prioriza el mensaje funcional anidado en HttpErrorResponse', () => {
    const error = {
      status: 400,
      message: 'Http failure response for http://localhost:8080/schedule: 400 Bad Request',
      error: {
        status: 400,
        error: 'Bad Request',
        message: 'No se puede restablecer el día porque el empleado está trabajando ese tramo'
      }
    };

    expect(formatApiErrorMessage(error, 'No fue posible completar la operación.'))
      .toBe('No se puede restablecer el día porque el empleado está trabajando ese tramo');
  });

  it('oculta mensajes técnicos cuando el servidor no entrega una explicación funcional', () => {
    const error = {
      status: 0,
      message: 'Http failure response for http://localhost:8080/schedule: 0 Unknown Error',
      error: {}
    };

    expect(formatApiErrorMessage(error, 'No se pudo conectar con el servicio.'))
      .toBe('No se pudo conectar con el servicio.');
  });

  it('conserva mensajes funcionales directos del API', () => {
    expect(formatApiErrorMessage({ status: 409, message: 'La jornada ya está cerrada' }, 'Fallback'))
      .toBe('La jornada ya está cerrada');
  });
});
