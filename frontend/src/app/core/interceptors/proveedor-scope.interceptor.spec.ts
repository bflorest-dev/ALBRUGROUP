// @vitest-environment jsdom
import '@angular/compiler';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CurrentUserProviderScopeService } from '../services/current-user-provider-scope.service';
import { proveedorScopeInterceptor } from './proveedor-scope.interceptor';

describe('proveedorScopeInterceptor', () => {
  it('envía el proveedor activo para aislar la bandeja global', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CurrentUserProviderScopeService,
          useValue: { activeId: () => 2, operationalScope: () => 'BACKOFFICE' }
        },
        provideHttpClient(withInterceptors([proveedorScopeInterceptor])),
        provideHttpClientTesting()
      ]
    });

    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(CurrentUserProviderScopeService);

    TestBed.inject(HttpClient).get('/api/leads/venta').subscribe();

    const request = http.expectOne('/api/leads/venta');
    expect(request.request.headers.get('X-Proveedor-Id')).toBe('2');
    expect(request.request.headers.get('X-Operational-Scope')).toBe('BACKOFFICE');
    request.flush({ content: [], totalElements: 0 });
    http.verify();
  });
});
