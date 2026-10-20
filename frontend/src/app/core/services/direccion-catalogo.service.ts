import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../constants/api.constants';
import { TipoDomicilioOption } from '../../shared/models/preventa/preventa.models';

@Injectable({ providedIn: 'root' })
export class DireccionCatalogoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads/direccion/catalogo`;

  listarTiposDomicilio(idProveedor: number): Observable<TipoDomicilioOption[]> {
    return this.http.get<TipoDomicilioOption[]>(`${this.baseUrl}/tipos-domicilio`, {
      params: { idProveedor },
    });
  }

  listarTiposUrbanizacion(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/tipos-urbanizacion`);
  }
}
