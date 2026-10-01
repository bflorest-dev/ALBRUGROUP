import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AdminRrhhService } from './admin-rrhh.service';

describe('AdminRrhhService', () => {
  it('envía la fecha de fin al dar de baja un empleado', () => {
    TestBed.configureTestingModule({
      providers: [AdminRrhhService, provideHttpClient(), provideHttpClientTesting()]
    });

    const service = TestBed.inject(AdminRrhhService);
    const http = TestBed.inject(HttpTestingController);
    const request = { fechaFin: '2026-09-30' };

    service.darDeBaja(42, request).subscribe();

    const httpRequest = http.expectOne((pending) => pending.url.endsWith('/rrhh/empleados/42/baja'));
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);
    httpRequest.flush({ id: 42 });
    http.verify();
  });
});
