import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import {
  EtapaCatalogo,
  SubtipDraft,
  TipDraft
} from '../../../../facades/admin-tipificacion.facade';

export interface TipFieldChange {
  uid: string;
  field: 'codigo' | 'descripcion';
  value: string;
}

export interface SubtipFieldChange {
  tipUid: string;
  subUid: string;
  field: 'codigo' | 'descripcion' | 'etapaCambio' | 'estadoPostventaCambio';
  value: string | null;
}

export interface SubtipAction {
  tipUid: string;
  subUid: string;
}

export interface SubtipMoveAction extends SubtipAction {
  direction: -1 | 1;
}

export interface SubtipDropAction {
  sourceTipUid: string;
  targetTipUid: string;
  subUid: string;
  targetIndex: number;
}

interface EtapaCambioOption {
  value: EtapaCatalogo;
  label: string;
  direction: 'BACK' | 'STAY' | 'FORWARD';
  icon: string;
}

@Component({
  selector: 'app-tip-editor',
  imports: [NgClass, FormsModule, DragDropModule, ButtonModule, InputTextModule, SelectModule, TooltipModule],
  templateUrl: './tip-editor.component.html',
  styleUrl: './tip-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TipEditorComponent {
  @Input({ required: true }) tip!: TipDraft;
  @Input({ required: true }) selectedEtapa!: EtapaCatalogo;
  @Input({ required: true }) etapaOptions: EtapaCambioOption[] = [];
  @Input({ required: true }) estadoPostventaOptions: string[] = [];

  @Output() tipFieldChange = new EventEmitter<TipFieldChange>();
  @Output() removeTip = new EventEmitter<string>();
  @Output() addSubtip = new EventEmitter<string>();
  @Output() subtipFieldChange = new EventEmitter<SubtipFieldChange>();
  @Output() removeSubtip = new EventEmitter<SubtipAction>();
  @Output() moveSubtip = new EventEmitter<SubtipMoveAction>();
  @Output() subtipDrop = new EventEmitter<SubtipDropAction>();

  protected updateTip(field: TipFieldChange['field'], value: string): void {
    this.tipFieldChange.emit({ uid: this.tip.uid, field, value });
  }

  protected updateSubtip(
    sub: SubtipDraft,
    field: SubtipFieldChange['field'],
    value: string | null
  ): void {
    this.subtipFieldChange.emit({ tipUid: this.tip.uid, subUid: sub.uid, field, value });
  }

  protected dropSubtip(event: CdkDragDrop<string, string, string>): void {
    this.subtipDrop.emit({
      sourceTipUid: event.previousContainer.data,
      targetTipUid: event.container.data,
      subUid: event.item.data,
      targetIndex: event.currentIndex
    });
  }

  protected resultClass(etapa: string | null): string {
    return {
      PREVENTA: 'result-preventa',
      VENTA: 'result-venta',
      POSTVENTA: 'result-postventa',
      COBRANZA: 'result-cobranza'
    }[etapa ?? ''] ?? '';
  }

  protected etapaOption(etapa: string | null): EtapaCambioOption | undefined {
    return this.etapaOptions.find((option) => option.value === etapa);
  }
}
