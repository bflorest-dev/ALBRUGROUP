/**
 * NAMING CONVENTIONS AND DTO GUIDE
 * 
 * Punto #8 (Consistency) - Guía centralizada de convenciones de nombres y DTOs
 * 
 * Última actualización: 10 de Marzo de 2026
 * Versión: 1.0
 */

export const CONSISTENCY_GUIDE = {
  /**
   * ============================================================================
   * 1. IMPORTS CENTRALIZADOS
   * ============================================================================
   * Todos los tipos deben importarse de @shared/types/
   */
  imports: `
    // Enumeraciones centralizadas
    import { 
      LeadChannel, 
      LeadFollowUpStatus, 
      LeadTipification,
      AdvisorStatus,
      POISCountry,
      AdvisorArea,
      BusinessUnit,
      ErrorCategory 
    } from '@shared/types/enums';

    // DTOs centralizados
    import type { 
      LeadDTO, 
      CreateLeadRequest, 
      LeadResponse, 
      LeadFilterCriteria, 
      LeadStatistics,
      NewLeadFormData 
    } from '@shared/types/lead.types';

    import type { 
      AdvisorDTO, 
      AdvisorSummary, 
      AdvisorPerformance, 
      CreateAdvisorRequest, 
      UpdateAdvisorRequest 
    } from '@shared/types/advisor.types';
  `,

  /**
   * ============================================================================
   * 2. PROPIEDADES DTO - LEAD (antes vs ahora)
   * ============================================================================
   */
  leadProperties: {
    before: {
      reasigned: 'number',
      alias: 'string',
      followUp: 'string (literal)',
      channel: 'string (literal)',
      businessUnit: 'string (literal)',
    },
    after: {
      reassignmentCount: 'number',           // Cambio: reasigned → reassignmentCount
      aliasName: 'string | undefined',       // Cambio: alias → aliasName
      followUp: 'LeadFollowUpStatus (enum)', // Cambio: string → enum
      channel: 'LeadChannel (enum)',         // Cambio: string → enum
      businessUnit: 'BusinessUnit (enum)',   // Cambio: string → enum
    }
  },

  /**
   * ============================================================================
   * 3. PROPIEDADES DTO - ADVISOR (antes vs ahora)
   * ============================================================================
   */
  advisorProperties: {
    before: {
      assigned: 'number',
      managed: 'number',
      status: 'string (literal)',
      area: 'string',
    },
    after: {
      assignedLeads: 'number',                  // Cambio: assigned → assignedLeads
      managedLeads: 'number',                   // Cambio: managed → managedLeads
      status: 'AdvisorStatus (enum)',           // Cambio: string → enum
      area: 'AdvisorArea (enum)',               // Cambio: string → AdvisorArea enum
      id: 'string (agregado)',                  // Agregado
      isActive: 'boolean (agregado)',           // Agregado
      utilizationRate: 'number (agregado)',     // Agregado
    }
  },

  /**
   * ============================================================================
   * 4. ENUMERACIONES DISPONIBLES
   * ============================================================================
   */
  enumerations: {
    LeadChannel: ['Facebook', 'Instagram', 'WhatsApp'],
    LeadFollowUpStatus: ['Nuevo', 'En gestión', 'Gestionado', 'Asignado'],
    LeadTipification: [
      'Sin tipificar',
      '0 - SIN CONTACTO',
      '1 - SEGUIMIENTO',
      '2 - AGENDADOS',
      '3 - RECHAZADO',
      '4 - PREVENTA INCOMPLETA',
      '5 - PREVENTA',
      '6 - PDTE SCORE/PREVENTA',
      '7 - PREVENTA COMPLETA',
      '8 - LISTA NEGRA',
    ],
    AdvisorStatus: ['Disponible', 'Ocupado', 'Saturado'],
    AdvisorArea: ['Norte', 'Sur', 'Centro', 'Este', 'Oeste'],
    BusinessUnit: ['Telefonía Hogar', 'Internet Empresas', 'Móviles', 'Cable'],
    POISCountry: ['CO', 'MX', 'PE'],
  },

  /**
   * ============================================================================
   * 5. PATTERN DE USO - HOOKS
   * ============================================================================
   */
  hookerUsagePattern: `
    // ✅ CORRECTO: Importar tipos centralizados
    import type { LeadDTO } from '@shared/types/lead.types';
    import type { AdvisorDTO } from '@shared/types/advisor.types';
    import { LeadChannel, AdvisorStatus } from '@shared/types/enums';

    // Crear alias para compatibilidad
    export type Lead = LeadDTO;

    // Usar en interfaz de return
    export const useLeads = (): LeadDTO[] => {
      // ...
    };

    // ❌ INCORRECTO: Definir tipos locales duplicados
    // export interface Lead { ... } // NO HACER ESTO
  `,

  /**
   * ============================================================================
   * 6. PATTERN DE USO - COMPONENTES
   * ============================================================================
   */
  componentUsagePattern: `
    // ✅ CORRECTO: Importar tipos centralizados
    import type { LeadDTO } from '@shared/types/lead.types';
    
    interface LeadsTableProps {
      leads: LeadDTO[];
      onSelect?: (lead: LeadDTO) => void;
    }

    export const LeadsTable: React.FC<LeadsTableProps> = ({ leads }) => {
      return (
        <table>
          {leads.map(lead => (
            <tr key={lead.id}>
              <td>{lead.firstName}</td>
              <td>{lead.channel}</td> {/* Ya es LeadChannel enum */}
              <td>{lead.reassignmentCount}</td> {/* Property name correcto */}
            </tr>
          ))}
        </table>
      );
    };

    // ❌ INCORRECTO: Duplicar tipos locales
    // interface Lead { ... } // NO HACER ESTO
  `,

  /**
   * ============================================================================
   * 7. ACCESO A PROPIEDADES - ANTES vs AHORA
   * ============================================================================
   */
  propertyAccessPatterns: {
    Lead: {
      before: `
        lead.alias            // ❌ Incorrecto
        lead.reasigned        // ❌ Incorrecto
        lead.followUp         // ✅ Correcto pero sin tipado
      `,
      after: `
        lead.aliasName              // ✅ Correcto
        lead.reassignmentCount      // ✅ Correcto
        lead.followUp               // ✅ Correcto y tipado: LeadFollowUpStatus
        lead.channel                // ✅ Correcto y tipado: LeadChannel
        lead.businessUnit           // ✅ Correcto y tipado: BusinessUnit
      `
    },
    Advisor: {
      before: `
        advisor.assigned      // ❌ Incorrecto
        advisor.managed       // ❌ Incorrecto
        advisor.status        // ✅ Correcto pero sin tipado
      `,
      after: `
        advisor.assignedLeads         // ✅ Correcto
        advisor.managedLeads          // ✅ Correcto
        advisor.status                // ✅ Correcto y tipado: AdvisorStatus
        advisor.area                  // ✅ Correcto y tipado: AdvisorArea
        advisor.utilizationRate       // ✅ Nuevo
      `
    }
  },

  /**
   * ============================================================================
   * 8. MIGRACIÓN - CHECKLIST
   * ============================================================================
   * Cuando actualices un archivo existente:
   */
  migrationChecklist: [
    '[ ] Reemplazar interface local Lead con import de LeadDTO',
    '[ ] Reemplazar interface local Advisor con import de AdvisorDTO',
    '[ ] Actualizar `alias` → `aliasName` en props/accesos',
    '[ ] Actualizar `reasigned` → `reassignmentCount` en props/accesos',
    '[ ] Actualizar `assigned` → `assignedLeads` en props/accesos',
    '[ ] Actualizar `managed` → `managedLeads` en props/accesos',
    '[ ] Cambiar string literals a enums: LeadChannel, AdvisorStatus, etc',
    '[ ] Verificar que no hay interfaz de Lead/Advisor duplicada',
    '[ ] Usar type alias: `type Lead = LeadDTO` para compatibilidad backwards',
  ],

  /**
   * ============================================================================
   * 9. CAMBIOS DE NOMENCLATURA RESUMIDOS
   * ============================================================================
   */
  namingChanges: [
    {
      category: 'Lead Properties',
      changes: [
        'reasigned → reassignmentCount (explícito, mejor nombrado)',
        'alias → aliasName (evita reserved keyword)',
        'channel: string → channel: LeadChannel (type-safe)',
        'followUp: string → followUp: LeadFollowUpStatus (type-safe)',
        'businessUnit: string → businessUnit: BusinessUnit (type-safe)',
      ]
    },
    {
      category: 'Advisor Properties',
      changes: [
        'assigned → assignedLeads (claridad: Leads Assigned)',
        'managed → managedLeads (claridad: Leads Managed)',
        'status: string → status: AdvisorStatus (type-safe)',
        'area: string → area: AdvisorArea (type-safe)',
        '[NEW] id: string',
        '[NEW] isActive: boolean',
        '[NEW] utilizationRate: number',
      ]
    }
  ],

  /**
   * ============================================================================
   * 10. BENEFICIOS DE LA CENTRALIZACIÓN
   * ============================================================================
   */
  benefits: [
    '✅ Single Source of Truth: Todos usan las mismas definiciones',
    '✅ Type Safety: Enums en lugar de string literals (previene typos)',
    '✅ Documentación Centralizada: Un único lugar para cambios',
    '✅ Fácil Mantenimiento: Si cambia un DTO, se actualiza en un único sitio',
    '✅ Mejor DX: ID e intellisense mejorado en editores IDE',
    '✅ Menos Bugs: Evita duplicación de lógica de validación',
    '✅ Refactoring Seguro: Cambiar propiedades afecta todo automáticamente',
  ],

  /**
   * ============================================================================
   * 11. ARCHIVOS ACTUALIZADOS - Punto #8
   * ============================================================================
   */
  filesUpdated: [
    '✅ src/shared/types/enums.ts (NUEVO - 120 líneas)',
    '✅ src/shared/types/lead.types.ts (NUEVO - 140 líneas)',
    '✅ src/shared/types/advisor.types.ts (NUEVO - 160 líneas)',
    '✅ src/features/SUPERVISOR_GTR/hooks/useLeadsData.ts (actualizado)',
    '✅ src/features/SUPERVISOR_GTR/hooks/useLeadsManagement.ts (actualizado)',
    '✅ src/features/SUPERVISOR_GTR/pages/GTRDashboard.tsx (actualizado)',
    '✅ src/features/SUPERVISOR_GTR/components/LeadsSection.tsx (actualizado)',
    '✅ src/features/SUPERVISOR_GTR/components/AdvisorsSection.tsx (actualizado)',
  ],

  /**
   * ============================================================================
   * 12. PRÓXIMOS PASOS
   * ============================================================================
   */
  nextSteps: [
    '1. Crear tests unitarios para DTOs y enums',
    '2. Documentar en Storybook los tipos esperados para cada componente',
    '3. Actualizar otros features (COMMUNITY, ASESOR_VENTAS, etc)',
    '4. Crear migrations script si hay datos históricos',
    '5. Añadir ESLint rules para prevenir definiciones locales duplicadas',
  ]
}
