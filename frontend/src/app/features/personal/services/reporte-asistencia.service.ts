import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { ConsultaCumplimientoRequest } from '../../../shared/models/schedule/consulta-cumplimiento-request';
import {
  CumplimientoDetalleResponse,
  CumplimientoResumenResponse
} from '../../../shared/models/schedule/cumplimiento-response';

export interface EmpleadoExportInfo {
  id: number;
  nombre: string;
  dni: string;
  categoria: string;
  rol: string;
}

export interface ExportReporteAsistenciaRequest {
  desde: string;
  hasta: string;
  empleados: EmpleadoExportInfo[];
}

@Injectable({ providedIn: 'root' })
export class ReporteAsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly revisionUrl = `${API_CONSTANTS.gatewayBaseUrl}/schedule/revision/asistencia`;

  getCumplimientoResumen(request: ConsultaCumplimientoRequest): Observable<CumplimientoResumenResponse> {
    return this.http.post<CumplimientoResumenResponse>(`${this.revisionUrl}/cumplimiento/resumen`, request);
  }

  getCumplimientoDetalle(request: ConsultaCumplimientoRequest): Observable<CumplimientoDetalleResponse> {
    return this.http.post<CumplimientoDetalleResponse>(`${this.revisionUrl}/cumplimiento/detalle`, request);
  }

  exportExcel(request: ExportReporteAsistenciaRequest): Observable<Blob> {
    return this.http.post(`${this.revisionUrl}/cumplimiento/export-excel`, request, {
      responseType: 'blob'
    });
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
