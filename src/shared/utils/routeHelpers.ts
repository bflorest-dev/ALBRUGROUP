export const routeHelpers = {
  getRedirectPath(roles: string[]): string {
    const rolePathMap: Record<string, string> = {
      'ADMINISTRADOR': '/panel',
      'RRHH': '/rrhh',
      'RECLUTAMIENTO': '/reclutamiento',
      'CAPACITACIÓN': '/capacitacion',
      'COMMUNITY': '/community',
      'GTR': '/gtr',
      'ASESOR_DE_VENTAS': '/asesores',
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
