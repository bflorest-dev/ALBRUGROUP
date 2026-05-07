import { recruitmentHttp, http } from '@shared/api';

export interface GrupoCapacitacionRequest {
  codigo: string;
  idCapacitador: number;
  turno: 'MORNING' | 'AFTERNOON';
  sala: 'SALA_FIBRA' | 'SALA_CLARO';
  fechaInicio: string;
  fechaFin: string;
}

export interface GrupoCapacitacionResponse {
  id: number;
  codigo: string;
  idCapacitador: number;
  turno: string;
  sala: string;
  fechaInicio: string;
  fechaFin: string;
  estado?: string;
  createdAt?: string;
}

export interface CapacitadorOption {
  id: number;
  nombre: string;
}

export interface ListarCapacitadoresResult {
  options: CapacitadorOption[];
  fallbackMode: boolean;
}

interface EmpleadoRecruitmentResponse {
  idEmpleado: number | string;
  nombres?: string;
  apellidos?: string;
  puestoTrabajo?: string;
  numeroDocumento?: string;
  celularPersonal?: string;
  correoPersonal?: string;
  [key: string]: unknown;
}

interface ApiErrorLike {
  status?: number;
}

const toCapacitadorOption = (emp: EmpleadoRecruitmentResponse): CapacitadorOption | null => {
  const id = Number(emp.idEmpleado);
  if (!Number.isFinite(id) || id <= 0) return null;

  const nombres = String(emp.nombres ?? '').trim();
  const apellidos = String(emp.apellidos ?? '').trim();
  const nombre = `${nombres} ${apellidos}`.trim() || `Empleado #${id}`;
  return { id, nombre };
};

const normalizePuestoTrabajo = (value: unknown): string => {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
};

export const grupoCapacitacionService = {
  crear: async (data: GrupoCapacitacionRequest): Promise<GrupoCapacitacionResponse> => {
    const response = await recruitmentHttp.post<GrupoCapacitacionResponse>(
      '/grupos-capacitacion',
      data
    );
    return response.data;
  },

  obtenerPorId: async (idGrupoCapacitacion: number): Promise<GrupoCapacitacionResponse> => {
    const response = await recruitmentHttp.get<GrupoCapacitacionResponse>(
      `/grupos-capacitacion/${idGrupoCapacitacion}`
    );
    return response.data;
  },

  listarCapacitadores: async (): Promise<ListarCapacitadoresResult> => {
    try {
      const response = await http.get<EmpleadoRecruitmentResponse[]>('/empleados/personal-recruitment');

      const capacitadores = (Array.isArray(response.data) ? response.data : [])
        .filter((emp) => normalizePuestoTrabajo(emp.puestoTrabajo) === 'CAPACITADOR')
        .map(toCapacitadorOption)
        .filter((item): item is CapacitadorOption => item !== null);

      const uniqueCapacitadores = Array.from(new Map(capacitadores.map((item) => [item.id, item])).values());

      return {
        options: uniqueCapacitadores,
        fallbackMode: false,
      };
    } catch (error) {
      const status = (error as ApiErrorLike)?.status ?? 'UNKNOWN';
      console.error('[Capacitadores] Error al cargar personal recruitment', { status, error });
      return {
        options: [],
        fallbackMode: false,
      };
    }
  },
};
