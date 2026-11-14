import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CurrentUserEmpresaScopeService } from '../services/current-user-empresa-scope.service';

/**
 * Adjunta la empresa contratista activa a las requests a /rrhh para que el scope
 * de RRHH quede acotado a la empresa seleccionada.
 */
export const empresaScopeInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/rrhh')) {
    return next(req);
  }
  const empresaScope = inject(CurrentUserEmpresaScopeService);
  const activeId = empresaScope.activeId();
  if (activeId === null) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: {
        'X-Empresa-Contratista-Id': String(activeId)
      }
    })
  );
};
