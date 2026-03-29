import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';

// Lazy load pages
const PaginaLogin = lazy(() => import('@caracteristicas/auth/pages/PaginaLogin'));
const PaginaAutenticacionAvanzada = lazy(() =>
  import('@caracteristicas/autenticacion/pages/PaginaAutenticacionAvanzada').then(
    (m) => ({ default: m.PaginaAutenticacionAvanzada })
  )
);
const PaginaPanel = lazy(() => import('@pages/PaginaPanel'));
const PaginaRRHH = lazy(() => import('@caracteristicas/rrhh/pages/PaginaRRHH'));
const PaginaReclutamiento = lazy(() => import('@caracteristicas/reclutamiento/pages/PaginaReclutamiento'));
const PaginaCapacitacion = lazy(() => import('@caracteristicas/capacitacion/pages/PaginaCapacitacion'));
const PaginaCommunity = lazy(() => import('@caracteristicas/community/pages/PaginaCommunity'));
const PaginaGTR = lazy(() => import('@caracteristicas/gtr/pages/PaginaGTR'));
const PaginaAsesores = lazy(() => import('@caracteristicas/asesor-ventas/pages/PaginaAsesores'));
const PaginaAsesorVentasDetail = lazy(() => import('@caracteristicas/asesor-ventas/pages/PaginaAsesorVentasDetail'));
const PaginaAsesorBackoffice = lazy(() => import('@caracteristicas/asesor-backoffice/pages/PaginaAsesorBackoffice'));
const PaginaAdmin = lazy(() => import('@caracteristicas/admin/pages/AdminPage'));
const PaginaNoAutorizado = lazy(() => import('@pages/PaginaNoAutorizado'));

const LoadingFallback = () => <div>Cargando...</div>;

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Flujo de autenticación (nuevo: con validación previa) */}
          <Route path="/autenticacion" element={<PaginaAutenticacionAvanzada />} />
          
          {/* Route legacy /login -> Nuevo flujo avanzado */}
          <Route path="/login" element={<PaginaAutenticacionAvanzada />} />
          
          {/* PaginaLogin se conserva como backup interno local */}
          <Route path="/login-old" element={<PaginaLogin />} />
          
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
            path="/community/dashboard"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['COMMUNITY']}>
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
            path="/gtr/dashboard"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ASESOR_GTR', 'GTR']}>
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
            path="/ventas/dashboard"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={[ 'ASESOR_VENTAS', 'ASESOR_DE_VENTAS', 'SUPERVISOR_VENTAS']}>
                  <PaginaAsesores />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/asesor-ventas"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'ASESOR_DE_VENTAS']}>
                  <PaginaAsesorVentasDetail />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/asesor-backoffice"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE']}>
                  <PaginaAsesorBackoffice />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/backoffice/dashboard"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE']}>
                  <PaginaAsesorBackoffice />
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
