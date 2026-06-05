import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { AmpliacionContextoResponse } from '../../../shared/models/schedule/ampliacion-contexto-response';
import { AmpliacionHorarioResponse } from '../../../shared/models/schedule/ampliacion-horario-response';
import { RegistrarAmpliacionRequest } from '../../../shared/models/schedule/registrar-ampliacion-request';

/**
 * Endpoints de ampliacion de horario consumidos desde GTR.
 * Sin estado de UI; solo HTTP + DTOs. La fecha se omite: el GTR siempre opera sobre el dia actual,
 * que resuelve el backend en America/Lima.
 */
@Injectable({ providedIn: 'root' })
export class GtrScheduleExtensionService {
  private readonly http = inject(HttpClient);
  private readonly horariosUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/horarios`;

  getContexto(idEmpleado: number): Observable<AmpliacionContextoResponse> {
    return this.http.get<AmpliacionContextoResponse>(
      `${this.horariosUrl}/empleados/${idEmpleado}/ampliaciones/contexto`
    );
  }

  registrarAmpliacion(idEmpleado: number, request: RegistrarAmpliacionRequest): Observable<AmpliacionHorarioResponse> {
    return this.http.post<AmpliacionHorarioResponse>(
      `${this.horariosUrl}/empleados/${idEmpleado}/ampliaciones`,
      request
    );
  }
}
