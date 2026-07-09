import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CatalogoResponse,
  MatrizCatalogoRequest,
  SubtipificacionCatalogoRequest,
  TipificacionCatalogoRequest
} from '../../../shared/models/preventa/preventa.models';
import { AdminTipificacionService } from '../services/admin-tipificacion.service';

export type EtapaCatalogo = 'PREVENTA' | 'VENTA' | 'POSTVENTA' | 'COBRANZA';

export interface SubtipDraft {
  uid: string;
  id: number | null;
  codigo: string;
  descripcion: string;
  orden: number;
  etapaCambio: string;
  estadoPostventaCambio: string | null;
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
    { value: 'POSTVENTA', label: 'Postventa' },
    { value: 'COBRANZA', label: 'Cobranza' }
  ];

  readonly estadoPostventaOptions = [
    'EN_SEGUIMIENTO',
    'PAGO_PENDIENTE',
    'EN_COBRANZA',
    'PAGO_CUBIERTO_EMPRESA',
    'BAJA_CONFIRMADA',
    'EFECTIVO',
    'NO_EFECTIVO'
  ];

  readonly selectedEtapa = signal<EtapaCatalogo>('VENTA');
  readonly drafts = signal<TipDraft[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDirty = signal(false);

  // Opciones para "Resultado: el lead..." segun la etapa seleccionada.
  readonly etapaCambioOptions = computed(() => {
    const actual = this.selectedEtapa();
    return this.etapaOptions.map((option) => ({
      value: option.value,
      label: option.value === actual ? `Se mantiene en ${option.label}` : `Pasa a ${option.label}`
    }));
  });

  etapaLabel(value?: string | null): string {
    return this.etapaOptions.find((option) => option.value === value)?.label ?? '-';
  }

  async loadCatalogo(): Promise<void> {
    const etapa = this.selectedEtapa();
    this.isLoading.set(true);
    try {
      const catalogo = await firstValueFrom(this.service.getCatalogo(etapa));
      this.drafts.set(this.toDrafts(catalogo, etapa));
      this.isDirty.set(false);
    } finally {
      this.isLoading.set(false);
    }
  }

  changeEtapa(etapa: EtapaCatalogo): void {
    this.selectedEtapa.set(etapa);
  }

  addTipificacion(): void {
    this.drafts.update((items) => [...items, this.newTipDraft(items.length + 1)]);
    this.isDirty.set(true);
  }

  removeTipificacion(uid: string): void {
    this.drafts.update((items) => items.filter((item) => item.uid !== uid));
    this.isDirty.set(true);
  }

  updateTipField(uid: string, field: 'codigo' | 'descripcion' | 'orden', value: string | number): void {
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
    field: 'codigo' | 'descripcion' | 'orden' | 'etapaCambio' | 'estadoPostventaCambio',
    value: string | number | null
  ): void {
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
            const next = { ...sub, [field]: value } as SubtipDraft;
            if (field === 'etapaCambio' && value !== 'POSTVENTA') {
              next.estadoPostventaCambio = null;
            }
            return next;
          })
        };
      })
    );
    this.isDirty.set(true);
  }

  /** Valida los drafts. Devuelve el primer mensaje de error o null si todo esta bien. */
  validate(): string | null {
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
        if (sub.etapaCambio === 'POSTVENTA' && !sub.estadoPostventaCambio) {
          return `La subtipificacion ${sub.codigo} pasa a Postventa: elige el estado postventa.`;
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
    } finally {
      this.isSaving.set(false);
    }
  }

  private toRequest(): MatrizCatalogoRequest {
    const etapa = this.selectedEtapa();
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
              estadoPostventaCambio: sub.etapaCambio === 'POSTVENTA' ? sub.estadoPostventaCambio : null
            })
          )
      }));
    return { etapa, tipificaciones };
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
        estadoPostventaCambio: sub.estadoPostventaCambio ?? null
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
      estadoPostventaCambio: null
    };
  }

  private nextUid(): string {
    return `d${this.uidSeq++}`;
  }

}
