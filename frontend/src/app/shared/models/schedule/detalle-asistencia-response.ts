import { EstadoAsistencia } from './estado-asistencia';

export interface DetalleAsistenciaResponse {
  idEmpleado: number;
  idHorario: number | null;
  fecha: string;
  estadoActual: EstadoAsistencia;
  entradaProgramada: string | null;
  salidaProgramada: string | null;
  inicioAlmuerzoProgramado: string | null;
  finAlmuerzoProgramado: string | null;
  fechaHoraIngreso: string | null;
  fechaHoraSalida: string | null;
  fechaHoraInicioAlmuerzo: string | null;
  fechaHoraFinAlmuerzo: string | null;
  minutosObjetivoDia: number | null;
  minutosTrabajados: number | null;
  minutosBalance: number | null;
  minutosAlmuerzoTomados: number | null;
  minutosServiciosPermitidos: number | null;
  minutosServiciosAcumulados: number | null;
  excedioServicios: boolean | null;
  jornadaCerrada: boolean;
}
