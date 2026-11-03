// @vitest-environment jsdom
import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { describe, expect, it } from 'vitest';
import { PreventaLeadService } from './preventa-lead.service';

try {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
} catch {
  // El builder de Angular ya inicializa el entorno cuando ejecuta ng test.
}

describe('PreventaLeadService scope de Supervisor_Ventas', () => {
  it('envía idEquipo en resumen y sin-leads', () => {
    TestBed.configureTestingModule({
      providers: [PreventaLeadService, provideHttpClient(), provideHttpClientTesting()]
    });

    const service = TestBed.inject(PreventaLeadService);
    const http = TestBed.inject(HttpTestingController);

    service.obtenerResumenSupervisor(7).subscribe();
    const resumen = http.expectOne((request) => request.url.endsWith('/preventa/supervisor-ventas/resumen'));
    expect(resumen.request.params.get('idEquipo')).toBe('7');
    resumen.flush([]);

    service.listarSinLeadsDesde([101, 202], 7).subscribe();
    const sinLeads = http.expectOne((request) => request.url.endsWith('/preventa/supervisor-ventas/sin-leads-desde'));
    expect(sinLeads.request.params.get('idsAsesor')).toBe('101,202');
    expect(sinLeads.request.params.get('idEquipo')).toBe('7');
    sinLeads.flush([]);

    http.verify();
  });
});
