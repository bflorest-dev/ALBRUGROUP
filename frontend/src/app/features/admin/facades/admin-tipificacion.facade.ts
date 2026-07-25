import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CatalogoResponse,
  ComportamientoTipificacion,
  MatrizCatalogoRequest,
  SubtipificacionCatalogoRequest,
  TipificacionCatalogoRequest
} from '../../../shared/models/preventa/preventa.models';
import { AdminTipificacionService, EquipoCatalogoItem } from '../services/admin-tipificacion.service';

export type EtapaCatalogo = 'PREVENTA' | 'VENTA' | 'POSTVENTA';

export interface SubtipDraft {
  uid: string;
  id: number | null;
  codigo: string;
  descripcion: string;
  orden: number;
  etapaCambio: string;
  comportamientos: ComportamientoTipificacion[];
}

export interface TipDraft {
  uid: string;
  id: number | null;
  codigo: string;
  descripcion: string;
  orden: number;
  subtipificaciones: SubtipDraft[];
}

@Injectable()
export class AdminTipificacionFacade {
  private readonly service = inject(AdminTipificacionService);
  private uidSeq = 0;

  readonly etapaOptions: { value: EtapaCatalogo; label: string }[] = [
    { value: 'PREVENTA', label: 'Preventa' },
    { value: 'VENTA', label: 'Venta' },
    { value: 'POSTVENTA', label: 'Postventa' }
  ];

  // Comportamientos disparables por subtipi, en lenguaje de negocio (reemplazan los códigos hardcodeados).
  private readonly comportamientoLabels: Record<ComportamientoTipificacion, string> = {
    REQUIERE_HORA_PROGRAMADA: 'Requiere hora',
    REQUIERE_FECHA_PROGRAMACION: 'Requiere fecha de programación',
    REQUIERE_FECHA_INSTALACION: 'Requiere fecha de instalación',
    REQUIERE_SEC_SOT: 'Requiere SEC/SOT',
    RECIBE_MERITO: 'Atribuye el mérito de la venta',
    ES_CIERRE_PREVENTA: 'Cierra la preventa',
    APARECE_EN_AGENDADOS_GTR: 'Aparece en Agendados (GTR)',
    ES_CANCELACION_PROGRAMACION: 'Es programación cancelada'
  };

  // Qué comportamientos tiene sentido ofrecer en cada etapa (curado).
  private readonly comportamientosPorEtapa: Record<EtapaCatalogo, ComportamientoTipificacion[]> = {
    PREVENTA: ['REQUIERE_HORA_PROGRAMADA', 'APARECE_EN_AGENDADOS_GTR', 'ES_CIERRE_PREVENTA', 'RECIBE_MERITO'],
    VENTA: ['REQUIERE_HORA_PROGRAMADA', 'REQUIERE_FECHA_PROGRAMACION', 'REQUIERE_FECHA_INSTALACION',
            'REQUIERE_SEC_SOT', 'RECIBE_MERITO', 'ES_CANCELACION_PROGRAMACION'],
    POSTVENTA: []
  };

  readonly comportamientoOptions = computed(() =>
    (this.comportamientosPorEtapa[this.selectedEtapa()] ?? [])
      .map((value) => ({ label: this.comportamientoLabels[value], value }))
  );

