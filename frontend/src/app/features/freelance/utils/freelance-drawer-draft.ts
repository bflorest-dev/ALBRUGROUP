export const FREELANCE_DRAWER_DRAFT_KEY = 'albru.freelance.venta-drawer.draft';

export type FreelanceDrawerDraftMode = 'crear' | 'corregir';

export interface FreelanceDrawerDraft {
  mode: FreelanceDrawerDraftMode;
  idLead: number | null;
  step: number;
  form: Record<string, unknown>;
}

export function readFreelanceDrawerDraft(): FreelanceDrawerDraft | null {
  const storage = getDraftStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(FREELANCE_DRAWER_DRAFT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<FreelanceDrawerDraft>;
    if (
      (value.mode !== 'crear' && value.mode !== 'corregir')
      || typeof value.step !== 'number'
      || !value.form
      || typeof value.form !== 'object'
      || (value.idLead !== null && typeof value.idLead !== 'number')
    ) {
      clearFreelanceDrawerDraft();
      return null;
    }
    return {
      mode: value.mode,
      idLead: value.idLead ?? null,
      step: Math.min(3, Math.max(0, Math.trunc(value.step))),
      form: value.form as Record<string, unknown>
    };
  } catch {
    clearFreelanceDrawerDraft();
    return null;
  }
}

export function saveFreelanceDrawerDraft(draft: FreelanceDrawerDraft): void {
  const storage = getDraftStorage();
  if (!storage) return;
  try {
    storage.setItem(FREELANCE_DRAWER_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // The draft is an assistance layer; a storage restriction must not block the form.
  }
}

export function clearFreelanceDrawerDraft(): void {
  const storage = getDraftStorage();
  if (!storage) return;
  try {
    storage.removeItem(FREELANCE_DRAWER_DRAFT_KEY);
  } catch {
    // The drawer remains usable if the browser denies storage access.
  }
}

function getDraftStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
