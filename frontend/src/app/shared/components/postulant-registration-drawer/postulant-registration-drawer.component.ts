import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AltaMetaPostulacionRequest } from '../../models/recruitment/alta-meta-postulacion-request';
import { OfertaLaboralResponse } from '../../models/recruitment/oferta-laboral-response';
import { PostulacionRequest } from '../../models/recruitment/postulacion-request';
import { RecruitmentNegocio } from '../../../core/services/current-user-recruitment-negocio-scope.service';

export type RegistrationDrawerActionState = 'idle' | 'loading' | 'success' | 'error';
export type RegistrationDrawerMode = 'full' | 'meta';

const MAX_PERSON_NAME_LENGTH = 120;
const MAX_META_USERNAME_LENGTH = 80;
const PERSON_NAME_PATTERN = /^\p{L}+(?: \p{L}+)*$/u;
const META_USERNAME_PATTERN = /^@*[A-Za-z0-9._-]+$/;

function personNameValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return !value || PERSON_NAME_PATTERN.test(value) ? null : { personName: true };
}

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  return !value || /^9\d{8}$/.test(value) ? null : { phone: true };
}

function metaUsernameValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  return !value || META_USERNAME_PATTERN.test(value) ? null : { metaUsername: true };
}

function notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) || parsed > today ? { futureDate: true } : null;
}

