import { client } from './client';

// 🔍 Interceptor para loguear respuestas de contrato
client.interceptors.response.use(
  response => {
    // Loguear respuestas de /contratos/*/registrar
    if (response.config.url?.includes('/contratos/') && response.config.url?.includes('/registrar')) {
      console.log('✅ ContratoRegistroResponse EXITOSA (HTTP 200):', {
        status: response.status,
        data: response.data,
        credenciales: (response.data as any)?.credenciales,
        credencialesGeneradas: (response.data as any)?.credencialesGeneradas,
        keys: response.data ? Object.keys(response.data) : [],
      });
    }
    return response;
  },
  error => {
    // Loguear errores de /contratos/*/registrar
    if (error.config?.url?.includes('/contratos/') && error.config?.url?.includes('/registrar')) {
      console.log('❌ ContratoRegistroResponse ERROR:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: (error.response?.data as any)?.message,
        details: (error.response?.data as any)?.details,
      });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
