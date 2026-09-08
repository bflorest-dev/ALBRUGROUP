import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CurrentUserProviderScopeService } from '../services/current-user-provider-scope.service';

/**
 * Adjunta el proveedor y ámbito activos a las requests a /leads para que las bandejas
 * de BACKOFFICE / POSTVENTA queden acotadas y nunca se mezclen.
 */
export const proveedorScopeInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/leads')) {
    return next(req);
  }
  const providerScope = inject(CurrentUserProviderScopeService);
  const activeId = providerScope.activeId();
  const operationalScope = providerScope.operationalScope();
  if (activeId === null && operationalScope === null) {
    return next(req);
  }
  const headers: Record<string, string> = {};
  if (activeId !== null) {
    headers['X-Proveedor-Id'] = String(activeId);
  }
  if (operationalScope !== null) {
    headers['X-Operational-Scope'] = operationalScope;
  }
  return next(
    req.clone({
      setHeaders: headers
    })
  );
};
