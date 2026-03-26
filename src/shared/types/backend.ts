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
  updatedAt: string;
}

export interface CuentaPublicitariaResponse {
  id: number;
  numeroCuenta: string;
  nombreCuenta: string;
  activo: boolean;
}

export interface EventoResponse {
  id: number;
  idLead: number;
  idCampana: number;
  idActor: number;
  nombreActor: string;
  rolActor: string;
  accion: string;
  etapa: string;
  tipificacion: string;
  subtipificacion: string;
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
  precioUnitarioAdicional: number;
}

export interface PlanResponse {
  id: number;
  nombre: string;
  precio: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  idProveedor: number;
  nombreProveedor: string;
  internet: InternetResponse | null;
  television: TelevisionResponse | null;
  telefono: TelefonoResponse | null;
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
  createdAt: string;
}

export interface PromocionComercialResponse {
  id: number;
  nombre: string;
  interno: boolean;
  idProveedor: number;
  nombreProveedor: string;
  idZona: number;
  nombreZona: string;
  descuento: boolean;
  cantidadMeses: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  activo: boolean;
  createdAt: string;
}