  readonly selectedEtapa = signal<EtapaCatalogo>('VENTA');
  // Equipo seleccionado: cada equipo tiene su propia matriz por etapa.
  readonly equipos = signal<EquipoCatalogoItem[]>([]);
  readonly selectedEquipo = signal<number | null>(null);
  readonly drafts = signal<TipDraft[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isCloning = signal(false);
  readonly isDirty = signal(false);
  readonly openTipUids = signal<string[]>([]);
  readonly searchTerm = signal('');

  // Opciones del selector de equipo (por nombre, nunca por id visible).
  readonly equipoOptions = computed(() =>
    this.equipos().map((equipo) => ({ label: equipo.nombre, value: equipo.id }))
  );

  // Equipos a los que se puede clonar la matriz actual (todos menos el seleccionado).
  readonly clonarOrigenOptions = computed(() =>
    this.equipos()
      .filter((equipo) => equipo.id !== this.selectedEquipo())
      .map((equipo) => ({ label: equipo.nombre, value: equipo.id }))
  );

  readonly filteredDrafts = computed(() => {
    const term = this.searchTerm().trim().toUpperCase();
    if (!term) {
      return this.drafts();
    }
    return this.drafts().filter((tip) =>
      tip.codigo.toUpperCase().includes(term)
      || tip.descripcion.toUpperCase().includes(term)
      || tip.subtipificaciones.some((sub) =>
        sub.codigo.toUpperCase().includes(term) || sub.descripcion.toUpperCase().includes(term)
      )
    );
  });

  readonly subtipificacionCount = computed(() =>
    this.drafts().reduce((total, tip) => total + tip.subtipificaciones.length, 0)
  );

  readonly tipParentOptions = computed(() =>
    this.drafts().map((tip) => ({
      label: tip.codigo || 'Nueva tipificación',
      value: tip.uid
    }))
  );

  readonly selectedTips = computed(() => {
    const draftsByUid = new Map(this.drafts().map((tip) => [tip.uid, tip]));
    return this.openTipUids()
      .map((uid) => draftsByUid.get(uid))
      .filter((tip): tip is TipDraft => !!tip);
  });

  // Opciones para "Resultado: el lead..." segun la etapa seleccionada.
  readonly etapaCambioOptions = computed(() => {
    const actual = this.selectedEtapa();
    const currentIndex = this.etapaOptions.findIndex((option) => option.value === actual);
    return this.etapaOptions
      .filter((_, index) => Math.abs(index - currentIndex) <= 1)
      .map((option) => {
        const targetIndex = this.etapaOptions.findIndex((item) => item.value === option.value);
        const direction: 'BACK' | 'STAY' | 'FORWARD' = targetIndex < currentIndex
          ? 'BACK'
          : targetIndex > currentIndex
            ? 'FORWARD'
            : 'STAY';
        return {
          value: option.value,
          label: direction === 'STAY'
            ? `Se mantiene en ${option.label}`
            : direction === 'BACK'
              ? `Regresa a ${option.label}`
              : `Pasa a ${option.label}`,
          direction,
          icon: direction === 'STAY'
            ? 'pi pi-replay'
            : direction === 'BACK'
              ? 'pi pi-arrow-left'
              : 'pi pi-arrow-right'
        };
      });
  });

  etapaLabel(value?: string | null): string {
    return this.etapaOptions.find((option) => option.value === value)?.label ?? '-';
  }

  async loadEquipos(): Promise<void> {
    const equipos = await firstValueFrom(this.service.listarEquipos());
    this.equipos.set(equipos);
    if (this.selectedEquipo() === null && equipos.length) {
      this.selectedEquipo.set(equipos[0].id);
    }
  }

  async loadCatalogo(): Promise<void> {
    const etapa = this.selectedEtapa();
    const idEquipo = this.selectedEquipo();
    if (idEquipo === null) {
      this.drafts.set([]);
      this.isDirty.set(false);
      this.openTipUids.set([]);
      this.searchTerm.set('');
      return;
    }
    this.isLoading.set(true);
    try {
      const catalogo = await firstValueFrom(this.service.getCatalogo(etapa, idEquipo));
      this.drafts.set(this.toDrafts(catalogo, etapa));
      this.isDirty.set(false);
      this.openTipUids.set([]);
      this.searchTerm.set('');
    } finally {
      this.isLoading.set(false);
    }
  }

  changeEtapa(etapa: EtapaCatalogo): void {
    this.selectedEtapa.set(etapa);
  }

  changeEquipo(idEquipo: number): void {
    this.selectedEquipo.set(idEquipo);
  }

  equipoLabel(id: number | null): string {
    return this.equipos().find((equipo) => equipo.id === id)?.nombre ?? '-';
  }

  // Copia la matriz de otro equipo (origen) al equipo seleccionado (destino) en la etapa actual.
  async clonarDesde(idEquipoOrigen: number): Promise<void> {
    const idEquipoDestino = this.selectedEquipo();
    if (idEquipoDestino === null || idEquipoOrigen === idEquipoDestino) {
      return;
    }
    this.isCloning.set(true);
    try {
      const catalogo = await firstValueFrom(this.service.clonarMatriz({
        etapa: this.selectedEtapa(),
        idEquipoOrigen,
        idEquipoDestino
      }));
      this.drafts.set(this.toDrafts(catalogo, this.selectedEtapa()));
      this.isDirty.set(false);
      this.openTipUids.set([]);
      this.searchTerm.set('');
    } finally {
      this.isCloning.set(false);
    }
  }

  addTipificacion(): void {
    const draft = this.newTipDraft(this.drafts().length + 1);
    this.drafts.update((items) => [...items, draft]);
    this.openTipUids.set([draft.uid]);
    this.isDirty.set(true);
  }

  removeTipificacion(uid: string): void {
    this.drafts.update((items) => items.filter((item) => item.uid !== uid));
    this.openTipUids.update((open) => open.filter((item) => item !== uid));
    this.isDirty.set(true);
  }

  toggleTip(uid: string): void {
    this.openTipUids.update((current) => {
      if (current.includes(uid)) {
        return current.filter((item) => item !== uid);
      }
      if (current.length < 2) {
        return [...current, uid];
      }
      return [current[0], uid];
    });
  }

  replaceOpenTip(position: number, uid: string): void {
    this.openTipUids.update((current) => {
      const other = current[position === 0 ? 1 : 0];
      if (uid === other) {
        return current;
      }
      const next = [...current];
      next[position] = uid;
      return next;
    });
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  moveTip(uid: string, direction: -1 | 1): void {
    const items = [...this.drafts()];
    const index = items.findIndex((item) => item.uid === uid);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) {
      return;
    }
    [items[index], items[target]] = [items[target], items[index]];
    this.drafts.set(this.normalizeTipOrders(items));
    this.isDirty.set(true);
  }

  moveTipToIndex(uid: string, targetIndex: number): void {
    const items = [...this.drafts()];
    const sourceIndex = items.findIndex((item) => item.uid === uid);
    if (sourceIndex < 0 || sourceIndex === targetIndex) {
      return;
    }
    const [moved] = items.splice(sourceIndex, 1);
    items.splice(Math.min(Math.max(targetIndex, 0), items.length), 0, moved);
    this.drafts.set(this.normalizeTipOrders(items));
    this.isDirty.set(true);
  }

  updateTipField(uid: string, field: 'codigo' | 'descripcion' | 'orden', value: string | number): void {
    const current = this.drafts().find((item) => item.uid === uid);
    if (!current || current[field] === value) {
      return;
    }
    this.drafts.update((items) =>
      items.map((item) => (item.uid === uid ? { ...item, [field]: value } : item))
    );
    this.isDirty.set(true);
  }

  addSubtipificacion(tipUid: string): void {
    this.drafts.update((items) =>
      items.map((item) =>
        item.uid === tipUid
          ? { ...item, subtipificaciones: [...item.subtipificaciones, this.newSubtipDraft(item.subtipificaciones.length + 1)] }
          : item
      )
    );
    this.isDirty.set(true);
  }

  moveSubtipificacion(tipUid: string, subUid: string, direction: -1 | 1): void {
    this.drafts.update((items) => items.map((tip) => {
      if (tip.uid !== tipUid) {
        return tip;
      }
      const subs = [...tip.subtipificaciones];
      const index = subs.findIndex((sub) => sub.uid === subUid);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= subs.length) {
        return tip;
      }
      [subs[index], subs[target]] = [subs[target], subs[index]];
      return { ...tip, subtipificaciones: this.normalizeSubtipOrders(subs) };
    }));
    this.isDirty.set(true);
  }

