import React from 'react';
import { Tag } from 'lucide-react';
import { Badge, Button, EmptyState } from '@shared/ui';
import type { PostulacionResponse } from '@features/rrhh/postulaciones/model';

interface ReclutamientoTableProps {
  postulaciones: PostulacionResponse[];
  loading: boolean;
  onTipificar?: (postulacion: PostulacionResponse) => void;
}

const getBadgeVariant = (label: string) => {
  const value = label.toLowerCase();
  if (value.includes('aprobado') || value.includes('completado')) return 'success';
  if (value.includes('rechazado')) return 'danger';
  if (value.includes('en_proceso') || value.includes('proceso')) return 'warning';
  return 'info';
};

export const ReclutamientoTable: React.FC<ReclutamientoTableProps> = ({
  postulaciones,
  loading,
  onTipificar,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-gray-600">Cargando postulaciones de reclutamiento...</p>
      </div>
    );
  }

  if (!postulaciones || postulaciones.length === 0) {
    return (
      <EmptyState
        title="No hay postulantes en reclutamiento"
        description="No se encontraron postulaciones en el buzón de reclutamiento."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Candidato</th>
            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Documento</th>
            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Origen</th>
            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Bandeja</th>
            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Oferta</th>
            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha registro</th>
            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {postulaciones.map((post) => (
            <tr key={post.id} className="hover:bg-slate-50">
              <td className="px-4 py-4 text-sm text-gray-900">
                <p className="font-semibold">{post.postulante.nombres} {post.postulante.apellidos}</p>
                <p className="text-xs text-gray-500">{post.postulante.tipoDocumento}</p>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">{post.postulante.documento}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{post.origen}</td>
              <td className="px-4 py-4 text-sm">
                <Badge
                  label={post.estadoProceso || 'Desconocido'}
                  variant={getBadgeVariant(post.estadoProceso || 'info')}
                />
              </td>
              <td className="px-4 py-4 text-sm">
                <Badge
                  label={post.estadoBandeja || 'Sin estado'}
                  variant="primary"
                />
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {post.ofertaLaboral ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">{post.ofertaLaboral.codigo}</p>
                    <p className="text-xs text-gray-500">{post.ofertaLaboral.puestoObjetivo} · {post.ofertaLaboral.horario}</p>
                  </div>
                ) : (
                  <span className="text-gray-400">No disponible</span>
                )}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {new Date(post.fechaCreacion).toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {onTipificar ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTipificar(post)}
                    title="Tipificar postulación"
                  >
                    <Tag size={16} />
                  </Button>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
