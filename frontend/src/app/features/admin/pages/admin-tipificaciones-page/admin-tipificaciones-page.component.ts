import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanDeactivateFn } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AdminTipificacionFacade, EtapaCatalogo } from '../../facades/admin-tipificacion.facade';
import {
  SubtipAction,
  SubtipDropAction,
  SubtipFieldChange,
  SubtipMoveAction,
  TipEditorComponent,
  TipFieldChange
} from './components/tip-editor/tip-editor.component';

@Component({
  selector: 'app-admin-tipificaciones-page',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    TipEditorComponent
  ],
  providers: [AdminTipificacionFacade, MessageService],
  templateUrl: './admin-tipificaciones-page.component.html',
  styleUrl: './admin-tipificaciones-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTipificacionesPageComponent implements OnInit {
  protected readonly facade = inject(AdminTipificacionFacade);
  private readonly messageService = inject(MessageService);
  private draggedTipUid: string | null = null;
  private draggedSubtip: SubtipAction | null = null;

  protected readonly skeletonRows = Array.from({ length: 4 });

  ngOnInit(): void {
    void this.load();
  }

  protected async onEtapaChange(etapa: EtapaCatalogo): Promise<void> {
    if (!this.confirmDiscardChanges()) {
      return;
    }
    this.facade.changeEtapa(etapa);
    await this.load();
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.facade.isDirty()) {
      event.preventDefault();
      event.returnValue = true;
    }
  }

  canLeave(): boolean {
    return this.confirmDiscardChanges();
  }

  protected async load(): Promise<void> {
    try {
      await this.facade.loadCatalogo();
    } catch {
      this.notify('error', 'No se pudo cargar el catálogo de esta etapa.');
    }
  }

  protected async guardar(): Promise<void> {
    const error = this.facade.validate();
    if (error) {
      this.notify('warn', error);
      return;
    }
    try {
      await this.facade.save();
      this.notify('success', 'Los cambios ya están disponibles.');
    } catch {
      this.notify('error', 'No se pudieron guardar los cambios. Revisa los datos e intenta nuevamente.');
    }
  }

  protected async descartar(): Promise<void> {
    if (!window.confirm('¿Quieres descartar todos los cambios sin guardar?')) {
      return;
    }
    try {
      await this.facade.discard();
      this.notify('info', 'Se recuperó la última versión guardada.');
    } catch {
      this.notify('error', 'No se pudo recuperar la última versión guardada.');
    }
  }

  protected onTipFieldChange(change: TipFieldChange): void {
    this.facade.updateTipField(change.uid, change.field, change.value);
  }

  protected onSubtipFieldChange(change: SubtipFieldChange): void {
    this.facade.updateSubtipField(
      change.tipUid,
      change.subUid,
      change.field,
      change.value
    );
  }

  protected startTipDrag(uid: string, event: DragEvent): void {
    this.draggedSubtip = null;
    this.draggedTipUid = uid;
    event.dataTransfer?.setData('text/plain', uid);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  protected dropOnTip(targetUid: string, targetSubtipCount: number, event: DragEvent): void {
    event.preventDefault();
    if (this.draggedSubtip) {
      this.facade.moveSubtipificacionTo(
        this.draggedSubtip.tipUid,
        this.draggedSubtip.subUid,
        targetUid,
        targetSubtipCount
      );
    } else if (this.draggedTipUid) {
      this.facade.moveTipTo(this.draggedTipUid, targetUid);
    }
    this.draggedTipUid = null;
    this.draggedSubtip = null;
  }

  protected startSubtipDrag(action: SubtipAction): void {
    this.draggedTipUid = null;
    this.draggedSubtip = action;
  }

  protected dropSubtip(action: SubtipDropAction): void {
    if (!this.draggedSubtip) {
      return;
    }
    this.facade.moveSubtipificacionTo(
      this.draggedSubtip.tipUid,
      this.draggedSubtip.subUid,
      action.tipUid,
      action.targetIndex
    );
    this.draggedSubtip = null;
  }

  protected moveSubtip(action: SubtipMoveAction): void {
    this.facade.moveSubtipificacion(action.tipUid, action.subUid, action.direction);
  }

  protected stageAccentClass(): string {
    return {
      PREVENTA: 'border-l-indigo-500',
      VENTA: 'border-l-emerald-500',
      POSTVENTA: 'border-l-amber-500',
      COBRANZA: 'border-l-rose-500'
    }[this.facade.selectedEtapa()];
  }

  protected stageBadgeClass(): string {
    return {
      PREVENTA: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
      VENTA: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      POSTVENTA: 'bg-amber-50 text-amber-800 ring-amber-200',
      COBRANZA: 'bg-rose-50 text-rose-700 ring-rose-200'
    }[this.facade.selectedEtapa()];
  }

  protected stageCodeClass(): string {
    return {
      PREVENTA: 'bg-indigo-100 text-indigo-800',
      VENTA: 'bg-emerald-100 text-emerald-800',
      POSTVENTA: 'bg-amber-100 text-amber-900',
      COBRANZA: 'bg-rose-100 text-rose-800'
    }[this.facade.selectedEtapa()];
  }

  private confirmDiscardChanges(): boolean {
    return !this.facade.isDirty()
      || window.confirm('Tienes cambios sin guardar. Si continúas, se perderán.');
  }

  private notify(severity: 'success' | 'info' | 'warn' | 'error', detail: string): void {
    const summary = {
      success: 'Listo',
      info: 'Información',
      warn: 'Atención',
      error: 'Hubo un problema'
    }[severity];
    this.messageService.add({
      severity,
      summary,
      detail,
      life: severity === 'error' ? 6000 : 4000
    });
  }
}

export const canDeactivateAdminTipificaciones: CanDeactivateFn<AdminTipificacionesPageComponent> =
  (component) => component.canLeave();