  moveSubtipificacionTo(
    sourceTipUid: string,
    subUid: string,
    targetTipUid: string,
    targetIndex: number
  ): void {
    if (sourceTipUid === targetTipUid) {
      this.reorderSubtipificacionTo(sourceTipUid, subUid, targetIndex);
      return;
    }

    const sourceTip = this.drafts().find((tip) => tip.uid === sourceTipUid);
    const moved = sourceTip?.subtipificaciones.find((sub) => sub.uid === subUid);
    if (!moved) {
      return;
    }

    this.drafts.update((items) => items.map((tip) => {
      if (tip.uid === sourceTipUid) {
        const remaining = tip.subtipificaciones.filter((sub) => sub.uid !== subUid);
        return { ...tip, subtipificaciones: this.normalizeSubtipOrders(remaining) };
      }
      if (tip.uid === targetTipUid) {
        const next = [...tip.subtipificaciones];
        next.splice(Math.min(Math.max(targetIndex, 0), next.length), 0, moved);
        return { ...tip, subtipificaciones: this.normalizeSubtipOrders(next) };
      }
      return tip;
    }));
    this.openTipUids.update((open) =>
      open.includes(targetTipUid) ? open : [...open.slice(-1), targetTipUid]
    );
    this.isDirty.set(true);
  }

