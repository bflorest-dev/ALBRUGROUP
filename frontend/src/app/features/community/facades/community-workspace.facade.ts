import { Injectable, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AdicionalResponse,
  CampanaResponse,
  CommunityLeadService,
  CriterioZona,
  CuentaPublicitariaResponse,
  NivelGeografico,
  PlanResponse,
  PromocionComercialResponse,
  ProveedorResponse,
  ServiciosProveedorResponse,
  UbigeoItem,
  ZonaReglaResponse,
  ZonaResponse
} from '../services/community-lead.service';

export type CommunitySection = 'proveedores' | 'cuentas' | 'campanas' | 'zonas' | 'planes' | 'promociones';

type ZoneDialogMode = 'create' | 'edit';
type ZoneRuleDraft = ZonaReglaResponse & { label: string };
type PlanAdditionalDraft = {
  idAdicional: number;
  nombre: string;
  cantidadIncluida: number;
  permiteCompraAdicional: boolean;
  cantidadMaximaAdicional: number;
};

@Injectable()
export class CommunityWorkspaceFacade {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly leadService = inject(CommunityLeadService);
  private readonly ubigeoLabels = new Map<string, string>();
  private ubigeoDirectoryLoaded = false;

  readonly section = signal<CommunitySection>('proveedores');
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isLoadingUbigeo = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly proveedores = signal<ProveedorResponse[]>([]);
  readonly proveedoresActivos = computed(() => this.proveedores().filter((proveedor) => proveedor.activo !== false));
  readonly cuentas = signal<CuentaPublicitariaResponse[]>([]);
  readonly cuentasActivas = signal<CuentaPublicitariaResponse[]>([]);
  readonly campanas = signal<CampanaResponse[]>([]);
  readonly campanasActivas = computed(() => this.campanas().filter((campana) => campana.activo !== false));
  readonly adicionales = signal<AdicionalResponse[]>([]);
  readonly adicionalesActivos = computed(() => this.adicionales().filter((adicional) => adicional.activo !== false));
  readonly planes = signal<PlanResponse[]>([]);
  readonly planesActivos = computed(() => this.planes().filter((plan) => plan.activo !== false));
  readonly promociones = signal<PromocionComercialResponse[]>([]);
  readonly promocionesActivas = computed(() => this.promociones().filter((promocion) => promocion.activo !== false));
  readonly zonas = signal<ZonaResponse[]>([]);
  readonly zonasActivas = computed(() => this.zonas().filter((zona) => zona.activo !== false));
  readonly serviciosProveedor = signal<ServiciosProveedorResponse | null>(null);

  readonly billingDayOptions = Array.from({ length: 31 }, (_, index) => index + 1);
  readonly selectedBillingCuts = signal<number[]>([1, 15]);
  readonly selectedCampaign = signal<CampanaResponse | null>(null);
  readonly whatsappDialogOpen = signal(false);

  readonly zoneDialogOpen = signal(false);
  readonly zoneDialogMode = signal<ZoneDialogMode>('create');
  readonly activeZoneId = signal<number | null>(null);
  readonly zoneRules = signal<ZoneRuleDraft[]>([]);
  readonly selectedZoneCriterion = signal<CriterioZona>('INCLUIR');
  readonly levelOptions: NivelGeografico[] = ['DEPARTAMENTO', 'PROVINCIA', 'DISTRITO'];
  readonly departamentos = signal<UbigeoItem[]>([]);
  readonly provincias = signal<UbigeoItem[]>([]);
  readonly distritos = signal<UbigeoItem[]>([]);
  readonly additionalDialogOpen = signal(false);
  readonly createPlanDialogOpen = signal(false);
  readonly editPlanDialogOpen = signal(false);
  readonly activePlanId = signal<number | null>(null);
  readonly selectedPlanProviderId = signal(0);
  readonly selectedPlanAdditionals = signal<PlanAdditionalDraft[]>([]);
  readonly availablePlanAdditionals = computed(() => {
    const idProveedor = this.selectedPlanProviderId();
    return this.adicionalesActivos().filter((adicional) => adicional.idProveedor === idProveedor);
  });
  readonly planNamePlaceholder = computed(() => this.planes()[0]?.nombre ?? 'Plan Fibra 200');
  readonly additionalNamePlaceholder = computed(() => this.adicionales()[0]?.nombre ?? 'Mesh WiFi');

