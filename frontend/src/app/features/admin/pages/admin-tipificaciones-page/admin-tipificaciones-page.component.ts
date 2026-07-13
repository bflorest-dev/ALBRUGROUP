import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
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
    DragDropModule,
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

  protected readonly skeletonRows = Array.from({ length: 4 });

  ngOnInit(): void {
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      await this.facade.loadEquipos();
    } catch {
      this.notify('error', 'No se pudieron cargar los equipos.');
    }
    await this.load();
  }

  protected async onEtapaChange(etapa: EtapaCatalogo): Promise<void> {
    if (!this.confirmDiscardChanges()) {
      return;
    }
    this.facade.changeEtapa(etapa);
    await this.load();
  }

  protected async onEquipoChange(idEquipo: number): Promise<void> {
    if (!this.confirmDiscardChanges()) {
      return;
    }
    this.facade.changeEquipo(idEquipo);
    await this.load();
  }

  protected async clonarDesde(idEquipoOrigen: number): Promise<void> {
    const origen = this.facade.equipoLabel(idEquipoOrigen);
    const destino = this.facade.equipoLabel(this.facade.selectedEquipo());
    const mensaje = this.facade.drafts().length > 0
      ? `Esto reemplazará la matriz de ${destino} con una copia de ${origen}. ¿Continuar?`
      : `Se copiará la matriz de ${origen} a ${destino}.`;
    if (!window.confirm(mensaje)) {
      return;
    }
    try {
      await this.facade.clonarDesde(idEquipoOrigen);
      this.notify('success', `Matriz copiada desde ${origen}.`);
    } catch {
      this.notify('error', 'No se pudo clonar la matriz. Intenta nuevamente.');
    }
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

  protected dropTip(event: CdkDragDrop<unknown>): void {
    this.facade.moveTipToIndex(event.item.data as string, event.currentIndex);
  }

  protected dropSubtip(action: SubtipDropAction): void {
    this.facade.moveSubtipificacionToIndex(
      action.sourceTipUid,
      action.subUid,
      action.targetTipUid,
      action.targetIndex
    );
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
