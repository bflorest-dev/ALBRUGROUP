/**
 * @file campaign.ts
 * @description Tipos y contratos para la entidad Campaign
 * @layer entities
 */

export interface Campaign {
  id?: number;
  nombre: string;
  numeroWhatsappEmpresa: string;
  idCuentaPublicitaria: number;
  idProveedor: number;
  createdAt?: string;
  updatedAt?: string;
  activo?: boolean;
}

export interface CuentaPublicitaria {
  id: number;
  numeroCuenta: string;
  nombreCuenta: string;
  activo?: boolean;
}

export type Proveedor = {
  id: number;
  nombre: string;
  activo?: boolean;
};

/**
 * Payload para crear campaña
 * NOTA: Backend espera idCuentaPublicitaria e idProveedor SINGULARES (no arrays)
 * numeroWhatsappEmpresa NO debe estar vacío
 */
export interface CreateCampaignPayload {
  nombre: string;
  numeroWhatsappEmpresa: string; // Campo correcto del backend
  idCuentaPublicitaria: number; // NO NULL, NO ARRAY
  idProveedor: number; // NO NULL, NO ARRAY
}
