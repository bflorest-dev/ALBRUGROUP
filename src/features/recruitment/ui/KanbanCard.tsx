/**
 * @molecule KanbanCard — Tarjeta individual del Kanban
 * Representa una postulación en el tablero
 * Cambio de estado únicamente mediante botón Tipificar
 */

import React from 'react';
import { Phone, User, FileText } from 'lucide-react';
import type { PostulacionResponse } from '@features/hr/applications/model';

interface KanbanCardProps {
  postulacion: PostulacionResponse;
  columnId: string;
  onTipificar?: (postulacion: PostulacionResponse, columnId: string) => void;
  onDetails?: (postulacion: PostulacionResponse) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  postulacion,
  columnId,
  onTipificar,
  onDetails,
}) => {
  const nombreCompleto = `${postulacion.postulante.nombres} ${postulacion.postulante.apellidos}`;
  const etapa = String(
    postulacion.etapaProceso ??
      (postulacion as any).etapa ??
      (postulacion as any).etapa_proceso ??
      'SIN_ETAPA'
  ).trim() || 'SIN_ETAPA';
  const estado = String(
    postulacion.estadoProceso ??
      (postulacion as any).estado ??
      postulacion.estadoBandeja ??
      (postulacion as any).estado_bandeja ??
      'SIN_ESTADO'
  ).trim() || 'SIN_ESTADO';

  return (
    <div
      className={`
        rounded-xl border border-[#d3e1f7] bg-white/95 p-[1.05rem] shadow-[0_8px_16px_rgba(15,42,82,0.08)]
        transition-all duration-200 hover:-translate-y-0.5 hover:border-[#bfd3f7] hover:shadow-[0_14px_24px_rgba(37,99,235,0.14)]
      `}
    >
      {/* Header: Nombre + Documento */}
      <div className="mb-3.5">
        <p className="truncate text-[0.95rem] font-semibold leading-5 text-[#0f2a52]">
          {nombreCompleto}
        </p>
        <p className="text-[0.8rem] leading-5 text-[#5f7598]">
          {postulacion.postulante.tipoDocumento}: {postulacion.postulante.documento}
        </p>
      </div>

      {/* Info: Celular + Oferta */}
      <div className="mb-3.5 space-y-2.5">
        {postulacion.postulante.celular && (
          <div className="flex items-center gap-2 text-[0.8rem] leading-5 text-[#4e6b92]">
            <Phone size={14} />
            <span>{postulacion.postulante.celular}</span>
          </div>
        )}
        {postulacion.ofertaLaboral && (
          <div className="flex items-center gap-2 text-[0.8rem] leading-5 text-[#4e6b92]">
            <FileText size={14} />
            <span className="font-medium">{postulacion.ofertaLaboral.codigo}</span>
          </div>
        )}
      </div>

      {/* Origen Badge */}
      {postulacion.origen && (
        <div className="mb-3.5">
          <span className="inline-block rounded-full border border-[#c8daf8] bg-[#eaf1ff] px-2.5 py-1 text-[0.75rem] font-semibold leading-5 tracking-[0.03em] text-[#2459c5]">
            {postulacion.origen}
          </span>
        </div>
      )}

      <div className="mb-3.5 space-y-1.5 text-[0.8rem] leading-5 text-[#4e6b92]">
        <p>
          <span className="font-medium">Etapa:</span> {etapa}
        </p>
        <p>
          <span className="font-medium">Estado:</span> {estado}
        </p>
      </div>

      {/* Acciones */}
      {(onTipificar || onDetails) && (
        <div className="flex gap-2 border-t border-[#e3ebfb] pt-3.5">
          {onTipificar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTipificar(postulacion, columnId);
              }}
              className="flex-1 rounded-xl bg-[#2f64dd] px-3 py-2.5 text-[0.8rem] font-semibold leading-5 text-white transition-colors hover:bg-[#2557ca]"
            >
              Tipificar
            </button>
          )}
          {onDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDetails(postulacion);
              }}
              className="flex-1 rounded-xl border border-[#d3e1f7] bg-white px-3 py-2.5 text-[0.8rem] font-semibold leading-5 text-[#2459c5] transition-colors hover:bg-[#f4f8ff]"
            >
              <User size={14} className="inline mr-1" />
              Ver más
            </button>
          )}
        </div>
      )}
    </div>
  );
};
