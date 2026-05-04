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

  async getById(_id: string): Promise<Tarea | null> {
    console.log('getById called with id:', _id);
    return null;
  }

  async create(_tarea: Omit<Tarea, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tarea> {
    console.log('create called with tarea:', _tarea);
    throw new Error('Not implemented');
  }

  async update(_id: string, _tarea: Partial<Tarea>): Promise<Tarea> {
    console.log('update called with id:', _id, 'tarea:', _tarea);
    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    console.log('delete called with id:', _id);
  }
}

export const tareaService = new TareaService();
