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

  async getById(_id: string): Promise<Usuario | null> {
    console.log('getById called with id:', _id);
    return null;
  }

  async create(_usuario: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Usuario> {
    console.log('create called with usuario:', _usuario);
    throw new Error('Not implemented');
  }

  async update(_id: string, _usuario: Partial<Usuario>): Promise<Usuario> {
    console.log('update called with id:', _id, 'usuario:', _usuario);
    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    console.log('delete called with id:', _id);
  }
}

export const usuarioService = new UsuarioService();
