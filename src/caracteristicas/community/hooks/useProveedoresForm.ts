/**
 * Custom Hook: useProveedoresForm
 * Maneja estado, validación, y lógica de formulario para Proveedores
 */
import { useState, useEffect, useCallback } from 'react';
import type { Proveedor, CreateProveedorPayload } from '@entidades/proveedor';
import { proveedorService } from '@shared/services/proveedorService';

interface ProveedorFormState {
  nombre: string;
}

interface UseProveedoresFormReturn {
  proveedores: Proveedor[];
  formState: ProveedorFormState;
  errors: { nombre?: string };
  globalMessage: string;
  loading: boolean;
  submitting: boolean;
  error: boolean;
  handleInputChange: (field: keyof ProveedorFormState, value: string) => void;
  handleSubmit: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useProveedoresForm = (): UseProveedoresFormReturn => {
  console.log('[useProveedoresForm] HOOK INITIALIZED');

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [formState, setFormState] = useState<ProveedorFormState>({ nombre: '' });
  const [errors, setErrors] = useState<{ nombre?: string }>({});
  const [globalMessage, setGlobalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const initialToken = localStorage.getItem('auth_token');
  console.log('[useProveedoresForm] initial token:', initialToken ? '***' : 'MISSING');
  const [authToken, setAuthToken] = useState<string | null>(initialToken);

  const refetch = useCallback(async () => {
    console.log('[useProveedoresForm] refetch started');
    setLoading(true);
    setError(false);
    try {
      console.log('[useProveedoresForm] fetching proveedores...');
      const data = await proveedorService.fetchProveedores();

      if (!Array.isArray(data)) {
        throw new Error('Invalid response: expected array');
      }

      console.log(`[useProveedoresForm] SUCCESS: loaded ${data.length} proveedores`);
      setProveedores(data);
      setGlobalMessage('');
    } catch (err: any) {
      const status = err.status || err.response?.status || 0;
      const errorMap: Record<number, string> = {
        401: '🔐 Sesión expirada',
        403: '🚫 Permiso denegado',
        500: '💥 Error del servidor',
      };

      console.error('[useProveedoresForm] refetch FAILED', {
        status,
        message: err.message,
        response: err.response?.data || null,
      });

      setError(true);
      setProveedores([]);
      setGlobalMessage(`❌ ${errorMap[status] || 'Error al cargar proveedores'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onStorageChange = (e?: StorageEvent) => {
      if (e && e.key !== 'auth_token') return;

      const newToken = localStorage.getItem('auth_token');
      if (newToken !== authToken) {
        console.log(
          '[useProveedoresForm] auth_token CHANGED',
          'old:', authToken ? '***' : 'null',
          'new:', newToken ? '***' : 'null'
        );
        setAuthToken(newToken);
      }
    };

    window.addEventListener('storage', onStorageChange as EventListener);
    return () => window.removeEventListener('storage', onStorageChange as EventListener);
  }, [authToken]);

  useEffect(() => {
    console.log(
      '[useProveedoresForm] EFFECT TRIGGERED',
      'token:', authToken ? '***' : 'MISSING',
      'refetch:', 'stable (useCallback)'
    );

    if (authToken) {
      console.log('[useProveedoresForm] token present, calling refetch()');
      refetch();
    } else {
      console.warn('[useProveedoresForm] NO TOKEN, waiting for auth');
      setGlobalMessage('⏳ Esperando autenticación para cargar proveedores');
      setError(true);
    }
  }, [authToken, refetch]);

  const validateForm = (): boolean => {
    const newErrors: { nombre?: string } = {};
    if (!formState.nombre.trim()) {
      newErrors.nombre = 'Nombre es requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProveedorFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateForm()) return;

    const proveedorNombre = formState.nombre.trim();
    console.log('[useProveedoresForm] handleSubmit START', { nombre: proveedorNombre });

    setSubmitting(true);
    try {
      const payload: CreateProveedorPayload = {
        nombre: proveedorNombre,
      };

      console.log('[useProveedoresForm] creating proveedor...', { payload });
      await proveedorService.createProveedor(payload);

      console.log('[useProveedoresForm] proveedor created, clearing form');
      setFormState({ nombre: '' });

      console.log('[useProveedoresForm] refetching from backend...');
      await refetch();

      setGlobalMessage('✅ Proveedor creado correctamente');
      console.log('[useProveedoresForm] SUCCESS');
    } catch (err: any) {
      const status = err.status || err.response?.status || 0;
      const errorMap: Record<number, string> = {
        400: '⚠️ Datos inválidos',
        401: '🔐 Sesión expirada',
        403: '🚫 Permiso denegado',
        409: '⚠️ Proveedor duplicado',
        500: '💥 Error del servidor',
      };

      const errorMessage = errorMap[status] || 'Error al crear proveedor';
      console.error('[useProveedoresForm] handleSubmit FAILED', {
        status,
        message: err.message,
        errorMessage,
        response: err.response?.data || null,
      });

      setGlobalMessage(`❌ ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    proveedores,
    formState,
    errors,
    globalMessage,
    loading,
    submitting,
    error,
    handleInputChange,
    handleSubmit,
    refetch,
  };
};
