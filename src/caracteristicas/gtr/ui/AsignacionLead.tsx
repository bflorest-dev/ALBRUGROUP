/**
 * Componente AsignacionLead - Modal/Formulario para asignar lead a asesor
 * Endpoint: PATCH /leads/{idLead}/asignacion
 * FSD: caracteristicas/gtr/ui
 */

import React, { useState, useEffect } from 'react';
import { FormSelect } from '@shared/ui/form-select/FormSelect';
import { FormInput } from '@shared/ui/form-input/FormInput';
import { Button, Alert, Spinner } from '@shared/ui/utilities/Utilities';
import { useAssignLeadMutation } from '../hooks/useGtrQueries';
import type { LeadAsignacionRequest, PermisosGTR } from '@entidades/lead/types';
import styles from './AsignacionLead.module.css';

interface AsignacionLeadProps {
  idLead: number;
  nombreLeadActual?: string;
  asesorActual?: { id: number; nombre: string };
  asesoresDisponibles: Array<{ id: number; nombre: string }>;
  isLoading?: boolean;
  onSuccess?: (asesorNombre: string) => void;
  onCancel?: () => void;
  permisos: PermisosGTR;
}

/**
 * Formulario para asignar/reasignar lead a un asesor
 * Validaciones:
 * - idAsesorAsignado: requerido, debe ser asesor disponible
 */
export const AsignacionLead: React.FC<AsignacionLeadProps> = ({
  idLead,
  nombreLeadActual,
  asesorActual,
  asesoresDisponibles,
  isLoading = false,
  onSuccess,
  onCancel,
  permisos,
}) => {
  // ========== ESTADO ==========
  const [idAsesorAsignado, setIdAsesorAsignado] = useState<string>(
    asesorActual?.id.toString() || ''
  );
  const [observaciones, setObservaciones] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ========== MUTACIONES ==========
  const assignMutation = useAssignLeadMutation();

  // ========== VALIDACIONES ==========
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!idAsesorAsignado || idAsesorAsignado === '0') {
      newErrors.asesor = 'Selecciona un asesor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== HANDLERS ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!permisos.ASSIGN_LEADS) {
      setErrors({ form: 'No tienes permiso para asignar leads' });
      return;
    }

    const asesorSeleccionado = asesoresDisponibles.find(
      (a) => a.id.toString() === idAsesorAsignado
    );

    if (!asesorSeleccionado) {
      setErrors({ asesor: 'Asesor no válido' });
      return;
    }

    try {
      const assignData: LeadAsignacionRequest = {
        idAsesorAsignado: parseInt(idAsesorAsignado),
        nombreAsesorAsignado: asesorSeleccionado.nombre,
      };

      await assignMutation.mutateAsync({
        idLead,
        data: assignData,
      });

      onSuccess?.(asesorSeleccionado.nombre);

      // Limpiar
      setIdAsesorAsignado('');
      setObservaciones('');
      setErrors({});
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al asignar lead';
      setErrors({ form: errorMsg });
    }
  };

  // ========== RENDER ==========
  if (!permisos.ASSIGN_LEADS) {
    return (
      <Alert
        type="warning"
        message="No tienes permiso para asignar leads"
      />
    );
  }

  const asesorOptions = asesoresDisponibles.map((a) => ({
    value: a.id,
    label: a.nombre,
  }));

  const asesorSeleccionado = asesoresDisponibles.find(
    (a) => a.id.toString() === idAsesorAsignado
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Asignar Lead</h3>
        {nombreLeadActual && (
          <p className={styles.leadInfo}>Lead: <strong>{nombreLeadActual}</strong></p>
        )}
      </div>

      {errors.form && (
        <Alert
          type="error"
          message={errors.form}
          dismissible
          onClose={() => setErrors({ form: '' })}
        />
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Asesor Actual */}
        {asesorActual && (
          <div className={styles.currentAsesor}>
            <small>Asesor actual: <strong>{asesorActual.nombre}</strong></small>
          </div>
        )}

        {/* Seleccionar Asesor */}
        <FormSelect
          label="Asesor a Asignar"
          name="asesor"
          value={idAsesorAsignado}
          onChange={(value) => setIdAsesorAsignado(String(value))}
          options={asesorOptions}
          placeholder="Selecciona un asesor disponible"
          required
          error={errors.asesor}
          disabled={isLoading || assignMutation.isPending}
        />

        {asesorSeleccionado && (
          <div className={styles.asesorPreview}>
            <strong>✓ {asesorSeleccionado.nombre}</strong>
            <small>Asignación confirmada</small>
          </div>
        )}

        {/* Observaciones (opcional) */}
        {/* <TextArea
          label="Observaciones (opcional)"
          name="observaciones"
          value={observaciones}
          onChange={setObservaciones}
          placeholder="Razón de la reasignación..."
          rows={3}
          maxLength={200}
        /> */}

        {/* Botones */}
        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            isLoading={assignMutation.isPending || isLoading}
            disabled={
              !permisos.ASSIGN_LEADS ||
              assignMutation.isPending ||
              isLoading ||
              !idAsesorAsignado
            }
          >
            Asignar
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={assignMutation.isPending}
          >
            Cancelar
          </Button>
        </div>

        {assignMutation.isSuccess && (
          <Alert
            type="success"
            message={`Lead asignado a ${asesorSeleccionado?.nombre}`}
            dismissible
            onClose={() => assignMutation.reset()}
          />
        )}
      </form>
    </div>
  );
};

export default AsignacionLead;