@Component({
  selector: 'app-postulant-registration-drawer',
  imports: [ReactiveFormsModule],
  templateUrl: './postulant-registration-drawer.component.html',
  styleUrl: './postulant-registration-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostulantRegistrationDrawerComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);

  @Input() visible = false;
  @Input() offers: OfertaLaboralResponse[] = [];
  @Input() fixedNegocio: RecruitmentNegocio | null = null;
  @Input() defaultNegocio: RecruitmentNegocio = 'WIN';
  @Input() catalogLoading = false;
  @Input() catalogError = '';
  @Input() actionState: RegistrationDrawerActionState = 'idle';
  @Input() actionError = '';

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly registerFull = new EventEmitter<PostulacionRequest>();
  @Output() readonly registerMeta = new EventEmitter<AltaMetaPostulacionRequest>();
  @Output() readonly businessChanged = new EventEmitter<RecruitmentNegocio>();

  protected readonly registrationMode = signal<RegistrationDrawerMode>('full');
  protected readonly puestoObjetivoOptions = [
    { value: 'ASESOR_VENTAS', label: 'Asesor de ventas' }
  ] as const;
  protected readonly negocios = [
    { value: 'WIN' as RecruitmentNegocio, label: 'WIN' },
    { value: 'CLARO' as RecruitmentNegocio, label: 'Claro' }
  ] as const;
  protected readonly fullOriginOptions = [
    { value: 'COMPUTRABAJO', label: 'Computrabajo' },
    { value: 'INDEED', label: 'Indeed' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'LINKEDIN', label: 'LinkedIn' },
    { value: 'REFERIDO', label: 'Referido' }
  ] as const;
  protected readonly metaOriginOptions = [
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'INDEED', label: 'Indeed' },
    { value: 'REFERIDO', label: 'Referido' }
  ] as const;
  protected readonly modalidadOptions = [
    { value: '', label: 'Pendiente de definir' },
    { value: 'PART_TIME', label: 'Part time' },
    { value: 'FULL_TIME', label: 'Full time' },
    { value: 'SEMI_FULL', label: 'Semi full' },
    { value: 'SUPER_FULL', label: 'Super full' }
  ] as const;
  protected readonly horarioOptions = [
    { value: '', label: 'Pendiente de definir' },
    { value: 'MORNING', label: 'Mañana' },
    { value: 'AFTERNOON', label: 'Tarde' },
    { value: 'NIGHT', label: 'Noche' }
  ] as const;

  protected readonly form = this.formBuilder.nonNullable.group({
    nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(MAX_PERSON_NAME_LENGTH), personNameValidator]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(MAX_PERSON_NAME_LENGTH), personNameValidator]],
    tipoDocumento: ['DNI', Validators.required],
    documento: ['', [Validators.required, Validators.maxLength(12), (control: AbstractControl) => this.documentValidator(control)]],
    celular: ['', [Validators.required, phoneValidator]],
    numeroExclusivoLlamadas: ['', phoneValidator],
    usuarioMeta: ['', [Validators.maxLength(MAX_META_USERNAME_LENGTH), metaUsernameValidator]],
    fechaNacimiento: ['', [Validators.required, notFutureDateValidator]],
    origen: ['COMPUTRABAJO', Validators.required],
    puestoObjetivo: ['ASESOR_VENTAS', Validators.required],
    negocio: [this.defaultNegocio],
    modalidad: [''],
    horario: [''],
    fechaPostulacion: [this.today(), [Validators.required, notFutureDateValidator]],
    idOfertaLaboral: [0]
  });

  protected readonly metaForm = this.formBuilder.nonNullable.group({
    usuarioMeta: ['', [Validators.required, Validators.maxLength(MAX_META_USERNAME_LENGTH), metaUsernameValidator]],
    origen: ['FACEBOOK', Validators.required],
    puestoObjetivo: ['ASESOR_VENTAS', Validators.required],
    negocio: [this.defaultNegocio, Validators.required],
    fechaPostulacion: [this.today(), [Validators.required, notFutureDateValidator]],
    idOfertaLaboral: [0]
  });

  ngOnChanges(changes: SimpleChanges): void {
    const opened = changes['visible']?.currentValue === true
      && changes['visible']?.previousValue !== true;
    if (opened) this.resetForms();

    if (changes['fixedNegocio'] || changes['defaultNegocio']) {
      this.syncBusiness();
    }
  }

  protected selectMode(mode: RegistrationDrawerMode): void {
    if (this.registrationMode() === mode || this.actionState === 'loading') return;
    this.registrationMode.set(mode);
    if (mode === 'meta') this.resetMetaForm();
    else this.resetFullForm();
  }

  protected submit(): void {
    if (this.actionState === 'loading') return;
    if (this.registrationMode() === 'meta') {
      this.submitMetaRegistration();
      return;
    }

    this.form.markAllAsTouched();
    this.applyDocumentValidation();
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    this.registerFull.emit({
      idOfertaLaboral: value.idOfertaLaboral > 0 ? value.idOfertaLaboral : null,
      origen: value.origen,
      puestoObjetivo: value.puestoObjetivo,
      negocio: value.negocio || null,
      modalidad: value.modalidad || null,
      horario: value.horario || null,
      fechaPostulacion: value.fechaPostulacion,
      postulante: {
        nombres: this.normalizePersonName(value.nombres),
        apellidos: this.normalizePersonName(value.apellidos),
        tipoDocumento: value.tipoDocumento,
        documento: value.documento.trim(),
        celular: value.celular.trim(),
        numeroExclusivoLlamadas: value.numeroExclusivoLlamadas.trim() || null,
        usuarioMeta: value.usuarioMeta.trim() || null,
        fechaNacimiento: value.fechaNacimiento
      }
    });
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  protected isMetaInvalid(controlName: keyof typeof this.metaForm.controls): boolean {
    const control = this.metaForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected errorMessage(controlName: keyof typeof this.form.controls): string {
    const errors = this.form.controls[controlName].errors ?? {};
    if (errors['required']) return 'Completa este campo.';
    if (errors['personName']) return 'Usa solo letras y espacios.';
    if (errors['minlength']) return 'Ingresa al menos 2 caracteres.';
    if (errors['maxlength']) return `Usa hasta ${MAX_PERSON_NAME_LENGTH} caracteres.`;
    if (errors['document']) return this.documentErrorMessage();
    if (errors['phone']) return 'Usa 9 dígitos y comienza en 9.';
    if (errors['futureDate']) return 'La fecha no puede ser posterior a hoy.';
    return 'Revisa el valor ingresado.';
  }

  protected metaErrorMessage(controlName: keyof typeof this.metaForm.controls): string {
    const errors = this.metaForm.controls[controlName].errors ?? {};
    if (errors['required']) return 'Completa este campo.';
    if (errors['metaUsername']) return 'Usa solo letras, números, puntos, guiones o guion bajo.';
    if (errors['maxlength']) return `Usa hasta ${MAX_META_USERNAME_LENGTH} caracteres.`;
    if (errors['futureDate']) return 'La fecha no puede ser posterior a hoy.';
    return 'Revisa el valor ingresado.';
  }

  protected documentErrorMessage(): string {
    return this.form.controls.tipoDocumento.value === 'DNI'
      ? 'El DNI debe tener exactamente 8 dígitos.'
      : 'El CE debe tener entre 6 y 12 dígitos.';
  }

  protected documentMaxLength(): number {
    return this.form.controls.tipoDocumento.value === 'DNI' ? 8 : 12;
  }

  protected documentPlaceholder(): string {
    return this.form.controls.tipoDocumento.value === 'DNI' ? '8 dígitos' : '6 a 12 dígitos';
  }

  protected documentTypeLabel(value: string | null | undefined): string {
    return value === 'CE' ? 'CE' : 'DNI';
  }

  protected optionLabel(
    options: ReadonlyArray<{ readonly value: string; readonly label: string }>,
    value: string | null | undefined
  ): string {
    return options.find(option => option.value === value)?.label ?? 'Selecciona una opción';
  }

  protected offerLabel(value: number | null | undefined): string {
    if (!value) return 'Sin asociar por ahora';
    const offer = this.offers.find(item => item.id === value);
    return offer ? `${offer.codigo} · ${offer.puestoObjetivo}` : 'Oferta no disponible';
  }

  protected selectOption(control: AbstractControl, value: unknown, menu: HTMLDetailsElement): void {
    control.setValue(value);
    control.markAsDirty();
    control.markAsTouched();
    control.updateValueAndValidity({ emitEvent: false });
    menu.open = false;
  }

  protected onDocumentTypeChange(): void {
    const control = this.form.controls.documento;
    control.setValue(this.normalizeDigits(control.value, this.documentMaxLength()), { emitEvent: false });
    this.applyDocumentValidation();
  }

  protected onPersonNameInput(controlName: 'nombres' | 'apellidos', input: HTMLInputElement): void {
    const normalized = this.normalizePersonNameInput(input.value);
    if (input.value !== normalized) input.value = normalized;
    this.form.controls[controlName].setValue(normalized, { emitEvent: false });
    this.form.controls[controlName].updateValueAndValidity({ emitEvent: false });
  }

  protected onPersonNameBlur(controlName: 'nombres' | 'apellidos'): void {
    const control = this.form.controls[controlName];
    control.setValue(this.normalizePersonName(control.value), { emitEvent: false });
    control.updateValueAndValidity({ emitEvent: false });
  }

  protected onDigitsInput(controlName: 'documento' | 'celular' | 'numeroExclusivoLlamadas', input: HTMLInputElement): void {
    const maxLength = controlName === 'documento' ? this.documentMaxLength() : 9;
    const normalized = this.normalizeDigits(input.value, maxLength);
    if (input.value !== normalized) input.value = normalized;
    this.form.controls[controlName].setValue(normalized, { emitEvent: false });
    this.form.controls[controlName].updateValueAndValidity({ emitEvent: false });
  }

  protected onMetaUsernameInput(input: HTMLInputElement): void {
    const normalized = this.normalizeMetaUsername(input.value);
    if (input.value !== normalized) input.value = normalized;
    this.metaForm.controls.usuarioMeta.setValue(normalized, { emitEvent: false });
    this.metaForm.controls.usuarioMeta.updateValueAndValidity({ emitEvent: false });
  }

  protected saveLabel(): string {
    if (this.actionState === 'loading') return 'Procesando…';
    return this.registrationMode() === 'meta' ? 'Crear alta Meta' : 'Registrar postulante';
  }

  protected businessLabel(value: string | null | undefined): string {
    return value === 'CLARO' ? 'Claro' : 'WIN';
  }

  protected close(): void {
    if (this.actionState !== 'loading') this.closed.emit();
  }

  protected onBusinessChange(value: string): void {
    if (value !== 'WIN' && value !== 'CLARO') return;
    const negocio = value as RecruitmentNegocio;
    this.form.controls.negocio.setValue(negocio);
    this.metaForm.controls.negocio.setValue(negocio);
    this.businessChanged.emit(negocio);
  }

  private submitMetaRegistration(): void {
    this.metaForm.markAllAsTouched();
    if (this.metaForm.invalid) return;

    const value = this.metaForm.getRawValue();
    this.registerMeta.emit({
      usuarioMeta: value.usuarioMeta.trim(),
      origen: value.origen,
      puestoObjetivo: value.puestoObjetivo,
      negocio: this.currentBusiness(),
      fechaPostulacion: value.fechaPostulacion,
      idOfertaLaboral: value.idOfertaLaboral > 0 ? value.idOfertaLaboral : null
    });
  }

  private documentValidator(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value ?? '');
    if (!value) return null;
    if (!/^\d+$/.test(value)) return { document: true };
    return this.form?.controls?.tipoDocumento?.value === 'DNI'
      ? (value.length === 8 ? null : { document: true })
      : (value.length >= 6 && value.length <= 12 ? null : { document: true });
  }

  private applyDocumentValidation(): void {
    this.form.controls.documento.updateValueAndValidity({ emitEvent: false });
  }

  private normalizePersonNameInput(value: string): string {
    return String(value ?? '')
      .replace(/[^\p{L}\s]/gu, '')
      .replace(/\s+/gu, ' ')
      .replace(/^\s+/u, '')
      .slice(0, MAX_PERSON_NAME_LENGTH);
  }

  private normalizePersonName(value: string): string {
    return this.normalizePersonNameInput(value).trim();
  }

  private normalizeDigits(value: string, maxLength: number): string {
    return String(value ?? '').replace(/\D/g, '').slice(0, maxLength);
  }

  private normalizeMetaUsername(value: string): string {
    return String(value ?? '')
      .replace(/^@+/u, '')
      .replace(/\s+/gu, '')
      .replace(/[^A-Za-z0-9._-]/g, '')
      .slice(0, MAX_META_USERNAME_LENGTH);
  }

  private resetForms(): void {
    this.registrationMode.set('full');
    this.resetFullForm();
    this.resetMetaForm();
  }

  private resetFullForm(): void {
    this.form.reset({
      nombres: '',
      apellidos: '',
      tipoDocumento: 'DNI',
      documento: '',
      celular: '',
      numeroExclusivoLlamadas: '',
      usuarioMeta: '',
      fechaNacimiento: '',
      origen: 'COMPUTRABAJO',
      puestoObjetivo: 'ASESOR_VENTAS',
      negocio: this.currentBusiness(),
      modalidad: '',
      horario: '',
      fechaPostulacion: this.today(),
      idOfertaLaboral: 0
    });
  }

  private resetMetaForm(): void {
    this.metaForm.reset({
      usuarioMeta: '',
      origen: 'FACEBOOK',
      puestoObjetivo: 'ASESOR_VENTAS',
      negocio: this.currentBusiness(),
      fechaPostulacion: this.today(),
      idOfertaLaboral: 0
    });
  }

  private syncBusiness(): void {
    const negocio = this.currentBusiness();
    this.form.controls.negocio.setValue(negocio);
    this.metaForm.controls.negocio.setValue(negocio);
  }

  private currentBusiness(): RecruitmentNegocio {
    if (this.fixedNegocio) return this.fixedNegocio;
    return this.form.controls.negocio.value === 'CLARO' || this.metaForm.controls.negocio.value === 'CLARO'
      ? 'CLARO'
      : this.defaultNegocio;
  }

  protected today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
