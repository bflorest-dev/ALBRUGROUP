export interface Adicional {
  id?: string;
  nombre?: string;
  name?: string;
  description?: string;
  precioUnitario?: number;
  price?: number;
  activo?: boolean;
  [key: string]: any;
}

export interface InternetConfig {
  id?: string;
  velocidad?: number;
  unidad?: "Mbps" | "Gbps";
  tecnologia?: "HFC" | "HPPT";
  speed?: string;
  provider?: string;
  [key: string]: any;
}

export interface TeleviConfig {
  id?: string;
  nombre?: string;
  cantidadCanales?: number;
  channels?: number;
  provider?: string;
  [key: string]: any;
}

export interface TelefonConfig {
  id?: string;
  minutos?: number;
  descripcion?: string;
  minutes?: number;
  provider?: string;
  [key: string]: any;
}

export interface Plan {
  id?: string;
  nombre?: string;
  name?: string;
  description?: string;
  precio?: number;
  price?: number;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  internetConfig?: InternetConfig;
  televiConfig?: TeleviConfig;
  telefonConfig?: TelefonConfig;
  internet?: InternetConfig;
  television?: TeleviConfig;
  telephone?: TelefonConfig;
  plans?: any[];
  [key: string]: any;
}

export interface Promocion {
  id?: string;
  nombre?: string;
  title?: string;
  tipo?: 'INTERNO' | 'EXTERNO';
  zona?: string;
  tipoVenta?: 'NATURAL' | 'JURIDICA';
  descuento?: boolean;
  porcentajeDescuento?: number;
  cantidadMeses?: number;
  fechaInicio?: string;
  fechaFin?: string;
  description?: string;
  discount?: number;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}
