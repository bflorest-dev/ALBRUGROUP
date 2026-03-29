/**
 * @file campaign.ts
 * @description Tipos y contratos para la entidad Campaign
 * @layer entities
 */

export interface Campaign {
  id?: string;
  nombre: string;
  numeroWhatsapp: string;
  cuentas: string[]; // IDs de cuentas publicitarias
  proveedores: string[]; // IDs de proveedores
  createdAt?: string;
  updatedAt?: string;
}

export interface CuentaPublicitaria {
  id: number;
  numeroCuenta: string;
  nombreCuenta: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
}

export interface CreateCampaignPayload {
  nombre: string;
  numeroWhatsapp: string;
  cuentas: string[];
  proveedores: string[];
}
