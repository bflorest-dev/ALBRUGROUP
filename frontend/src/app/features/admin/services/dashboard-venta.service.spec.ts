// @vitest-environment jsdom
import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { describe, expect, it } from 'vitest';
import { DashboardVentaService } from './dashboard-venta.service';

try {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
} catch {
  // El builder de Angular ya inicializa el entorno cuando ejecuta ng test.
}

describe('DashboardVentaService scope de equipo', () => {
  it('envía idEquipo en catálogo, resumen, tramos y detalle', () => {
    TestBed.configureTestingModule({
      providers: [DashboardVentaService, provideHttpClient(), provideHttpClientTesting()]
    });

    const service = TestBed.inject(DashboardVentaService);
    const http = TestBed.inject(HttpTestingController);

    service.obtenerProveedores(7).subscribe();
    const proveedores = http.expectOne((request) => request.url.endsWith('/leads/venta/dashboard/proveedores'));
    expect(proveedores.request.params.get('idEquipo')).toBe('7');
    proveedores.flush([]);

    service.obtenerDashboard(3, '2026-11-01', '2026-11-30', 7).subscribe();
    const dashboard = http.expectOne((request) => request.url.endsWith('/leads/venta/dashboard'));
    expect(dashboard.request.params.get('idProveedor')).toBe('3');
    expect(dashboard.request.params.get('idEquipo')).toBe('7');
    expect(dashboard.request.params.get('desde')).toBe('2026-11-01');
    expect(dashboard.request.params.get('hasta')).toBe('2026-11-30');
    dashboard.flush({});

    service.obtenerTramos(3, 7).subscribe();
    const tramos = http.expectOne((request) => request.url.endsWith('/leads/venta/dashboard/programados-tramos'));
    expect(tramos.request.params.get('idEquipo')).toBe('7');
    tramos.flush({});

    service.obtenerDetalleUnificado({
      idProveedor: 3,
      idEquipo: 7,
      metrica: 'SIN_INGRESAR'
    }).subscribe();
    const detalle = http.expectOne((request) => request.url.endsWith('/leads/venta/dashboard/detalle'));
    expect(detalle.request.params.get('idEquipo')).toBe('7');
    detalle.flush({});

    http.verify();
  });
});
