/**
 * Enums para RRHH — Recruitment
 * FSD: shared/backendEnums
 * 
 * Centraliza enumeraciones que vienen del backend y se usan en UI
 */

/** Origen de postulación */
export enum Origen {
  COMPUTRABAJO = 'COMPUTRABAJO',
  INDEED = 'INDEED',
  TIKTOK = 'TIKTOK',
  FACEBOOK = 'FACEBOOK',
  LINKEDIN = 'LINKEDIN',
  REFERIDO = 'REFERIDO',
}

/** Tipo de documento de identificación */
export enum TipoDocumento {
  DNI = 'DNI',
  CE = 'CE', // Carné de Extranjería
}

/** Modalidad de contacto */
export enum ModalidadContacto {
  TELEFONO = 'TELEFONO',
  PRESENCIAL = 'PRESENCIAL',
  VIRTUAL = 'VIRTUAL',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
}

/** Etapas del proceso de selección */
export enum EtapaProceso {
  RECLUTAMIENTO = 'RECLUTAMIENTO',
  CAPACITACION = 'CAPACITACION',
  CONTRATACION = 'CONTRATACION',
  FINAL = 'FINAL',
}

/** Estados dentro de cada etapa */
export enum EstadoProceso {
  PENDIENTE = 'PENDIENTE',
  EN_REVISION = 'EN_REVISION',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  COMPLETADO = 'COMPLETADO',
}

/** Estados de bandeja (para filtrado) */
export enum EstadoBandeja {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  COMPLETADO = 'COMPLETADO',
}
