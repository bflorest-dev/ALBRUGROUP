/**
 * @file useCampaignForm.ts
 * @description Hook personalizado para gestionar el formulario de Campaign
 * @layer features/community
 */

import { useState, useCallback, useEffect } from 'react';
import { fetchCuentasPublicitarias, fetchProveedores, createCampaign } from '@shared/services/campaignService';
import type { CreateCampaignPayload, CuentaPublicitaria, Proveedor } from '@entidades/campana';

export interface CampaignFormState {
  nombre: string;
  numeroWhatsapp: string;
  cuentasIds: string[];
  proveedoresIds: string[];
}

export interface CampaignFormErrors {
  nombre?: string;
  numeroWhatsapp?: string;
  cuentasIds?: string;
  proveedoresIds?: string;
}

export interface UseCampaignFormReturn {
  formState: CampaignFormState;
  setFormState: React.Dispatch<React.SetStateAction<CampaignFormState>>;
  cuentas: CuentaPublicitaria[];
  proveedores: Proveedor[];
  loading: boolean;
  submitting: boolean;
  errors: CampaignFormErrors;
  globalMessage: string;
  loadData: () => Promise<void>;
  handleInputChange: (field: keyof Omit<CampaignFormState, 'cuentasIds' | 'proveedoresIds'>, value: string) => void;
  handleCuentasChange: (ids: string[]) => void;
  handleProveedoresChange: (ids: string[]) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
}

const initialFormState: CampaignFormState = {
  nombre: '',
  numeroWhatsapp: '',
  cuentasIds: [],
  proveedoresIds: [],
};

export const useCampaignForm = (): UseCampaignFormReturn => {
  const [formState, setFormState] = useState<CampaignFormState>(initialFormState);
  const [cuentas, setCuentas] = useState<CuentaPublicitaria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const [globalMessage, setGlobalMessage] = useState('');

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    setLoading(true);
    setGlobalMessage('');
    const errors: string[] = [];
    let cuentasData: CuentaPublicitaria[] = [];
    let proveedoresData: Proveedor[] = [];

    // Intentar cargar cuentas
    try {
      cuentasData = await fetchCuentasPublicitarias();
    } catch (err: any) {
      console.error('[useCampaignForm] Error loading cuentas:', err);
      errors.push(`Cuentas: ${err.message}`);
    }

    // Intentar cargar proveedores
    try {
      proveedoresData = await fetchProveedores();
    } catch (err: any) {
      console.error('[useCampaignForm] Error loading proveedores:', err);
      errors.push(`Proveedores: ${err.message}`);
    }

    // Establecer datos y mostrar mensaje
    setCuentas(Array.isArray(cuentasData) ? cuentasData : []);
    setProveedores(Array.isArray(proveedoresData) ? proveedoresData : []);

    if (errors.length > 0) {
      // Mostrar errores específicos
      const errorMsg = `⚠️ ${errors.join(' | ')}`;
      setGlobalMessage(errorMsg);
    } else {
      setGlobalMessage('');
    }

    setLoading(false);
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Validar formulario
  const validateForm = useCallback((): boolean => {
    const newErrors: CampaignFormErrors = {};

    if (!formState.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formState.numeroWhatsapp.trim()) {
      newErrors.numeroWhatsapp = 'El número de WhatsApp es requerido';
    }

    if (formState.cuentasIds.length === 0) {
      newErrors.cuentasIds = 'Debes seleccionar al menos una cuenta';
    }

    if (formState.proveedoresIds.length === 0) {
      newErrors.proveedoresIds = 'Debes seleccionar al menos un proveedor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  // Handlers
  const handleInputChange = useCallback((field: keyof Omit<CampaignFormState, 'cuentasIds' | 'proveedoresIds'>, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleCuentasChange = useCallback((ids: string[]) => {
    setFormState((prev) => ({ ...prev, cuentasIds: ids }));
    setErrors((prev) => ({ ...prev, cuentasIds: undefined }));
  }, []);

  const handleProveedoresChange = useCallback((ids: string[]) => {
    setFormState((prev) => ({ ...prev, proveedoresIds: ids }));
    setErrors((prev) => ({ ...prev, proveedoresIds: undefined }));
  }, []);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      setGlobalMessage('⚠️ Por favor completa todos los campos requeridos');
      return;
    }

    // Evitar doble-click
    if (submitting) {
      console.warn('[useCampaignForm] Already submitting, ignoring double-click');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateCampaignPayload = {
        nombre: formState.nombre.trim(),
        numeroWhatsapp: formState.numeroWhatsapp.trim(),
        cuentas: formState.cuentasIds,
        proveedores: formState.proveedoresIds,
      };

      console.debug('[useCampaignForm] Submitting:', payload);
      await createCampaign(payload);

      setGlobalMessage('✅ Campaña creada exitosamente');
      resetForm();
    } catch (err: any) {
      const errorMsg = err.message || 'Error desconocido';
      console.error('[useCampaignForm] Error submitting:', errorMsg);
      setGlobalMessage(`❌ ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  }, [formState, submitting, validateForm]);

  // Reset
  const resetForm = useCallback(() => {
    setFormState(initialFormState);
    setErrors({});
  }, []);

  return {
    formState,
    setFormState,
    cuentas,
    proveedores,
    loading,
    submitting,
    errors,
    globalMessage,
    loadData,
    handleInputChange,
    handleCuentasChange,
    handleProveedoresChange,
    handleSubmit,
    resetForm,
  };
};
