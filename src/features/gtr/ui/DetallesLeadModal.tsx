/**
 * Modal de Detalles del Lead con historial de Eventos
 */

import React, { useState } from 'react';
import type { LeadGtrResponse } from '@entities/lead/types';
import { useEventosByLead } from '../hooks/useEventosQueries';
import type { EventoResponse } from '../model/eventos.api';
import styles from './DetallesLeadModal.module.css';

interface DetallesLeadModalProps {
  lead: LeadGtrResponse;
  onClose: () => void;
  dashboardMode?: boolean;
}

/**
 * Obtiene el color de badge según el tipo de evento
 */
const getTipoEventoBadgeColor = (tipo: string): string => {
  const colorMap: Record<string, string> = {
    CONTACTO: '#0066cc',         // Azul
    TIPIFICACION: '#28a745',     // Verde
    VALIDACION: '#fd7e14',       // Naranja
    CAMBIO_ETAPA: '#6c757d',     // Gris
    ASIGNACION: '#17a2b8',       // Cian
    REASIGNACION: '#17a2b8',     // Cian
    ERROR: '#dc3545',            // Rojo
  };
  return colorMap[tipo] || '#6c757d';
};

/**
 * Formatea la fecha para mostrar
 */
const formatFecha = (fecha: string): string => {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getEventoDescripcion = (evento: EventoResponse): string => {
  const accion = (evento.accion ?? '').toUpperCase();

  if (accion === 'REGISTRO' && evento.nombreActor) {
    return `por ${evento.nombreActor}`;
  }

  if (accion === 'ASIGNACION' && evento.nombreAsesorAsignado) {
    return `a ${evento.nombreAsesorAsignado}`;
  }

  if (evento.tipificacion) {
    return `Tipificación: ${evento.tipificacion}`;
  }

  if (evento.subtipificacion) {
    return `Subtipificación: ${evento.subtipificacion}`;
  }

  return evento.comentario ?? 'Sin descripción';
};

const formatRol = (rol?: string): string => {
  if (!rol) {
    return '-';
  }

  return rol.replace(/_/g, ' ').toUpperCase();
};

const getRolAsesorAsignado = (evento: EventoResponse): string | null => {
  if (evento.rolAsesorAsignado) {
    return evento.rolAsesorAsignado;
  }

  if (evento.nombreAsesorAsignado) {
    return 'ASESOR_VENTAS';
  }

  return null;
};

export const DetallesLeadModal: React.FC<DetallesLeadModalProps> = ({
  lead,
  onClose,
  dashboardMode = false,
}) => {
  const [mostrarDetalles, setMostrarDetalles] = useState<number | null>(null);
  const { data: eventos, isLoading: eventosLoading, isError: eventosError } = useEventosByLead(lead.id);

  return (
    <div className={`${styles.overlay} ${dashboardMode ? styles.dashboardMode : ''}`} onClick={onClose}>
      <div className={`${styles.modal} ${dashboardMode ? styles.dashboardModal : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.container}>
          {/* Sección de Información del Lead */}
          <section className={styles.section}>
            <h2>Detalles del Lead #{lead.id}</h2>
            <div className={styles.leadInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Teléfono:</span>
                <span className={styles.value}>{lead.prefijo}{lead.lead}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Titular:</span>
                <span className={styles.value}>{lead.nombreTitular}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Campaña:</span>
                <span className={styles.value}>{lead.nombreCampana}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Proveedor:</span>
                <span className={styles.value}>{lead.nombreProveedorCampana}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Asesor Asignado:</span>
                <span className={styles.value}>{lead.nombreAsesorAsignado || '-'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Estado:</span>
                <span className={`${styles.value} ${styles.statusPill}`}>
                  {lead.estadoSeguimiento}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Tipificación:</span>
                <span className={styles.value}>
                  {lead.codigoTipificacion ? `${lead.codigoTipificacion}` : '-'}
                  {lead.codigoSubtipificacion && ` > ${lead.codigoSubtipificacion}`}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Fecha Creación:</span>
                <span className={styles.value}>{formatFecha(lead.createdAt)}</span>
              </div>
            </div>
          </section>

          {/* Sección de Historial de Eventos */}
          <section className={styles.section}>
            <h2>Historial de Eventos</h2>
            
            {eventosLoading && (
              <div className={styles.loading}>
                <p>{dashboardMode ? 'Cargando eventos...' : '⏳ Cargando eventos...'}</p>
              </div>
            )}

            {eventosError && (
              <div className={styles.error}>
                <p>{dashboardMode ? 'Error al cargar los eventos' : '❌ Error al cargar los eventos'}</p>
              </div>
            )}

            {!eventosLoading && !eventosError && (!eventos || eventos.length === 0) && (
              <div className={styles.empty}>
                <p>{dashboardMode ? 'No hay eventos registrados para este lead' : '📭 No hay eventos registrados para este lead'}</p>
              </div>
            )}

            {!eventosLoading && !eventosError && eventos && eventos.length > 0 && (
              <div className={styles.eventosList}>
                {eventos.map((evento, idx) => {
                  const rolActor = formatRol(evento.rolActor);
                  const rolAsesorAsignado = getRolAsesorAsignado(evento);

                  return (
                    <div key={evento.id} className={styles.eventoItem}>
                    <div
                      className={styles.eventoHeader}
                      onClick={() => setMostrarDetalles(mostrarDetalles === idx ? null : idx)}
                    >
                      <span className={styles.eventoBadge} style={{ backgroundColor: getTipoEventoBadgeColor(evento.accion ?? evento.etapa ?? 'EVENTO') }}>
                        {evento.accion ?? evento.etapa ?? 'EVENTO'}
                      </span>
                      <span className={styles.eventoDescripcion}>
                        {getEventoDescripcion(evento)}
                      </span>
                      <span className={styles.eventoFecha}>{formatFecha(evento.createdAt)}</span>
                      <span className={styles.eventoToggle}>{mostrarDetalles === idx ? '▼' : '▶'}</span>
                    </div>

                    {mostrarDetalles === idx && (
                      <div className={styles.eventoDetalles}>
                        {evento.nombreActor && (
                          <div className={styles.personRow}>
                            <span className={styles.personLabel}>Actor:</span>
                            <span className={styles.personName}>{evento.nombreActor}</span>
                            {evento.rolActor && (
                              <span className={styles.personRole}>{rolActor}</span>
                            )}
                          </div>
                        )}
                        {evento.nombreAsesorAsignado && (
                          <div className={styles.personRow}>
                            <span className={styles.personLabel}>Asesor asignado:</span>
                            <span className={styles.personName}>{evento.nombreAsesorAsignado}</span>
                            {rolAsesorAsignado && (
                              <span className={styles.personRole}>{formatRol(rolAsesorAsignado)}</span>
                            )}
                          </div>
                        )}
                        {evento.etapa && (
                          <div className={styles.inlineDetalleRow}>
                            <strong>Etapa:</strong>
                            <span>{evento.etapa}</span>
                          </div>
                        )}
                        {evento.tipificacion && (
                          <div className={styles.detalleRow}>
                            <strong>Tipificación:</strong> {evento.tipificacion}
                          </div>
                        )}
                        {evento.subtipificacion && (
                          <div className={styles.detalleRow}>
                            <strong>Subtipificación:</strong> {evento.subtipificacion}
                          </div>
                        )}
                        {evento.fechaInstalacion && (
                          <div className={styles.detalleRow}>
                            <strong>Fecha Instalación:</strong> {formatFecha(evento.fechaInstalacion)}
                          </div>
                        )}
                        {evento.comentario && (
                          <div className={styles.detalleRow}>
                            <strong>Comentario:</strong> {evento.comentario}
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className={styles.footer}>
          <button className={styles.closeButton} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
