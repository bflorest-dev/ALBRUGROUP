/**
 * CONSTANTES DE TIPIFICACIÓN
 * 
 * Datos centralizados de los bloques de tipificación
 * para ASESOR_BACKOFFICE y módulos relacionados.
 */

import type { TipificationBlock } from '@compartido/tipos';

/**
 * Bloques de tipificación con todas sus opciones
 * Estructura jerárquica: Bloque → Opciones
 */
export const TIPIFICATION_BLOCKS: TipificationBlock[] = [
  {
    id: 'sin_gestionar',
    icon: 'hourglass',
    label: 'SIN GESTIONAR',
    description: 'Estados sin gestión iniciada',
    color: '#1e3a8a',
    status: 'pending',
    options: [
      { id: 'chancada_sin_ingresar', label: '0 - CHANCADA / SIN INGRESAR', description: '' },
      { id: 'edificio_exclusividad', label: '0 - EDIFICIO EXCLUSIVIDAD', description: '' },
      { id: 'grabado', label: '0 - GRABADO', description: '' },
      { id: 'mal_registrado', label: '0 - MAL REGISTRADO', description: '' },
      { id: 'no_contesta', label: '0 - NO CONTESTA', description: '' },
      { id: 'no_desea_dar_dni', label: '0 - NO DESEA DAR DNI', description: '' },
      { id: 'no_desea_grabar', label: '0 - NO DESEA GRABAR', description: '' },
      { id: 'pdte_habilitar_condominio', label: '0 - PDTE HABILITAR CONDOMINIO', description: '' },
      { id: 'pdte_pago_adelantado', label: '0 - PDTE PAGO ADELANTADO', description: '' },
      { id: 'pdte_score', label: '0 - PDTE SCORE', description: '' },
      { id: 'sin_cobertura', label: '0 - SIN COBERTURA', description: '' },
      { id: 'sin_cto', label: '0 - SIN CTO', description: '' },
      { id: 'sin_subir', label: '0 - SIN SUBIR', description: '' }
    ]
  },
  {
    id: 'en_proceso',
    icon: 'sync',
    label: 'EN PROCESO',
    description: 'Gestión en curso',
    color: '#3b82f6',
    status: 'pending',
    options: [
      { id: 'en_progreso', label: '1 - EN PROGRESO', description: '' },
      { id: 'manchada', label: '1 - MANCHADA', description: '' },
      { id: 'revisado', label: '1 - REVISADO', description: '' },
      { id: 'subida', label: '1 - SUBIDA', description: '' },
      { id: 'zona_f', label: '1 - ZONA F', description: '' }
    ]
  },
  {
    id: 'en_revision',
    icon: 'search',
    label: 'EN REVISIÓN',
    description: 'Bajo revisión o validación',
    color: '#6366f1',
    status: 'pending',
    options: [
      { id: 'desaprobado', label: '2 - DESAPROBADO', description: '' },
      { id: 'rescate', label: '2 - RESCATE', description: '' }
    ]
  },
  {
    id: 'programados',
    icon: 'calendar',
    label: 'PROGRAMADOS',
    description: 'Instalación programada',
    color: '#8b5cf6',
    status: 'pending',
    options: [
      { id: 'programada', label: '3 - PROGRAMADA', description: '' },
      { id: 'reprogramada', label: '3 - REPROGRAMADA', description: '' },
      { id: 'prog_agendada', label: '3 - PROG-AGENDADA', description: '' },
      { id: 'prog_tec_en_camino', label: '3 - PROG-TEC EN CAMINO', description: '' },
      { id: 'prog_iniciada', label: '3 - PROG-INICIADA', description: '' },
      { id: 'prog_tec_en_casa', label: '3 - PROG-TEC EN CASA', description: '' },
      { id: 'prog_cancelada', label: '3.1 - PROG-CANCELADA', description: '' },
      { id: 'prog_sin_cd', label: '3.1 - PROG-SIN CD', description: '' }
    ]
  },
  {
    id: 'inconvenientes',
    icon: 'alert-circle',
    label: 'INCONVENIENTES',
    description: 'Problemas comerciales o técnicos',
    color: '#ef4444',
    status: 'rejected',
    options: [
      { id: 'baja_mala_info_venta', label: '4 - BAJA-MALA INFO VENTA', description: '' },
      { id: 'baja_mult_deudas', label: '4 - BAJA-MULT DEUDAS', description: '' },
      { id: 'baja_no_desea', label: '4 - BAJA-NO DESEA', description: '' },
      { id: 'fac_tec_cto_excede_metraje', label: '4.1 - FAC TEC-CTO EXCEDE METRAJE', description: '' },
      { id: 'fac_tec_cto_saturado', label: '4.1 - FAC TEC-CTO SATURADO', description: '' },
      { id: 'fac_tec_ductos_obstruidos', label: '4.1 - FAC TEC-DUCTOS OBSTRUIDOS', description: '' },
      { id: 'fac_tec_naps_robadas', label: '4.1 - FAC TEC-NAPS ROBADAS', description: '' },
      { id: 'fac_tec_naps_saturadas', label: '4.1 - FAC TEC-NAPS SATURADAS', description: '' },
      { id: 'fac_tec_sin_cobertura', label: '4.1 - FAC TEC-SIN COBERTURA', description: '' },
      { id: 'fac_tec_sin_cto', label: '4.1 - FAC TEC-SIN CTO', description: '' },
      { id: 'fac_tec_sin_permiso_vecinos', label: '4.1 - FAC TEC-SIN PERMISO VECINOS', description: '' },
      { id: 'fac_tec_sin_poste_apoyo', label: '4.1 - FAC TEC-SIN POSTE DE APOYO', description: '' },
      { id: 'fac_tec_sin_potencia', label: '4.1 - FAC TEC-SIN POTENCIA', description: '' },
      { id: 'fac_tec_torre_no_habilitada', label: '4.1 - FAC TEC-TORRE NO HABILITADA', description: '' },
      { id: 'fac_tec_zona_elevada', label: '4.1 - FAC TEC-ZONA ELEVADA', description: '' },
      { id: 'zona_peligrosa', label: '4.2 - ZONA PELIGROSA', description: '' },
      { id: 'chancada_ingresada', label: '4.2 - CHANCADA / INGRESADA', description: '' },
      { id: 'flipping', label: '4.2 - FLIPPING', description: '' },
      { id: 'posible_fraude', label: '4.2 - POSIBLE FRAUDE', description: '' },
      { id: 'sin_instalar', label: '4.2 - SIN INSTALAR', description: '' }
    ]
  },
  {
    id: 'instalado',
    icon: 'check-circle',
    label: 'INSTALADO',
    description: 'Servicio instalado exitosamente',
    color: '#10b981',
    status: 'success',
    options: [
      { id: 'instalada', label: '5 - INSTALADA', description: '' }
    ]
  },
  {
    id: 'invalidados',
    icon: 'ban',
    label: 'INVALIDADOS',
    description: 'Registros invalidados o anulados',
    color: '#6b7280',
    status: 'rejected',
    options: [
      { id: 'anulado', label: '6 - ANULADO', description: '' },
      { id: 'duplicado', label: '6 - DUPLICADO', description: '' },
      { id: 'blacklist', label: '6 - BLACKLIST', description: '' }
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
    icon: 'check'
  },
  follow_up: {
    label: 'Seguimientos',
    color: '#F59E0B',
    icon: 'clock'
  },
  rejection: {
    label: 'Rechazos',
    color: '#EF4444',
    icon: 'x'
  },
  no_contact: {
    label: 'Sin Contacto',
    color: '#6B7280',
    icon: 'phone'
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
