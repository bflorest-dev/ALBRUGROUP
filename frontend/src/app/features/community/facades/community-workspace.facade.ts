import { Injectable, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AdicionalResponse,
  CampanaResponse,
  CommunityLeadService,
  CuentaPublicitariaResponse,
  PlanResponse,
  PromocionComercialResponse,
  ProveedorResponse,
  ServiciosProveedorResponse,
  ZonaResponse
} from '../services/community-lead.service';

export type CommunitySection = 'proveedores' | 'cuentas' | 'campanas' | 'planes' | 'promociones' | 'zonas';

@Injectable()
export class CommunityWorkspaceFacade {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly leadService = inject(CommunityLeadService);

  readonly section = signal<CommunitySection>('proveedores');
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly proveedores = signal<ProveedorResponse[]>([]);
  readonly proveedoresActivos = computed(() => this.proveedores().filter((proveedor) => proveedor.activo !== false));
  readonly cuentas = signal<CuentaPublicitariaResponse[]>([]);
  readonly cuentasActivas = signal<CuentaPublicitariaResponse[]>([]);
  readonly campanas = signal<CampanaResponse[]>([]);
  readonly adicionales = signal<AdicionalResponse[]>([]);
  readonly planes = signal<PlanResponse[]>([]);
  readonly promociones = signal<PromocionComercialResponse[]>([]);
  readonly zonas = signal<ZonaResponse[]>([]);
  readonly zonasActivas = computed(() => this.zonas().filter((zona) => zona.activo !== false));
  readonly serviciosProveedor = signal<ServiciosProveedorResponse | null>(null);

  readonly providerForm = this.fb.group({
    nombre: ['', [Validators.required]],
    cortesFacturacion: ['1,15'],
    mesesPermanencia: [6, [Validators.required, Validators.min(1)]]
  });

  readonly accountForm = this.fb.group({
    numeroCuenta: ['', [Validators.required]],
    nombreCuenta: ['', [Validators.required]]
  });

  readonly campaignForm = this.fb.group({
    nombre: ['', [Validators.required]],
    numeroWhatsappEmpresa: ['', [Validators.required]],
    idCuentaPublicitaria: [0, [Validators.required, Validators.min(1)]],
    idProveedor: [0, [Validators.required, Validators.min(1)]]
  });

  readonly campaignWhatsappForm = this.fb.group({
    idCampana: [0, [Validators.required, Validators.min(1)]],
    numeroWhatsappEmpresa: ['', [Validators.required]]
  });

  readonly additionalForm = this.fb.group({
    idProveedor: [0, [Validators.required, Validators.min(1)]],
    nombre: ['', [Validators.required]],
    precioUnitario: [0, [Validators.required, Validators.min(0.01)]]
  });

  readonly planForm = this.fb.group({
    idPlan: [0],
    idProveedor: [0, [Validators.required, Validators.min(1)]],
    nombre: ['', [Validators.required]],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    precioPromocional: [0],
    mesesPromocionPrecio: [0],
    vigenciaDesde: [''],
    vigenciaHasta: [''],
    internetVelocidad: [0],
    internetUnidad: ['MBPS'],
    internetTecnologia: ['FTTH'],
    televisionNombre: [''],
    televisionCanales: [0],
    telefonoMinutos: [0],
    telefonoDescripcion: [''],
    velocidadPromocional: [0],
    mesesPromocionVelocidad: [0],
    idZona: [0],
    adicionales: ['']
  });

  readonly providerServicesForm = this.fb.group({
    idProveedor: [0, [Validators.required, Validators.min(1)]]
  });

  readonly promotionForm = this.fb.group({
    reglaComercial: ['', [Validators.required]],
    idProveedor: [0, [Validators.required, Validators.min(1)]],
    idZona: [0],
    idsPlanes: ['', [Validators.required]]
  });

  readonly promotionFiltersForm = this.fb.group({
    idProveedor: [0],
    idZona: [0],
    idPlan: [0]
  });

  readonly zoneForm = this.fb.group({
    idZona: [0],
    nombre: ['', [Validators.required]],
    reglas: ['DISTRITO,1,INCLUIR']
  });

  async initialize(): Promise<void> {
    await this.loadAll();
  }

