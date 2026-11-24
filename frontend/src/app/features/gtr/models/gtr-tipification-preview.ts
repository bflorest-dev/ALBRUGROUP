import { EventoResponse } from '../../../shared/models/preventa/preventa.models';

export type GtrTipificationAdvisorPreviewStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface GtrTipificationAdvisorPreviewState {
  status: GtrTipificationAdvisorPreviewStatus;
  names: string[];
  error: string | null;
  updatedAt: number | null;
}

export const EMPTY_GTR_TIPIFICATION_ADVISOR_PREVIEW: GtrTipificationAdvisorPreviewState = {
  status: 'idle',
  names: [],
  error: null,
  updatedAt: null
};

/**
 * Returns one advisor name per actor, keeping the most recent tipification first.
 * Events without a usable responsible are ignored so incomplete audit records do
 * not make the compact preview unusable.
 */
export function extractTipificationAdvisorNames(events: EventoResponse[]): string[] {
  const sortedEvents = [...events].sort((left, right) => {
    const rightTime = parseEventTime(right.createdAt);
    const leftTime = parseEventTime(left.createdAt);

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return right.id - left.id;
  });

  const seenActors = new Set<string>();
  const names: string[] = [];

  for (const event of sortedEvents) {
    if (event.accion && event.accion.trim().toUpperCase() !== 'TIPIFICACION') {
      continue;
    }

    const name = (event.nombreActor ?? '').trim() || (event.nombreAsesorAsignado ?? '').trim();
    if (!name) {
      continue;
    }

    const normalizedName = name.replace(/\s+/g, ' ').toLocaleUpperCase();
    const actorKey = event.idActor ?? event.idAsesorAsignado;
    const dedupeKey = actorKey === null || actorKey === undefined
      ? `name:${normalizedName}`
      : `actor:${actorKey}`;

    if (seenActors.has(dedupeKey)) {
      continue;
    }

    seenActors.add(dedupeKey);
    names.push(name.replace(/\s+/g, ' '));
  }

  return names;
}

function parseEventTime(value?: string | null): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}