  moveSubtipificacionToIndex(
    sourceTipUid: string,
    subUid: string,
    targetTipUid: string,
    targetIndex: number
  ): void {
    if (sourceTipUid !== targetTipUid) {
      this.moveSubtipificacionTo(sourceTipUid, subUid, targetTipUid, targetIndex);
      return;
    }

    this.drafts.update((items) => items.map((tip) => {
      if (tip.uid !== sourceTipUid) {
        return tip;
      }
      const next = [...tip.subtipificaciones];
      const sourceIndex = next.findIndex((sub) => sub.uid === subUid);
      if (sourceIndex < 0 || sourceIndex === targetIndex) {
        return tip;
      }
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(Math.min(Math.max(targetIndex, 0), next.length), 0, moved);
      return { ...tip, subtipificaciones: this.normalizeSubtipOrders(next) };
    }));
    this.isDirty.set(true);
  }

  private reorderSubtipificacionTo(tipUid: string, subUid: string, targetIndex: number): void {
    this.drafts.update((items) => items.map((tip) => {
      if (tip.uid !== tipUid) {
        return tip;
      }
      const next = [...tip.subtipificaciones];
      const sourceIndex = next.findIndex((sub) => sub.uid === subUid);
      if (sourceIndex < 0) {
        return tip;
      }
      const [moved] = next.splice(sourceIndex, 1);
      const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(Math.min(Math.max(adjustedTarget, 0), next.length), 0, moved);
      return { ...tip, subtipificaciones: this.normalizeSubtipOrders(next) };
    }));
    this.isDirty.set(true);
  }

  removeSubtipificacion(tipUid: string, subUid: string): void {
    this.drafts.update((items) =>
      items.map((item) => {
        if (item.uid !== tipUid) {
          return item;
        }
        return { ...item, subtipificaciones: item.subtipificaciones.filter((sub) => sub.uid !== subUid) };
      })
    );
    this.isDirty.set(true);
  }

  updateSubtipField(
    tipUid: string,
    subUid: string,
    field: 'codigo' | 'descripcion' | 'orden' | 'etapaCambio',
    value: string | number | null
  ): void {
    const current = this.drafts()
      .find((item) => item.uid === tipUid)
      ?.subtipificaciones.find((sub) => sub.uid === subUid);
    if (!current || current[field] === value) {
      return;
    }
    this.drafts.update((items) =>
      items.map((item) => {
        if (item.uid !== tipUid) {
          return item;
        }
        return {
          ...item,
          subtipificaciones: item.subtipificaciones.map((sub) => {
            if (sub.uid !== subUid) {
              return sub;
            }
            return { ...sub, [field]: value } as SubtipDraft;
          })
        };
      })
    );
    this.isDirty.set(true);
  }

  updateSubtipComportamientos(tipUid: string, subUid: string, comportamientos: ComportamientoTipificacion[]): void {
    this.drafts.update((items) =>
      items.map((item) => {
        if (item.uid !== tipUid) {
          return item;
        }
        return {
          ...item,
          subtipificaciones: item.subtipificaciones.map((sub) =>
            sub.uid === subUid ? { ...sub, comportamientos: [...comportamientos] } : sub
          )
        };
      })
    );
    this.isDirty.set(true);
  }

