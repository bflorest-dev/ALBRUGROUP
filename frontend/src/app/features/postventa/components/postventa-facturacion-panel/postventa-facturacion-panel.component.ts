import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { AportantePago, EstadoPeriodoFacturacionPostventa } from '../../services/postventa-lead.service';
import { EstadoBadge, SelectOption, display, estadoBadge } from '../../models/postventa.vm';

/** Facturacion del periodo vigente: confirmar factura, registrar pago y cerrar periodo. */
@Component({
  selector: 'app-postventa-facturacion-panel',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule
  ],
  templateUrl: './postventa-facturacion-panel.component.html',
  styleUrl: './postventa-facturacion-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaFacturacionPanelComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  private readonly fb = inject(NonNullableFormBuilder);
  private handledPeriodoId = -1;

  protected readonly aportanteOptions: SelectOption<AportantePago>[] = [
    { label: 'Cliente', value: 'CLIENTE' },
    { label: 'Empresa', value: 'EMPRESA' }
  ];
  // Solo estados que efectivamente cierran el periodo (el backend rechaza los demas).
  protected readonly cierreOptions: SelectOption<EstadoPeriodoFacturacionPostventa>[] = [
    { label: 'Pago confirmado', value: 'PAGO_CONFIRMADO' },
    { label: 'Vencido', value: 'VENCIDO' },
    { label: 'En cobranza', value: 'EN_COBRANZA' },
    { label: 'Baja', value: 'BAJA' },
    { label: 'Anulado', value: 'ANULADO' }
  ];

  protected readonly facturaForm = this.fb.group({
    fechaEmisionConfirmada: [''],
    fechaVencimientoConfirmado: [''],
    montoFacturado: [null as number | null],
    observacion: ['']
  });

  protected readonly pagoForm = this.fb.group({
    aportante: [null as AportantePago | null],
    monto: [null as number | null, [Validators.min(0.01)]],
    fechaPago: [''],
    fechaCompromisoPago: [''],
    numeroOperacion: [''],
    canalPago: [''],
    observacion: ['']
  });

  protected readonly cierreForm = this.fb.group({
    estado: ['PAGO_CONFIRMADO' as EstadoPeriodoFacturacionPostventa],
    crearSiguientePeriodo: [true],
    observacion: ['']
  });

  constructor() {
    // Prefijar factura y pago con los datos del periodo seleccionado, una vez por periodo.
    // Al navegar a otro periodo, el effect vuelve a correr y reprefija los formularios.
    effect(() => {
      const periodo = this.facade.selectedPeriodo();
      if (!periodo || periodo.id === this.handledPeriodoId) {
        return;
      }
      this.handledPeriodoId = periodo.id;
      const emision = periodo.fechaEmisionConfirmada ?? periodo.fechaEmisionEstimada ?? '';
      const vencimiento = periodo.fechaVencimientoConfirmado ?? periodo.fechaVencimientoEstimado ?? '';
      const monto = periodo.montoFacturado ?? periodo.montoEsperado ?? null;
      this.facturaForm.reset({
        fechaEmisionConfirmada: emision,
        fechaVencimientoConfirmado: vencimiento,
        montoFacturado: monto,
        observacion: periodo.observacion ?? ''
      });
      this.pagoForm.reset({
        aportante: null,
        monto,
        fechaPago: '',
        fechaCompromisoPago: '',
        numeroOperacion: '',
        canalPago: '',
        observacion: ''
      });
      this.cierreForm.reset({ estado: 'PAGO_CONFIRMADO', crearSiguientePeriodo: true, observacion: '' });
    });
  }

  protected badge(value: unknown): EstadoBadge {
    return estadoBadge(value);
  }

  protected display(value: unknown): string {
    return display(value);
  }

  /** Etiqueta legible de un periodo para el selector: "Periodo 2 · Pago pendiente". */
  protected periodoLabel(periodo: { numeroPeriodo?: number | null; estado?: unknown }): string {
    const numero = periodo.numeroPeriodo ?? '—';
    return `Periodo ${numero} · ${estadoBadge(periodo.estado).label}`;
  }

  protected onPeriodoChange(idPeriodo: number | null): void {
    this.facade.selectPeriodo(idPeriodo);
  }

  protected async guardarFactura(): Promise<void> {
    const raw = this.facturaForm.getRawValue();
    if (raw.fechaEmisionConfirmada && raw.fechaVencimientoConfirmado && raw.fechaVencimientoConfirmado < raw.fechaEmisionConfirmada) {
      return;
    }
    await this.facade.confirmarFactura({
      fechaEmisionConfirmada: raw.fechaEmisionConfirmada || null,
      fechaVencimientoConfirmado: raw.fechaVencimientoConfirmado || null,
      montoFacturado: raw.montoFacturado,
      observacion: raw.observacion || null
    });
  }

  protected get vencimientoInvalido(): boolean {
    const raw = this.facturaForm.getRawValue();
    return Boolean(raw.fechaEmisionConfirmada && raw.fechaVencimientoConfirmado && raw.fechaVencimientoConfirmado < raw.fechaEmisionConfirmada);
  }

  protected async registrarPago(): Promise<void> {
    const raw = this.pagoForm.getRawValue();
    if (this.pagoIncompleto()) {
      return;
    }
    const ok = await this.facade.registrarPago({
      aportante: raw.fechaPago ? raw.aportante : null,
      monto: raw.monto!,
      fechaPago: raw.fechaPago || null,
      fechaCompromisoPago: raw.fechaCompromisoPago || null,
      numeroOperacion: raw.numeroOperacion || null,
      canalPago: raw.canalPago || null,
      observacion: raw.observacion || null
    });
    if (ok) {
      this.pagoForm.patchValue({ aportante: null, fechaPago: '', fechaCompromisoPago: '', numeroOperacion: '', observacion: '' });
    }
  }

  protected async cerrarPeriodo(): Promise<void> {
    const raw = this.cierreForm.getRawValue();
    await this.facade.cerrarPeriodo({
      estado: raw.estado,
      crearSiguientePeriodo: raw.crearSiguientePeriodo,
      observacion: raw.observacion || null
    });
  }

  protected pagoIncompleto(): boolean {
    const raw = this.pagoForm.getRawValue();
    return !raw.monto || (!raw.fechaPago && !raw.fechaCompromisoPago) || Boolean(raw.fechaPago && !raw.aportante);
  }
}
