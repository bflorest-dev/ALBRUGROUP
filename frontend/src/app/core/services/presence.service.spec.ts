// @vitest-environment jsdom
import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { describe, expect, it } from 'vitest';
import { AttendanceStatusState } from '../state/attendance-status.state';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { PresenceService } from './presence.service';

try {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
} catch {
  // El builder de Angular ya inicializa el entorno cuando ejecuta ng test.
}

describe('PresenceService monitoreo de Supervisor_Ventas', () => {
  it('envía idEquipo en las dos consultas de monitoreo', () => {
    TestBed.configureTestingModule({
      providers: [
        PresenceService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: SessionService,
          useValue: { session: () => null }
        },
        {
          provide: TokenService,
          useValue: { getAccessToken: () => null }
        },
        AttendanceStatusState
      ]
    });

    const service = TestBed.inject(PresenceService);
    const http = TestBed.inject(HttpTestingController);

    service.listarAsesoresSupervisor(7).subscribe();
    const conectados = http.expectOne((request) => request.url.endsWith('/monitor/supervisor-ventas/asesores-ventas/conectados'));
    expect(conectados.request.params.get('idEquipo')).toBe('7');
    conectados.flush([]);

    service.listarEsperadosNoConectados(7).subscribe();
    const esperados = http.expectOne((request) => request.url.endsWith('/monitor/supervisor-ventas/asesores-ventas/esperados-no-conectados'));
    expect(esperados.request.params.get('idEquipo')).toBe('7');
    esperados.flush([]);

    http.verify();
  });
});