  readonly providerForm = this.fb.group({
    nombre: ['', [Validators.required]],
    mesesPermanencia: [6, [Validators.required, Validators.min(1)]]
  });

  readonly billingCutForm = this.fb.group({
    day: [1, [Validators.required, Validators.min(1), Validators.max(31)]]
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
    numeroWhatsappEmpresa: ['', [Validators.required]]
  });

  readonly additionalForm = this.fb.group({
    idProveedor: [0, [Validators.required, Validators.min(1)]],
    nombre: ['', [Validators.required]],
    precioUnitario: [0, [Validators.required, Validators.min(0.01)]]
  });

  readonly createPlanForm = this.fb.group({
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
    idZona: [0]
  });

  readonly editPlanForm = this.fb.group({
    nombre: ['', [Validators.required]],
    precio: [0, [Validators.required, Validators.min(0.01)]],
    precioPromocional: [0],
    mesesPromocionPrecio: [0],
    vigenciaDesde: [''],
    vigenciaHasta: [''],
    velocidadPromocional: [0],
    mesesPromocionVelocidad: [0],
    idZona: [0]
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
    nombre: ['', [Validators.required]]
  });

  readonly zoneRuleForm = this.fb.group({
    nivelGeografico: ['DEPARTAMENTO' as NivelGeografico, [Validators.required]],
    idDepartamento: [0],
    idProvincia: [0],
    geoId: [0, [Validators.required, Validators.min(1)]]
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
      const proveedores = await firstValueFrom(this.leadService.listarProveedores());
      this.proveedores.set(proveedores);

      const results = await Promise.allSettled([
        this.loadList('cuentas', () => firstValueFrom(this.leadService.listarCuentas())),
        this.loadList('cuentas activas', () => firstValueFrom(this.leadService.listarCuentasActivas())),
        this.loadList('campanas', () => firstValueFrom(this.leadService.listarCampanas())),
        this.loadList('adicionales', () => this.loadAdditionalsByProviders(proveedores)),
        this.loadList('planes', () => firstValueFrom(this.leadService.listarPlanes())),
        this.loadList('promociones', () => firstValueFrom(this.leadService.listarPromociones({}))),
        this.loadList('zonas', () => firstValueFrom(this.leadService.listarZonas()))
      ]);

      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason)
        .filter(Boolean);

      if (failed.length) {
        this.errorMessage.set(`Algunos catalogos no cargaron: ${failed.join(', ')}.`);
      }
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar la informacion de COMMUNITY.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  addBillingCut(): void {
    const day = this.billingCutForm.controls.day.value;
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      this.errorMessage.set('Selecciona un dia valido entre 1 y 31.');
      return;
    }

    this.selectedBillingCuts.update((cuts) => [...new Set([...cuts, day])].sort((a, b) => a - b));
    this.clearMessages();
  }

  removeBillingCut(day: number): void {
    this.selectedBillingCuts.update((cuts) => cuts.filter((cut) => cut !== day));
  }

