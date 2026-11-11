// @vitest-environment jsdom
import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AdminComisionVentaService } from './admin-comision-venta.service';

describe('AdminComisionVentaService auditoría de comisiones', () => {
  it('envía el contexto del corte, filtro y paginación al endpoint de detalle', () => {
    TestBed.configureTestingModule({
      providers: [AdminComisionVentaService, provideHttpClient(), provideHttpClientTesting()]
    });

    const service = TestBed.inject(AdminComisionVentaService);
    const http = TestBed.inject(HttpTestingController);

    service.obtenerDetalleVentasPorCorte({
      mesCorteBase: '2026-09-01',
      numeroCorte: 1,
      proveedor: 'CLARO',
      idAsesor: 900042,
      fechaLimiteMorosidad: null,
      estado: 'NO_VALIDAS',
      pageNumber: 1,
      pageSize: 12
    }).subscribe();

    const request = http.expectOne((pending) => pending.url.endsWith('/leads/comisiones/ventas-por-corte/detalle'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('mesCorteBase')).toBe('2026-09-01');
    expect(request.request.params.get('numeroCorte')).toBe('1');
    expect(request.request.params.get('proveedor')).toBe('CLARO');
    expect(request.request.params.get('idAsesor')).toBe('900042');
    expect(request.request.params.get('estado')).toBe('NO_VALIDAS');
    expect(request.request.params.get('pageNumber')).toBe('1');
    expect(request.request.params.get('pageSize')).toBe('12');
    request.flush({
      totalLeads: 18,
      totalValidas: 15,
      totalNoValidas: 3,
      page: 1,
      size: 12,
      totalPages: 1,
      totalElements: 3,
      content: []
    });
    http.verify();
  });
});
