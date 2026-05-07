/**
 * Componente AsignacionLead - Modal/Formulario para asignar lead a asesor
 * Endpoint: PATCH /leads/{idLead}/asignacion
 * FSD: caracteristicas/gtr/ui
 */

import React, { useState, useEffect } from 'react';
import { FormSelect } from '@shared/ui/form-select/FormSelect';
import { FormInput } from '@shared/ui/form-input/FormInput';
import { Button } from '@shared/ui';
import { Alert, Spinner } from '@shared/ui/utilities/Utilities';
import { useAssignLeadMutation } from '../hooks/useGtrQueries';
import type { LeadAsignacionRequest, PermisosGTR } from '@entities/lead/types';
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
  dashboardMode?: boolean;
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
  dashboardMode = false,
}) => {
  // ========== ESTADO ==========
  const [idAsesorAsignado, setIdAsesorAsignado] = useState<string>(
    asesorActual?.id.toString() || ''
  );
  const [observaciones, setObservaciones] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  // ========== MUTACIONES ==========
  const assignMutation = useAssignLeadMutation();

  // ========== EFECTOS ==========
  // Limpiar errores cuando se cambia de asesor
  useEffect(() => {
    if (idAsesorAsignado) {
      setErrors({});
      setSuccessMessage('');
    }
  }, [idAsesorAsignado]);

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

      setSuccessMessage(`Lead asignado a ${asesorSeleccionado.nombre}`);
      setErrors({});
      
      // Llamar onSuccess después de un breve delay para que el usuario vea el mensaje
      setTimeout(() => {
        onSuccess?.(asesorSeleccionado.nombre);
      }, 1500);

      // Limpiar
      setIdAsesorAsignado('');
      setObservaciones('');
    } catch (error) {
      // Extraer el mensaje de error del objeto ApiError normalizado o AxiosError
      let errorMsg = 'Error al asignar lead';
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMsg = error.message;
        } else if ('details' in error && error.details && typeof error.details === 'object') {
          // Intentar extraer mensaje de details
          const details = error.details as Record<string, unknown>;
          if (typeof details.message === 'string') {
            errorMsg = details.message;
          }
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      console.log('[AsignacionLead] Error capturado:', errorMsg);
      console.log('[AsignacionLead] Error completo:', error);
      
      // Si el error es que el asesor ya gestionó el lead, tratarlo como advertencia
      // Buscar variaciones del mensaje (case-insensitive)
      const errorMsgLower = errorMsg.toLowerCase();
      if (
        errorMsgLower.includes('ya ha gestionado') ||
        errorMsgLower.includes('ya gestionó') ||
        errorMsgLower.includes('gestionado') && errorMsgLower.includes('anteriormente')
      ) {
        // Mostrar como advertencia (error) pero sin cerrar el modal
        setErrors({ form: `${asesorSeleccionado.nombre}: Asesor de Ventas ya ha gestionado el Lead anteriormente` });
        setSuccessMessage('');
      } else {
        setErrors({ form: errorMsg });
        setSuccessMessage('');
      }
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
    <div className={`${styles.container} ${dashboardMode ? styles.dashboardMode : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Asignar Lead</h3>
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
          onChange={setIdAsesorAsignado}
          options={asesorOptions}
          placeholder="Selecciona un asesor disponible"
          required
          error={errors.asesor}
          disabled={isLoading || assignMutation.isPending}
          className={dashboardMode ? styles.dashboardField : ''}
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
            variant="default"
            disabled={
              !permisos.ASSIGN_LEADS ||
              assignMutation.isPending ||
              isLoading ||
              !idAsesorAsignado
            }
          >
            {assignMutation.isPending || isLoading ? 'Asignando...' : 'Asignar'}
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

        {successMessage && (
          <Alert
            type="success"
            message={successMessage}
            dismissible
            onClose={() => setSuccessMessage('')}
          />
        )}
      </form>
    </div>
  );
};

export default AsignacionLead;
