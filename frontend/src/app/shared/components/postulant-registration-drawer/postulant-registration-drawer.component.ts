import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AltaMetaPostulacionRequest } from '../../models/recruitment/alta-meta-postulacion-request';
import { OfertaLaboralResponse } from '../../models/recruitment/oferta-laboral-response';
import { PostulacionRequest } from '../../models/recruitment/postulacion-request';
import { RecruitmentNegocio } from '../../../core/services/current-user-recruitment-negocio-scope.service';

export type RegistrationDrawerActionState = 'idle' | 'loading' | 'success' | 'error';
export type RegistrationDrawerMode = 'full' | 'meta';

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

  protected readonly form = this.formBuilder.nonNullable.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    tipoDocumento: ['DNI', Validators.required],
    documento: ['', Validators.required],
    celular: ['', Validators.required],
    numeroExclusivoLlamadas: [''],
    usuarioMeta: [''],
    fechaNacimiento: ['', Validators.required],
    origen: ['COMPUTRABAJO', Validators.required],
    puestoObjetivo: ['ASESOR_VENTAS', Validators.required],
    negocio: [this.defaultNegocio],
    modalidad: [''],
    horario: [''],
    fechaPostulacion: [this.today(), Validators.required],
    idOfertaLaboral: [0]
  });

  protected readonly metaForm = this.formBuilder.nonNullable.group({
    usuarioMeta: ['', Validators.required],
    origen: ['FACEBOOK', Validators.required],
    puestoObjetivo: ['ASESOR_VENTAS', Validators.required],
    negocio: [this.defaultNegocio, Validators.required],
    fechaPostulacion: [this.today(), Validators.required],
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
        nombres: value.nombres.trim(),
        apellidos: value.apellidos.trim(),
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

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}
