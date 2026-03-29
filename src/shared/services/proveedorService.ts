/**
 * Servicio para gestionar Proveedores
 * Endpoints: GET /proveedores, POST /proveedores
 */
import { leadsHttp } from '@shared/api/clienteHttp';
import type { Proveedor, CreateProveedorPayload } from '@entidades/proveedor';

export const proveedorService = {
  async fetchProveedores(): Promise<Proveedor[]> {
    const token = localStorage.getItem('auth_token');
    console.debug('[proveedorService] GET /api/leads/proveedores | Authorization:', token ? 'Bearer *****' : 'NO TOKEN');
    const res = await leadsHttp.get<Proveedor[]>('/proveedores');
    return res.data || [];
  },

  async createProveedor(payload: CreateProveedorPayload): Promise<Proveedor> {
    const token = localStorage.getItem('auth_token');
    console.debug('[proveedorService] POST /api/leads/proveedores | Authorization:', token ? 'Bearer *****' : 'NO TOKEN', 'payload:', payload);
    const res = await leadsHttp.post<Proveedor>('/proveedores', payload);
    return res.data;
  },
};
