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

  async getById(_id: string): Promise<Cliente | null> {
    // Implementar llamada API
    console.log('getById called with id:', _id);
    return null;
  }

  async create(_cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    // Implementar llamada API
    console.log('create called with cliente:', _cliente);
    throw new Error('Not implemented');
  }

  async update(_id: string, _cliente: Partial<Cliente>): Promise<Cliente> {
    // Implementar llamada API
    console.log('update called with id:', _id, 'cliente:', _cliente);
    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    // Implementar llamada API
    console.log('delete called with id:', _id);
  }
}

export const clienteService = new ClienteService();
