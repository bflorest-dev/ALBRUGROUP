import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';

export interface ActorMomento {
  idPersona: number | null;
  nombre: string | null;
  fecha: string | null;
}

export interface QuienDetalle {
  primeraAsignacion: ActorMomento | null;
  primeraTipificacion: ActorMomento | null;
  ultimaAsignacion: ActorMomento | null;
  ultimaTipificacion: ActorMomento | null;
  mayorTipificacion: ActorMomento | null;
  primeraCodigoTipificacion: string | null;
  ultimaCodigoTipificacion: string | null;
  mayorRangoCodigoTipificacion: string | null;
}

export interface CuandoDetalle {
  primerRegistro: string | null;
  ultimoRegistro: string | null;
  ingresoVenta: string | null;
  fechaInstalacion: string | null;
  ultimaGestionPostventa: string | null;
}

export interface LeadFichaDetalle {
  quien: QuienDetalle;
  cuando: CuandoDetalle;
}

@Injectable({ providedIn: 'root' })
export class LeadFichaDetalleService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_CONSTANTS.gatewayBaseUrl}/leads/ficha-detalle`;

  obtener(idLead: number, etapa: string = 'PREVENTA'): Observable<LeadFichaDetalle> {
    const params = new HttpParams().set('etapa', etapa);
    return this.http.get<LeadFichaDetalle>(`${this.url}/${idLead}`, { params });
  }
}
