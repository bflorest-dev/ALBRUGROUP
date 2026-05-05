/**
 * @file useCampaignForm.ts
 * @description Hook personalizado para gestionar el formulario de Campaign
 * @layer features/community
 */

import { useState, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getErrorMessage } from '@shared/lib/error-utils';
import { createCampaign } from '@features/community/api/campaignService';
import type { CreateCampaignPayload, CuentaPublicitaria, Proveedor } from '@entities/campaign';

export interface CampaignFormState {
  nombre: string;
  numeroWhatsappEmpresa: string;
  idCuentaPublicitaria: number | null;
  idProveedor: number | null;
}

export interface CampaignFormErrors {
  nombre?: string;
  numeroWhatsappEmpresa?: string;
  idCuentaPublicitaria?: string;
  idProveedor?: string;
}

export interface UseCampaignFormReturn {
  formState: CampaignFormState;
  setFormState: Dispatch<SetStateAction<CampaignFormState>>;
  cuentas: CuentaPublicitaria[];
  proveedores: Proveedor[];
  loading: boolean;
  submitting: boolean;
  errors: CampaignFormErrors;
  globalMessage: string;
  loadData: () => Promise<void>;
  handleInputChange: (field: keyof Omit<CampaignFormState, 'idCuentaPublicitaria' | 'idProveedor'>, value: string) => void;
  handleCuentasChange: (id: number | null) => void;
  handleProveedoresChange: (id: number | null) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
}

const initialFormState: CampaignFormState = {
  nombre: '',
  numeroWhatsappEmpresa: '',
  idCuentaPublicitaria: null,
  idProveedor: null,
};

interface UseCampaignFormOptions {
  catalogs: {
    cuentas: CuentaPublicitaria[];
    proveedores: Proveedor[];
  };
}

export const useCampaignForm = ({ catalogs }: UseCampaignFormOptions): UseCampaignFormReturn => {
  const [formState, setFormState] = useState<CampaignFormState>(initialFormState);
  const loading = false;
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const [globalMessage, setGlobalMessage] = useState('');

  const loadData = useCallback(async () => {
    return Promise.resolve();
  }, []);

  // Validar formulario con reglas estrictas backend
  const validateForm = useCallback((): boolean => {
    const newErrors: CampaignFormErrors = {};

    // Nombre: requerido y no vacío
    if (!formState.nombre || !formState.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    // Número WhatsApp: requerido, no vacío, validar que tenga formato de teléfono
    const whatsappTrimmed = formState.numeroWhatsappEmpresa?.trim() || '';
    if (!whatsappTrimmed) {
      newErrors.numeroWhatsappEmpresa = 'El número de WhatsApp es requerido (no debe estar vacío)';
    } else if (whatsappTrimmed.length < 7) {
      newErrors.numeroWhatsappEmpresa = 'El número de WhatsApp debe tener al menos 7 dígitos';
    } else if (!/[0-9+\-\s()]/g.test(whatsappTrimmed)) {
      newErrors.numeroWhatsappEmpresa = 'El número debe contener solo dígitos, espacios, +, -, o ()';
    }

    // Cuenta Publicitaria: DEBE existir y ser número válido
    if (formState.idCuentaPublicitaria === null || formState.idCuentaPublicitaria === undefined) {
      newErrors.idCuentaPublicitaria = 'Debes seleccionar una cuenta publicitaria (no puede ser nulo)';
    } else if (!Number.isInteger(formState.idCuentaPublicitaria) || formState.idCuentaPublicitaria <= 0) {
      newErrors.idCuentaPublicitaria = 'La cuenta seleccionada no es válida';
    }

    // Proveedor: DEBE existir y ser número válido
    if (formState.idProveedor === null || formState.idProveedor === undefined) {
      newErrors.idProveedor = 'Debes seleccionar un proveedor (no puede ser nulo)';
    } else if (!Number.isInteger(formState.idProveedor) || formState.idProveedor <= 0) {
      newErrors.idProveedor = 'El proveedor seleccionado no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  // Handlers
  const handleInputChange = useCallback((field: keyof Omit<CampaignFormState, 'idCuentaPublicitaria' | 'idProveedor'>, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleCuentasChange = useCallback((id: number | null) => {
    setFormState((prev) => ({ ...prev, idCuentaPublicitaria: id }));
    setErrors((prev) => ({ ...prev, idCuentaPublicitaria: undefined }));
  }, []);

  const handleProveedoresChange = useCallback((id: number | null) => {
    setFormState((prev) => ({ ...prev, idProveedor: id }));
    setErrors((prev) => ({ ...prev, idProveedor: undefined }));
  }, []);

  // Reset
  const resetForm = useCallback(() => {
    setFormState(initialFormState);
    setErrors({});
  }, []);

  // Submit con validaciones estrictas y debugging
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      setGlobalMessage('⚠️ Por favor completa todos los campos requeridos');
      console.warn('[useCampaignForm] Validation failed:', errors);
      return;
    }

    // Evitar doble-click
    if (submitting) {
      console.warn('[useCampaignForm] Already submitting, ignoring double-click');
      return;
    }

    setSubmitting(true);
    try {
      // Validar tipos antes de enviar
      const idCuenta = Number(formState.idCuentaPublicitaria);
      const idProveedor = Number(formState.idProveedor);
      const numeroWhatsapp = formState.numeroWhatsappEmpresa?.trim() || '';
      const nombre = formState.nombre?.trim() || '';

      // Verificaciones adicionales (triple-check antes del POST)
      if (!Number.isInteger(idCuenta) || idCuenta <= 0) {
        throw new Error('ERROR: idCuentaPublicitaria no es un número válido. No se enviará request.');
      }
      if (!Number.isInteger(idProveedor) || idProveedor <= 0) {
        throw new Error('ERROR: idProveedor no es un número válido. No se enviará request.');
      }
      if (!numeroWhatsapp || numeroWhatsapp.length === 0) {
        throw new Error('ERROR: numeroWhatsappEmpresa está vacío. No se enviará request.');
      }
      if (!nombre || nombre.length === 0) {
        throw new Error('ERROR: nombre está vacío. No se enviará request.');
      }

      const payload: CreateCampaignPayload = {
        nombre,
        numeroWhatsappEmpresa: numeroWhatsapp,
        idCuentaPublicitaria: idCuenta,
        idProveedor,
      };

      // 🔍 DEBUG: Imprimir payload completo antes de enviar
      console.log('═══════════════════════════════════════════════════');
      console.log('[useCampaignForm] 🚀 ENVIANDO PAYLOAD A BACKEND:');
      console.log('═══════════════════════════════════════════════════');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('Tipos:', {
        nombre_type: typeof payload.nombre,
        numeroWhatsappEmpresa_type: typeof payload.numeroWhatsappEmpresa,
        idCuentaPublicitaria_type: typeof payload.idCuentaPublicitaria,
        idProveedor_type: typeof payload.idProveedor,
      });
      console.log('═══════════════════════════════════════════════════');

      await createCampaign(payload);

      setGlobalMessage('✅ Campaña creada exitosamente');
      resetForm();
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Error desconocido');
      console.error('[useCampaignForm] ❌ Error submitting:', errorMsg);
      setGlobalMessage(`❌ ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  }, [formState, submitting, validateForm, errors, resetForm]);

  return {
    formState,
    setFormState,
    cuentas: catalogs.cuentas,
    proveedores: catalogs.proveedores,
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
