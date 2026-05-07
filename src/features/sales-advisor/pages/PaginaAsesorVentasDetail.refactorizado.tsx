import React, { useState, FormEvent } from 'react';
import {
  useBandejaLeads,
  useDetalleLead,
  usePlanes,
  useCatalogoTipificacion,
  useUpdatePreventaMutation,
  useTipificarLeadMutation,
} from '../hooks';
import { Table } from '@shared/ui/Table';
import { SessionLogoutButton } from '@shared/ui';
import { FormularioDatosPreventa } from '../ui/FormularioDatosPreventa';
import { FormularioOfertaComercial } from '../ui/FormularioOfertaComercial';
import { FormularioTipificacion } from '../ui/FormularioTipificacion';
import { DetalleLeadInfo } from '../ui/DetalleLeadInfo';
import type { LeadAsesorVentasResponse, UpdatePreventaPayload, TipificarLeadPayload } from '@shared/types';
import styles from './PaginaAsesorVentasDetail.module.css';

interface Props {
  useBandejaLeadsHook?: typeof useBandejaLeads;
  useDetalleLeadHook?: typeof useDetalleLead;
  usePlanesHook?: typeof usePlanes;
  useCatalogoTipificacionHook?: typeof useCatalogoTipificacion;
  useUpdatePreventaHook?: typeof useUpdatePreventaMutation;
  useTipificarLeadHook?: typeof useTipificarLeadMutation;
}

export const PaginaAsesorVentasDetail: React.FC<Props> = ({
  useBandejaLeadsHook = useBandejaLeads,
  useDetalleLeadHook = useDetalleLead,
  usePlanesHook = usePlanes,
  useCatalogoTipificacionHook = useCatalogoTipificacion,
  useUpdatePreventaHook = useUpdatePreventaMutation,
  useTipificarLeadHook = useTipificarLeadMutation,
}) => {
  const [activeTab, setActiveTab] = useState<'bandeja' | 'detalle'>('bandeja');
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const [preventaForm, setPreventaForm] = useState<UpdatePreventaPayload>({
    nombreTitular: '',
    celularRegistro: '',
    celularReferencia: '',
    correo: '',
  });

  const [tipificacionForm, setTipificacionForm] = useState<TipificarLeadPayload>({
    codigoTipificacion: '',
    codigoSubtipificacion: '',
  });

  const {
    data: bandeja = [],
    isLoading: bandejaLoading,
    error: bandejaError,
  } = useBandejaLeadsHook();

  const {
    data: detalleActual,
    isLoading: detalleLoading,
    error: detalleError,
  } = useDetalleLeadHook(selectedLeadId);

  const { data: planes = [] } = usePlanesHook();

  const { data: catalogo } = useCatalogoTipificacionHook('VENTA');

  const updatePreventaMutation = useUpdatePreventaHook();
  const tipificarMutation = useTipificarLeadHook();

  const tipificaciones = catalogo?.tipificaciones || [];

  const handleSelectLead = async (lead: LeadAsesorVentasResponse) => {
    setSelectedLeadId(lead.id);
    setActiveTab('detalle');
    setPreventaForm({
      nombreTitular: '',
      celularRegistro: '',
      celularReferencia: '',
      correo: '',
    });
  };

  const handleUpdatePreventa = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) return;

    try {
      await updatePreventaMutation.mutateAsync({
        idLead: selectedLeadId,
        payload: preventaForm,
      });
      alert('Preventa actualizada');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleTipificar = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) return;

    try {
      await tipificarMutation.mutateAsync({
        idLead: selectedLeadId,
        payload: tipificacionForm,
      });
      alert('Lead tipificado');
      setActiveTab('bandeja');
      setSelectedLeadId(null);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const error = detalleError || bandejaError;
  const isLoading = bandejaLoading || (activeTab === 'detalle' && detalleLoading);

  if (error) {
    return <div className="alert alert-danger">Error: {String(error)}</div>;
  }

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Panel Asesor de Ventas - Gestión de Leads</h1>
        <SessionLogoutButton />
      </div>

      <ul className={`nav nav-tabs ${styles.tabsList}`}>
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
            loading={isLoading}
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
            <FormularioDatosPreventa
              values={preventaForm}
              onChange={(name, value) => setPreventaForm({ ...preventaForm, [name]: value })}
              onSubmit={handleUpdatePreventa}
              loading={updatePreventaMutation.isPending}
            />
            <DetalleLeadInfo lead={detalleActual} />
          </div>

          <div className="col-md-6">
            <FormularioOfertaComercial
              planes={planes}
              values={{ idPlan: '', idPromocion: '' }}
              onChange={() => {}}
              loading={false}
            />
            <FormularioTipificacion
              tipificaciones={tipificaciones}
              values={tipificacionForm}
              onChange={(name, value) => setTipificacionForm({ ...tipificacionForm, [name]: value })}
              onSubmit={handleTipificar}
              loading={tipificarMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaAsesorVentasDetail;
