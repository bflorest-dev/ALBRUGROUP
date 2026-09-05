import { SidebarDomainDefinition } from './sidebar-item.model';

type SidebarV2RoleConfig = {
  domains: SidebarDomainDefinition[];
};

const ROLE_CONFIGS: Record<string, SidebarV2RoleConfig> = {
  ADMINISTRADOR: {
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
  },
  ASESOR_GTR: {
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
  },
  ASESOR_BACKOFFICE: {
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
  }
};

ROLE_CONFIGS['SUPERVISOR_GTR'] = ROLE_CONFIGS['ASESOR_GTR'];
ROLE_CONFIGS['SUPERVISOR_BACKOFFICE'] = ROLE_CONFIGS['ASESOR_BACKOFFICE'];

export function sidebarV2EnabledForRole(primaryRole?: string | null): boolean {
  return Boolean(primaryRole && ROLE_CONFIGS[primaryRole]);
}

export function sidebarDomainsForRole(primaryRole?: string | null): SidebarDomainDefinition[] {
  return primaryRole ? ROLE_CONFIGS[primaryRole]?.domains ?? [] : [];
}
