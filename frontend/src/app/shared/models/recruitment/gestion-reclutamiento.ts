import { PostulacionResponse } from './postulacion-response';
export type GestionAccion = 'NO_CONTACTO'|'SEGUIMIENTO'|'AGENDAR'|'AGENDAR_MEET'|'REPROGRAMAR'|'REPROGRAMAR_MEET'|'ASISTIO_MEET'|'INASISTENCIA'|'CANCELAR_CITA'|'EVALUAR'|'NO_INTERESADO'|'RECHAZAR'|'APROBAR'|'ASIGNAR_GRUPO';
export interface ActividadReclutamiento {
 id:number; postulacionId:number; tipo:string; modalidad:string; fechaHora:string;
 referencia:string|null; meetSesionId:number|null; estado:string; responsableId:number; createdAt:string;
}
export interface HorarioMeet { id:number; negocio:string; codigo:string; etiqueta:string; horaInicio:string; }
export interface GestionReclutamiento {
 postulacion:PostulacionResponse; revision:number; evaluadaAt:string|null;
 ultimaGestionAt:string|null; ultimoResultado:string|null; resultadoEvaluacion:string|null;
 accionesDisponibles:GestionAccion[]; actividades:ActividadReclutamiento[];
}
export interface GestionRequest {
 accion:GestionAccion; revision:number; fechaHoraGestion:string; modalidadContacto:string;
 observacion:string; motivo:string|null; fechaHoraActividad:string|null;
 modalidadActividad:string|null; referencia:string|null; idGrupoCapacitacion:number|null;
 fechaMeet:string|null; idHorarioMeet:number|null; idSesionMeet:number|null;
}
