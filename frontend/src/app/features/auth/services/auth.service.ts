import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { UsuarioResponse } from '../../../shared/models/auth/usuario-response';
import { CredencialesResponse } from '../../../shared/models/auth/credenciales-response';
import { EstadoAccesoResponse } from '../../../shared/models/auth/estado-acceso-response';
import { ForgotPasswordRequest } from '../../../shared/models/auth/forgot-password-request';
import { LoginRequest } from '../../../shared/models/auth/login-request';
import { LoginResponse } from '../../../shared/models/auth/login-response';
import { LogoutRequest } from '../../../shared/models/auth/logout-request';
import { RefreshRequest } from '../../../shared/models/auth/refresh-request';
import { RefreshResponse } from '../../../shared/models/auth/refresh-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authUrl = `${API_CONSTANTS.gatewayBaseUrl}${API_CONSTANTS.authBasePath}`;

  constructor(private readonly http: HttpClient) {}

  getEstadoAcceso(username: string): Observable<EstadoAccesoResponse> {
    return this.http.get<EstadoAccesoResponse>(
      `${this.authUrl}/estado-acceso/${encodeURIComponent(username.trim())}`
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<CredencialesResponse> {
    return this.http.post<CredencialesResponse>(`${this.authUrl}/forgot-password`, request);
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, request);
  }

  refresh(request: RefreshRequest): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${this.authUrl}/refresh`, request);
  }

  logout(request: LogoutRequest): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/logout`, request);
  }

  getUsuarioPorEmpleadoId(empleadoId: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.authUrl}/${empleadoId}/empleado`);
  }
}
