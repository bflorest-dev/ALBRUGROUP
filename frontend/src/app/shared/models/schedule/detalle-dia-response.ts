import { EstadoAsistencia } from './estado-asistencia';

export type OrigenAlmuerzo = 'MANUAL' | 'FORZADO';

export type TipoSesionEstado = 'SERVICIOS' | 'PAUSA_ACTIVA' | 'CAPACITACION';

export type TipoTramoDia = 'BASE' | 'EXTRA' | 'COMPENSABLE';

export type EstadoTramoDia = 'PENDIENTE' | 'EN_CURSO' | 'CUMPLIDO' | 'EXPIRADO' | 'ANULADO';

/** Un tramo de la jornada del día (base + extras/compensables). El frontend deriva de aquí el tramo
 *  vigente/próximo/hueco y las compuertas de marcación con su reloj vivo. */
export interface TramoDiaResponse {
  idAjuste: number | null;
  tipo: TipoTramoDia;
  inicio: string; // ISO LocalDateTime
  fin: string;
  estado: EstadoTramoDia;
  ingresoReal: string | null;
  salidaReal: string | null;
  minutosAcreditados: number | null;
}

/** VM compacto de un tramo del día para mostrarlo en el picker: rango + tipo + si es el vigente. */
export interface TramoDiaVm {
  rango: string;
  tipo: TipoTramoDia;
  vigente: boolean;
  estado: EstadoTramoDia;
}

/** Parámetros de política (por rol) para calcular las ventanas de marcación en el frontend. */
export interface PoliticaMarcacion {
  margenAdelantoMin: number | null;
  bloqueoTardanzaMin: number | null;
  maxMinutosPausaActiva: number | null;
  maxUsosPausaActivaDia: number | null;
  ventanaMarcaAlmuerzoMin: number | null;
  permiteIngresoDuranteTurno: boolean | null;
}

/**
 * Read model del día (v3, /asistencia/v2/dia). Reemplazo limpio: el backend entrega ESTADO real +
 * TRAMOS resueltos + POLÍTICA + VERSION; el frontend deriva las compuertas de marcación con su reloj
 * vivo (tramo vigente/próximo/hueco, ventanas). El backend re-valida en el write. Ya NO hay booleanos
 * puede*, ni enTurnoActivo/operativo, ni entrada/salida programada planas: todo se deriva de `tramos`
 * + `politica` + el reloj del cliente.
 */
export interface DetalleDiaResponse {
  idEmpleado: number;
  fecha: string;
  idHorario: number | null;

  // Estado real (verdad de servidor).
  estadoActual: EstadoAsistencia;
  tieneHorario: boolean | null;
  jornadaCerrada: boolean;
  fechaHoraIngreso: string | null;
  fechaHoraSalida: string | null;

  // Jornada resuelta + política + versión (insumos para derivar los gates).
  tramos: TramoDiaResponse[] | null;
  politica: PoliticaMarcacion | null;
  version: string | null;

  // Totales del día.
  minutosObjetivoDia: number | null;
  minutosTrabajados: number | null;
  minutosBalance: number | null;
  minutosExtra: number | null;
  minutosCompensados: number | null;

  // Almuerzo (split): programado + marcación real.
  inicioAlmuerzoProgramado: string | null;
  minutosAlmuerzoProgramado: number | null;
  almuerzoEstadoDesde: string | null;
  almuerzoRealInicio: string | null;
  almuerzoRealFin: string | null;
  origenAlmuerzo: OrigenAlmuerzo | null;
  minutosAlmuerzoTomados: number | null;

  // Sub-estados cronometrados (totales del día + uso, para derivar los gates de pausas).
  minutosServiciosHoy: number | null;
  minutosPausaActivaHoy: number | null;
  minutosCapacitacionHoy: number | null;
  pausaActivaUsosHoy: number | null;
  sesionEnCurso: boolean | null;

  // Umbrales/anclas de la sesión abierta (cronómetros + aviso de tope en rojo).
  minutosServiciosTope: number | null;
  maxMinutosPausaActiva: number | null;
  sesionActualTipo: TipoSesionEstado | null;
  sesionActualInicio: string | null;
}
