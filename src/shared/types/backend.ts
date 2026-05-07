export interface CampanaResponse {
  id: number;
  nombre: string;
  numeroWhatsappEmpresa: string;
  activo: boolean;
  idCuentaPublicitaria: number;
  numeroCuenta: string;
  nombreCuenta: string;
  idProveedor: number;
  nombreProveedor: string;
  updatedAt: string | null;
}

export interface CuentaPublicitariaResponse {
  id: number;
  numeroCuenta: string;
  nombreCuenta: string;
  activo: boolean;
}

export interface EventoResponse {
  id: number;
  idLead?: number | null;
  idCampana?: number | null;
  idActor?: number | null;
  nombreActor?: string | null;
  rolActor?: string | null;
  idAsesorAsignado?: number | null;
  nombreAsesorAsignado?: string | null;
  rolAsesorAsignado?: string | null;
  accion?: string | null;
  etapa?: string | null;
  tipificacion?: string | null;
  subtipificacion?: string | null;
  fechaInstalacion?: string | null;
  comentario?: string | null;
  createdAt: string;
}

export interface AdicionalResponse {
  id: number;
  nombre: string;
  precioUnitario: number;
  idProveedor: number;
  nombreProveedor: string;
  activo: boolean;
}

export interface InternetResponse {
  id: number;
  velocidad: number;
  unidad: string;
  tecnologia: string;
}

export interface TelevisionResponse {
  id: number;
  nombre: string;
  cantidadCanales: number;
}

export interface TelefonoResponse {
  id: number;
  minutos: number;
  descripcion: string;
}

export interface PlanAdicionalResponse {
  idAdicional: number;
  nombreAdicional: string;
  cantidadIncluida: number;
  permiteCompraAdicional: boolean;
  cantidadMaximaAdicional: number;
}

export interface PlanResponse {
  id: number;
  nombre: string;
  precio: number;
  precioPromocional: number;
  mesesPromocionPrecio: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  idProveedor: number;
  nombreProveedor: string;
  internet: InternetResponse | null;
  television: TelevisionResponse | null;
  telefono: TelefonoResponse | null;
  velocidadPromocional: number;
  mesesPromocionVelocidad: number;
  idZona: number | null;
  nombreZona: string | null;
  adicionales: PlanAdicionalResponse[];
  activo: boolean;
}

export interface ServiciosProveedorResponse {
  idProveedor: number;
  nombreProveedor: string;
  internets: InternetResponse[];
  televisiones: TelevisionResponse[];
  telefonos: TelefonoResponse[];
}

export interface ProveedorResponse {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt: string | null;
}

export interface UsuarioResponse {
  id: number;
  username: string;
  email: string;
  empleadoId: number;
  nombreCompleto: string;
  dni?: string;
  activo: boolean;
  roles: string[];
}

export interface ActualizarCredencialesRequest {
  username: string;
  password?: string;
  puestoTrabajo: string;
  roles?: string[];
}

export interface PromocionComercialResponse {
  id: number;
  reglaComercial: string;
  idProveedor: number;
  nombreProveedor: string;
  idZona: number;
  nombreZona: string;
  idsPlanes: number[];
  nombresPlanes: string[];
  activo: boolean;
  createdAt: string;
}

/**
 * AUTENTICACIÓN CON VALIDACIÓN PREVIA
 * 
 * Flujo: Validar usuario → Mostrar login o reset según passwordInicializada
 */

export interface EstadoAccesoResponse {
  passwordInicializada: boolean;
}

export interface ForgotPasswordRequest {
  username: string;
  email: string;
  dni: string;
  newPassword?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
  username?: string;
  password?: string;
}

export interface AuthLoginResponse {
  token: string;
  type: string;
  username: string;
  empleadoId: number;
  nombreCompleto: string;
  roles: string[];
}
