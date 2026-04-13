import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';

// Lazy load pages
const PaginaLogin = lazy(() => import('@features/auth/pages/PaginaLogin'));
const PaginaAutenticacionAvanzada = lazy(() =>
  import('@features/autenticacion/pages/PaginaAutenticacionAvanzada').then(
    (m) => ({ default: m.PaginaAutenticacionAvanzada })
  )
);
const PaginaPanel = lazy(() => import('@features/admin/pages/AdminPage'));
const PaginaRRHH = lazy(() => import('@features/rrhh/pages/PaginaRRHH'));
const PaginaListadoOfertasActivas = lazy(() => import('@features/rrhh/pages/PaginaListadoOfertasActivas'));
const PaginaAmpliacionOferta = lazy(() => import('@features/rrhh/pages/PaginaAmpliacionOferta'));
const PaginaReclutamiento = lazy(() => import('@features/reclutamiento/pages/PaginaReclutamiento'));
const PaginaCapacitacion = lazy(() => import('@features/capacitacion/pages/PaginaCapacitacion'));
const PaginaCommunity = lazy(() => import('@features/community/pages/PaginaCommunity'));
const PaginaGTR = lazy(() => import('@features/gtr/pages/PaginaGTR'));
const PaginaAsesores = lazy(() => import('@features/asesor-ventas/pages/PaginaAsesores'));
const PaginaAsesorVentasDetail = lazy(() => import('@features/asesor-ventas/pages/PaginaAsesorVentasDetail'));
const PaginaAsesorBackoffice = lazy(() => import('@features/asesor-backoffice/pages/PaginaAsesorBackoffice'));
const PaginaAdmin = lazy(() => import('@features/admin/pages/AdminPage'));
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
            path="/rrhh/ofertas-laborales"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'RRHH']}>
                  <PaginaListadoOfertasActivas />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/rrhh/ofertas-laborales/:id/ampliacion"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'RRHH']}>
                  <PaginaAmpliacionOferta />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/reclutamiento"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'RECLUTAMIENTO', 'RECLUTADOR']}>
                  <PaginaReclutamiento />
                </RequireRole>
              </RequireAuth>
            }
          />
          
          <Route
            path="/capacitacion"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={['ADMINISTRADOR', 'CAPACITACIÓN', 'CAPACITACION', 'CAPACITADOR']}>
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
