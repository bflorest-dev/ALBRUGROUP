// @vitest-environment jsdom
import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BackofficeLeadService } from './backoffice-lead.service';

describe('BackofficeLeadService', () => {
  it('omite idEquipo en la bandeja global de Backoffice', () => {
    TestBed.configureTestingModule({
      providers: [BackofficeLeadService, provideHttpClient(), provideHttpClientTesting()]
    });

    const service = TestBed.inject(BackofficeLeadService);
    const http = TestBed.inject(HttpTestingController);

    service.listarPlataforma(
      { pageNumber: 0, pageSize: 20, sortBy: 'id', direction: 'desc' },
      undefined,
      null
    ).subscribe();

    const request = http.expectOne((pending) => pending.url.endsWith('/leads/venta'));
    expect(request.request.params.has('idEquipo')).toBe(false);
    request.flush({ content: [], totalElements: 0 });
    http.verify();
  });
});