  setSection(section: CommunitySection): void {
    this.section.set(section);
    this.clearMessages();
  }

  async loadAll(): Promise<void> {
    this.isLoading.set(true);
    this.clearMessages();
    try {
      const [proveedores, cuentas, cuentasActivas, campanas, adicionales, planes, promociones, zonas] = await Promise.all([
        firstValueFrom(this.leadService.listarProveedores()),
        firstValueFrom(this.leadService.listarCuentas()),
        firstValueFrom(this.leadService.listarCuentasActivas()),
        firstValueFrom(this.leadService.listarCampanas()),
        firstValueFrom(this.leadService.listarAdicionales()),
        firstValueFrom(this.leadService.listarPlanes()),
        firstValueFrom(this.leadService.listarPromociones({})),
        firstValueFrom(this.leadService.listarZonas())
      ]);

      this.proveedores.set(proveedores);
      this.cuentas.set(cuentas);
      this.cuentasActivas.set(cuentasActivas);
      this.campanas.set(campanas);
      this.adicionales.set(adicionales);
      this.planes.set(planes);
      this.promociones.set(promociones);
      this.zonas.set(zonas);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar la informacion de COMMUNITY.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async submitProvider(): Promise<void> {
    if (this.providerForm.invalid) {
      this.errorMessage.set('Completa los datos del proveedor.');
      return;
    }

    await this.saveAction(
      () => this.leadService.registrarProveedor({
        ...this.providerForm.getRawValue(),
        cortesFacturacion: this.parseNumberList(this.providerForm.controls.cortesFacturacion.value)
      }),
      'Proveedor registrado.',
      () => this.refreshProviders()
    );
  }

  async toggleProvider(idProveedor: number): Promise<void> {
    await this.saveAction(() => this.leadService.alternarProveedor(idProveedor), 'Estado del proveedor actualizado.', () =>
      this.refreshProviders()
    );
  }

  async submitAccount(): Promise<void> {
    if (this.accountForm.invalid) {
      this.errorMessage.set('Completa los datos de la cuenta publicitaria.');
      return;
    }

    await this.saveAction(() => this.leadService.registrarCuenta(this.accountForm.getRawValue()), 'Cuenta registrada.', () =>
      this.refreshAccounts()
    );
  }

  async deactivateAccount(idCuenta: number): Promise<void> {
    await this.saveAction(() => this.leadService.desactivarCuenta(idCuenta), 'Cuenta desactivada.', () => this.refreshAccounts());
  }

  async submitCampaign(): Promise<void> {
    if (this.campaignForm.invalid) {
      this.errorMessage.set('Completa los datos de la campana.');
      return;
    }

    await this.saveAction(() => this.leadService.registrarCampana(this.campaignForm.getRawValue()), 'Campana registrada.', () =>
      this.refreshCampaigns()
    );
  }

  async updateCampaignWhatsapp(): Promise<void> {
    if (this.campaignWhatsappForm.invalid) {
      this.errorMessage.set('Indica la campana y el nuevo WhatsApp.');
      return;
    }

    const raw = this.campaignWhatsappForm.getRawValue();
    await this.saveAction(
      () => this.leadService.actualizarWhatsappCampana(raw.idCampana, raw.numeroWhatsappEmpresa),
      'WhatsApp de campana actualizado.',
      () => this.refreshCampaigns()
    );
  }

  async deactivateCampaign(idCampana: number): Promise<void> {
    await this.saveAction(() => this.leadService.desactivarCampana(idCampana), 'Campana desactivada.', () =>
      this.refreshCampaigns()
    );
  }

  async submitAdditional(): Promise<void> {
    if (this.additionalForm.invalid) {
      this.errorMessage.set('Completa los datos del adicional.');
      return;
    }

    await this.saveAction(() => this.leadService.registrarAdicional(this.additionalForm.getRawValue()), 'Adicional registrado.', () =>
      this.refreshPlansData()
    );
  }

  async submitPlan(): Promise<void> {
    if (this.planForm.invalid) {
      this.errorMessage.set('Completa los datos obligatorios del plan.');
      return;
    }

    await this.saveAction(() => this.leadService.registrarPlan(this.buildPlanRequest()), 'Plan registrado.', () =>
      this.refreshPlansData()
    );
  }

  async updatePlan(): Promise<void> {
    const raw = this.planForm.getRawValue();
    if (!raw.idPlan || this.planForm.controls.nombre.invalid || this.planForm.controls.precio.invalid) {
      this.errorMessage.set('Indica el ID del plan, nombre y precio para actualizar.');
      return;
    }

    await this.saveAction(() => this.leadService.actualizarPlan(raw.idPlan, this.buildPlanUpdateRequest()), 'Plan actualizado.', () =>
      this.refreshPlansData()
    );
  }

  async deactivatePlan(idPlan: number): Promise<void> {
    await this.saveAction(() => this.leadService.desactivarPlan(idPlan), 'Plan desactivado.', () => this.refreshPlansData());
  }

  async loadProviderServices(): Promise<void> {
    if (this.providerServicesForm.invalid) {
      this.errorMessage.set('Indica un proveedor para consultar servicios.');
      return;
    }

    this.clearMessages();
    try {
      const servicios = await firstValueFrom(
        this.leadService.listarServiciosProveedor(this.providerServicesForm.controls.idProveedor.value)
      );
      this.serviciosProveedor.set(servicios);
      this.successMessage.set('Servicios del proveedor cargados.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron cargar los servicios del proveedor.'));
    }
  }

  async submitPromotion(): Promise<void> {
    if (this.promotionForm.invalid) {
      this.errorMessage.set('Completa los datos de la promocion.');
      return;
    }

    const raw = this.promotionForm.getRawValue();
    await this.saveAction(
      () =>
        this.leadService.registrarPromocion({
          reglaComercial: raw.reglaComercial,
          idProveedor: raw.idProveedor,
          idZona: raw.idZona || null,
          idsPlanes: this.parseNumberList(raw.idsPlanes)
        }),
      'Promocion registrada.',
      () => this.refreshPromotions()
    );
  }

  async filterPromotions(): Promise<void> {
    const raw = this.promotionFiltersForm.getRawValue();
    this.clearMessages();
    try {
      const promociones = await firstValueFrom(
        this.leadService.listarPromociones({
          idProveedor: raw.idProveedor || undefined,
          idZona: raw.idZona || undefined,
          idPlan: raw.idPlan || undefined
        })
      );
      this.promociones.set(promociones);
      this.successMessage.set('Promociones actualizadas con los filtros.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron filtrar promociones.'));
    }
  }

