import type { Role } from '@entities/auth';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  roles: Role[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UsuarioService {
  async getAll(): Promise<Usuario[]> {
    return [];
  }

  async getById(id: string): Promise<Usuario | null> {
    return null;
  }

  async create(usuario: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Usuario> {
    throw new Error('Not implemented');
  }

  async update(id: string, usuario: Partial<Usuario>): Promise<Usuario> {
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<void> {}
}

export const usuarioService = new UsuarioService();
