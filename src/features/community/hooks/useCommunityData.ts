import { useState, useCallback, useEffect } from 'react';
import { LeadsRepository } from '@shared/api';
import type {
  CampanaResponse,
  CuentaPublicitariaResponse,
  PlanResponse,
  PromocionComercialResponse,
  ProveedorResponse,
  ZonaResponse,
  AdicionalResponse,
  TipificacionResponse,
} from '@shared/types';

/**
 * Hook para manejar datos de Community (catálogos)
 * Centraliza llamadas a API y estado
 */
export const useCommunityData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campañas
  const [campanas, setCampanas] = useState<CampanaResponse[]>([]);

  // Cuentas Publicitarias
  const [cuentas, setCuentas] = useState<CuentaPublicitariaResponse[]>([]);

  // Planes
  const [planes, setPlanes] = useState<PlanResponse[]>([]);

  // Promociones
  const [promociones, setPromociones] = useState<PromocionComercialResponse[]>([]);

  // Proveedores
  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);

  // Zonas
  const [zonas, setZonas] = useState<ZonaResponse[]>([]);

  // Adicionales
  const [adicionales, setAdicionales] = useState<AdicionalResponse[]>([]);

  // ========================================================================
  // Campañas
  // ========================================================================

  const fetchCampanas = useCallback(async (activo?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const data = await LeadsRepository.getCampanas(activo);
      setCampanas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampana = useCallback(
    async (payload: Parameters<typeof LeadsRepository.createCampana>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const nueva = await LeadsRepository.createCampana(payload);
        setCampanas((prev) => [...prev, nueva]);
        return nueva;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear campaña');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateCampana = useCallback(
    async (id: number, payload: Parameters<typeof LeadsRepository.updateCampana>[1]) => {
      setLoading(true);
      setError(null);
      try {
        const actualizada = await LeadsRepository.updateCampana(id, payload);
        setCampanas((prev) => prev.map((c) => (c.id === id ? actualizada : c)));
        return actualizada;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar campaña');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteCampana = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await LeadsRepository.deleteCampana(id);
      setCampanas((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar campaña');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCampanaEstado = useCallback(
    async (id: number, activo: boolean) => {
      return updateCampana(id, { activo });
    },
    [updateCampana],
  );

  // ========================================================================
  // Cuentas Publicitarias
  // ========================================================================

  const fetchCuentas = useCallback(async (activo?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const data = await LeadsRepository.getCuentasPublicitarias(activo);
      setCuentas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCuenta = useCallback(
    async (payload: Parameters<typeof LeadsRepository.createCuentaPublicitaria>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const nueva = await LeadsRepository.createCuentaPublicitaria(payload);
        setCuentas((prev) => [...prev, nueva]);
        return nueva;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear cuenta');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteCuenta = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await LeadsRepository.deleteCuentaPublicitaria(id);
      setCuentas((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cuenta');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCuentaEstadoLocal = useCallback((id: number, activo: boolean) => {
    setCuentas((prev) => prev.map((cuenta) => (cuenta.id === id ? { ...cuenta, activo } : cuenta)));
  }, []);

  const toggleAdicionalEstadoLocal = useCallback((id: number, activo: boolean) => {
    setAdicionales((prev) => prev.map((adicional) => (adicional.id === id ? { ...adicional, activo } : adicional)));
  }, []);

  // ========================================================================
  // Planes
  // ========================================================================

  const fetchPlanes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await LeadsRepository.getPlanes();
      setPlanes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar planes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdicionales = useCallback(async (idProveedor?: number) => {
    if (typeof idProveedor !== 'number') {
      setAdicionales([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await LeadsRepository.getAdicionales(idProveedor);
      setAdicionales(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar adicionales');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAdicional = useCallback(
    async (payload: Parameters<typeof LeadsRepository.createAdicional>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const nuevo = await LeadsRepository.createAdicional(payload);
        setAdicionales((prev) => [...prev, nuevo]);
        window.dispatchEvent(new CustomEvent('adicional-creado', { detail: nuevo }));
        return nuevo;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear adicional');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createPlan = useCallback(
    async (payload: Parameters<typeof LeadsRepository.createPlan>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const nuevo = await LeadsRepository.createPlan(payload);
        setPlanes((prev) => [...prev, nuevo]);
        return nuevo;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear plan');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updatePlan = useCallback(
    async (id: number, payload: Parameters<typeof LeadsRepository.updatePlan>[1]) => {
      setLoading(true);
      setError(null);
      try {
        const actualizado = await LeadsRepository.updatePlan(id, payload);
        setPlanes((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
        return actualizado;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar plan');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deletePlan = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await LeadsRepository.deletePlan(id);
      setPlanes((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar plan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePlanEstado = useCallback(
    async (id: number, activo: boolean) => {
      return updatePlan(id, { activo });
    },
    [updatePlan],
  );

  // ========================================================================
  // Promociones
  // ========================================================================

  const fetchPromociones = useCallback(
    async (filtros?: { proveedorId?: number; zonaId?: number; interno?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await LeadsRepository.getPromociones(filtros);
        console.debug('[useCommunityData] fetchPromociones', {
          filtros,
          count: data?.length,
          data,
        });
        if (!Array.isArray(data)) {
          throw new Error('La respuesta de promociones no es un array');
        }
        setPromociones(data);
      } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Error al cargar promociones';
      console.error('[useCommunityData] fetchPromociones ERROR', { message, error: err });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPromocion = useCallback(
    async (payload: Parameters<typeof LeadsRepository.createPromocion>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const nueva = await LeadsRepository.createPromocion(payload);
        setPromociones((prev) => [...prev, nueva]);
        return nueva;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear promoción');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deletePromocion = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await LeadsRepository.deletePromocion(id);
      setPromociones((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar promoción');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePromocionEstadoLocal = useCallback((id: number, activo: boolean) => {
    setPromociones((prev) =>
      prev.map((promocion) => (promocion.id === id ? { ...promocion, activo } : promocion)),
    );
  }, []);

  // ========================================================================
  // Proveedores
  // ========================================================================

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      console.log('[useCommunityData] 📦 Fetching proveedores...', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
      });
      
      const data = await LeadsRepository.getProveedores();
      
      console.log('[useCommunityData] ✅ Proveedores loaded:', {
        count: data?.length || 0,
        data: data,
      });
      
      setProveedores(data);
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar proveedores';
      console.error('[useCommunityData] ❌ Error fetching proveedores:', {
        error: errorMsg,
        details: err,
        status: err?.status,
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProveedor = useCallback(
    async (payload: Parameters<typeof LeadsRepository.createProveedor>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const nuevo = await LeadsRepository.createProveedor(payload);
        setProveedores((prev) => [...prev, nuevo]);
        return nuevo;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear proveedor');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ========================================================================
  // Zonas
  // ========================================================================

  const fetchZonas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await LeadsRepository.getZonas();
      setZonas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar zonas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createZona = useCallback(
    async (payload: Parameters<typeof LeadsRepository.createZona>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const nueva = await LeadsRepository.createZona(payload);
        setZonas((prev) => [...prev, nueva]);
        return nueva;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear zona');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateZona = useCallback(
    async (id: number, payload: Parameters<typeof LeadsRepository.updateZona>[1]) => {
      setLoading(true);
      setError(null);
      try {
        const actualizada = await LeadsRepository.updateZona(id, payload);
        setZonas((prev) => prev.map((z) => (z.id === id ? actualizada : z)));
        return actualizada;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar zona');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteZona = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await LeadsRepository.getZonas(); // Simular eliminación
      setZonas((prev) => prev.filter((z) => z.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar zona');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleZonaEstado = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const actualizada = await LeadsRepository.updateZonaEstado(id);
      setZonas((prev) => prev.map((z) => (z.id === id ? actualizada : z)));
      return actualizada;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado de zona');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    // Campañas
    campanas,
    fetchCampanas,
    createCampana,
    updateCampana,
    toggleCampanaEstado,
    deleteCampana,
    // Cuentas
    cuentas,
    fetchCuentas,
    createCuenta,
    toggleCuentaEstadoLocal,
    deleteCuenta,
    // Planes
    planes,
    fetchPlanes,
    createPlan,
    updatePlan,
    togglePlanEstado,
    deletePlan,
    // Promociones
    promociones,
    fetchPromociones,
    createPromocion,
    togglePromocionEstadoLocal,
    deletePromocion,
    // Proveedores
    proveedores,
    fetchProveedores,
    createProveedor,
    // Zonas
    zonas,
    fetchZonas,
    createZona,
    updateZona,
    toggleZonaEstado,
    deleteZona,
    // Adicionales
    adicionales,
    fetchAdicionales,
    createAdicional,
    toggleAdicionalEstadoLocal,
  };
};
