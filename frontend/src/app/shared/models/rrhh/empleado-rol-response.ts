export interface EmpleadoRolResponse {
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  celularPersonal: string;
  correoPersonal: string;
  puestoTrabajo: string;
  estadoOperativo: 'ACTIVO' | 'INACTIVO';
}
