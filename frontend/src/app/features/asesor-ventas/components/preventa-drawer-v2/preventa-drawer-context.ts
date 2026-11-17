import { InjectionToken } from '@angular/core';
import { AsesorVentasWorkspaceFacade } from '../../facades/asesor-ventas-workspace.facade';

/**
 * Contexto de la superficie Drawer V2. El contrato conserva la API visual del asesor, pero permite
 * que cada dominio aporte sus reglas de autorización y persistencia sin duplicar el componente.
 */
export const PREVENTA_DRAWER_FACADE = new InjectionToken<AsesorVentasWorkspaceFacade>(
  'PREVENTA_DRAWER_FACADE'
);
