import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize, timeout } from 'rxjs/operators';
import { ApiErrorResponse } from '../../../shared/models/api/api-error-response';
import { CatalogoTipificacionResponse } from '../../../shared/models/recruitment/catalogo-tipificacion-response';
import { EventoResponse } from '../../../shared/models/recruitment/evento-response';
import { GrupoCapacitacionResponse } from '../../../shared/models/recruitment/grupo-capacitacion-response';
import { PostulacionResponse } from '../../../shared/models/recruitment/postulacion-response';
import { RegistrarContactoPostulacionRequest } from '../../../shared/models/recruitment/registrar-contacto-postulacion-request';
import { SubtipificacionResponse } from '../../../shared/models/recruitment/subtipificacion-response';
import { TipificarPostulacionRequest } from '../../../shared/models/recruitment/tipificar-postulacion-request';
import { EmpleadoRolResponse } from '../../../shared/models/rrhh/empleado-rol-response';
import { RecruiterPostulantesService } from '../services/recruiter-postulantes.service';

export type RecruiterOperationalDrawer = 'none' | 'detail';
export type RecruiterOperationalActionState = 'idle' | 'loading' | 'success' | 'error';
export type ContactChannel = 'LLAMADA' | 'WHATSAPP';

export type OperationalSummary = {
  total: number;
  postulante: number;
  sinContacto: number;
  enGestion: number;
  noInteresado: number;
  rechazado: number;
};

const EMPTY_SUMMARY: OperationalSummary = {
  total: 0,
  postulante: 0,
  sinContacto: 0,
  enGestion: 0,
  noInteresado: 0,
  rechazado: 0
};

const EMPTY_CATALOG: CatalogoTipificacionResponse = {
  etapa: 'RECLUTAMIENTO',
  tipificaciones: []
};

