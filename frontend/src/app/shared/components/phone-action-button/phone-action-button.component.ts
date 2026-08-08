import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { API_CONSTANTS } from '../../../core/constants/api.constants';
import { BrowserSessionService } from '../../../core/services/browser-session.service';
import { NumeroLlamadaResponse } from '../../models/preventa/preventa.models';

@Component({
  selector: 'app-phone-action-button',
  imports: [FormsModule, ButtonModule, InputTextModule, PopoverModule],
  templateUrl: './phone-action-button.component.html',
  styleUrl: './phone-action-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhoneActionButtonComponent implements OnChanges {
  private readonly http = inject(HttpClient);
  private readonly browserSessionService = inject(BrowserSessionService);
  private readonly leadUrl = `${API_CONSTANTS.gatewayBaseUrl}/leads`;

  @Input({ required: true }) idLead: number | null | undefined = null;
  @Input() prefijo: string | null | undefined = null;
  @Input() lead: string | null | undefined = null;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() label = 'Llamar';
  @Input() size: 'small' | 'large' | undefined = 'small';
  @Input() severity: 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast' | undefined = 'secondary';

  @Output() callStarted = new EventEmitter<string>();
  @Output() callError = new EventEmitter<string>();

  readonly isLoadingNumeros = signal(false);
  readonly isSavingNumero = signal(false);
  readonly loadFailed = signal(false);
  readonly numeros = signal<NumeroLlamadaResponse[]>([]);
  readonly selectedNumero = signal<NumeroLlamadaResponse | null>(null);
  readonly editingNumeroParaLlamar = signal(false);
  readonly numeroParaLlamarDraft = signal('');

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idLead']) {
      this.resetState();
      if (this.idLead) {
        void this.loadNumerosLlamada(this.idLead);
      }
    }
  }

  currentNumero(): NumeroLlamadaResponse | null {
    return this.selectedNumero() ?? this.numeros()[0] ?? null;
  }

  canDial(): boolean {
    return !!this.telUrl(this.currentNumero()?.numero ?? this.lead);
  }

  currentLabel(): string {
    return this.currentNumero()?.label ?? this.label;
  }

  hasNumeroParaLlamarOption(): boolean {
    return this.numeros().some((numero) => numero.tipo === 'NUMERO_PARA_LLAMAR');
  }

  canEditNumero(numero: NumeroLlamadaResponse): boolean {
    return numero.tipo === 'NUMERO_PARA_LLAMAR';
  }

  isCurrentNumero(numero: NumeroLlamadaResponse): boolean {
    return this.currentNumero()?.numero === numero.numero;
  }

  openDialer(): void {
    const numero = this.currentNumero()?.numero ?? this.lead ?? null;
    this.openDialerForNumero(numero);
  }

  openDialerWithNumero(numero: NumeroLlamadaResponse): void {
    this.selectedNumero.set(numero);
    this.openDialerForNumero(numero.numero);
  }

  startNumeroParaLlamarEdit(numero: NumeroLlamadaResponse): void {
    if (!this.canEditNumero(numero)) {
      return;
    }
    this.numeroParaLlamarDraft.set(numero.numero);
    this.editingNumeroParaLlamar.set(true);
  }

  startEmptyNumeroParaLlamarEdit(): void {
    this.numeroParaLlamarDraft.set('');
    this.editingNumeroParaLlamar.set(true);
  }

  normalizeNumeroParaLlamarDraft(value: string): void {
    this.numeroParaLlamarDraft.set(this.normalizePhoneInput(value));
  }

  cancelNumeroParaLlamarEdit(): void {
    this.editingNumeroParaLlamar.set(false);
    this.numeroParaLlamarDraft.set('');
  }

  async saveNumeroParaLlamar(): Promise<void> {
    if (!this.idLead) {
      this.callError.emit('Selecciona un lead antes de editar el numero para llamar.');
      return;
    }

    const numeroParaLlamar = this.normalizePhoneInput(this.numeroParaLlamarDraft());
    if (!/^9\d{8}$/.test(numeroParaLlamar)) {
      this.callError.emit('El numero para llamar debe tener 9 digitos y empezar en 9.');
      return;
    }

    this.isSavingNumero.set(true);
    try {
      await firstValueFrom(
        this.http.patch<void>(`${this.leadUrl}/${this.idLead}/numero-para-llamar`, { numeroParaLlamar })
      );
      await this.loadNumerosLlamada(this.idLead, numeroParaLlamar);
      this.editingNumeroParaLlamar.set(false);
      this.numeroParaLlamarDraft.set('');
    } catch (error) {
      this.callError.emit(this.getErrorMessage(error, 'No se pudo actualizar el numero para llamar.'));
    } finally {
      this.isSavingNumero.set(false);
    }
  }

  private openDialerForNumero(numero: string | null): void {
    const url = this.telUrl(numero);
    if (!url) {
      this.callError.emit('El lead no tiene un numero valido para iniciar la llamada.');
      return;
    }
    this.browserSessionService.allowExternalNavigation();
    this.document.defaultView?.location.assign(url);
    this.callStarted.emit(this.normalizePhoneInput(numero));
  }

  private async loadNumerosLlamada(idLead: number, preferNumero?: string): Promise<void> {
    this.isLoadingNumeros.set(true);
    this.loadFailed.set(false);
    try {
      const numeros = await firstValueFrom(
        this.http.get<NumeroLlamadaResponse[]>(`${this.leadUrl}/${idLead}/numeros-llamada`)
      );
      this.numeros.set(numeros);
      this.selectedNumero.set(
        (preferNumero ? numeros.find((numero) => numero.numero === preferNumero) : null) ?? numeros[0] ?? null
      );
    } catch (error) {
      this.numeros.set([]);
      this.selectedNumero.set(null);
      this.loadFailed.set(true);
      this.callError.emit(this.getErrorMessage(error, 'No se pudieron cargar los numeros de llamada.'));
    } finally {
      this.isLoadingNumeros.set(false);
    }
  }

  private resetState(): void {
    this.numeros.set([]);
    this.selectedNumero.set(null);
    this.editingNumeroParaLlamar.set(false);
    this.numeroParaLlamarDraft.set('');
    this.loadFailed.set(false);
    this.isLoadingNumeros.set(false);
    this.isSavingNumero.set(false);
  }

  private telUrl(numero?: string | null): string | null {
    const phone = this.normalizePhoneInput(numero);
    if (!phone) {
      return null;
    }
    const prefix = (this.prefijo ?? '').trim();
    const normalizedPrefix = prefix ? prefix.replace(/\s+/g, '') : '';
    const dialTarget = normalizedPrefix ? `${normalizedPrefix}${phone}` : phone;
    return `tel:${dialTarget}`;
  }

  private normalizePhoneInput(value?: string | null): string {
    return (value ?? '').replace(/\D+/g, '').trim();
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const payload = (error as { error?: { message?: string } | string }).error;
      if (typeof payload === 'object' && payload?.message) {
        return payload.message;
      }
      if (typeof payload === 'string' && payload.trim()) {
        return payload;
      }
    }
    return fallback;
  }
}
