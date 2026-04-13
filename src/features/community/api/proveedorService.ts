/**
 * Servicio de Proveedores para la feature Community
 * Capa: caracteristicas/community/api
 */
import { leadsHttp } from '@shared/api/clienteHttp';
import type { Proveedor, CreateProveedorPayload } from '@entities/proveedor';

export const proveedorService = {
  async fetchProveedores(): Promise<Proveedor[]> {
    const res = await leadsHttp.get<Proveedor[]>('/proveedores');
    return res.data || [];
  },

  async createProveedor(payload: CreateProveedorPayload): Promise<Proveedor> {
    const res = await leadsHttp.post<Proveedor>('/proveedores', payload);
    return res.data;
  },
};
