import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).getToken();
  const isPublicAuthRequest =
    req.url.includes('/auth/autorizacion/login') ||
    req.url.includes('/auth/autorizacion/forgot-password') ||
    req.url.includes('/auth/autorizacion/estado-acceso/');

  if (!token || isPublicAuthRequest) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};
