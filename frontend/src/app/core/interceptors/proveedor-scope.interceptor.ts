import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CurrentUserProviderScopeService } from '../services/current-user-provider-scope.service';

/**
 * Adjunta el proveedor activo (header X-Proveedor-Id) a las requests a /leads para que las bandejas
 * de BACKOFFICE / POSTVENTA queden acotadas a un solo proveedor y nunca se mezclen. Si el usuario no
 * está acotado por proveedor (no hay activo), no toca la request.
 */
export const proveedorScopeInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/leads')) {
    return next(req);
  }
  const providerScope = inject(CurrentUserProviderScopeService);
  const activeId = providerScope.activeId();
  if (activeId === null) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: {
        'X-Proveedor-Id': String(activeId)
      }
    })
  );
};
