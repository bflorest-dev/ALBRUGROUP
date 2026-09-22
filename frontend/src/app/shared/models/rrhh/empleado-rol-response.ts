export interface EmpleadoRolResponse {
  idEmpleado: number;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  celularPersonal: string;
  correoPersonal: string;
  categoriaPersonal?: 'ESTRUCTURAL' | 'OPERATIVO';
  puestoTrabajo: string;
  estadoOperativo: 'ACTIVO' | 'INACTIVO';
}
