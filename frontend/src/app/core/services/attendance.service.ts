import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';
import { DetalleDiaResponse } from '../../shared/models/schedule/detalle-dia-response';
import { AsistenciaMesResponse } from '../../shared/models/schedule/asistencia-mes-response';
import { HorarioMesResponse } from '../../shared/models/schedule/horario-mes-response';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly scheduleUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule`;
  // Motor nuevo (rediseno). El mes en vivo y el horario del mes siguen en las rutas viejas (otra vista).
  private readonly attendanceUrl = `${this.scheduleUrl}/asistencia/v2`;

  constructor(private readonly http: HttpClient) {}

  getAsistenciaDia(fecha?: string): Observable<DetalleDiaResponse> {
    const params = fecha ? new HttpParams().set('fecha', fecha) : undefined;
    return this.http.get<DetalleDiaResponse>(`${this.attendanceUrl}/dia`, { params });
  }

  // El motor nuevo usa el reloj del servidor: las acciones no llevan cuerpo.
  registrarIngreso(): Observable<DetalleDiaResponse> {
    return this.http.post<DetalleDiaResponse>(`${this.attendanceUrl}/ingreso`, {});
  }

  registrarSalida(): Observable<DetalleDiaResponse> {
    return this.http.post<DetalleDiaResponse>(`${this.attendanceUrl}/salida`, {});
  }

  iniciarAlmuerzo(bandejaVacia: boolean): Observable<DetalleDiaResponse> {
    return this.http.post<DetalleDiaResponse>(`${this.attendanceUrl}/almuerzo/inicio`, { bandejaVacia, forzado: false });
  }

  finalizarAlmuerzo(): Observable<DetalleDiaResponse> {
    return this.http.post<DetalleDiaResponse>(`${this.attendanceUrl}/almuerzo/fin`, {});
  }

  /** Senal "bandeja vacia": arranca el contador real del almuerzo si aun no empezo (idempotente). */
  notificarBandejaVacia(): Observable<DetalleDiaResponse> {
    return this.http.post<DetalleDiaResponse>(`${this.attendanceUrl}/almuerzo/bandeja-vacia`, {});
  }

  iniciarServicios(): Observable<DetalleDiaResponse> {
    return this.http.post<DetalleDiaResponse>(`${this.attendanceUrl}/servicios/inicio`, {});
  }

  finalizarServicios(): Observable<DetalleDiaResponse> {
    return this.http.post<DetalleDiaResponse>(`${this.attendanceUrl}/servicios/fin`, {});
  }

  iniciarPausaActiva(): Observable<DetalleDiaResponse> {
    return this.http.post<DetalleDiaResponse>(`${this.attendanceUrl}/pausa-activa/inicio`, {});
  }

  finalizarPausaActiva(): Observable<DetalleDiaResponse> {
    return this.http.post<DetalleDiaResponse>(`${this.attendanceUrl}/pausa-activa/fin`, {});
  }

  /** El propio asesor sale de CAPACITACION (volver a ONLINE); no puede activarla. */
  finalizarCapacitacion(): Observable<DetalleDiaResponse> {
    return this.http.post<DetalleDiaResponse>(`${this.attendanceUrl}/capacitacion/fin`, {});
  }

  // --- Vistas viejas (flag-aware, se mantienen hasta Fase 7): mes en vivo + horario del mes ---

  getAsistenciaMes(anio?: number, mes?: number): Observable<AsistenciaMesResponse> {
    let params = new HttpParams();
    if (anio !== undefined) params = params.set('anio', anio);
    if (mes !== undefined) params = params.set('mes', mes);
    return this.http.get<AsistenciaMesResponse>(`${this.scheduleUrl}/asistencia/mes`, { params });
  }

  getHorarioMes(anio?: number, mes?: number): Observable<HorarioMesResponse> {
    let params = new HttpParams();
    if (anio !== undefined) params = params.set('anio', anio);
    if (mes !== undefined) params = params.set('mes', mes);
    return this.http.get<HorarioMesResponse>(`${this.scheduleUrl}/horarios/mes`, { params });
  }
}