  async deactivatePromotion(idPromocion: number): Promise<void> {
    await this.saveAction(() => this.leadService.desactivarPromocion(idPromocion), 'Promocion desactivada.', () =>
      this.refreshPromotions()
    );
  }

  async submitZone(): Promise<void> {
    if (this.zoneForm.controls.nombre.invalid) {
      this.errorMessage.set('Indica el nombre de la zona.');
      return;
    }

    await this.saveAction(() => this.leadService.registrarZona(this.buildZoneRequest()), 'Zona registrada.', () =>
      this.refreshZones()
    );
  }

  async updateZone(): Promise<void> {
    const idZona = this.zoneForm.controls.idZona.value;
    if (!idZona || this.zoneForm.controls.nombre.invalid) {
      this.errorMessage.set('Indica el ID y nombre de zona para actualizar.');
      return;
    }

    await this.saveAction(() => this.leadService.actualizarZona(idZona, this.buildZoneRequest()), 'Zona actualizada.', () =>
      this.refreshZones()
    );
  }

  async toggleZone(idZona: number): Promise<void> {
    await this.saveAction(() => this.leadService.alternarZona(idZona), 'Estado de zona actualizado.', () => this.refreshZones());
  }

  private async refreshProviders(): Promise<void> {
    this.proveedores.set(await firstValueFrom(this.leadService.listarProveedores()));
  }

  private async refreshAccounts(): Promise<void> {
    const [cuentas, cuentasActivas] = await Promise.all([
      firstValueFrom(this.leadService.listarCuentas()),
      firstValueFrom(this.leadService.listarCuentasActivas())
    ]);
    this.cuentas.set(cuentas);
    this.cuentasActivas.set(cuentasActivas);
  }