@Injectable()
export class RecruiterOperationalInboxFacade {
  private readonly service = inject(RecruiterPostulantesService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly requestTimeoutMs = 15000;
  private readonly statuses = ['POSTULANTE', 'SIN_CONTACTO', 'EN_GESTION', 'NO_INTERESADO', 'RECHAZADO'];

  readonly typifyForm = this.formBuilder.nonNullable.group({
    idTipificacion: [0, [Validators.required, Validators.min(1)]],
    idSubtipificacion: [0, [Validators.required, Validators.min(1)]],
    idGrupoCapacitacion: [0],
    modalidadContacto: [''],
    fechaHoraGestion: [''],
    observacion: ['']
  });

  readonly rows = signal<PostulacionResponse[]>([]);
  readonly responsibleEmployees = signal<Record<number, EmpleadoRolResponse>>({});
  readonly selectedPostulacion = signal<PostulacionResponse | null>(null);
  readonly eventos = signal<EventoResponse[]>([]);
  readonly catalogo = signal<CatalogoTipificacionResponse>(EMPTY_CATALOG);
  readonly groups = signal<GrupoCapacitacionResponse[]>([]);
  readonly drawer = signal<RecruiterOperationalDrawer>('none');
  readonly listLoading = signal(false);
  readonly listError = signal('');
  readonly catalogLoading = signal(false);
  readonly catalogError = signal('');
  readonly eventsLoading = signal(false);
  readonly eventsError = signal('');
  readonly actionState = signal<RecruiterOperationalActionState>('idle');
  readonly actionMessage = signal('');
  readonly actionError = signal('');
  readonly contactChannel = signal<ContactChannel | null>(null);
  readonly summary = signal<OperationalSummary>(EMPTY_SUMMARY);
  private readonly trainingGroupAssignmentRequired = signal(false);
  readonly summaryLoading = signal(false);
  readonly searchTerm = signal('');
  readonly estadoFilter = signal('');
  readonly tipificacionFilter = signal(0);
  readonly lastSync = signal(new Date());

  readonly tipificaciones = computed(() => this.catalogo().tipificaciones);
  readonly filteredRows = computed(() => {
    const term = this.normalize(this.searchTerm());
    if (!term) return this.rows();

    return this.rows().filter((row) => this.normalize([
      row.postulante.nombres,
      row.postulante.apellidos,
      row.postulante.documento,
      row.postulante.celular,
      row.postulante.numeroExclusivoLlamadas ?? '',
      row.puestoObjetivo,
      row.negocio ?? '',
      row.estadoBandeja,
      row.ofertaLaboral?.codigo ?? ''
    ].join(' ')).includes(term));
  });

  constructor() {
    this.typifyForm.valueChanges.subscribe(() => this.refreshTrainingGroupAssignmentRequirement());
  }

  initialize(): void {
    this.loadCatalogs();
    this.load();
  }

  load(): void {
    this.listLoading.set(true);
    this.listError.set('');
    this.summaryLoading.set(true);
    const selectedStatus = this.estadoFilter();
    const statuses = selectedStatus ? [selectedStatus] : this.statuses;
    const idTipificacion = this.tipificacionFilter() || undefined;

    forkJoin(statuses.map((status) => this.service.listarBandejaReclutamiento(status, 0, 100, idTipificacion)))
      .pipe(
        timeout(this.requestTimeoutMs),
        finalize(() => {
          this.listLoading.set(false);
          this.summaryLoading.set(false);
        })
      )
      .subscribe({
        next: (pages) => {
          const rowsById = new Map<number, PostulacionResponse>();
          const summary = { ...EMPTY_SUMMARY };

          pages.forEach((page) => {
            summary.total += page.totalElements;
            page.content.forEach((row) => rowsById.set(row.id, row));
            page.content.forEach((row) => {
              const key: keyof Omit<OperationalSummary, 'total'> = row.estadoBandeja === 'POSTULANTE'
                ? 'postulante'
                : row.estadoBandeja === 'SIN_CONTACTO'
                  ? 'sinContacto'
                  : row.estadoBandeja === 'EN_GESTION'
                    ? 'enGestion'
                    : row.estadoBandeja === 'NO_INTERESADO'
                      ? 'noInteresado'
                      : 'rechazado';
              summary[key] += 1;
            });
          });

          const rows = [...rowsById.values()].sort((left, right) =>
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
          );
          this.rows.set(rows);
          this.loadResponsibleEmployees(rows);
          this.summary.set(summary);
          this.lastSync.set(new Date());
        },
        error: (error: HttpErrorResponse) => {
          this.rows.set([]);
          this.summary.set(EMPTY_SUMMARY);
          this.listError.set(this.errorMessage(error, 'No fue posible cargar la bandeja operativa.'));
        }
      });
  }

  refresh(): void {
    this.load();
    this.loadCatalogs(true);
  }

  handleRealtime(): void {
    this.load();
    const selected = this.selectedPostulacion();
    if (selected) this.loadEvents(selected.id);
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setEstadoFilter(value: string): void {
    this.estadoFilter.set(value);
    this.load();
  }

  setTipificacionFilter(value: string): void {
    this.tipificacionFilter.set(Number(value) || 0);
    this.load();
  }

  openDetail(postulacion: PostulacionResponse): void {
    this.selectedPostulacion.set(postulacion);
    this.drawer.set('detail');
    this.actionState.set('idle');
    this.actionMessage.set('');
    this.actionError.set('');
    this.contactChannel.set(null);
    this.resetTypifyForm();
    this.loadCatalogs();
    this.loadEvents(postulacion.id);
  }

  closeDrawer(): void {
    this.drawer.set('none');
    this.selectedPostulacion.set(null);
    this.eventos.set([]);
    this.eventsError.set('');
    this.actionState.set('idle');
    this.actionMessage.set('');
    this.actionError.set('');
    this.contactChannel.set(null);
  }

  contact(channel: ContactChannel): void {
    const selected = this.selectedPostulacion();
    if (!selected || this.actionState() === 'loading') return;

    const request: RegistrarContactoPostulacionRequest = {
      modalidadContacto: channel,
      observacion: channel === 'WHATSAPP' ? 'Contacto iniciado por WhatsApp.' : 'Contacto iniciado por llamada.'
    };
    this.actionState.set('loading');
    this.contactChannel.set(channel);
    this.actionMessage.set('Registrando contacto…');
    this.actionError.set('');

    this.service.registrarContacto(selected.id, request).pipe(timeout(this.requestTimeoutMs)).subscribe({
      next: () => {
        this.actionState.set('success');
        this.actionMessage.set(channel === 'WHATSAPP' ? 'WhatsApp registrado' : 'Llamada registrada');
        this.loadEvents(selected.id);
        this.load();
        this.openExternalContact(selected, channel);
      },
      error: (error: HttpErrorResponse) => this.failAction(error, 'No fue posible registrar el contacto.')
    });
  }

  submitTypification(): void {
    const selected = this.selectedPostulacion();
    if (!selected || this.actionState() === 'loading') return;

    this.typifyForm.markAllAsTouched();
    if (this.typifyForm.invalid) return;

    const raw = this.typifyForm.getRawValue();
    if (raw.modalidadContacto && !raw.fechaHoraGestion) {
      this.actionError.set('Indica la fecha y hora de gestión para el contacto.');
      return;
    }
    if (this.requiresTrainingGroupAssignment() && Number(raw.idGrupoCapacitacion) <= 0) {
      this.actionError.set('Selecciona un grupo de capacitación abierto para avanzar.');
      return;
    }

    const payload: TipificarPostulacionRequest = {
      idTipificacion: Number(raw.idTipificacion),
      idSubtipificacion: Number(raw.idSubtipificacion),
      idGrupoCapacitacion: this.requiresTrainingGroupAssignment() ? Number(raw.idGrupoCapacitacion) : null,
      modalidadContacto: raw.modalidadContacto || null,
      fechaHoraGestion: raw.fechaHoraGestion || null,
      observacion: raw.observacion.trim() || null
    };
    this.actionState.set('loading');
    this.actionMessage.set('Procesando tipificación…');
    this.actionError.set('');
    this.service.tipificarPostulacion(selected.id, payload).pipe(timeout(this.requestTimeoutMs)).subscribe({
      next: (updated) => {
        this.selectedPostulacion.set(updated);
        this.actionState.set('success');
        this.actionMessage.set('Tipificación guardada');
        this.resetTypifyForm();
        this.loadEvents(updated.id);
        this.load();
      },
      error: (error: HttpErrorResponse) => this.failAction(error, 'No fue posible guardar la tipificación.')
    });
  }

  getSubtipificaciones(idTipificacion: number): SubtipificacionResponse[] {
    return this.tipificaciones().find((item) => item.id === idTipificacion)?.subtipificaciones ?? [];
  }

  resetSubtipificacion(): void {
    this.typifyForm.controls.idSubtipificacion.setValue(0);
    this.typifyForm.controls.idGrupoCapacitacion.setValue(0);
    this.actionError.set('');
  }

  requiresTrainingGroupAssignment(): boolean {
    return this.trainingGroupAssignmentRequired();
  }

  label(value: string | null | undefined): string {
    if (!value) return 'Pendiente';
    const labels: Record<string, string> = {
      POSTULANTE: 'Por revisar',
      SIN_CONTACTO: 'Sin contacto',
      EN_GESTION: 'En gestión',
      NO_INTERESADO: 'No interesado',
      RECHAZADO: 'Rechazado',
      RECLUTAMIENTO: 'Postulación',
      CAPACITACION: 'Capacitación',
      CONTRATACION: 'Contratación',
      WHATSAPP: 'WhatsApp',
      LLAMADA: 'Llamada'
    };
    return labels[value] ?? value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  recruiterName(row: PostulacionResponse): string {
    const id = row.ultimaGestionResponsableId;
    if (!id) return 'Sin gestión registrada';
    const employee = this.responsibleEmployees()[id];
    return employee ? `${employee.nombres} ${employee.apellidos}`.trim() : `Empleado #${id}`;
  }

  recruiterInitials(row: PostulacionResponse): string {
    const id = row.ultimaGestionResponsableId;
    const employee = id ? this.responsibleEmployees()[id] : null;
    if (!employee) return id ? 'E' : '—';
    return `${employee.nombres.charAt(0)}${employee.apellidos.charAt(0)}`.toUpperCase();
  }

  date(value: string | null | undefined): string {
    if (!value) return 'Pendiente';
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? (() => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); })()
      : new Date(value);
    return parsed.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  dateTime(value: string | null | undefined): string {
    if (!value) return 'Sin fecha';
    return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  eventIcon(action: string | null | undefined): string {
    if (action === 'CONTACTO') return 'ti ti-phone-call';
    if (action === 'TIPIFICACION') return 'ti ti-tags';
    if (action === 'ASIGNACION_GRUPO_CAPACITACION') return 'ti ti-users-group';
    if (action === 'ASIGNACION_OFERTA_LABORAL') return 'ti ti-briefcase';
    if (action === 'ACTUALIZACION_POSTULACION') return 'ti ti-pencil';
    return 'ti ti-activity';
  }

  contactButtonLabel(channel: ContactChannel): string {
    if (this.actionState() === 'loading' && this.contactChannel() === channel) return 'Procesando…';
    if (this.actionState() === 'success' && this.contactChannel() === channel) return 'Listo';
    return channel === 'WHATSAPP' ? 'Abrir WhatsApp' : 'Llamar';
  }

  private loadEvents(idPostulacion: number): void {
    this.eventsLoading.set(true);
    this.eventsError.set('');
    this.service.listarEventos(idPostulacion).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.eventsLoading.set(false))
    ).subscribe({
      next: (page) => this.eventos.set(page.content),
      error: (error: HttpErrorResponse) => {
        this.eventos.set([]);
        this.eventsError.set(this.errorMessage(error, 'No fue posible cargar la trazabilidad.'));
      }
    });
  }

  private loadResponsibleEmployees(rows: PostulacionResponse[]): void {
    const ids = [...new Set(rows
      .map(row => row.ultimaGestionResponsableId)
      .filter((id): id is number => id != null && Number.isInteger(id) && id > 0))];

    if (!ids.length) {
      this.responsibleEmployees.set({});
      return;
    }

    this.service.listarEmpleadosLight(ids).pipe(timeout(this.requestTimeoutMs)).subscribe({
      next: employees => {
        const directory = employees.reduce<Record<number, EmpleadoRolResponse>>((accumulator, employee) => {
          accumulator[employee.idEmpleado] = employee;
          return accumulator;
        }, {});
        this.responsibleEmployees.set(directory);
      },
      error: () => this.responsibleEmployees.set({})
    });
  }

  private loadCatalogs(force = false): void {
    if (!force && (this.catalogo().tipificaciones.length || this.groups().length)) return;
    this.catalogLoading.set(true);
    this.catalogError.set('');
    forkJoin({
      catalogo: this.service.obtenerCatalogoReclutamiento(),
      groups: this.service.listarGruposCapacitacionAbiertos()
    }).pipe(
      timeout(this.requestTimeoutMs),
      finalize(() => this.catalogLoading.set(false))
    ).subscribe({
      next: (catalogs) => {
        this.catalogo.set(catalogs.catalogo);
        this.groups.set(catalogs.groups.content);
      },
      error: (error: HttpErrorResponse) => this.catalogError.set(this.errorMessage(error, 'No fue posible cargar los catálogos operativos.'))
    });
  }

  private completeAction(updated: PostulacionResponse, message: string): void {
    this.selectedPostulacion.set(updated);
    this.actionState.set('success');
    this.actionMessage.set(message);
    this.loadEvents(updated.id);
    this.load();
  }

  private failAction(error: HttpErrorResponse, fallback: string): void {
    this.actionState.set('error');
    this.actionMessage.set('');
    this.actionError.set(this.errorMessage(error, fallback));
  }

  private resetTypifyForm(): void {
    this.typifyForm.reset({
      idTipificacion: 0,
      idSubtipificacion: 0,
      idGrupoCapacitacion: 0,
      modalidadContacto: '',
      fechaHoraGestion: '',
      observacion: ''
    });
  }

  private refreshTrainingGroupAssignmentRequirement(): void {
    const raw = this.typifyForm.getRawValue();
    const requiresAssignment = this.getSubtipificaciones(Number(raw.idTipificacion))
      .some((item) => item.id === Number(raw.idSubtipificacion) &&
        (item.etapaDestino === 'CAPACITACION' || item.codigo === 'APTO_PARA_CAPACITACION'));
    this.trainingGroupAssignmentRequired.set(requiresAssignment);
  }

  private openExternalContact(postulacion: PostulacionResponse, channel: ContactChannel): void {
    const number = (postulacion.postulante.numeroExclusivoLlamadas || postulacion.postulante.celular).replace(/\D/g, '');
    if (!number) return;
    const normalized = number.length === 9 ? `51${number}` : number;
    const url = channel === 'WHATSAPP' ? `https://wa.me/${normalized}` : `tel:${number}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private normalize(value: string): string {
    return value.toLocaleLowerCase('es-PE').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private errorMessage(error: HttpErrorResponse, fallback: string): string {
    const apiError = error.error as ApiErrorResponse | null;
    if (apiError?.details?.length) return `${apiError.message}: ${apiError.details.join(', ')}`;
    return apiError?.message ?? fallback;
  }
}
