import React, { useMemo, useState } from 'react';
import { AlertCircle, Eye, History, RefreshCw, Search, Users } from 'lucide-react';
import { Button, Modal, SelectInput, SessionLogoutButton, Spinner } from '@shared/ui';
import {
  DsEyebrow,
  DsInlineMessage,
  DsSectionCard,
  DsStatGrid,
  DsStatusBadge,
} from '@shared/ui/design-system';
import {
  useBandejaCapacitacion,
  useCatalogoTipificaciones,
  useDetalleGrupoCapacitacion,
  useDetallePostulacion,
  useEventosPostulacion,
  useGruposCapacitacion,
  useTipificarPostulacion,
} from '@features/hr/applications/hooks';
import type {
  GrupoCapacitacionResponse,
  PostulacionResponse,
  TipificarPostulacionRequest,
} from '@features/hr/applications/model';
import styles from './PaginaCapacitacion.module.css';

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

const getGroupStatusTone = (estado?: GrupoCapacitacionResponse['estado']) => {
  const normalized = String(estado ?? '').toUpperCase();

  if (!normalized) {
    return 'neutral' as const;
  }

  if (normalized.includes('ACT')) {
    return 'success' as const;
  }

  if (normalized.includes('PEND') || normalized.includes('PROC')) {
    return 'warning' as const;
  }

  if (normalized.includes('ERR') || normalized.includes('RECH')) {
    return 'danger' as const;
  }

  return 'neutral' as const;
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

    try {
      await tipificarHook.mutateAsync({ id: activePostulacionId, body: payload });

      if (selectedGroupId) {
        await detalleGrupoHook.execute(selectedGroupId).catch(() => undefined);
      }

      await Promise.all([
        bandejaCapacitacionHook.refetch(),
        detallePostulacionHook.execute(activePostulacionId).catch(() => undefined),
      ]);

      setTipificarModalOpen(false);
    } catch (error) {
      console.error('[PaginaCapacitacion] Error al tipificar:', error);
    }
  };

  const refrescarTodo = async () => {
    await Promise.all([
      gruposHook.refetch(),
      bandejaCapacitacionHook.refetch(),
      selectedGroupId ? detalleGrupoHook.execute(selectedGroupId) : Promise.resolve(),
    ]);
  };

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <p className={styles.eyebrow}>Capacitacion</p>
              <h1>Tablero de Capacitación</h1>
              <p className={styles.subtitle}>Visualiza grupos existentes, revisa postulantes asignados, tipifica y registra resultados.</p>
            </div>
            <div className={styles.headerActions}>
              <Button type="button" variant="secondary" onClick={refrescarTodo} className={styles.refreshButton}>
                <RefreshCw size={16} />
                Refrescar
              </Button>
              <SessionLogoutButton />
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <section className={styles.section}>
          <DsStatGrid
            columns={3}
            className={styles.statsGrid}
            items={[
              { label: 'Grupos', value: grupos.length },
              { label: 'Bandeja capacitación', value: bandejaCapacitacion.length },
              { label: 'Postulaciones totales', value: bandejaCapacitacion.length },
            ]}
          />

          <DsSectionCard className={`${styles.panelCard} ${styles.searchCard}`.trim()}>
            <label className={styles.searchLabel}>Buscar postulaciones</label>
            <div className={styles.searchField}>
              <Search size={16} className={styles.searchIcon} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nombre, documento o código de oferta"
                className={styles.searchInput}
              />
            </div>
            {searchTerm.trim() && (
              <div className={styles.searchResults}>
                {searchResults.length === 0 ? (
                  <p className={styles.searchResultEmpty}>Sin coincidencias.</p>
                ) : (
                  <ul className={styles.searchResultList}>
                    {searchResults.map((post) => (
                      <li key={post.id} className={styles.searchResultItem}>
                        <span className={styles.searchResultMain}>
                          {post.postulante.nombres} {post.postulante.apellidos} · {post.postulante.documento}
                        </span>
                        <span className={styles.searchResultMeta}>Etapa: {post.etapaProceso}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </DsSectionCard>

          <div className={styles.mainGrid}>
            <DsSectionCard className={`${styles.panelCard} ${styles.groupsCard}`.trim()}>
              <DsEyebrow>Grupos de capacitación</DsEyebrow>

              {gruposHook.loading && (
                <div className={styles.centeredLoading}>
                  <Spinner size="medium" />
                </div>
              )}

              {gruposHook.error && (
                <DsInlineMessage tone="danger">
                  {gruposHook.error}
                </DsInlineMessage>
              )}

              <div className={styles.groupsList}>
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
                      className={`${styles.groupCard} ${isActive ? styles.groupCardActive : ''}`.trim()}
                    >
                      <p className={styles.groupTitle}>{grupo.nombre || `Grupo ${grupo.id}`}</p>
                      <div className={styles.groupMeta}>
                        <DsStatusBadge
                          tone={getGroupStatusTone(grupo.estado)}
                          label={`Estado: ${grupo.estado ?? 'N/A'}`}
                        />
                        <span className={styles.groupCount}>
                          <Users size={13} />
                          {total} asignados
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </DsSectionCard>

            <DsSectionCard className={`${styles.panelCard} ${styles.detailCard}`.trim()}>
              {!selectedGroupId && (
                <p className={styles.emptyStateText}>Selecciona un grupo para ver detalle y postulantes asignados.</p>
              )}

              {selectedGroupId && detalleGrupoHook.loading && (
                <div className={styles.centeredLoading}>
                  <Spinner size="medium" />
                </div>
              )}

              {selectedGroupId && detalleGrupoHook.error && (
                <DsInlineMessage tone="danger">
                  {detalleGrupoHook.error}
                </DsInlineMessage>
              )}

              {selectedGroupId && selectedGroup && (
                <>
                  <header className={styles.detailHeader}>
                    <h3 className={styles.groupTitle}>{selectedGroup.nombre || `Grupo ${selectedGroup.id}`}</h3>
                  </header>

                  {assignedPostulaciones.length === 0 ? (
                    <p className={styles.emptyStateText}>Este grupo no tiene postulaciones asignadas.</p>
                  ) : (
                    <div className={styles.postList}>
                      {assignedPostulaciones.map((post) => {
                        return (
                          <article key={post.id} className={styles.postCard}>
                            <div className={styles.postCardTop}>
                              <div>
                                <p className={styles.postName}>
                                  {post.postulante.nombres} {post.postulante.apellidos}
                                </p>
                                <p className={styles.postPosition}>
                                  Puesto de trabajo: {post.ofertaLaboral?.puestoObjetivo
                                    ? post.ofertaLaboral.puestoObjetivo
                                        .toLowerCase()
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, (char) => char.toUpperCase())
                                    : 'N/A'}
                                </p>
                              </div>
                              <div className={styles.groupMeta}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDetallePostulacion(post.id)}
                                  className={styles.postActionButton}
                                >
                                  <Eye size={14} />
                                  Detalle
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openTipificar(post.id)}
                                  className={styles.postActionButton}
                                >
                                  Tipificar
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openHistorial(post.id)}
                                  className={styles.postActionButton}
                                >
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
            </DsSectionCard>
          </div>
          </section>
        </main>
      </div>

      <Modal isOpen={detalleModalOpen} onClose={() => setDetalleModalOpen(false)} title="Detalle de postulación" size="lg">
        {detallePostulacionHook.loading && (
          <div className={styles.centeredLoading}>
            <Spinner size="small" />
          </div>
        )}

        {detallePostulacionHook.error && (
          <DsInlineMessage tone="danger">
            {detallePostulacionHook.error}
          </DsInlineMessage>
        )}

        {activePostulacionDetalle && (
          <div className={styles.detailList}>
            <p className={styles.detailItem}><span className={styles.detailLabel}>Postulante:</span> {activePostulacionDetalle.postulante.nombres} {activePostulacionDetalle.postulante.apellidos}</p>
            <p className={styles.detailItem}><span className={styles.detailLabel}>Etapa:</span> {activePostulacionDetalle.etapaProceso}</p>
            <p className={styles.detailItem}><span className={styles.detailLabel}>Estado:</span> {activePostulacionDetalle.estadoProceso}</p>
            <p className={styles.detailItem}><span className={styles.detailLabel}>Oferta:</span> {activePostulacionDetalle.ofertaLaboral?.codigo ?? 'N/A'}</p>
            <p className={styles.detailItem}><span className={styles.detailLabel}>Grupo:</span> {activePostulacionDetalle.idGrupoCapacitacion ?? 'Sin grupo'}</p>
          </div>
        )}
      </Modal>

      <Modal isOpen={tipificarModalOpen} onClose={() => setTipificarModalOpen(false)} title="Tipificar postulante" size="md">
        {catalogoHook.loading && (
          <div className={styles.centeredLoading}>
            <Spinner size="small" />
          </div>
        )}

        {catalogoHook.error && (
          <DsInlineMessage tone="danger">
            {catalogoHook.error}
          </DsInlineMessage>
        )}

        {!catalogoHook.loading && !catalogoHook.error && (
          <div className={styles.tipificarBody}>
            <p className={styles.searchResultMeta}>Catálogo cargado para etapa: {activeEtapaCatalogo}</p>
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
              <label className={styles.formLabel}>Observación</label>
              <textarea
                rows={3}
                value={tipificarForm.observacion}
                onChange={(event) => setTipificarForm((prev) => ({ ...prev, observacion: event.target.value }))}
                className={styles.textareaField}
                placeholder="Comentario de tipificación"
              />
            </div>

            <div className={styles.modalFooter}>
              <Button
                type="button"
                variant="default"
                onClick={handleTipificar}
                disabled={tipificarHook.isPending || !tipificarForm.idTipificacion || !tipificarForm.idSubtipificacion}
              >
                Confirmar tipificación
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={historialModalOpen} onClose={() => setHistorialModalOpen(false)} title="Eventos de postulación" size="lg">
        {eventosHook.loading && (
          <div className={styles.centeredLoading}>
            <Spinner size="small" />
          </div>
        )}

        {eventosHook.error && (
          <DsInlineMessage tone="danger">
            {eventosHook.error}
          </DsInlineMessage>
        )}

        {!eventosHook.loading && !eventosHook.error && (
          <div className={styles.eventosWrapper}>
            {(eventosHook.data ?? []).length === 0 && (
              <p className={styles.emptyStateText}>Sin eventos registrados.</p>
            )}
            <ul className={styles.postList}>
              {(eventosHook.data ?? []).map((evento) => (
                <li key={evento.id} className={styles.eventItem}>
                  <p className={styles.eventTitle}>{evento.descripcion}</p>
                  <p className={styles.eventMeta}>
                    Etapa: {evento.etapa ?? 'N/A'} · Fecha: {formatEventDate(evento.createdAt ?? evento.fecha)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {tipificarHook.error && (
        <div className={styles.floatingError}>
          <div className={styles.floatingErrorContent}>
            <AlertCircle size={14} />
            {tipificarHook.error.message || String(tipificarHook.error)}
          </div>
        </div>
      )}
    </>
  );
};

export default PaginaCapacitacion;
