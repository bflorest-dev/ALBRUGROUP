/**
 * @file campaignService.ts
 * @description Servicio para operaciones de Campaign
 * @layer shared/services
 */

import { leadsHttp } from '@shared/api/clienteHttp';
import type { Campaign, CuentaPublicitaria, CreateCampaignPayload, Proveedor } from '@entidades/campana';

/**
 * Obtener todas las cuentas publicitarias
 */
export const fetchCuentasPublicitarias = async (): Promise<CuentaPublicitaria[]> => {
  try {
    const token = localStorage.getItem('auth_token');
    console.debug('[CampaignService] GET /cuentas-publicitarias', 'Authorization:', token ? 'Bearer *****' : 'NO TOKEN');
    
    const res = await leadsHttp.get('/cuentas-publicitarias');
    console.debug('[CampaignService] Cuentas fetched:', res.data);
    return res.data ?? [];
  } catch (err: any) {
    const status = err.status || err.response?.status || 0;
    console.error('[CampaignService] Error fetching cuentas:', { status, message: err.message });
    throw new Error(`Error al cargar cuentas (${status}): ${err.message}`);
  }
};

/**
 * Obtener todos los proveedores
 */
export const fetchProveedores = async (): Promise<Proveedor[]> => {
  try {
    const token = localStorage.getItem('auth_token');
    console.debug('[CampaignService] GET /proveedores', 'Authorization:', token ? 'Bearer *****' : 'NO TOKEN');
    
    const res = await leadsHttp.get<Proveedor[]>('/proveedores');
    console.debug('[CampaignService] Proveedores fetched:', res.data);
    if (!Array.isArray(res.data)) {
      console.warn('[CampaignService] Proveedores data no es array, se convierte a array vacío', res.data);
      return [];
    }
    return res.data || [];
  } catch (err: any) {
    const status = err.status || err.response?.status || 0;
    const responseData = err.response?.data;
    const headers = err.response?.headers;
    
    // Log detallado para debugging
    console.error('[CampaignService] Error fetching proveedores:', {
      status,
      message: err.message,
      responseData,
      headers: {
        'x-required-role': headers?.['x-required-role'],
        'x-user-roles': headers?.['x-user-roles'],
      },
    });
    
    // Manejo específico de errores
    if (status === 403) {
      console.error('[CampaignService] 🚫 Acceso denegado (403): Usuario no tiene permisos para /proveedores');
      console.error('[CampaignService] Verifica rol requerido en headers: x-required-role');
    }
    if (status === 401) {
      console.error('[CampaignService] 🔐 Token inválido o expirado (401)');
    }
    
    throw new Error(`Error al cargar proveedores (${status}): ${err.message}`);
  }
};

/**
 * Crear una nueva campaña
 */
export const createCampaign = async (payload: CreateCampaignPayload): Promise<Campaign> => {
  try {
    const token = localStorage.getItem('auth_token');
    console.debug('[CampaignService] POST /campanas', 'Authorization:', token ? 'Bearer *****' : 'NO TOKEN', 'payload:', payload);
    
    const res = await leadsHttp.post('/campanas', payload);
    console.debug('[CampaignService] Campaign created:', res.data);
    return res.data ?? {};
  } catch (err: any) {
    const status = err.status || err.response?.status || 0;
    console.error('[CampaignService] Error creating campaign:', { status, message: err.message, payload });
    throw new Error(`Error al crear campaña (${status}): ${err.message}`);
  }
};
