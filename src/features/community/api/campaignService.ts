/**
 * Servicio de Campaign para la feature Community
 * Capa: caracteristicas/community/api
 */
import { leadsHttp } from '@shared/api/clienteHttp';
import type { Campaign, CuentaPublicitaria, CreateCampaignPayload, Proveedor } from '@entities/campaign/model/campaign';

export const fetchCuentasPublicitarias = async (): Promise<CuentaPublicitaria[]> => {
  const res = await leadsHttp.get<CuentaPublicitaria[]>('/cuentas-publicitarias');
  return res.data || [];
};

export const fetchProveedores = async (): Promise<Proveedor[]> => {
  const res = await leadsHttp.get<Proveedor[]>('/proveedores');
  return res.data || [];
};

export const createCampaign = async (payload: CreateCampaignPayload): Promise<Campaign> => {
  const res = await leadsHttp.post<Campaign>('/campanas', payload);
  return res.data;
};
