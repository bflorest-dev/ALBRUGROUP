/**
 * @molecule TablaBandeja — Tabla reutilizable para postulaciones
 * Muestra lista de postulaciones con acciones contextuales
 * FSD: caracteristicas/rrhh/postulaciones/ui
 */

import React from 'react';
import { Edit2, Check, Clock3 } from 'lucide-react';
import { Button, Badge, Spinner, EmptyState, ErrorState } from '@shared/ui';
import type { PostulacionResponse } from '../model';

interface TablaBandejaProps {
  postulaciones: PostulacionResponse[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onCreate?: () => void;
  onVerHistorial?: (postulacion: PostulacionResponse) => void;
  onConfirmarContratacion?: (postulacion: PostulacionResponse) => void;
  onEditar?: (postulacion: PostulacionResponse) => void;
  columnaExtra?: string;
}

/**
 * Mapea códigos de estado a variantes de Badge
 */
function getEstadoVariant(
  estado: string
): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  const lower = estado.toLowerCase();
  if (lower.includes('aprobado') || lower.includes('completado'))
    return 'success';
  if (lower.includes('rechazado')) return 'danger';
  if (lower.includes('revision')) return 'warning';
  return 'info';
}

function resolveEtapa(post: PostulacionResponse): string {
  const rawEtapa =
    post.etapaProceso ??
    (post as any).etapa ??
    (post as any).etapa_proceso ??
    '';
  const etapa = String(rawEtapa).trim();
  return etapa || 'SIN_ETAPA';
}

function resolveEstado(post: PostulacionResponse): string {
  const rawEstado =
    post.estadoProceso ??
    (post as any).estado ??
    post.estadoBandeja ??
    (post as any).estado_bandeja ??
    '';
  const estado = String(rawEstado).trim();
  return estado || 'SIN_ESTADO';
}

export const TablaBandeja: React.FC<TablaBandejaProps> = ({
  postulaciones,
  loading,
  error,
  onRetry,
  onCreate,
  onVerHistorial,
  onConfirmarContratacion,
  onEditar,
  columnaExtra,
}) => {
  // Estados de carga
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="medium" />
      </div>
    );
  }

  // Estado de error
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  // Listado vacío
  if (!postulaciones || postulaciones.length === 0) {
    return (
      <EmptyState
        title="No hay postulaciones"
        description="No se encontraron postulaciones en esta bandeja"
        action={
          onCreate ? (
            <Button variant="primary" size="md" onClick={onCreate}>
              Registrar Postulante
            </Button>
          ) : undefined
        }
      />
    );
  }

  // Tabla principal
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
              Nombre Completo
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
              Documento
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
              Origen
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
              Etapa
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
              Estado
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
              Tipificación
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
              Fecha
            </th>
            {columnaExtra && (
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                {columnaExtra}
              </th>
            )}
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {postulaciones.map((post, idx) => {
            const etapa = resolveEtapa(post);
            const estado = resolveEstado(post);

            return (
              <tr
                key={post.id}
                className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  idx % 2 === 0
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
              {/* Nombre Completo */}
              <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                {post.postulante.nombres} {post.postulante.apellidos}
              </td>

              {/* Documento */}
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {post.postulante.documento}
              </td>

              {/* Origen */}
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {post.origen}
              </td>

              {/* Etapa */}
              <td className="px-4 py-3">
                <Badge
                  label={etapa}
                  variant="info"
                  size="small"
                />
              </td>

              {/* Estado */}
              <td className="px-4 py-3">
                <Badge
                  label={estado}
                  variant={getEstadoVariant(estado)}
                  size="small"
                />
              </td>

              {/* Tipificación */}
              <td className="px-4 py-3">
                <Badge
                  label={
                    post.tipificacion?.codigo ||
                    post.codigoTipificacion ||
                    post.tipificacion?.descripcion ||
                    'SIN_TIPIFICACION'
                  }
                  variant="primary"
                  size="small"
                />
              </td>

              {/* Fecha */}
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {new Date(post.fechaCreacion).toLocaleDateString('es-PE')}
              </td>

              {/* Columna Extra (si aplica) */}
              {columnaExtra && (
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  -
                </td>
              )}

              {/* Acciones */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {onEditar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditar(post)}
                      title="Editar postulación"
                    >
                      <Edit2 size={16} />
                    </Button>
                  )}
                  {onVerHistorial && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVerHistorial(post)}
                      title="Ver historial"
                    >
                      <Clock3 size={16} />
                    </Button>
                  )}
                  {onConfirmarContratacion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onConfirmarContratacion(post)}
                      title="Confirmar contratación"
                    >
                      <Check size={16} />
                    </Button>
                  )}
                </div>
              </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
