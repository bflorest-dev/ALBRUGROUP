import React, { useEffect, useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Alert, Button } from '@shared/ui';
import { FlatpickrDateInput } from '@shared/ui/date-picker';
import {
  grupoCapacitacionService,
  type CapacitadorOption,
  type ListarCapacitadoresResult,
  type GrupoCapacitacionRequest,
  type GrupoCapacitacionResponse,
} from '../api/grupoCapacitacionService';
import {
  getGrupoCapacitacionErrorMessage,
  useCrearGrupoCapacitacion,
} from '../hooks/useCrearGrupoCapacitacion';

type FormErrors = Partial<Record<keyof GrupoCapacitacionRequest, string>>;
const USED_GROUP_CODES_KEY = 'recruitment.used-group-codes';
const CREATED_GROUP_IDS_KEY = 'recruitment.created-group-ids';

const getTodayIso = (): string => {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().split('T')[0] ?? '';
};

const loadUsedCodes = (): Set<string> => {
  try {
    const raw = localStorage.getItem(USED_GROUP_CODES_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.map((item) => String(item)));
  } catch {
    return new Set<string>();
  }
};

const persistUsedCodes = (codes: Set<string>): void => {
  localStorage.setItem(USED_GROUP_CODES_KEY, JSON.stringify(Array.from(codes)));
};

const loadCreatedGroupIds = (): number[] => {
  try {
    const raw = localStorage.getItem(CREATED_GROUP_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => Number(item))
      .filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
};

const persistCreatedGroupIds = (ids: number[]): void => {
  localStorage.setItem(CREATED_GROUP_IDS_KEY, JSON.stringify(ids));
};

const getQueryErrorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;

  if ('status' in error && typeof (error as any).status === 'number') {
    return (error as any).status;
  }

  const response = (error as any).response;
  if (response && typeof response === 'object' && typeof response.status === 'number') {
    return response.status;
  }

  return undefined;
};

