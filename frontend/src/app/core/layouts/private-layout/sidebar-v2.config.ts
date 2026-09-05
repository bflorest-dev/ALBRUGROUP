import { SidebarDomainDefinition } from './sidebar-item.model';

type SidebarV2RoleConfig = {
  domains: SidebarDomainDefinition[];
};

const adminConfig: SidebarV2RoleConfig = {
  domains: [
    {
      id: 'overview',
      label: 'Vista general',
      description: 'Indicadores, actividad y control diario',
      icon: 'ti ti-layout-dashboard'
    },
    {
      id: 'operation',
      label: 'Operación',
      description: 'Plataformas, campañas y mantenimiento',
      icon: 'ti ti-adjustments-horizontal'
    },
    {
      id: 'people',
      label: 'Personas',
      description: 'Colaboradores, asistencia y empleabilidad',
      icon: 'ti ti-users-group'
    },
    {
      id: 'system',
      label: 'Configuración',
      description: 'Catálogos, equipos y administración',
      icon: 'ti ti-settings-2'
    }
  ]
};

const gtrConfig: SidebarV2RoleConfig = {
  domains: [
    {
      id: 'workspace',
      label: 'Gestión GTR',
      description: 'Bandeja, agenda e historial operativo',
      icon: 'ti ti-headset'
    },
    {
      id: 'insights',
      label: 'Seguimiento',
      description: 'Leads e indicadores de desempeño',
      icon: 'ti ti-chart-histogram'
    }
  ]
};

const backofficeConfig: SidebarV2RoleConfig = {
  domains: [
    {
      id: 'workspace',
      label: 'Gestión Backoffice',
      description: 'Bandeja y ciclo de atención',
      icon: 'ti ti-briefcase'
    },
    {
      id: 'insights',
      label: 'Seguimiento',
      description: 'Indicadores de la operación',
      icon: 'ti ti-chart-histogram'
    }
  ]
};

const salesConfig: SidebarV2RoleConfig = {
  domains: [
    {
      id: 'workspace',
      label: 'Gestión comercial',
      description: 'Bandeja, preventas y jornada operativa',
      icon: 'ti ti-shopping-cart'
    },
    {
      id: 'insights',
      label: 'Rendimiento',
      description: 'Métricas de la gestión comercial',
      icon: 'ti ti-chart-bar'
    }
  ]
};

const salesSupervisorConfig: SidebarV2RoleConfig = {
  domains: [
    {
      id: 'workspace',
      label: 'Supervisión comercial',
      description: 'Monitoreo y gestión del equipo',
      icon: 'ti ti-device-desktop-analytics'
    },
    {
      id: 'insights',
      label: 'Resultados',
      description: 'Indicadores consolidados de venta',
      icon: 'ti ti-chart-histogram'
    }
  ]
};

const postventaConfig: SidebarV2RoleConfig = {
  domains: [
    {
      id: 'workspace',
      label: 'Gestión Postventa',
      description: 'Atención y seguimiento de clientes',
      icon: 'ti ti-lifebuoy'
    },
    {
      id: 'insights',
      label: 'Resultados',
      description: 'Indicadores de la operación postventa',
      icon: 'ti ti-chart-histogram'
    }
  ]
};

const ROLE_CONFIGS: Record<string, SidebarV2RoleConfig> = {
  ADMINISTRADOR: adminConfig,
  RRHH: {
    domains: [
      {
        id: 'people',
        label: 'Gestión de personas',
        description: 'Asistencia y administración del personal',
        icon: 'ti ti-users-group'
      }
    ]
  },
  RECLUTADOR: {
    domains: [
      {
        id: 'recruitment',
        label: 'Selección',
        description: 'Grupos de capacitación y postulantes',
        icon: 'ti ti-user-search'
      }
    ]
  },
  CAPACITADOR: {
    domains: [
      {
        id: 'training',
        label: 'Capacitación',
        description: 'Grupos, asistencia y avance formativo',
        icon: 'ti ti-school'
      }
    ]
  },
  ASESOR_GTR: gtrConfig,
  SUPERVISOR_GTR: gtrConfig,
  ASESOR_VENTAS: salesConfig,
  OJT: salesConfig,
  SUPERVISOR_VENTAS: salesSupervisorConfig,
  ASESOR_BACKOFFICE: backofficeConfig,
  SUPERVISOR_BACKOFFICE: backofficeConfig,
  ASESOR_POSTVENTA: postventaConfig,
  SUPERVISOR_POSTVENTA: postventaConfig,
  COMMUNITY: {
    domains: [
      {
        id: 'workspace',
        label: 'Operación Community',
        description: 'Campañas, mantenimiento y atención diaria',
        icon: 'ti ti-speakerphone'
      },
      {
        id: 'insights',
        label: 'Resultados',
        description: 'Finanzas, métricas e indicadores',
        icon: 'ti ti-chart-histogram'
      }
    ]
  },
  MONITOR: {
    domains: [
      {
        id: 'monitoring',
        label: 'Monitoreo',
        description: 'Vista operativa y seguimiento general',
        icon: 'ti ti-radar'
      }
    ]
  }
};

export function sidebarV2EnabledForRole(primaryRole?: string | null): boolean {
  return Boolean(primaryRole && ROLE_CONFIGS[primaryRole]);
}

export function sidebarDomainsForRole(primaryRole?: string | null): SidebarDomainDefinition[] {
  return primaryRole ? ROLE_CONFIGS[primaryRole]?.domains ?? [] : [];
}
