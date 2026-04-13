import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { useBandejaLeads } from '../hooks';
import { Table } from '@shared/ui/Table';
import { Form } from '@shared/ui/Form';
import { LeadsRepository } from '@shared/api';
import type {
  LeadAsesorVentasResponse,
  LeadAsesorDetalleResponse,
  PlanResponse,
  TipificacionResponse,
} from '@shared/types';

/**
 * Página principal de Asesor de Ventas
 * Gestión de leads asignados y conversión a venta
 */
export const PaginaAsesorVentasDetail: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bandeja' | 'detalle'>('bandeja');
  const [selectedLead, setSelectedLead] = useState<LeadAsesorDetalleResponse | null>(null);
  const [planes, setPlanes] = useState<PlanResponse[]>([]);
  const [tipificaciones, setTipificaciones] = useState<TipificacionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detalleActual, setDetalleActual] = useState<LeadAsesorDetalleResponse | null>(null);

  const [preventaForm, setPreventaForm] = useState({
    nombreTitular: '',
    celularRegistro: '',
    celularReferencia: '',
    correo: '',
  });

  const [direccionForm, setDireccionForm] = useState({
    tipoVia: '',
    via: '',
    direccion: '',
    numero: '',
  });

  const [ofertaForm, setOfertaForm] = useState({
    idPlan: '',
    idPromocion: '',
  });

  const [tipificacionForm, setTipificacionForm] = useState({
    codigoTipificacion: '',
    codigoSubtipificacion: '',
  });

  const {
    data: bandeja = [],
    isLoading: bandejaLoading,
    error: bandejaError,
    refetch: refetchBandeja,
  } = useBandejaLeads();

  const fetchDetalle = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await LeadsRepository.getDetalleAsesor(id);
      setDetalleActual(data);
      setSelectedLead(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detalle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreventa = useCallback(async (idLead: number, payload: any) => {
    setLoading(true);
    setError(null);
    try {
      await LeadsRepository.updateDatosPreventa(idLead, payload);
      await fetchDetalle(idLead);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar preventa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDetalle]);

  const tipificarLead = useCallback(async (idLead: number, payload: any) => {
    setLoading(true);
    setError(null);
    try {
      await LeadsRepository.tipificarLead(idLead, payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al tipificar lead');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([LeadsRepository.getPlanes(), LeadsRepository.getCatalogoTipificacion('VENTA')])
      .then(([planes, catalogo]) => {
        setPlanes(planes);
        setTipificaciones(catalogo.tipificaciones);
      })
      .catch(console.error);
  }, []);

  const handleSelectLead = async (lead: LeadAsesorVentasResponse) => {
    await fetchDetalle(lead.id);
    setActiveTab('detalle');
  };

  const handleUpdatePreventa = async (e: FormEvent) => {
    e.preventDefault();
    if (!detalleActual) return;
    try {
      await updatePreventa(detalleActual.id, preventaForm);
      await refetchBandeja();
      alert('Preventa actualizada');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleTipificar = async (e: FormEvent) => {
    e.preventDefault();
    if (!detalleActual) return;
    try {
      await tipificarLead(detalleActual.id, tipificacionForm);
      await refetchBandeja();
      alert('Lead tipificado');
      setActiveTab('bandeja');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (error || bandejaError) {
    return <div className="alert alert-danger">Error: {error || String(bandejaError)}</div>;
  }

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">Panel Asesor de Ventas - Gestión de Leads</h1>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'bandeja' ? 'active' : ''}`}
            onClick={() => setActiveTab('bandeja')}
          >
            Bandeja Personal ({bandeja.length})
          </button>
        </li>
        {detalleActual && (
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'detalle' ? 'active' : ''}`}>
              Detalle: {detalleActual.nombreTitular}
            </button>
          </li>
        )}
      </ul>

      {activeTab === 'bandeja' && (
        <div>
          <h4 className="mb-3">Mis Leads Asignados</h4>
          <Table<LeadAsesorVentasResponse>
            data={bandeja}
            loading={loading || bandejaLoading}
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'nombreTitular', label: 'Titular' },
              { key: 'correo', label: 'Correo' },
              { key: 'estadoSeguimiento', label: 'Estado' },
              { key: 'fechaAsignacion', label: 'Fecha Asignación' },
            ]}
            actions={[
              {
                label: 'Abrir',
                onClick: handleSelectLead,
              },
            ]}
          />
        </div>
      )}

      {activeTab === 'detalle' && detalleActual && (
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-header">
                <h5>Datos de Preventa</h5>
              </div>
              <div className="card-body">
                <Form
                  fields={[
                    {
                      name: 'nombreTitular',
                      label: 'Nombre del Titular',
                      required: true,
                    },
                    {
                      name: 'celularRegistro',
                      label: 'Celular de Registro',
                      type: 'text',
                    },
                    {
                      name: 'celularReferencia',
                      label: 'Celular de Referencia',
                      type: 'text',
                    },
                    {
                      name: 'correo',
                      label: 'Correo',
                      type: 'email',
                    },
                  ]}
                  values={preventaForm}
                  onChange={(name, value) => setPreventaForm({ ...preventaForm, [name]: value })}
                  onSubmit={handleUpdatePreventa}
                  loading={loading}
                  submitLabel="Guardar Preventa"
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h5>Dirección</h5>
              </div>
              <div className="card-body">
                <p>
                  <strong>{detalleActual.direccion}</strong>
                </p>
                <small>{detalleActual.referencia}</small>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-header">
                <h5>Oferta Comercial</h5>
              </div>
              <div className="card-body">
                <Form
                  fields={[
                    {
                      name: 'idPlan',
                      label: 'Plan',
                      type: 'select',
                      required: true,
                      options: planes.map((p) => ({ value: p.id, label: p.nombre })),
                    },
                  ]}
                  values={ofertaForm}
                  onChange={(name, value) => setOfertaForm({ ...ofertaForm, [name]: value })}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    // Aquí iría la acción de guardar oferta
                  }}
                  submitLabel="Guardar Oferta"
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h5>Tipificación (Cierre)</h5>
              </div>
              <div className="card-body">
                <Form
                  fields={[
                    {
                      name: 'codigoTipificacion',
                      label: 'Tipificación',
                      type: 'select',
                      required: true,
                      options: tipificaciones.map((t) => ({
                        value: t.codigo,
                        label: t.descripcion,
                      })),
                    },
                  ]}
                  values={tipificacionForm}
                  onChange={(name, value) => setTipificacionForm({ ...tipificacionForm, [name]: value })}
                  onSubmit={handleTipificar}
                  submitLabel="Tipificar Lead"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaAsesorVentasDetail;
