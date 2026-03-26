import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';

// Lazy load pages
const PaginaLogin = lazy(() => import('@caracteristicas/auth/pages/PaginaLogin'));
const PaginaPanel = lazy(() => import('@pages/PaginaPanel'));
const PaginaRRHH = lazy(() => import('@caracteristicas/rrhh/pages/PaginaRRHH'));
const PaginaReclutamiento = lazy(() => import('@caracteristicas/reclutamiento/pages/PaginaReclutamiento'));
const PaginaCapacitacion = lazy(() => import('@caracteristicas/capacitacion/pages/PaginaCapacitacion'));
const PaginaCommunity = lazy(() => import('@caracteristicas/community/pages/PaginaCommunity'));
const PaginaGTR = lazy(() => import('@caracteristicas/gtr/pages/PaginaGTR'));
const PaginaAsesores = lazy(() => import('@caracteristicas/asesor-ventas/pages/PaginaAsesores'));
const PaginaAdmin = lazy(() => import('@caracteristicas/admin/pages/AdminPage'));
const PaginaNoAutorizado = lazy(() => import('@pages/PaginaNoAutorizado'));

const LoadingFallback = () => <div>Cargando...</div>;

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<PaginaLogin />} />
          
          <Route
            path="/panel"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR']}>
                  <PaginaPanel />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR']}>
                  <PaginaAdmin />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/rrhh"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'RRHH']}>
                  <PaginaRRHH />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/reclutamiento"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'RECLUTAMIENTO']}>
                  <PaginaReclutamiento />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/capacitacion"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'CAPACITACIÓN']}>
                  <PaginaCapacitacion />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/community"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'COMMUNITY']}>
                  <PaginaCommunity />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/gtr"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'GTR']}>
                  <PaginaGTR />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/asesores"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'ASESOR_DE_VENTAS']}>
                  <PaginaAsesores />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/no-autorizado"
            element={
              <RequireAuth>
                <PaginaNoAutorizado />
              </RequireAuth>
            }
          />
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

import { Navigate } from 'react-router-dom';