const createRandomGroupCode = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GRUPO-${yyyy}${mm}${dd}-${random}`;
};

const generateUniqueGroupCode = (usedCodes: Set<string>): string => {
  for (let i = 0; i < 100; i += 1) {
    const code = createRandomGroupCode();
    if (!usedCodes.has(code)) {
      usedCodes.add(code);
      persistUsedCodes(usedCodes);
      return code;
    }
  }

  const fallback = `GRUPO-${Date.now()}`;
  usedCodes.add(fallback);
  persistUsedCodes(usedCodes);
  return fallback;
};

const INITIAL_FORM: GrupoCapacitacionRequest = {
  codigo: '',
  idCapacitador: 0,
  turno: 'MORNING',
  sala: 'SALA_FIBRA',
  fechaInicio: '',
  fechaFin: '',
};

export const GrupoCapacitacionForm: React.FC = () => {
  const today = useMemo(() => getTodayIso(), []);
  const [usedCodes, setUsedCodes] = useState<Set<string>>(() => loadUsedCodes());
  const [createdGroupIds, setCreatedGroupIds] = useState<number[]>(() => loadCreatedGroupIds());
  const [form, setForm] = useState<GrupoCapacitacionRequest>(() => ({
    ...INITIAL_FORM,
    codigo: generateUniqueGroupCode(loadUsedCodes()),
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>('');

  const {
    data: capacitadoresResult,
    isLoading: isLoadingCapacitadores,
    error: capacitadoresError,
  } = useQuery<ListarCapacitadoresResult>({
    queryKey: ['empleados', 'capacitadores'],
    queryFn: grupoCapacitacionService.listarCapacitadores,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const capacitadores: CapacitadorOption[] = capacitadoresResult?.options ?? [];
  const fallbackMode = capacitadoresResult?.fallbackMode ?? false;
  const capacitadorNameById = useMemo(
    () => new Map(capacitadores.map((cap) => [cap.id, cap.nombre])),
    [capacitadores]
  );

  const crearGrupo = useCrearGrupoCapacitacion();

  const createdGroupQueries = useQueries({
    queries: createdGroupIds.map((groupId) => ({
      queryKey: ['grupos-capacitacion', groupId],
      queryFn: () => grupoCapacitacionService.obtenerPorId(groupId),
      staleTime: 60 * 1000,
      retry: false,
    })),
  });

  useEffect(() => {
    const staleIds = createdGroupQueries
      .map((query, index) => ({ query, groupId: createdGroupIds[index] }))
      .filter(
        ({ query, groupId }) =>
          query.isError &&
          getQueryErrorStatus(query.error) === 404 &&
          typeof groupId === 'number'
      )
      .map(({ groupId }) => groupId ?? Number.NaN)
      .filter((id) => Number.isFinite(id) && id > 0);

    if (staleIds.length === 0) return;

    const nextIds = createdGroupIds.filter((id) => !staleIds.includes(id));
    if (nextIds.length !== createdGroupIds.length) {
      setCreatedGroupIds(nextIds);
      persistCreatedGroupIds(nextIds);
    }
  }, [createdGroupQueries, createdGroupIds]);

  const createdGroups = createdGroupQueries
    .filter((query): query is typeof query & { data: GrupoCapacitacionResponse } => Boolean(query.data))
    .map((query) => query.data)
    .sort((a, b) => b.id - a.id);

  const isLoadingCreatedGroups = createdGroupQueries.some((query) => query.isLoading);
  const hasCreatedGroupsError = createdGroupQueries.some((query) => {
    const status = getQueryErrorStatus(query.error);
    return Boolean(query.error && status !== 404);
  });

  const regenerateCode = () => {
    const nextUsed = new Set(usedCodes);
    const newCode = generateUniqueGroupCode(nextUsed);
    setUsedCodes(nextUsed);
    updateField('codigo', newCode);
  };

  const updateField = <K extends keyof GrupoCapacitacionRequest>(
    field: K,
    value: GrupoCapacitacionRequest[K]
  ) => {
    setForm((prev: GrupoCapacitacionRequest) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError('');
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!form.codigo.trim()) {
      nextErrors.codigo = 'El código es requerido';
    } else if (form.codigo.trim().length < 3) {
      nextErrors.codigo = 'El código debe tener al menos 3 caracteres';
    }

    if (!form.idCapacitador || form.idCapacitador <= 0) {
      nextErrors.idCapacitador = 'Selecciona un capacitador';
    }

    if (!form.turno) {
      nextErrors.turno = 'Selecciona un turno';
    }

    if (!form.sala) {
      nextErrors.sala = 'Selecciona una sala';
    }

    if (!form.fechaInicio) {
      nextErrors.fechaInicio = 'La fecha de inicio es requerida';
    } else if (form.fechaInicio < today) {
      nextErrors.fechaInicio = 'La fecha de inicio no puede ser anterior a hoy';
    }

    if (!form.fechaFin) {
      nextErrors.fechaFin = 'La fecha de fin es requerida';
    } else if (form.fechaInicio && form.fechaFin < form.fechaInicio) {
      nextErrors.fechaFin = 'La fecha fin no puede ser menor a fecha inicio';
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      const payload: GrupoCapacitacionRequest = {
        ...form,
        codigo: form.codigo.trim(),
      };

      const created = await crearGrupo.mutateAsync(payload);
      setSubmitError('');

      if (created.id > 0) {
        const nextIds = Array.from(new Set([created.id, ...createdGroupIds]));
        setCreatedGroupIds(nextIds);
        persistCreatedGroupIds(nextIds);
      }

      const nextUsed = new Set(usedCodes);
      const newCode = generateUniqueGroupCode(nextUsed);
      setUsedCodes(nextUsed);
      setForm({ ...INITIAL_FORM, codigo: newCode });
      setErrors({});
    } catch (error) {
      setSubmitError(getGrupoCapacitacionErrorMessage(error));
    }
  };

  return (
    <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Datos del grupo</h3>
          <p className="text-sm text-slate-500">Completa la información para registrar un nuevo grupo.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Código
            <div className="flex gap-2">
              <input
                value={form.codigo}
                onChange={(event) => updateField('codigo', event.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="Ej: GRUPO-20260411-ABCD"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={regenerateCode}
                disabled={crearGrupo.isPending}
                className="whitespace-nowrap"
              >
                Regenerar
              </Button>
            </div>
            {errors.codigo && <span className="text-xs text-red-600">{errors.codigo}</span>}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Capacitador
            <select
              value={form.idCapacitador || ''}
              onChange={(event) => updateField('idCapacitador', Number(event.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              disabled={isLoadingCapacitadores || crearGrupo.isPending}
            >
              <option value="">Seleccionar capacitador</option>
              {capacitadores.map((capacitador) => (
                <option key={capacitador.id} value={capacitador.id}>
                  {capacitador.nombre}
                </option>
              ))}
            </select>
            {errors.idCapacitador && <span className="text-xs text-red-600">{errors.idCapacitador}</span>}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Turno
            <select
              value={form.turno}
              onChange={(event) => updateField('turno', event.target.value as GrupoCapacitacionRequest['turno'])}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="MORNING">Mañana</option>
              <option value="AFTERNOON">Tarde</option>
            </select>
            {errors.turno && <span className="text-xs text-red-600">{errors.turno}</span>}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Sala
            <select
              value={form.sala}
              onChange={(event) => updateField('sala', event.target.value as GrupoCapacitacionRequest['sala'])}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="SALA_FIBRA">Sala Fibra</option>
              <option value="SALA_CLARO">Sala Claro</option>
            </select>
            {errors.sala && <span className="text-xs text-red-600">{errors.sala}</span>}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Fecha inicio
            <FlatpickrDateInput
              value={form.fechaInicio}
              onChange={(value) => updateField('fechaInicio', value)}
              minDate={today}
              inputClassName="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            {errors.fechaInicio && <span className="text-xs text-red-600">{errors.fechaInicio}</span>}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Fecha fin
            <FlatpickrDateInput
              value={form.fechaFin}
              onChange={(value) => updateField('fechaFin', value)}
              minDate={form.fechaInicio || today}
              inputClassName="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            {errors.fechaFin && <span className="text-xs text-red-600">{errors.fechaFin}</span>}
          </label>
        </div>

        {submitError && <Alert variant="error">{submitError}</Alert>}

        {capacitadoresError && !fallbackMode && (
          <Alert variant="error">No se pudo cargar la lista de capacitadores.</Alert>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={crearGrupo.isPending || isLoadingCapacitadores}>
            {crearGrupo.isPending ? 'Creando...' : 'Crear grupo'}
          </Button>
        </div>
      </form>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-slate-900">Grupos creados recientemente</h4>
          {isLoadingCreatedGroups && <span className="text-xs text-slate-500">Actualizando...</span>}
        </header>

        {hasCreatedGroupsError && (
          <Alert variant="warning">No se pudo sincronizar el historial completo de grupos creados.</Alert>
        )}

        {createdGroups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Aún no se registran grupos en esta sesión.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Capacitador</th>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3">Sala</th>
                  <th className="px-4 py-3">Fechas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {createdGroups.map((group) => (
                  <tr key={group.id} className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-900">{group.codigo}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {capacitadorNameById.get(group.idCapacitador) ?? `ID ${group.idCapacitador}`}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{group.turno}</td>
                    <td className="px-4 py-3 text-slate-700">{group.sala}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {group.fechaInicio} - {group.fechaFin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
