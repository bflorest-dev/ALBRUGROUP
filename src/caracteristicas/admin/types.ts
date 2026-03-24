/**
 * Types para la característica ADMIN
 * Estructura transitoria - será migrada a @entidades
 */

export interface Adicional {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
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
  name?: string;
  description?: string;
  price?: number;
  internet?: InternetConfig;
  television?: TeleviConfig;
  telephone?: TelefonConfig;
  plans?: any[];
  [key: string]: any;
}

export interface Promocion {
  id?: string;
  title?: string;
  description?: string;
  discount?: number;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}
