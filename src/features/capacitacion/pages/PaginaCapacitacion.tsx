import React, { useMemo, useState } from 'react';
import { AlertCircle, Eye, History, RefreshCw, Search, Users } from 'lucide-react';
import { Button, Modal, SelectInput, Spinner } from '@shared/ui';
import {
  useBandejaCapacitacion,
  useCatalogoTipificaciones,
  useDetalleGrupoCapacitacion,
  useDetallePostulacion,
  useEventosPostulacion,
  useGruposCapacitacion,
  useTipificarPostulacion,
} from '@features/rrhh/postulaciones/hooks';
import type {
  GrupoCapacitacionResponse,
  PostulacionResponse,
  TipificarPostulacionRequest,
} from '@features/rrhh/postulaciones/model';

interface TipificarFormState {
  idTipificacion: string;
  idSubtipificacion: string;
  observacion: string;
}

const INITIAL_TIPIFICAR: TipificarFormState = {
  idTipificacion: '',
  idSubtipificacion: '',
  observacion: '',
};

const PaginaCapacitacion: React.FC = () => {
  const gruposHook = useGruposCapacitacion();
  const bandejaCapacitacionHook = useBandejaCapacitacion();
  const detalleGrupoHook = useDetalleGrupoCapacitacion();
  const detallePostulacionHook = useDetallePostulacion();
  const tipificarHook = useTipificarPostulacion();

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [historialModalOpen, setHistorialModalOpen] = useState(false);
  const [tipificarModalOpen, setTipificarModalOpen] = useState(false);
  const [activePostulacionId, setActivePostulacionId] = useState<number | null>(null);
  const [tipificarForm, setTipificarForm] = useState<TipificarFormState>(INITIAL_TIPIFICAR);
  const [searchTerm, setSearchTerm] = useState('');

  const activePostulacionDetalle = detallePostulacionHook.data;
  const activeEtapaCatalogo = String(activePostulacionDetalle?.etapaProceso ?? 'CAPACITACION').toUpperCase();
  const catalogoHook = useCatalogoTipificaciones(activeEtapaCatalogo);
  const eventosHook = useEventosPostulacion(activePostulacionId ?? undefined);

  const grupos = useMemo(() => gruposHook.data ?? [], [gruposHook.data]);
  const bandejaCapacitacion = useMemo(
    () => (bandejaCapacitacionHook.data ?? []).filter((item) => String(item.etapaProceso).toUpperCase() === 'CAPACITACION'),
    [bandejaCapacitacionHook.data]
  );

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [] as PostulacionResponse[];

    return bandejaCapacitacion.filter((post) => {
      const fullName = `${post.postulante.nombres} ${post.postulante.apellidos}`.toLowerCase();
      const doc = String(post.postulante.documento ?? '').toLowerCase();
      const oferta = String(post.ofertaLaboral?.codigo ?? '').toLowerCase();
      return fullName.includes(term) || doc.includes(term) || oferta.includes(term);
    });
  }, [searchTerm, bandejaCapacitacion]);

  const formatEventDate = (fecha?: string | null): string => {
    if (!fecha) return 'Sin fecha';
    const parsed = new Date(fecha);
    if (Number.isFinite(parsed.getTime())) {
      return parsed.toLocaleString('es-PE');
    }

    const normalized = String(fecha).trim().replace(' ', 'T');
    const fallbackDate = new Date(normalized);
    if (Number.isFinite(fallbackDate.getTime())) {
      return fallbackDate.toLocaleString('es-PE');
    }

    return fecha;
  };

  const selectedGroup = detalleGrupoHook.data;
  const assignedPostulaciones = useMemo(
    () => {
      const fromDetalles = Array.isArray(selectedGroup?.detalles)
        ? selectedGroup.detalles
            .map((detalle) => detalle.postulacion)
            .filter((postulacion): postulacion is PostulacionResponse => Boolean(postulacion))
        : [];

      if (fromDetalles.length > 0) {
        return fromDetalles;
      }

      return Array.isArray(selectedGroup?.postulaciones) ? selectedGroup.postulaciones : [];
    },
    [selectedGroup]
  );

  const tipificaciones = useMemo(
    () => (Array.isArray(catalogoHook.data) ? catalogoHook.data : []),
    [catalogoHook.data]
  );

  const selectedTipificacion = tipificaciones.find((item) => String(item.id) === tipificarForm.idTipificacion);
  const subtipificaciones = selectedTipificacion?.subtipificaciones ?? [];

  const openGroup = async (groupId: number) => {
    setSelectedGroupId(groupId);
    await detalleGrupoHook.execute(groupId).catch(() => undefined);
  };

  const openDetallePostulacion = async (postulacionId: number) => {
    setActivePostulacionId(postulacionId);
    await detallePostulacionHook.execute(postulacionId).catch(() => undefined);
    setDetalleModalOpen(true);
  };

  const openHistorial = (postulacionId: number) => {
    setActivePostulacionId(postulacionId);
    setHistorialModalOpen(true);
  };

  const openTipificar = async (postulacionId: number) => {
    setTipificarForm(INITIAL_TIPIFICAR);
    setActivePostulacionId(postulacionId);
    await detallePostulacionHook.execute(postulacionId).catch(() => undefined);
    setTipificarModalOpen(true);
  };

  const handleTipificar = async () => {
    if (!activePostulacionId) return;
    if (!tipificarForm.idTipificacion || !tipificarForm.idSubtipificacion) return;

    const payload: TipificarPostulacionRequest = {
      idTipificacion: Number(tipificarForm.idTipificacion),
      idSubtipificacion: Number(tipificarForm.idSubtipificacion),
      observacion: tipificarForm.observacion,
    };

    await tipificarHook.execute(activePostulacionId, payload).catch(() => undefined);

    if (selectedGroupId) {
      await detalleGrupoHook.execute(selectedGroupId).catch(() => undefined);
    }

    await Promise.all([
      bandejaCapacitacionHook.refetch(),
      detallePostulacionHook.execute(activePostulacionId).catch(() => undefined),
    ]);

    setTipificarModalOpen(false);
  };

  const refrescarTodo = async () => {
    await Promise.all([
      gruposHook.refetch(),
      bandejaCapacitacionHook.refetch(),
      selectedGroupId ? detalleGrupoHook.execute(selectedGroupId) : Promise.resolve(),
    ]);
  };

  return (
    <div className="space-y-6 p-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tablero de Capacitación</h1>
            <p className="mt-1 text-sm text-slate-600">
              Visualiza grupos existentes, revisa postulantes asignados, tipifica y registra resultados.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={refrescarTodo}>
            <RefreshCw size={16} />
            Refrescar
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Grupos</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{grupos.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Bandeja Capacitación</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{bandejaCapacitacion.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Postulaciones Totales</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{bandejaCapacitacion.length}</p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-slate-700">Buscar postulaciones (GET /postulaciones/bandeja/capacitacion)</label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nombre, documento o código de oferta"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        {searchTerm.trim() && (
          <div className="mt-3 max-h-48 overflow-auto rounded-xl border border-slate-200">
            {searchResults.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">Sin coincidencias.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {searchResults.map((post) => (
                  <li key={post.id} className="flex items-center justify-between p-3 text-sm">
                    <span className="text-slate-700">
                      {post.postulante.nombres} {post.postulante.apellidos} · {post.postulante.documento}
                    </span>
                    <span className="text-xs text-slate-500">Etapa: {post.etapaProceso}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Grupos de capacitación</h2>

          {gruposHook.loading && (
            <div className="flex justify-center py-8">
              <Spinner size="medium" />
            </div>
          )}

          {gruposHook.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {gruposHook.error}
            </div>
          )}

          <div className="space-y-3">
            {grupos.map((grupo) => {
              const isActive = selectedGroupId === grupo.id;
              const total = Array.isArray(grupo.detalles)
                ? grupo.detalles.length
                : Array.isArray(grupo.postulaciones)
                ? grupo.postulaciones.length
                : 0;
              return (
                <button
                  key={grupo.id}
                  type="button"
                  onClick={() => openGroup(grupo.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{grupo.nombre || `Grupo ${grupo.id}`}</p>
                  <p className="mt-1 text-xs text-slate-600">Estado: {grupo.estado ?? 'N/A'}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-700">
                    <Users size={13} />
                    {total} asignados
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {!selectedGroupId && (
            <p className="text-sm text-slate-500">Selecciona un grupo para ver detalle y postulantes asignados.</p>
          )}

          {selectedGroupId && detalleGrupoHook.loading && (
            <div className="flex justify-center py-10">
              <Spinner size="medium" />
            </div>
          )}

          {selectedGroupId && detalleGrupoHook.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {detalleGrupoHook.error}
            </div>
          )}

          {selectedGroupId && selectedGroup && (
            <>
              <header className="mb-4 border-b border-slate-200 pb-3">
                <h3 className="text-lg font-semibold text-slate-900">{selectedGroup.nombre || `Grupo ${selectedGroup.id}`}</h3>
              </header>

              {assignedPostulaciones.length === 0 ? (
                <p className="text-sm text-slate-500">Este grupo no tiene postulaciones asignadas.</p>
              ) : (
                <div className="space-y-3">
                  {assignedPostulaciones.map((post) => {
                    return (
                      <article key={post.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {post.postulante.nombres} {post.postulante.apellidos}
                            </p>
                            <p className="text-xs text-slate-600">
                              Puesto de trabajo: {post.ofertaLaboral?.puestoObjetivo
                                ? post.ofertaLaboral.puestoObjetivo
                                    .toLowerCase()
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (char) => char.toUpperCase())
                                : 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => openDetallePostulacion(post.id)}>
                              <Eye size={14} />
                              Detalle
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => openTipificar(post.id)}>
                              Tipificar
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => openHistorial(post.id)}>
                              <History size={14} />
                              Historial
                            </Button>
                          </div>
                        </div>

                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Modal isOpen={detalleModalOpen} onClose={() => setDetalleModalOpen(false)} title="Detalle de postulación" size="lg">
        {detallePostulacionHook.loading && (
          <div className="flex justify-center py-6">
            <Spinner size="small" />
          </div>
        )}

        {detallePostulacionHook.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {detallePostulacionHook.error}
          </div>
        )}

        {activePostulacionDetalle && (
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-semibold">Postulante:</span> {activePostulacionDetalle.postulante.nombres} {activePostulacionDetalle.postulante.apellidos}</p>
            <p><span className="font-semibold">Etapa:</span> {activePostulacionDetalle.etapaProceso}</p>
            <p><span className="font-semibold">Estado:</span> {activePostulacionDetalle.estadoProceso}</p>
            <p><span className="font-semibold">Oferta:</span> {activePostulacionDetalle.ofertaLaboral?.codigo ?? 'N/A'}</p>
            <p><span className="font-semibold">Grupo:</span> {activePostulacionDetalle.idGrupoCapacitacion ?? 'Sin grupo'}</p>
          </div>
        )}
      </Modal>

      <Modal isOpen={tipificarModalOpen} onClose={() => setTipificarModalOpen(false)} title="Tipificar postulante" size="md">
        {catalogoHook.loading && (
          <div className="flex justify-center py-6">
            <Spinner size="small" />
          </div>
        )}

        {catalogoHook.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {catalogoHook.error}
          </div>
        )}

        {!catalogoHook.loading && !catalogoHook.error && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">Catálogo cargado para etapa: {activeEtapaCatalogo}</p>
            <SelectInput
              label="Tipificación"
              name="tipificacion"
              value={tipificarForm.idTipificacion}
              onChange={(value) =>
                setTipificarForm((prev) => ({
                  ...prev,
                  idTipificacion: value,
                  idSubtipificacion: '',
                }))
              }
              placeholder="Selecciona tipificación"
              options={tipificaciones.map((item) => ({
                label: `${item.codigo} - ${item.descripcion}`,
                value: String(item.id),
              }))}
            />

            <SelectInput
              label="Subtipificación"
              name="subtipificacion"
              value={tipificarForm.idSubtipificacion}
              onChange={(value) => setTipificarForm((prev) => ({ ...prev, idSubtipificacion: value }))}
              placeholder="Selecciona subtipificación"
              options={subtipificaciones.map((sub) => ({
                label: `${sub.codigo} - ${sub.descripcion}`,
                value: String(sub.id),
              }))}
            />

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Observación</label>
              <textarea
                rows={3}
                value={tipificarForm.observacion}
                onChange={(event) => setTipificarForm((prev) => ({ ...prev, observacion: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Comentario de tipificación"
              />
            </div>

            <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
              <Button
                type="button"
                variant="primary"
                className="bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100"
                onClick={handleTipificar}
                disabled={tipificarHook.loading || !tipificarForm.idTipificacion || !tipificarForm.idSubtipificacion}
              >
                Confirmar tipificación
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={historialModalOpen} onClose={() => setHistorialModalOpen(false)} title="Eventos de postulación" size="lg">
        {eventosHook.loading && (
          <div className="flex justify-center py-6">
            <Spinner size="small" />
          </div>
        )}

        {eventosHook.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {eventosHook.error}
          </div>
        )}

        {!eventosHook.loading && !eventosHook.error && (
          <div className="space-y-2">
            {(eventosHook.data ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Sin eventos registrados.</p>
            )}
            <ul className="space-y-2">
              {(eventosHook.data ?? []).map((evento) => (
                <li key={evento.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-800">{evento.descripcion}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Etapa: {evento.etapa ?? 'N/A'} · Fecha: {formatEventDate(evento.createdAt ?? evento.fecha)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {tipificarHook.error && (
        <div className="fixed bottom-4 right-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            {tipificarHook.error}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaCapacitacion;
