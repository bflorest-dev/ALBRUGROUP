export interface Trato {
  id: string;
  clienteId: string;
  monto: number;
  estado: 'abierto' | 'cerrado' | 'perdido';
  fechaPropuesta?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TratoService {
  async getAll(): Promise<Trato[]> {
    return [];
  }

  async getById(id: string): Promise<Trato | null> {
    return null;
  }

  async create(trato: Omit<Trato, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trato> {
    throw new Error('Not implemented');
  }

  async update(id: string, trato: Partial<Trato>): Promise<Trato> {
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<void> {}
}

export const tratoService = new TratoService();
