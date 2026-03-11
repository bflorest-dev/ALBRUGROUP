/**
 * CONSTANTES DE TIPIFICACIÓN
 * 
 * Datos centralizados de los bloques de tipificación
 * para ASESOR_BACKOFFICE y módulos relacionados.
 */

import type { TipificationBlock } from '@shared/types';

/**
 * Bloques de tipificación con todas sus opciones
 * Estructura jerárquica: Bloque → Opciones
 */
export const TIPIFICATION_BLOCKS: TipificationBlock[] = [
  {
    id: 'conversion',
    icon: '✅',
    label: 'CONVERSIÓN EXITOSA',
    description: 'Cliente está interesado y compró o compraría próximamente',
    color: '#10B981',
    status: 'success',
    options: [
      {
        id: 'venta_cerrada',
        label: 'Venta Cerrada',
        description: 'Cliente compró en el momento de la llamada'
      },
      {
        id: 'venta_mes_siguiente',
        label: 'Venta Mes Siguiente',
        description: 'Cliente compró pero la instalación es mes siguiente'
      }
    ]
  },
  {
    id: 'follow_up',
    icon: '⏸️',
    label: 'REQUIERE SEGUIMIENTO',
    description: 'Necesita gestión adicional para convertir o agendar',
    color: '#F59E0B',
    status: 'pending',
    options: [
      {
        id: 'agendado',
        label: 'Agendado para...',
        description: 'Cliente reprogramó para otra fecha',
        requiresDate: true
      },
      {
        id: 'consultar_familia',
        label: 'Consultar con Familiar',
        description: 'Debe consultar con alguien más antes de decidir'
      },
      {
        id: 'llamada_interrumpida',
        label: 'Llamada Interrumpida',
        description: 'La llamada se cortó o fue interrumpida'
      },
      {
        id: 'gestion_chat',
        label: 'Gestión x Chat',
        description: 'Continuará por WhatsApp u otro canal de mensajería'
      }
    ]
  },
  {
    id: 'rejection',
    icon: '❌',
    label: 'RECHAZO',
    description: 'Cliente rechazó la oferta de forma definitiva',
    color: '#EF4444',
    status: 'rejected',
    options: [
      {
        id: 'zona_f',
        label: 'Zona F',
        description: 'No hay cobertura en su zona'
      },
      {
        id: 'vc_desaprobada',
        label: 'VC Desaprobada',
        description: 'Validación de crédito fue rechazada'
      },
      {
        id: 'no_desea',
        label: 'No Desea',
        description: 'Cliente rechazó la oferta directamente'
      },
      {
        id: 'no_califica',
        label: 'No Califica',
        description: 'No cumple con los requisitos de la oferta'
      }
    ]
  },
  {
    id: 'no_contact',
    icon: '📲',
    label: 'SIN CONTACTO',
    description: 'No se logró establecer contacto con el cliente',
    color: '#6B7280',
    status: 'no-contact',
    options: [
      {
        id: 'no_contesta',
        label: 'No Contesta',
        description: 'El cliente no respondió la llamada'
      },
      {
        id: 'numero_equivocado',
        label: 'Nº Equivocado',
        description: 'El número no corresponde al cliente'
      },
      {
        id: 'buzon',
        label: 'Buzón',
        description: 'El número está desconectado o buzón de voz'
      },
      {
        id: 'fuera_servicio',
        label: 'Fuera de Servicio',
        description: 'El número no tiene servicio activo'
      }
    ]
  }
];

/**
 * Mapa de bloques por ID para acceso rápido
 */
export const TIPIFICATION_BLOCKS_MAP = TIPIFICATION_BLOCKS.reduce(
  (acc, block) => ({
    ...acc,
    [block.id]: block
  }),
  {} as Record<string, TipificationBlock>
);

/**
 * Estadísticas por bloque (para display)
 */
export const TIPIFICATION_STATISTICS = {
  conversion: {
    label: 'Conversiones',
    color: '#10B981',
    icon: '✅'
  },
  follow_up: {
    label: 'Seguimientos',
    color: '#F59E0B',
    icon: '⏸️'
  },
  rejection: {
    label: 'Rechazos',
    color: '#EF4444',
    icon: '❌'
  },
  no_contact: {
    label: 'Sin Contacto',
    color: '#6B7280',
    icon: '📲'
  }
};

/**
 * Utilidad para obtener una opción específica dentro de un bloque
 */
export const getTipificationOption = (blockId: string, optionId: string) => {
  const block = TIPIFICATION_BLOCKS_MAP[blockId];
  if (!block) return null;
  return block.options.find(opt => opt.id === optionId) || null;
};

/**
 * Utilidad para obtener el bloque y opción seleccionados
 */
export const getTipificationDetails = (blockId: string, optionId: string) => {
  const block = TIPIFICATION_BLOCKS_MAP[blockId];
  const option = block?.options.find(opt => opt.id === optionId);
  
  return {
    block,
    option,
    label: option?.label || '',
    color: block?.color || '',
    icon: block?.icon || ''
  };
};