  async submitProvider(): Promise<void> {
    if (this.providerForm.invalid || !this.selectedBillingCuts().length) {
      this.errorMessage.set('Completa los datos del proveedor y agrega al menos un corte.');
      return;
    }

    await this.saveAction(
      () =>
        this.leadService.registrarProveedor({
          ...this.providerForm.getRawValue(),
          cortesFacturacion: this.selectedBillingCuts()
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
      this.errorMessage.set('Completa los datos de la campaña.');
      return;
    }

    await this.saveAction(() => this.leadService.registrarCampana(this.campaignForm.getRawValue()), 'Campaña registrada.', () =>
      this.refreshCampaigns()
    );
  }

  openWhatsappDialog(campana: CampanaResponse): void {
    this.selectedCampaign.set(campana);
    this.campaignWhatsappForm.reset({ numeroWhatsappEmpresa: campana.numeroWhatsappEmpresa ?? '' });
    this.whatsappDialogOpen.set(true);
    this.clearMessages();
  }

  closeWhatsappDialog(): void {
    this.whatsappDialogOpen.set(false);
    this.selectedCampaign.set(null);
  }

  async saveCampaignWhatsapp(): Promise<void> {
    const campana = this.selectedCampaign();
    if (!campana || this.campaignWhatsappForm.invalid) {
      this.errorMessage.set('Indica la campaña y el nuevo WhatsApp.');
      return;
    }

    const raw = this.campaignWhatsappForm.getRawValue();
    await this.saveAction(
      () => this.leadService.actualizarWhatsappCampana(campana.id, raw.numeroWhatsappEmpresa),
      'WhatsApp de campaña actualizado.',
      async () => {
        await this.refreshCampaigns();
        this.closeWhatsappDialog();
      }
    );
  }

  async toggleCampaign(idCampana: number): Promise<void> {
    await this.saveAction(() => this.leadService.alternarCampana(idCampana), 'Estado de campaña actualizado.', () =>
      this.refreshCampaigns()
    );
  }

  async submitAdditional(): Promise<void> {
    if (this.additionalForm.invalid) {
      this.errorMessage.set('Completa los datos del adicional.');
      return;
    }

    await this.saveAction(() => this.leadService.registrarAdicional(this.additionalForm.getRawValue()), 'Adicional registrado.', async () => {
      await this.refreshPlansData();
      this.closeAdditionalDialog();
    });
  }

  openAdditionalDialog(): void {
    this.additionalForm.reset({ idProveedor: 0, nombre: '', precioUnitario: 0 });
    this.additionalDialogOpen.set(true);
    this.clearMessages();
  }

  closeAdditionalDialog(): void {
    this.additionalDialogOpen.set(false);
  }

  openCreatePlanDialog(): void {
    this.createPlanForm.reset({
      idProveedor: 0,
      nombre: '',
      precio: 0,
      precioPromocional: 0,
      mesesPromocionPrecio: 0,
      vigenciaDesde: '',
      vigenciaHasta: '',
      internetVelocidad: 0,
      internetUnidad: 'MBPS',
      internetTecnologia: 'FTTH',
      televisionNombre: '',
      televisionCanales: 0,
      telefonoMinutos: 0,
      telefonoDescripcion: '',
      velocidadPromocional: 0,
      mesesPromocionVelocidad: 0,
      idZona: 0
    });
    this.selectedPlanProviderId.set(0);
    this.selectedPlanAdditionals.set([]);
    this.createPlanDialogOpen.set(true);
    this.clearMessages();
  }

  closeCreatePlanDialog(): void {
    this.createPlanDialogOpen.set(false);
    this.selectedPlanProviderId.set(0);
    this.selectedPlanAdditionals.set([]);
  }

  openEditPlanDialog(plan: PlanResponse): void {
    this.activePlanId.set(plan.id);
    this.editPlanForm.reset({
      nombre: plan.nombre ?? '',
      precio: plan.precio ?? 0,
      precioPromocional: plan.precioPromocional ?? 0,
      mesesPromocionPrecio: plan.mesesPromocionPrecio ?? 0,
      vigenciaDesde: this.toDateInputValue(plan.vigenciaDesde),
      vigenciaHasta: this.toDateInputValue(plan.vigenciaHasta),
      velocidadPromocional: plan.velocidadPromocional ?? 0,
      mesesPromocionVelocidad: plan.mesesPromocionVelocidad ?? 0,
      idZona: plan.idZona ?? 0
    });
    this.editPlanDialogOpen.set(true);
    this.clearMessages();
  }

  closeEditPlanDialog(): void {
    this.editPlanDialogOpen.set(false);
    this.activePlanId.set(null);
  }

  onCreatePlanProviderChanged(): void {
    this.selectedPlanProviderId.set(this.createPlanForm.controls.idProveedor.value);
    this.selectedPlanAdditionals.set([]);
  }

  addPlanAdditional(idAdicional: number): void {
    if (!idAdicional) {
      return;
    }

    if (this.selectedPlanAdditionals().some((adicional) => adicional.idAdicional === idAdicional)) {
      this.errorMessage.set('Este adicional ya fue agregado al plan.');
      return;
    }

    const adicional = this.availablePlanAdditionals().find((item) => item.id === idAdicional);
    if (!adicional) {
      this.errorMessage.set('Selecciona un adicional disponible para el proveedor.');
      return;
    }

    this.selectedPlanAdditionals.update((items) => [
      ...items,
      {
        idAdicional,
        nombre: adicional.nombre ?? `Adicional ${idAdicional}`,
        cantidadIncluida: 1,
        permiteCompraAdicional: true,
        cantidadMaximaAdicional: 0
      }
    ]);
    this.clearMessages();
  }

  removePlanAdditional(idAdicional: number): void {
    this.selectedPlanAdditionals.update((items) => items.filter((item) => item.idAdicional !== idAdicional));
  }

  updatePlanAdditionalQuantity(idAdicional: number, field: 'cantidadIncluida' | 'cantidadMaximaAdicional', value: string): void {
    const numericValue = Math.max(0, Number(value) || 0);
    this.selectedPlanAdditionals.update((items) =>
      items.map((item) => (item.idAdicional === idAdicional ? { ...item, [field]: numericValue } : item))
    );
  }

  updatePlanAdditionalPurchase(idAdicional: number, checked: boolean): void {
    this.selectedPlanAdditionals.update((items) =>
      items.map((item) => (item.idAdicional === idAdicional ? { ...item, permiteCompraAdicional: checked } : item))
    );
  }

  async submitPlan(): Promise<void> {
    if (this.createPlanForm.invalid) {
      this.errorMessage.set('Completa los datos obligatorios del plan.');
      return;
    }

    await this.saveAction(() => this.leadService.registrarPlan(this.buildPlanRequest()), 'Plan registrado.', async () => {
      await this.refreshPlansData();
      this.closeCreatePlanDialog();
    });
  }

  async updatePlan(): Promise<void> {
    const idPlan = this.activePlanId();
    if (!idPlan || this.editPlanForm.invalid) {
      this.errorMessage.set('Indica el plan, nombre y precio para actualizar.');
      return;
    }

    await this.saveAction(() => this.leadService.actualizarPlan(idPlan, this.buildPlanUpdateRequest()), 'Plan actualizado.', async () => {
      await this.refreshPlansData();
      this.closeEditPlanDialog();
    });
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

  async openCreateZone(): Promise<void> {
    this.zoneDialogMode.set('create');
    this.activeZoneId.set(null);
    this.zoneForm.reset({ nombre: '' });
    this.zoneRules.set([]);
    this.resetZoneRuleForm();
    this.zoneDialogOpen.set(true);
    await this.ensureDepartamentosLoaded();
  }

  async openEditZone(zona: ZonaResponse): Promise<void> {
    this.zoneDialogMode.set('edit');
    this.activeZoneId.set(zona.id);
    this.zoneForm.reset({ nombre: zona.nombre ?? '' });
    this.zoneDialogOpen.set(true);
    this.resetZoneRuleForm();
    await this.ensureUbigeoDirectoryLoaded();
    this.zoneRules.set((zona.reglas ?? []).map((regla) => ({ ...regla, label: this.zoneRuleLabel(regla) })));
  }

  closeZoneDialog(): void {
    this.zoneDialogOpen.set(false);
    this.activeZoneId.set(null);
  }

  setZoneCriterion(criterion: CriterioZona): void {
    this.selectedZoneCriterion.set(criterion);
  }

  async onZoneLevelChanged(): Promise<void> {
    this.resetZoneRuleForm(this.zoneRuleForm.controls.nivelGeografico.value);
    await this.ensureDepartamentosLoaded();
  }

  async onZoneDepartmentChanged(): Promise<void> {
    const idDepartamento = this.zoneRuleForm.controls.idDepartamento.value;
    this.zoneRuleForm.patchValue({ idProvincia: 0, geoId: 0 });
    this.distritos.set([]);
    if (this.zoneRuleForm.controls.nivelGeografico.value === 'DEPARTAMENTO') {
      this.zoneRuleForm.patchValue({ geoId: idDepartamento });
      return;
    }
    await this.loadProvincias(idDepartamento);
  }

  async onZoneProvinceChanged(): Promise<void> {
    const idProvincia = this.zoneRuleForm.controls.idProvincia.value;
    this.zoneRuleForm.patchValue({ geoId: 0 });
    if (this.zoneRuleForm.controls.nivelGeografico.value === 'PROVINCIA') {
      this.zoneRuleForm.patchValue({ geoId: idProvincia });
      return;
    }
    await this.loadDistritos(idProvincia);
  }

  addZoneRule(): void {
    const raw = this.zoneRuleForm.getRawValue();
    const nivelGeografico = raw.nivelGeografico;
    const geoId = raw.geoId;

    if (!geoId) {
      this.errorMessage.set('Selecciona una ubicacion para la regla.');
      return;
    }

    const criterio = this.selectedZoneCriterion();
    const exists = this.zoneRules().some(
      (rule) => rule.nivelGeografico === nivelGeografico && rule.geoId === geoId && rule.criterio === criterio
    );
    if (exists) {
      this.errorMessage.set('Esta regla ya fue agregada.');
      return;
    }

    const rule = { nivelGeografico, geoId, criterio };
    this.zoneRules.update((rules) => [...rules, { ...rule, label: this.zoneRuleLabel(rule) }]);
    this.clearMessages();
  }

  removeZoneRule(index: number): void {
    this.zoneRules.update((rules) => rules.filter((_, ruleIndex) => ruleIndex !== index));
  }

  async saveZone(): Promise<void> {
    if (this.zoneForm.invalid || !this.zoneRules().length) {
      this.errorMessage.set('Indica el nombre de la zona y agrega al menos una regla.');
      return;
    }

    const idZona = this.activeZoneId();
    if (this.zoneDialogMode() === 'edit' && idZona) {
      await this.saveAction(() => this.leadService.actualizarZona(idZona, this.buildZoneRequest()), 'Zona actualizada.', async () => {
        await this.refreshZones();
        this.closeZoneDialog();
      });
      return;
    }

    await this.saveAction(() => this.leadService.registrarZona(this.buildZoneRequest()), 'Zona registrada.', async () => {
      await this.refreshZones();
      this.closeZoneDialog();
    });
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
      this.loadAdditionalsByProviders(this.proveedores()),
      firstValueFrom(this.leadService.listarPlanes())
    ]);
    this.adicionales.set(adicionales);
    this.planes.set(planes);
  }

  private async loadAdditionalsByProviders(proveedores: ProveedorResponse[]): Promise<AdicionalResponse[]> {
    if (!proveedores.length) {
      return [];
    }

    const adicionalesPorProveedor = await Promise.all(
      proveedores.map((proveedor) => firstValueFrom(this.leadService.listarAdicionales(proveedor.id)))
    );
    const adicionales = adicionalesPorProveedor.flat();
    return [...new Map(adicionales.map((adicional) => [adicional.id, adicional])).values()];
  }

  private async loadList<T>(label: string, loader: () => Promise<T[]>): Promise<void> {
    try {
      const value = await loader();
      if (label === 'cuentas') this.cuentas.set(value as CuentaPublicitariaResponse[]);
      if (label === 'cuentas activas') this.cuentasActivas.set(value as CuentaPublicitariaResponse[]);
      if (label === 'campanas') this.campanas.set(value as CampanaResponse[]);
      if (label === 'adicionales') this.adicionales.set(value as AdicionalResponse[]);
      if (label === 'planes') this.planes.set(value as PlanResponse[]);
      if (label === 'promociones') this.promociones.set(value as PromocionComercialResponse[]);
      if (label === 'zonas') this.zonas.set(value as ZonaResponse[]);
    } catch {
      throw label;
    }
  }

  private async refreshPromotions(): Promise<void> {
    this.promociones.set(await firstValueFrom(this.leadService.listarPromociones({})));
  }

  private async refreshZones(): Promise<void> {
    this.zonas.set(await firstValueFrom(this.leadService.listarZonas()));
  }

  private async ensureDepartamentosLoaded(): Promise<void> {
    if (this.departamentos().length) {
      return;
    }

    this.isLoadingUbigeo.set(true);
    try {
      const departamentos = await firstValueFrom(this.leadService.listarDepartamentos());
      departamentos.forEach((departamento) => this.cacheUbigeoLabel('DEPARTAMENTO', departamento));
      this.departamentos.set(departamentos);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar ubigeo.'));
    } finally {
      this.isLoadingUbigeo.set(false);
    }
  }

  private async loadProvincias(idDepartamento: number): Promise<void> {
    if (!idDepartamento) {
      this.provincias.set([]);
      return;
    }

    const provincias = await firstValueFrom(this.leadService.listarProvincias(idDepartamento));
    provincias.forEach((provincia) => this.cacheUbigeoLabel('PROVINCIA', provincia));
    this.provincias.set(provincias);
  }

  private async loadDistritos(idProvincia: number): Promise<void> {
    if (!idProvincia) {
      this.distritos.set([]);
      return;
    }

    const distritos = await firstValueFrom(this.leadService.listarDistritos(idProvincia));
    distritos.forEach((distrito) => this.cacheUbigeoLabel('DISTRITO', distrito));
    this.distritos.set(distritos);
  }

  private async ensureUbigeoDirectoryLoaded(): Promise<void> {
    if (this.ubigeoDirectoryLoaded) {
      return;
    }

    this.isLoadingUbigeo.set(true);
    try {
      await this.ensureDepartamentosLoaded();
      for (const departamento of this.departamentos()) {
        const provincias = await firstValueFrom(this.leadService.listarProvincias(departamento.id));
        provincias.forEach((provincia) => this.cacheUbigeoLabel('PROVINCIA', provincia));
        for (const provincia of provincias) {
          const distritos = await firstValueFrom(this.leadService.listarDistritos(provincia.id));
          distritos.forEach((distrito) => this.cacheUbigeoLabel('DISTRITO', distrito));
        }
      }
      this.ubigeoDirectoryLoaded = true;
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudieron resolver los nombres de ubigeo.'));
    } finally {
      this.isLoadingUbigeo.set(false);
    }
  }

  private cacheUbigeoLabel(level: NivelGeografico, item: UbigeoItem): void {
    this.ubigeoLabels.set(`${level}:${item.id}`, item.nombre);
  }

  private resetZoneRuleForm(level: NivelGeografico = 'DEPARTAMENTO'): void {
    this.zoneRuleForm.reset({ nivelGeografico: level, idDepartamento: 0, idProvincia: 0, geoId: 0 });
    this.provincias.set([]);
    this.distritos.set([]);
  }

  private zoneRuleLabel(rule: Pick<ZonaReglaResponse, 'nivelGeografico' | 'geoId'>): string {
    return this.ubigeoLabels.get(`${rule.nivelGeografico}:${rule.geoId}`) ?? `${rule.nivelGeografico} #${rule.geoId}`;
  }

  private buildPlanRequest(): Record<string, unknown> {
    const raw = this.createPlanForm.getRawValue();

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
      adicionales: this.selectedPlanAdditionals().length
        ? this.selectedPlanAdditionals().map((adicional) => ({
            idAdicional: adicional.idAdicional,
            cantidadIncluida: adicional.cantidadIncluida,
            permiteCompraAdicional: adicional.permiteCompraAdicional,
            cantidadMaximaAdicional: adicional.cantidadMaximaAdicional || null
          }))
        : null
    });
  }

  private buildPlanUpdateRequest(): Record<string, unknown> {
    const raw = this.editPlanForm.getRawValue();

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
      reglas: this.zoneRules().map((rule) => ({
        nivelGeografico: rule.nivelGeografico,
        geoId: rule.geoId,
        criterio: rule.criterio
      }))
    };
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

  private toDateInputValue(value: string | undefined): string {
    return value ? value.slice(0, 10) : '';
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

