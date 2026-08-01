import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

/**
 * Una fila de la tabla "Gestión del mes" (espejo del DTO del backend). Cada fila es un grupo de leads
 * por corte, con el recibo/factura que le toca gestionar ese mes. Contadores por estado del periodo;
 * el backend NO envía porcentajes (se calculan en el front). `mesCorteBase` viene como 'yyyy-MM-dd'.
 */
export interface GestionMensualFila {
  mesCorteBase: string;
  numeroCorteBase: number;
  numeroFactura: number;
  etiqueta: string;
  total: number;
  pagadoCliente: number;
  pagadoEmpresa: number;
  impagos: number;
  bajas: number;
}

/** Respuesta del endpoint de gestión mensual. `mesGestion` es 'yyyy-MM-dd' (día 1 del mes). */
export interface GestionMensualResponse {
  mesGestion: string;
  proveedor: string;
  filas: GestionMensualFila[];
}

@Injectable({ providedIn: 'root' })
export class AdminGestionMensualPostventaService {
  private readonly http = inject(HttpClient);
  private readonly leadsUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  /**
   * Métricas de gestión mensual de postventa. Si se omite `mesGestion`, el backend resuelve el mes
   * vigente con la regla del día 15 (día ≥ 15 → mes actual; antes → mes anterior).
   */
  obtenerGestionMensual(mesGestion?: string, proveedor = 'WIN'): Observable<GestionMensualResponse> {
    let params = new HttpParams().set('proveedor', proveedor);
    if (mesGestion) {
      params = params.set('mesGestion', mesGestion);
    }
    return this.http.get<GestionMensualResponse>(
      `${this.leadsUrl}/postventa/facturacion/gestion-mensual`,
      { params }
    );
  }
}
