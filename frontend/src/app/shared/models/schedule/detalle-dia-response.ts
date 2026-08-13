import { EstadoAsistencia } from './estado-asistencia';

export type OrigenAlmuerzo = 'MANUAL' | 'FORZADO';

export type TipoSesionEstado = 'SERVICIOS' | 'PAUSA_ACTIVA' | 'CAPACITACION';

export interface TramoAsistenciaResponse {
  origen: string;
  horaEntradaEstablecida: string | null;
  horaSalidaEstablecida: string | null;
  horaEntradaAsistencia: string | null;
  horaSalidaAsistencia: string | null;
  minutosObjetivo: number | null;
  minutosTrabajados: number | null;
  motivo?: string | null;
  creadoPor?: number | null;
}

/**
 * Read model del dia del motor nuevo (/asistencia/v2/dia). Reemplaza a DetalleAsistenciaResponse en el
 * flujo de marcacion. Principio: un campo por pregunta. Las compuertas (puede*) son autoritativas del
 * backend (el frontend habilita/deshabilita con ellas, sin recalcular ventanas con el reloj); los datos
 * de display/cronometros los renderiza el frontend.
 */
export interface DetalleDiaResponse {
  idEmpleado: number;
  fecha: string;
  idHorario: number | null;

  estadoActual: EstadoAsistencia;
  tieneHorario: boolean | null;
  /** Dentro del tramo de turno activo ahora (base de pausas + display). NO responde "puedo marcar". */
  enTurnoActivo: boolean | null;
  operativo: boolean | null;
  jornadaCerrada: boolean;

  // Compuertas (autoritativas).
  puedeMarcarIngreso: boolean | null;
  puedeMarcarSalida: boolean | null;
  puedeIniciarAlmuerzo: boolean | null;
  puedeIniciarServicios: boolean | null;
  puedeIniciarPausaActiva: boolean | null;

  entradaProgramada: string | null;
  salidaProgramada: string | null;
  fechaHoraIngreso: string | null;
  fechaHoraSalida: string | null;

  minutosObjetivoDia: number | null;
  minutosTrabajados: number | null;
  minutosBalance: number | null;
  minutosExtra: number | null;
  minutosCompensados: number | null;

  // Almuerzo (split): programado + marcacion real.
  inicioAlmuerzoProgramado: string | null;
  minutosAlmuerzoProgramado: number | null;
  almuerzoEstadoDesde: string | null;
  almuerzoRealInicio: string | null;
  almuerzoRealFin: string | null;
  origenAlmuerzo: OrigenAlmuerzo | null;
  minutosAlmuerzoTomados: number | null;

  // Sub-estados cronometrados (totales del dia).
  minutosServiciosHoy: number | null;
  minutosPausaActivaHoy: number | null;
  minutosCapacitacionHoy: number | null;
  sesionEnCurso: boolean | null;

  // Umbrales para el aviso de desbalance/tope (rojo al superarlos) + ancla de la sesion abierta.
  minutosServiciosTope: number | null;
  maxMinutosPausaActiva: number | null;
  sesionActualTipo: TipoSesionEstado | null;
  sesionActualInicio: string | null;

  tramos?: TramoAsistenciaResponse[] | null;
}
