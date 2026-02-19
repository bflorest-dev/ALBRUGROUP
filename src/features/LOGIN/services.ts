import type { LoginRequest, LoginResponse } from './types';

// Usamos implementación mock para desarrollo; descomentar http.post cuando exista el endpoint real
// import { http } from '../../api/http';

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  // mock delay
  await new Promise((r) => setTimeout(r, 600));

  // validación simple mock
  if (payload.email === 'demo@albru.com' && payload.password === 'demo') {
    return {
      token: 'mock-jwt-token-123',
      user: {
        id: 'u-1',
        name: 'Demo User',
        email: payload.email,
        role: 'ADMINISTRADOR' as any,
        permissions: ['DASHBOARD_VIEW'],
      },
    } as LoginResponse;
  }

  // Si quisieras usar la API real:
  // const resp = await http.post('/auth/login', payload);
  // return resp.data as LoginResponse;

  throw { message: 'Correo o contraseña inválidos' };
};
