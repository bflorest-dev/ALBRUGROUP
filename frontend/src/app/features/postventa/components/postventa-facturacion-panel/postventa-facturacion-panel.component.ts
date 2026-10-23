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
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { AportantePago, CondicionPagoPostventa } from '../../services/postventa-lead.service';
import { EstadoBadge, SelectOption, display, estadoBadge } from '../../models/postventa.vm';

type ModoRegistroPago = 'PAGO' | 'COMPROMISO' | null;

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
    TagModule
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

  protected readonly condicionPagoOptions: SelectOption<CondicionPagoPostventa>[] = [
    { label: 'Normal', value: 'NORMAL' },
    { label: 'Reintegro', value: 'REINTEGRO' },
    { label: 'Cashback Ventas', value: 'CASHBACK_ASESOR_VENTAS' },
    { label: 'Cashback Postventa', value: 'CASHBACK_POSTVENTA' }
  ];

  protected readonly facturaForm = this.fb.group({
    fechaEmisionConfirmada: [''],
    fechaVencimientoConfirmado: [''],
    montoFacturado: [null as number | null]
  });

  protected readonly pagoForm = this.fb.group({
    modoRegistro: [null as ModoRegistroPago],
    aportante: [null as AportantePago | null],
    condicion: ['NORMAL' as CondicionPagoPostventa],
    monto: [null as number | null, [Validators.min(0.01)]],
    fechaPago: [''],
    fechaCompromisoPago: [''],
    numeroOperacion: ['']
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
        montoFacturado: monto
      });
      const cashback = this.resolverCashbackPreventa(periodo.numeroPeriodo);
      if (cashback) {
        this.pagoForm.reset({
          modoRegistro: 'PAGO' as ModoRegistroPago,
          aportante: 'EMPRESA' as AportantePago,
          condicion: 'CASHBACK_ASESOR_VENTAS' as CondicionPagoPostventa,
          monto: cashback.monto ?? null,
          fechaPago: '',
          fechaCompromisoPago: '',
          numeroOperacion: ''
        });
      } else {
        this.pagoForm.reset({
          modoRegistro: null,
          aportante: null,
          condicion: 'NORMAL',
          monto: null,
          fechaPago: '',
          fechaCompromisoPago: '',
          numeroOperacion: ''
        });
      }
      this.actualizarEstadoAportante();
      this.actualizarEstadoMonto();
    });
    this.facade.registerBeforeTipificarTask('facturacion', () => this.guardarPendientesAntesDeTipificar());
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

  private async guardarFactura(): Promise<boolean> {
    const raw = this.facturaForm.getRawValue();
    if (raw.fechaEmisionConfirmada && raw.fechaVencimientoConfirmado && raw.fechaVencimientoConfirmado < raw.fechaEmisionConfirmada) {
      return false;
    }
    const ok = await this.facade.confirmarFactura({
      fechaEmisionConfirmada: raw.fechaEmisionConfirmada || null,
      fechaVencimientoConfirmado: raw.fechaVencimientoConfirmado || null,
      montoFacturado: raw.montoFacturado,
      observacion: null
    });
    if (ok) {
      this.facturaForm.markAsPristine();
    }
    return ok;
  }

  protected get vencimientoInvalido(): boolean {
    const raw = this.facturaForm.getRawValue();
    return Boolean(raw.fechaEmisionConfirmada && raw.fechaVencimientoConfirmado && raw.fechaVencimientoConfirmado < raw.fechaEmisionConfirmada);
  }

  private async registrarPago(): Promise<boolean> {
    const raw = this.pagoForm.getRawValue();
    if (this.pagoIncompleto()) {
      return false;
    }
    const esPago = raw.modoRegistro === 'PAGO';
    const aportante = esPago ? this.resolverAportantePago() : null;
    const montoValue = this.pagoForm.controls.monto.value;
    const ok = await this.facade.registrarPago({
      aportante,
      condicion: esPago ? raw.condicion : null,
      monto: montoValue,
      fechaPago: esPago ? raw.fechaPago || null : null,
      fechaCompromisoPago: esPago ? null : raw.fechaCompromisoPago || null,
      numeroOperacion: esPago && aportante === 'EMPRESA' ? raw.numeroOperacion || null : null,
      observacion: null
    });
    if (ok) {
      this.pagoForm.patchValue({
        modoRegistro: null,
        aportante: null,
        condicion: 'NORMAL',
        fechaPago: '',
        fechaCompromisoPago: '',
        numeroOperacion: ''
      });
      this.pagoForm.controls.monto.setValue(null);
      this.pagoForm.markAsPristine();
      this.actualizarEstadoMonto();
    }
    return ok;
  }

  protected pagoIncompleto(): boolean {
    const raw = this.pagoForm.getRawValue();
    if (!raw.modoRegistro) {
      return true;
    }
    if (raw.modoRegistro === 'COMPROMISO') {
      return !this.facturaVencida() || !raw.fechaCompromisoPago;
    }
    const aportante = this.resolverAportantePago();
    const montoRequerido = !(raw.condicion === 'NORMAL' && aportante === 'CLIENTE');
    if (montoRequerido && !raw.monto) {
      return true;
    }
    return !raw.fechaPago
      || !aportante
      || (aportante === 'EMPRESA' && !raw.numeroOperacion?.trim());
  }

  protected registrarCompromisoDeshabilitado(): boolean {
    return !this.facturaVencida();
  }

  protected mostrarPago(): boolean {
    return this.pagoForm.controls.modoRegistro.value === 'PAGO';
  }

  protected mostrarCompromiso(): boolean {
    return this.pagoForm.controls.modoRegistro.value === 'COMPROMISO';
  }

  protected mostrarNumeroOperacion(): boolean {
    return this.mostrarPago() && this.resolverAportantePago() === 'EMPRESA';
  }

  protected onModoRegistroChange(modo: ModoRegistroPago): void {
    if (modo === 'COMPROMISO') {
      this.pagoForm.patchValue({
        aportante: null,
        condicion: 'NORMAL',
        monto: null,
        fechaPago: '',
        numeroOperacion: ''
      });
      this.actualizarEstadoAportante();
      this.actualizarEstadoMonto();
      return;
    }
    this.pagoForm.patchValue({ fechaCompromisoPago: '' });
    this.actualizarEstadoAportante();
    this.actualizarEstadoMonto();
  }

  protected onCondicionChange(condicion: CondicionPagoPostventa): void {
    const aportante = this.resolverAportantePorCondicion(condicion);
    this.pagoForm.patchValue({
      aportante,
      numeroOperacion: aportante === 'EMPRESA'
        ? this.pagoForm.controls.numeroOperacion.value
        : ''
    });
    this.actualizarEstadoAportante();
    this.actualizarEstadoMonto();
  }

  protected onAportanteChange(): void {
    this.actualizarEstadoMonto();
  }

  protected facturaVencida(): boolean {
    const periodo = this.facade.selectedPeriodo();
    const vencimiento = periodo?.fechaVencimientoConfirmado ?? periodo?.fechaVencimientoEstimado;
    if (!vencimiento) {
      return false;
    }
    return vencimiento < this.todayIso();
  }

  protected resolverAportantePago(): AportantePago | null {
    const raw = this.pagoForm.getRawValue();
    if (raw.condicion === 'NORMAL') {
      return raw.aportante;
    }
    return this.resolverAportantePorCondicion(raw.condicion);
  }

  private resolverAportantePorCondicion(condicion: CondicionPagoPostventa): AportantePago | null {
    if (condicion !== 'NORMAL') {
      return 'EMPRESA';
    }
    return this.pagoForm.controls.aportante.value;
  }

  private actualizarEstadoAportante(): void {
    const control = this.pagoForm.controls.aportante;
    const debeBloquearse = this.mostrarPago() && this.pagoForm.controls.condicion.value !== 'NORMAL';
    if (debeBloquearse && control.enabled) {
      control.disable({ emitEvent: false });
      return;
    }
    if (!debeBloquearse && control.disabled) {
      control.enable({ emitEvent: false });
    }
  }

  private actualizarEstadoMonto(): void {
    const condicion = this.pagoForm.controls.condicion.value;
    const aportante = this.resolverAportantePago();
    const montoCtrl = this.pagoForm.controls.monto;

    if (condicion === 'NORMAL' && aportante === 'CLIENTE') {
      montoCtrl.setValue(null, { emitEvent: false });
      montoCtrl.disable({ emitEvent: false });
      return;
    }

    if (condicion === 'NORMAL' && aportante === 'EMPRESA') {
      const periodo = this.facade.selectedPeriodo();
      montoCtrl.setValue(periodo?.montoFacturado ?? null, { emitEvent: false });
      montoCtrl.disable({ emitEvent: false });
      return;
    }

    if (condicion === 'CASHBACK_ASESOR_VENTAS') {
      const periodo = this.facade.selectedPeriodo();
      const cashback = this.resolverCashbackPreventa(periodo?.numeroPeriodo);
      if (cashback) {
        montoCtrl.setValue(cashback.monto, { emitEvent: false });
        montoCtrl.disable({ emitEvent: false });
        return;
      }
    }

    if (montoCtrl.disabled) {
      montoCtrl.enable({ emitEvent: false });
    }
  }

  protected montoOculto(): boolean {
    const condicion = this.pagoForm.controls.condicion.value;
    const aportante = this.resolverAportantePago();
    return condicion === 'NORMAL' && aportante === 'CLIENTE';
  }

  private resolverCashbackPreventa(numeroPeriodo: number | null | undefined): { monto: number | null } | null {
    if (numeroPeriodo == null) return null;
    const promo = this.facade.promoPreventa();
    if (!promo?.cashbackPeriodos?.length) return null;
    const match = promo.cashbackPeriodos.find(cb => cb.numeroPeriodo === numeroPeriodo);
    return match ? { monto: match.monto ?? null } : null;
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private async guardarPendientesAntesDeTipificar(): Promise<boolean> {
    if (this.facturaForm.dirty) {
      const okFactura = await this.guardarFactura();
      if (!okFactura) {
        return false;
      }
    }
    if (this.pagoTieneDatos()) {
      return this.registrarPago();
    }
    return true;
  }

  private pagoTieneDatos(): boolean {
    const raw = this.pagoForm.getRawValue();
    return Boolean(
      raw.modoRegistro
      && (raw.fechaPago
        || raw.fechaCompromisoPago
        || raw.numeroOperacion
        || raw.aportante
        || raw.condicion !== 'NORMAL')
    );
  }
}
