import { leadsHttp } from '@shared/api/httpClient';

export type Tipificacion = {
  id?: number;
  codigo: string;
  descripcion: string;
  orden: number;
  activo: boolean;
};

export type TipificacionesCatalogoPayload = {
  etapa: 'PREVENTA' | 'VENTA' | 'POSTVENTA' | string;
  tipificaciones: Tipificacion[];
};

export type TipificacionEstadoPayload = {
  idTipificacion: number;
  activo: boolean;
};

export const TipificacionesApi = {
  getCatalogo: (etapa: string) =>
    leadsHttp.get<Tipificacion[]>(`/tipificaciones/${etapa}/catalogo`),

  putCatalogo: (payload: TipificacionesCatalogoPayload) =>
    leadsHttp.put('/tipificaciones/catalogo', payload),

  patchEstado: (payload: TipificacionEstadoPayload) =>
    leadsHttp.patch('/tipificaciones/catalogo/estado', payload),
};