  /** Valida los drafts. Devuelve el primer mensaje de error o null si todo esta bien. */
  validate(): string | null {
    if (this.selectedEquipo() === null) {
      return 'Selecciona un equipo antes de guardar.';
    }
    const drafts = this.drafts();
    if (!drafts.length) {
      return 'Agrega al menos una tipificacion antes de guardar.';
    }
    const codigos = new Set<string>();
    for (const tip of drafts) {
      if (!tip.codigo.trim() || !tip.descripcion.trim()) {
        return 'Cada tipificacion necesita codigo y descripcion.';
      }
      if (tip.orden <= 0) {
        return `La tipificacion ${tip.codigo} necesita un orden mayor a cero.`;
      }
      const codigoNorm = tip.codigo.trim().toUpperCase();
      if (codigos.has(codigoNorm)) {
        return `El codigo de tipificacion ${tip.codigo} esta repetido.`;
      }
      codigos.add(codigoNorm);

      const subCodigos = new Set<string>();
      for (const sub of tip.subtipificaciones) {
        if (!sub.codigo.trim() || !sub.descripcion.trim()) {
          return `Cada subtipificacion de ${tip.codigo} necesita codigo y descripcion.`;
        }
        if (sub.orden <= 0) {
          return `La subtipificacion ${sub.codigo} necesita un orden mayor a cero.`;
        }
        const subNorm = sub.codigo.trim().toUpperCase();
        if (subCodigos.has(subNorm)) {
          return `El codigo de subtipificacion ${sub.codigo} esta repetido en ${tip.codigo}.`;
        }
        subCodigos.add(subNorm);
      }
    }
    return null;
  }

  async save(): Promise<void> {
    const request = this.toRequest();
    this.isSaving.set(true);
    try {
      const catalogo = await firstValueFrom(this.service.guardarMatriz(request));
      this.drafts.set(this.toDrafts(catalogo, this.selectedEtapa()));
      this.isDirty.set(false);
      this.openTipUids.set([]);
    } finally {
      this.isSaving.set(false);
    }
  }

  async discard(): Promise<void> {
    await this.loadCatalogo();
  }

  private toRequest(): MatrizCatalogoRequest {
    const etapa = this.selectedEtapa();
    const idEquipo = this.selectedEquipo()!;
    const tipificaciones: TipificacionCatalogoRequest[] = [...this.drafts()]
      .sort((left, right) => left.orden - right.orden)
      .map((tip, tipIndex) => ({
        id: tip.id,
        codigo: tip.codigo.trim(),
        descripcion: tip.descripcion.trim(),
        orden: tipIndex + 1,
        subtipificaciones: [...tip.subtipificaciones]
          .sort((left, right) => left.orden - right.orden)
          .map(
            (sub, subIndex): SubtipificacionCatalogoRequest => ({
              id: sub.id,
              codigo: sub.codigo.trim(),
              descripcion: sub.descripcion.trim(),
              orden: subIndex + 1,
              etapaCambio: sub.etapaCambio,
              comportamientos: sub.comportamientos
            })
          )
      }));
    return { etapa, idEquipo, tipificaciones };
  }

  private toDrafts(catalogo: CatalogoResponse, etapa: EtapaCatalogo): TipDraft[] {
    return (catalogo.tipificaciones ?? []).map((tip) => ({
      uid: this.nextUid(),
      id: tip.id,
      codigo: tip.codigo,
      descripcion: tip.descripcion,
      orden: tip.orden,
      subtipificaciones: (tip.subtipificaciones ?? []).map((sub) => ({
        uid: this.nextUid(),
        id: sub.id,
        codigo: sub.codigo,
        descripcion: sub.descripcion,
        orden: sub.orden,
        // null en backend significa "se mantiene"; lo normalizamos a la etapa actual.
        etapaCambio: sub.etapaCambio ?? etapa,
        comportamientos: sub.comportamientos ?? []
      }))
    }));
  }

  private newTipDraft(orden: number): TipDraft {
    return {
      uid: this.nextUid(),
      id: null,
      codigo: '',
      descripcion: '',
      orden,
      subtipificaciones: []
    };
  }

  private newSubtipDraft(orden: number): SubtipDraft {
    return {
      uid: this.nextUid(),
      id: null,
      codigo: '',
      descripcion: '',
      orden,
      etapaCambio: this.selectedEtapa(),
      comportamientos: []
    };
  }

  private nextUid(): string {
    return `d${this.uidSeq++}`;
  }

  private normalizeTipOrders(items: TipDraft[]): TipDraft[] {
    return items.map((item, index) => ({ ...item, orden: index + 1 }));
  }

  private normalizeSubtipOrders(items: SubtipDraft[]): SubtipDraft[] {
    return items.map((item, index) => ({ ...item, orden: index + 1 }));
  }

}
