/**
 * 🔐 Configuración centralizada de APIs
 * 
 * ENDPOINTS EXACTOS (sin cambios de /api):
 *  - AUTH: POST /autorizacion/login
 *  - AUTH: GET /autorizacion/estado-acceso/{username}
 *  - AUTH: POST /autorizacion/forgot-password
 * 
 * URLs BASE (con proxy en desarrollo):
 *  DEV:  /api/auth → vite proxy → http://localhost:8080
 *  PROD: http://localhost:8081 (sin /api, directo)
 */

export const API_CONFIG = {
  // ─── DESENVOLVIMENTO (con proxy vite) ──────────────────────────────────
  // Estos se reescriben en vite.config.ts:
  // /api/auth/autorizacion/login → http://localhost:8080/autorizacion/login
  DEV: {
    AUTH_BASE_URL: '/api/auth',           // POST /autorizacion/login
    RRHH_BASE_URL: '/api/rrhh',           // GET /postulantes, etc
    LEADS_BASE_URL: '/api/leads',         // GET /campanas, etc
    RECRUITMENT_BASE_URL: '/api/recruitment', // GET /recruitment/* through gateway proxy
  },

  // ─── ENDPOINTS EXACTOS (SIN cambios) ──────────────────────────────────
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/autorizacion/login',                      // POST
      GET_STATUS: '/autorizacion/estado-acceso/:username', // GET
      FORGOT_PASSWORD: '/autorizacion/forgot-password',  // POST
    },
    RRHH: {
      POSTULANTES: '/postulantes',
      EMPLEADOS: '/empleados',
      CONTRATOS: '/contratos',
    },
    LEADS: {
      CAMPANAS: '/campanas',
      CUENTAS: '/cuentas-publicitarias',
      EVENTOS: '/eventos',
    },
  },

  // ─── VERIFICACIÓN DE CONFIGURACIÓN ─────────────────────────────────────
  logConfig(): void {
    console.group('🔐 API_CONFIG ACTIVO');
    console.log('🌐 AUTH_BASE_URL:', this.DEV.AUTH_BASE_URL);
    console.log('🌐 RRHH_BASE_URL:', this.DEV.RRHH_BASE_URL);
    console.log('🌐 LEADS_BASE_URL:', this.DEV.LEADS_BASE_URL);
    console.log('🌐 RECRUITMENT_BASE_URL:', this.DEV.RECRUITMENT_BASE_URL);
    
    console.log('\n🔒 Endpoints autenticación:');
    console.log('  POST', this.ENDPOINTS.AUTH.LOGIN);
    console.log('  GET', this.ENDPOINTS.AUTH.GET_STATUS);
    console.log('  POST', this.ENDPOINTS.AUTH.FORGOT_PASSWORD);
    
    console.log('\n✅ Proxy vite activo en desarrollo:');
    console.log('  /api/auth → http://localhost:8080');
    console.log('  /api/rrhh → http://localhost:8080');
    console.log('  /api/leads → http://localhost:8080');
    console.log('  /api/recruitment → http://localhost:8080');
    
    console.groupEnd();
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// INICIALIZAR LOGS AL CARGAR (solo en desarrollo)
if (import.meta.env.DEV) {
  setTimeout(() => API_CONFIG.logConfig(), 100);
}