  private async refreshCampaigns(): Promise<void> {
    this.campanas.set(await firstValueFrom(this.leadService.listarCampanas()));
  }

  private async refreshPlansData(): Promise<void> {
    const [adicionales, planes] = await Promise.all([
      firstValueFrom(this.leadService.listarAdicionales()),
      firstValueFrom(this.leadService.listarPlanes())
    ]);
    this.adicionales.set(adicionales);
    this.planes.set(planes);
  }

  private async refreshPromotions(): Promise<void> {
    this.promociones.set(await firstValueFrom(this.leadService.listarPromociones({})));
  }

  private async refreshZones(): Promise<void> {
    this.zonas.set(await firstValueFrom(this.leadService.listarZonas()));
  }

  private buildPlanRequest(): Record<string, unknown> {
    const raw = this.planForm.getRawValue();

    return this.cleanObject({
      idProveedor: raw.idProveedor,
      nombre: raw.nombre,
      precio: raw.precio,
      precioPromocional: raw.precioPromocional || null,
      mesesPromocionPrecio: raw.mesesPromocionPrecio || null,
      vigenciaDesde: raw.vigenciaDesde || null,
      vigenciaHasta: raw.vigenciaHasta || null,
      internet: raw.internetVelocidad
        ? {
            velocidad: raw.internetVelocidad,
            unidad: raw.internetUnidad,
            tecnologia: raw.internetTecnologia
          }
        : null,
      television: raw.televisionNombre
        ? {
            nombre: raw.televisionNombre,
            cantidadCanales: raw.televisionCanales || 0
          }
        : null,
      telefono: raw.telefonoDescripcion
        ? {
            minutos: raw.telefonoMinutos || 0,
            descripcion: raw.telefonoDescripcion
          }
        : null,
      velocidadPromocional: raw.velocidadPromocional || null,
      mesesPromocionVelocidad: raw.mesesPromocionVelocidad || null,
      idZona: raw.idZona || null,
      adicionales: this.parsePlanAdditionals(raw.adicionales)
    });
  }

  private buildPlanUpdateRequest(): Record<string, unknown> {
    const raw = this.planForm.getRawValue();

    return this.cleanObject({
      nombre: raw.nombre,
      precio: raw.precio,
      precioPromocional: raw.precioPromocional || null,
      mesesPromocionPrecio: raw.mesesPromocionPrecio || null,
      vigenciaDesde: raw.vigenciaDesde || null,
      vigenciaHasta: raw.vigenciaHasta || null,
      velocidadPromocional: raw.velocidadPromocional || null,
      mesesPromocionVelocidad: raw.mesesPromocionVelocidad || null,
      idZona: raw.idZona || null
    });
  }

  private buildZoneRequest(): Record<string, unknown> {
    const raw = this.zoneForm.getRawValue();
    return {
      nombre: raw.nombre,
      reglas: raw.reglas
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [nivelGeografico, geoId, criterio] = line.split(',').map((part) => part.trim());
          return {
            nivelGeografico,
            geoId: Number(geoId),
            criterio
          };
        })
    };
  }

  private parsePlanAdditionals(value: string): unknown[] | null {
    const additionals = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [idAdicional, cantidadIncluida = '1', permiteCompraAdicional = 'true', cantidadMaximaAdicional = '0'] = item.split(':');
        return {
          idAdicional: Number(idAdicional),
          cantidadIncluida: Number(cantidadIncluida),
          permiteCompraAdicional: permiteCompraAdicional.toLowerCase() === 'true',
          cantidadMaximaAdicional: Number(cantidadMaximaAdicional) || null
        };
      });

    return additionals.length ? additionals : null;
  }

  private parseNumberList(value: string): number[] {
    return value
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((valueNumber) => Number.isFinite(valueNumber) && valueNumber > 0);
  }

  private cleanObject<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)) as T;
  }

  private async saveAction<T>(
    action: () => import('rxjs').Observable<T>,
    successMessage: string,
    afterSuccess?: () => Promise<void>
  ): Promise<void> {
    this.isSaving.set(true);
    this.clearMessages();
    try {
      await firstValueFrom(action());
      if (afterSuccess) {
        await afterSuccess();
      }
      this.successMessage.set(successMessage);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo completar la operacion.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }

    return fallback;
  }
}
