export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: 'pendiente' | 'en-progreso' | 'completada';
  asignado?: string;
  fechaVencimiento?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TareaService {
  async getAll(): Promise<Tarea[]> {
    return [];
  }

  async getById(id: string): Promise<Tarea | null> {
    return null;
  }

  async create(tarea: Omit<Tarea, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tarea> {
    throw new Error('Not implemented');
  }

  async update(id: string, tarea: Partial<Tarea>): Promise<Tarea> {
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<void> {}
}

export const tareaService = new TareaService();
