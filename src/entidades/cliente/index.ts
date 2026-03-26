export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  empresa?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ClienteService {
  async getAll(): Promise<Cliente[]> {
    // Implementar llamada API
    return [];
  }

  async getById(id: string): Promise<Cliente | null> {
    // Implementar llamada API
    return null;
  }

  async create(cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    // Implementar llamada API
    throw new Error('Not implemented');
  }

  async update(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
    // Implementar llamada API
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<void> {
    // Implementar llamada API
  }
}

export const clienteService = new ClienteService();
