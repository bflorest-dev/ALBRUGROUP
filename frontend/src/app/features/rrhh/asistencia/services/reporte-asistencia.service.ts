import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, of, switchMap, Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../../core/constants/api.constants';
import { ResumenMensualResponse } from '../../../../shared/models/schedule/resumen-mensual-response';

export interface EmpleadoReporteAsistencia {
  idEmpleado: number;
  nombreCompleto: string;
  numeroDocumento: string;
  rolPrincipal: string | null;
  modalidad: string | null;
  fechaIngreso: string | null;
  fechaBaja: string | null;
  diasConsiderados: number;
}

export interface FilaReporteAsistencia {
  empleado: EmpleadoReporteAsistencia;
  resumen: ResumenMensualResponse | null;
}

@Injectable({ providedIn: 'root' })
export class ReporteAsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly rrhhUrl = `${API_CONSTANTS.gatewayBaseUrl}/rrhh/empleados`;
  private readonly scheduleUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/asistencia/reporte-mensual`;

  cargar(anio: number, mes: number): Observable<FilaReporteAsistencia[]> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);

    return this.http.get<EmpleadoReporteAsistencia[]>(`${this.rrhhUrl}/reporte-asistencia`, { params }).pipe(
      switchMap(empleados => {
        if (!empleados.length) return of([]);

        const ids = empleados.map(e => e.idEmpleado).join(',');
        const bulkParams = new HttpParams().set('anio', anio).set('mes', mes).set('ids', ids);

        return this.http.get<ResumenMensualResponse[]>(`${this.scheduleUrl}/bulk`, { params: bulkParams }).pipe(
          map(resumenes => {
            const resumenMap = new Map(resumenes.map(r => [r.idEmpleado, r]));
            return empleados.map(emp => ({
              empleado: emp,
              resumen: resumenMap.get(emp.idEmpleado) ?? null
            }));
          })
        );
      })
    );
  }

  recalcular(anio: number, mes: number, ids: number[]): Observable<ResumenMensualResponse[]> {
    const params = new HttpParams().set('anio', anio).set('mes', mes).set('ids', ids.join(','));
    return this.http.post<ResumenMensualResponse[]>(`${this.scheduleUrl}/recalcular`, null, { params });
  }
}
