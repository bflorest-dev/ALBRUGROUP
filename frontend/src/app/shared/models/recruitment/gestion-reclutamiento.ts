import { PostulacionResponse } from './postulacion-response';
export type GestionAccion = 'NO_CONTACTO'|'SEGUIMIENTO'|'AGENDAR'|'REPROGRAMAR'|'INASISTENCIA'|'CANCELAR_CITA'|'EVALUAR'|'NO_INTERESADO'|'RECHAZAR'|'APROBAR';
export interface ActividadReclutamiento {
 id:number; postulacionId:number; tipo:string; modalidad:string; fechaHora:string;
 referencia:string|null; estado:string; responsableId:number; createdAt:string;
}
export interface GestionReclutamiento {
 postulacion:PostulacionResponse; revision:number; evaluadaAt:string|null;
 ultimaGestionAt:string|null; ultimoResultado:string|null;
 accionesDisponibles:GestionAccion[]; actividades:ActividadReclutamiento[];
}
export interface GestionRequest {
 accion:GestionAccion; revision:number; fechaHoraGestion:string; modalidadContacto:string;
 observacion:string; motivo:string|null; fechaHoraActividad:string|null;
 modalidadActividad:string|null; referencia:string|null; idGrupoCapacitacion:number|null;
}
