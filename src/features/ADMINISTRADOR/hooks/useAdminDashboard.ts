import { useState, useCallback, useMemo } from 'react';
import type { Plan, Promocion, Adicional } from '../types';

/**
 * localStorage Storage Keys
 */
const STORAGE_KEYS = {
  PLANS: 'admin_plans',
  PROMOTIONS: 'admin_promotions',
  ADICIONALES: 'admin_adicionales',
};

/**
 * LocalStorage Utility Functions
 * Handles Date serialization/deserialization for localStorage
 */
const storageUtils = {
  savePlans: (plans: Plan[]) => {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  },
  loadPlans: (): Plan[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return parsed.map((plan: Plan) => ({
        ...plan,
        createdAt: new Date(plan.createdAt),
        updatedAt: new Date(plan.updatedAt),
      }));
    } catch {
      return [];
    }
  },

  savePromotions: (promotions: Promocion[]) => {
    localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
  },
  loadPromotions: (): Promocion[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return parsed.map((promo: Promocion) => ({
        ...promo,
        createdAt: new Date(promo.createdAt),
        updatedAt: new Date(promo.updatedAt),
      }));
    } catch {
      return [];
    }
  },

  saveAdicionales: (adicionales: Adicional[]) => {
    localStorage.setItem(STORAGE_KEYS.ADICIONALES, JSON.stringify(adicionales));
  },
  loadAdicionales: (): Adicional[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ADICIONALES);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return parsed.map((item: Adicional) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
    } catch {
      return [];
    }
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.PLANS);
    localStorage.removeItem(STORAGE_KEYS.PROMOTIONS);
    localStorage.removeItem(STORAGE_KEYS.ADICIONALES);
  }
};

export const useAdminDashboard = () => {
  // ==================== STATE ====================
  const [activeSection, setActiveSection] = useState<'plans' | 'promotions' | 'adicionales'>('plans');

  // Plans State
  const [plans, setPlansState] = useState<Plan[]>(() => storageUtils.loadPlans());
  const setPlans = useCallback((updater: Plan[] | ((prev: Plan[]) => Plan[])) => {
    setPlansState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      storageUtils.savePlans(next);
      return next;
    });
  }, []);

  // Promotions State
  const [promotions, setPromotionsState] = useState<Promocion[]>(() => storageUtils.loadPromotions());
  const setPromotions = useCallback((updater: Promocion[] | ((prev: Promocion[]) => Promocion[])) => {
    setPromotionsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      storageUtils.savePromotions(next);
      return next;
    });
  }, []);

  // Adicionales State
  const [adicionales, setAdicionalesState] = useState<Adicional[]>(() => storageUtils.loadAdicionales());
  const setAdicionales = useCallback((updater: Adicional[] | ((prev: Adicional[]) => Adicional[])) => {
    setAdicionalesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      storageUtils.saveAdicionales(next);
      return next;
    });
  }, []);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ==================== COMPUTED VALUES ====================
  const activePlans = useMemo(() => plans.filter(p => p.activo), [plans]);
  const activePromotions = useMemo(() => promotions.filter(p => p.activa), [promotions]);
  const activeAdicionales = useMemo(() => adicionales.filter(a => a.activo), [adicionales]);

  // ==================== EVENT HANDLERS ====================

  // Plans Handlers
  const handleCreatePlan = useCallback((plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlan: Plan = {
      ...plan,
      id: `${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPlans(prev => [newPlan, ...prev]);
    setIsModalOpen(false);
    setEditingId(null);
  }, [setPlans]);

  const handleUpdatePlan = useCallback((id: string, plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => {
    setPlans(prev => prev.map(p =>
      p.id === id
        ? { ...p, ...plan, updatedAt: new Date() }
        : p
    ));
    setIsModalOpen(false);
    setEditingId(null);
  }, [setPlans]);

  const handleDeletePlan = useCallback((id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  }, [setPlans]);

  // Promotions Handlers
  const handleCreatePromotion = useCallback((promotion: Omit<Promocion, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPromotion: Promocion = {
      ...promotion,
      id: `${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPromotions(prev => [newPromotion, ...prev]);
    setIsModalOpen(false);
    setEditingId(null);
  }, [setPromotions]);

  const handleUpdatePromotion = useCallback((id: string, promotion: Omit<Promocion, 'id' | 'createdAt' | 'updatedAt'>) => {
    setPromotions(prev => prev.map(p =>
      p.id === id
        ? { ...p, ...promotion, updatedAt: new Date() }
        : p
    ));
    setIsModalOpen(false);
    setEditingId(null);
  }, [setPromotions]);

  const handleDeletePromotion = useCallback((id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
  }, [setPromotions]);

  // Adicionales Handlers
  const handleCreateAdicional = useCallback((adicional: Omit<Adicional, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAdicional: Adicional = {
      ...adicional,
      id: `${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAdicionales(prev => [newAdicional, ...prev]);
    setIsModalOpen(false);
    setEditingId(null);
  }, [setAdicionales]);

  const handleUpdateAdicional = useCallback((id: string, adicional: Omit<Adicional, 'id' | 'createdAt' | 'updatedAt'>) => {
    setAdicionales(prev => prev.map(a =>
      a.id === id
        ? { ...a, ...adicional, updatedAt: new Date() }
        : a
    ));
    setIsModalOpen(false);
    setEditingId(null);
  }, [setAdicionales]);

  const handleDeleteAdicional = useCallback((id: string) => {
    setAdicionales(prev => prev.filter(a => a.id !== id));
  }, [setAdicionales]);

  return {
    // State
    activeSection,
    setActiveSection,
    isModalOpen,
    setIsModalOpen,
    editingId,
    setEditingId,

    // Plans
    plans,
    setPlans,
    activePlans,
    handleCreatePlan,
    handleUpdatePlan,
    handleDeletePlan,

    // Promotions
    promotions,
    setPromotions,
    activePromotions,
    handleCreatePromotion,
    handleUpdatePromotion,
    handleDeletePromotion,

    // Adicionales
    adicionales,
    setAdicionales,
    activeAdicionales,
    handleCreateAdicional,
    handleUpdateAdicional,
    handleDeleteAdicional,

    // Storage
    clearAllData: storageUtils.clearAll,
  };
};

export type AdminDashboardState = ReturnType<typeof useAdminDashboard>;
