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

  async getById(_id: string): Promise<Trato | null> {
    console.log('getById called with id:', _id);
    return null;
  }

  async create(_trato: Omit<Trato, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trato> {
    console.log('create called with trato:', _trato);
    throw new Error('Not implemented');
  }

  async update(_id: string, _trato: Partial<Trato>): Promise<Trato> {
    console.log('update called with id:', _id, 'trato:', _trato);
    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    console.log('delete called with id:', _id);
  }
}

export const tratoService = new TratoService();
