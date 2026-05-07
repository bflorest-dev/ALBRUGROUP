export const routeHelpers = {
  getRedirectPath(roles: string[]): string {
    const rolePathMap: Record<string, string> = {
      'ADMINISTRADOR': '/panel',
      'RRHH': '/rrhh',
      'RECLUTAMIENTO': '/reclutamiento',
      'RECLUTADOR': '/reclutamiento',
      'CAPACITACIÓN': '/capacitacion',
      'COMMUNITY': '/community',
      'GTR': '/gtr',
      'ASESOR_DE_VENTAS': '/asesores',
      'ASESOR_VENTAS': '/asesores',
      'SUPERVISOR_VENTAS': '/asesores',
      'ASESOR_GTR': '/gtr',
      'ASESOR_BACKOFFICE': '/panel',
    };

    for (const role of roles) {
      if (rolePathMap[role]) return rolePathMap[role];
    }
    return '/panel';
  },

  isPublicRoute(path: string): boolean {
    return ['/login'].includes(path);
  },
};
