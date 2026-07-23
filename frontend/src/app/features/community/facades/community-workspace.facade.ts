import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, Validators, type FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import {
  AdicionalResponse,
  CampanaGastoCampanaResumenResponse,
  CampanaGastoRegistroEstadoResponse,
  CampanaGastoResponse,
  CampanaGastoResumenDiarioResponse,
  CampanaGastoResumenMensualResponse,
  CampanaResponse,
  CommunityLeadService,
  CriterioZona,
  CredencialPlataformaResponse,
  CuentaPublicitariaResponse,
  NivelGeografico,
  PaquetePlataformaResponse,
  PlanResponse,
  PlataformaDigitalResponse,
  PromocionComercialResponse,
  ProveedorResponse,
  ServiciosProveedorResponse,
  UbigeoItem,
  ZonaReglaResponse,
  ZonaResponse
} from '../services/community-lead.service';
import {
  FinanceMetricCard,
  FinanceRow,
  SnapshotFinanceRow,
  buildFinanceCards,
  financeCurrentDateValue,
  financeCurrentMonthValue,
  financeMonthMonth,
  financeMonthYear,
  formatFinanceDateTime,
  formatFinanceMoney,
  toFinanceRow,
  toSnapshotFinanceRows
} from '../../../shared/utils/campaign-finance.utils';

export type CommunitySection =
  | 'proveedores'
  | 'cuentas'
  | 'campanas'
  | 'zonas'
  | 'planes'
  | 'promociones'
  | 'plataformas-digitales';
export type CommunityPageMode = 'mantenimiento' | 'metricas' | 'finanzas';
export type CommunityAccessMode = 'community' | 'admin';

type ZoneDialogMode = 'create' | 'edit';
type ZoneRuleDraft = ZonaReglaResponse & { label: string };
type PlanAdditionalDraft = {
  idAdicional: number;
  nombre: string;
  cantidadIncluida: number;
  permiteCompraAdicional: boolean;
  cantidadMaximaAdicional: number;
};
type PromotionPlanOption = PlanResponse & { promotionOptionLabel: string };
type PromotionScope = 'proveedor' | 'zona' | 'planes';
type PromotionScopeOption = {
  label: string;
  value: PromotionScope;
  icon: string;
  severity: 'info' | 'success' | 'warn';
};
type PlanCatalogSort = 'provider_name' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
type PlanCatalogComposition =
  | 'ALL'
  | 'SOLO_INTERNET'
  | 'INTERNET_TV'
  | 'INTERNET_TELEFONIA'
  | 'TRIPLE_PACK'
  | 'SOLO_TV'
  | 'SOLO_TELEFONIA'
  | 'TV_TELEFONIA';
type PlanCatalogOption<T> = {
  label: string;
  value: T;
};
type PlanCatalogProviderFilter = ProveedorResponse & {
  planesCount: number;
  adicionalesCount: number;
};

@Injectable()
export class CommunityWorkspaceFacade {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly leadService = inject(CommunityLeadService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ubigeoLabels = new Map<string, string>();
  private ubigeoDirectoryLoaded = false;
  private catalogLoadInFlight = false;
  private expenseRegistrationCheckId = 0;

  readonly currentMode = signal<CommunityPageMode>('mantenimiento');
  readonly accessMode = signal<CommunityAccessMode>('community');
  readonly section = signal<CommunitySection>('proveedores');
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isLoadingUbigeo = signal(false);
  readonly isLoadingFinance = signal(false);
  readonly isLoadingFinanceSnapshots = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly canDisplayOperationalData = computed(() => true);
  readonly canMutateOperationalData = computed(() => true);

  readonly proveedores = signal<ProveedorResponse[]>([]);
  readonly proveedoresActivos = computed(() => this.proveedores().filter((proveedor) => proveedor.activo !== false));
  readonly proveedoresSorted = computed(() =>
    [...this.proveedores()].sort((a, b) => (b.activo !== false ? 1 : 0) - (a.activo !== false ? 1 : 0))
  );
  readonly cuentas = signal<CuentaPublicitariaResponse[]>([]);
  readonly cuentasActivas = signal<CuentaPublicitariaResponse[]>([]);
  readonly cuentasSorted = computed(() =>
    [...this.cuentas()].sort((a, b) => (b.activo !== false ? 1 : 0) - (a.activo !== false ? 1 : 0))
  );
  readonly campanas = signal<CampanaResponse[]>([]);
  readonly mostrarCampanasInactivas = signal(false);
  readonly campanasActivas = computed(() => this.campanas().filter((campana) => campana.activo !== false));
  readonly campanasSorted = computed(() =>
    [...this.campanas()].sort((a, b) => (b.activo !== false ? 1 : 0) - (a.activo !== false ? 1 : 0))
  );
  readonly adicionales = signal<AdicionalResponse[]>([]);
  readonly adicionalesActivos = computed(() => this.adicionales().filter((adicional) => adicional.activo !== false));
  readonly planes = signal<PlanResponse[]>([]);
  readonly planesActivos = computed(() => this.planes().filter((plan) => plan.activo !== false));
  readonly selectedPlanCatalogProviderId = signal(0);
  readonly selectedPlanCatalogSort = signal<PlanCatalogSort>('provider_name');
  readonly selectedPlanCatalogComposition = signal<PlanCatalogComposition>('ALL');
  readonly planCatalogProviderFilters = computed<PlanCatalogProviderFilter[]>(() =>
    this.proveedores()
      .map((proveedor) => ({
        ...proveedor,
        planesCount: this.planes().filter((plan) => plan.idProveedor === proveedor.id).length,
        adicionalesCount: this.adicionales().filter((adicional) => adicional.idProveedor === proveedor.id).length
      }))
      .filter((proveedor) => proveedor.activo !== false || proveedor.planesCount || proveedor.adicionalesCount)
  );
  readonly planCatalogSortOptions: PlanCatalogOption<PlanCatalogSort>[] = [
    { label: 'Proveedor / Nombre', value: 'provider_name' },
    { label: 'Precio menor a mayor', value: 'price_asc' },
    { label: 'Precio mayor a menor', value: 'price_desc' },
    { label: 'Nombre A-Z', value: 'name_asc' },
    { label: 'Nombre Z-A', value: 'name_desc' }
  ];
  readonly planCatalogCompositionOptions: PlanCatalogOption<PlanCatalogComposition>[] = [
    { label: 'Todos los combos', value: 'ALL' },
    { label: 'Solo Internet', value: 'SOLO_INTERNET' },
    { label: 'Internet + TV', value: 'INTERNET_TV' },
    { label: 'Internet + Telefonia', value: 'INTERNET_TELEFONIA' },
    { label: 'Triple pack', value: 'TRIPLE_PACK' },
    { label: 'Solo TV', value: 'SOLO_TV' },
    { label: 'Solo Telefonia', value: 'SOLO_TELEFONIA' },
    { label: 'TV + Telefonia', value: 'TV_TELEFONIA' }
  ];
  readonly filteredPlanes = computed(() => {
    const idProveedor = this.selectedPlanCatalogProviderId();
    const composition = this.selectedPlanCatalogComposition();
    const sort = this.selectedPlanCatalogSort();
    const filtered = (idProveedor ? this.planes().filter((plan) => plan.idProveedor === idProveedor) : this.planes()).filter((plan) =>
      this.matchesPlanCatalogComposition(plan, composition)
    );
    return [...filtered].sort((left, right) => this.comparePlanCatalogItems(left, right, sort));
  });
  readonly filteredAdicionales = computed(() => {
    const idProveedor = this.selectedPlanCatalogProviderId();
    return idProveedor ? this.adicionales().filter((adicional) => adicional.idProveedor === idProveedor) : this.adicionales();
  });
  readonly promociones = signal<PromocionComercialResponse[]>([]);
  readonly promocionesActivas = computed(() => this.promociones().filter((promocion) => promocion.activo !== false));
  readonly zonas = signal<ZonaResponse[]>([]);
  readonly zonasActivas = computed(() => this.zonas().filter((zona) => zona.activo !== false));
  readonly plataformasDigitales = signal<PlataformaDigitalResponse[]>([]);
  readonly plataformasDigitalesActivas = computed(() =>
    this.plataformasDigitales().filter((plataforma) => plataforma.activo !== false)
  );
  readonly paquetesPlataforma = signal<PaquetePlataformaResponse[]>([]);
  readonly credencialesPlataforma = signal<CredencialPlataformaResponse[]>([]);
  readonly selectedDigitalPlatformId = signal(0);
  readonly selectedCredentialPackageId = signal(0);
  readonly serviciosProveedor = signal<ServiciosProveedorResponse | null>(null);
  readonly dailyExpenseSummary = signal<CampanaGastoResumenDiarioResponse | null>(null);
  readonly monthlyExpenseSummary = signal<CampanaGastoResumenMensualResponse | null>(null);
  readonly campaignExpenseSnapshots = signal<CampanaGastoResponse[]>([]);
  readonly selectedExpenseCampaign = signal<FinanceRow | null>(null);
  readonly expenseDialogOpen = signal(false);
  readonly expenseSnapshotsOpen = signal(false);
  readonly expenseRegistrationStatus = signal<CampanaGastoRegistroEstadoResponse | null>(null);
  readonly expenseRegistrationCheckError = signal<string | null>(null);
  readonly financeDate = signal(financeCurrentDateValue());
  readonly financeMonth = signal(financeCurrentMonthValue());

  readonly billingDayOptions = Array.from({ length: 31 }, (_, index) => index + 1);
  readonly promotionScopeOptions: PromotionScopeOption[] = [
    { label: 'Proveedor', value: 'proveedor', icon: 'pi pi-building', severity: 'info' },
    { label: 'Zona', value: 'zona', icon: 'pi pi-map-marker', severity: 'success' },
    { label: 'Planes', value: 'planes', icon: 'pi pi-wifi', severity: 'warn' }
  ];
  readonly selectedBillingCuts = signal<number[]>([1, 15]);
  readonly selectedCampaign = signal<CampanaResponse | null>(null);
  readonly whatsappDialogOpen = signal(false);
  readonly editAccountDialogOpen = signal(false);
  readonly selectedAccountId = signal<number | null>(null);

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
  readonly activePlanProviderName = signal('');
  readonly selectedPlanProviderId = signal(0);
  readonly selectedPlanAdditionals = signal<PlanAdditionalDraft[]>([]);
  readonly selectedPromotionProviderId = signal(0);
  readonly availablePlanAdditionals = computed(() => {
    const idProveedor = this.selectedPlanProviderId();
    return this.adicionalesActivos().filter((adicional) => adicional.idProveedor === idProveedor);
  });
  readonly availablePlanAdditionalOptions = computed(() => [
    { id: 0, nombre: '(Ninguno)' },
    ...this.availablePlanAdditionals()
  ]);
  readonly canSelectPlanAdditional = computed(() => this.selectedPlanProviderId() > 0);
  readonly planAdditionalsHelperText = computed(() => {
    if (this.selectedPlanProviderId() === 0) {
      return 'Selecciona un proveedor para ver sus adicionales disponibles.';
    }

    if (!this.availablePlanAdditionals().length) {
      return 'Este proveedor no tiene adicionales activos.';
    }

    if (!this.selectedPlanAdditionals().length) {
      return 'Puedes agregar adicionales del proveedor si corresponde.';
    }

    return 'Los adicionales agregados quedaran incluidos en la configuracion del plan.';
  });
  readonly availablePromotionPlans = computed<PromotionPlanOption[]>(() => {
    const idProveedor = this.selectedPromotionProviderId();
    return this.planesActivos()
      .filter((plan) => !idProveedor || plan.idProveedor === idProveedor)
      .map((plan) => ({ ...plan, promotionOptionLabel: this.buildPromotionPlanLabel(plan) }));
  });
  readonly planNamePlaceholder = computed(() => this.planes()[0]?.nombre ?? 'Plan Fibra 200');
  readonly additionalNamePlaceholder = computed(() => this.adicionales()[0]?.nombre ?? 'Mesh WiFi');
  readonly dailyFinanceCards = computed(() => buildFinanceCards(this.dailyExpenseSummary()));
  readonly monthlyFinanceCards = computed(() => buildFinanceCards(this.monthlyExpenseSummary()));
  readonly dailyFinanceRows = computed<FinanceRow[]>(() => (this.dailyExpenseSummary()?.campanas ?? []).map((campana) => toFinanceRow(campana)));
  readonly snapshotRows = computed<SnapshotFinanceRow[]>(() => toSnapshotFinanceRows(this.campaignExpenseSnapshots()));
  readonly expenseRegistrationWarning = computed(() =>
    this.expenseRegistrationStatus()?.aplicaCierreRetroactivo
      ? 'Este es el primer registro de hoy. Se guardar� como cierre de ayer a las 23:59.'
      : null
  );

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

  readonly expenseForm = this.fb.group({
    idCampana: [0, [Validators.required, Validators.min(1)]],
    leads: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    costoTotal: ['', [Validators.required, Validators.pattern(/^\d+(?:[,.]\d+)?$/)]]
  });

  readonly campaignForm = this.fb.group({
    nombre: ['', [Validators.required]],
    prefijo: ['+51', [Validators.required, Validators.pattern(/^\+\d{1,3}$/)]],
    numeroWhatsApp: ['', [Validators.required, Validators.pattern(/^\d{6,15}$/)]],
    idCuentaPublicitaria: [0, [Validators.required, Validators.min(1)]],
    idProveedor: [0, [Validators.required, Validators.min(1)]]
  });

  readonly campaignWhatsappForm = this.fb.group({
    prefijo: ['+51', [Validators.required, Validators.pattern(/^\+\d{1,3}$/)]],
    numeroWhatsApp: ['', [Validators.required, Validators.pattern(/^\d{6,15}$/)]]
  });

  readonly editAccountForm = this.fb.group({
    nombreCuenta: ['', [Validators.required]]
  });

  readonly additionalForm = this.fb.group({
    idProveedor: [0, [Validators.required, Validators.min(1)]],
    nombre: ['', [Validators.required]],
    precioUnitario: [0, [Validators.required, Validators.min(0.01)]]
  });

  readonly createPlanForm = this.fb.group({
    idProveedor: [0, [Validators.required, Validators.min(1)]],
    nombre: ['', [Validators.required]],
    precio: [null as number | null, [Validators.required, Validators.min(0.01)]],
    precioPromocional: [null as number | null, [Validators.min(0.01)]],
    mesesPromocionPrecio: [{ value: null as number | null, disabled: true }, [Validators.required, Validators.min(1)]],
    vigenciaDesde: [''],
    vigenciaHasta: [''],
    internetVelocidad: [null as number | null],
    internetUnidad: ['MBPS'],
    internetTecnologia: ['FTTH'],
    televisionNombre: [''],
    televisionCanales: [null as number | null],
    telefonoMinutos: [null as number | null],
    telefonoDescripcion: [''],
    velocidadPromocional: [null as number | null, [Validators.min(1)]],
    mesesPromocionVelocidad: [{ value: null as number | null, disabled: true }, [Validators.required, Validators.min(1)]],
    idZona: [0]
  });

  readonly editPlanForm = this.fb.group({
    nombre: ['', [Validators.required]],
    precio: [null as number | null, [Validators.required, Validators.min(0.01)]],
    precioPromocional: [null as number | null, [Validators.min(0.01)]],
    mesesPromocionPrecio: [{ value: null as number | null, disabled: true }, [Validators.required, Validators.min(1)]],
    vigenciaDesde: [''],
    vigenciaHasta: [''],
    internetVelocidad: [null as number | null],
    internetUnidad: ['MBPS'],
    internetTecnologia: ['FTTH'],
    televisionNombre: [''],
    televisionCanales: [null as number | null],
    telefonoMinutos: [null as number | null],
    telefonoDescripcion: [''],
    velocidadPromocional: [null as number | null, [Validators.min(1)]],
    mesesPromocionVelocidad: [{ value: null as number | null, disabled: true }, [Validators.required, Validators.min(1)]],
    idZona: [0]
  });

  readonly providerServicesForm = this.fb.group({
    idProveedor: [0, [Validators.required, Validators.min(1)]]
  });

  readonly promotionForm = this.fb.group({
    reglaComercial: ['', [Validators.required]],
    scopes: [[] as PromotionScope[]],
    idProveedor: [0],
    idZona: [0],
    idsPlanes: [[] as number[]]
  });

  readonly promotionFiltersForm = this.fb.group({
    idProveedor: [0],
    idZona: [0],
    idPlan: [0]
  });

  readonly digitalPlatformForm = this.fb.group({
    nombre: ['', [Validators.required]]
  });

  readonly platformPackageForm = this.fb.group({
    idPlataforma: [0, [Validators.required, Validators.min(1)]],
    nombre: ['', [Validators.required]],
    cantidadMeses: [1, [Validators.required, Validators.min(1)]],
    cantidadUsuarios: [1, [Validators.required, Validators.min(1)]],
    consumeCreditos: [false],
    cantidadCreditosConsumidos: [0, [Validators.min(0)]],
    precioVenta: [0, [Validators.min(0)]]
  });

  readonly platformCredentialForm = this.fb.group({
    idPaquete: [0, [Validators.required, Validators.min(1)]],
    usuario: ['', [Validators.required]],
    password: ['', [Validators.required]],
    fechaCreacion: [this.currentDateInputValue(), [Validators.required]],
    observacion: ['']
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

  constructor() {
    this.bindPlanPromotionalMonthControls();
  }

  private bindPlanPromotionalMonthControls(): void {
    this.bindPromotionalMonthControl(
      this.createPlanForm.controls.precioPromocional,
      this.createPlanForm.controls.mesesPromocionPrecio
    );
    this.bindPromotionalMonthControl(
      this.createPlanForm.controls.velocidadPromocional,
      this.createPlanForm.controls.mesesPromocionVelocidad
    );
    this.bindPromotionalMonthControl(
      this.editPlanForm.controls.precioPromocional,
      this.editPlanForm.controls.mesesPromocionPrecio
    );
    this.bindPromotionalMonthControl(
      this.editPlanForm.controls.velocidadPromocional,
      this.editPlanForm.controls.mesesPromocionVelocidad
    );
  }

  private bindPromotionalMonthControl(source: FormControl<number | null>, target: FormControl<number | null>): void {
    source.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.updatePromotionalMonthControl(target, value);
    });
    this.updatePromotionalMonthControl(target, source.value, false);
  }

  private updatePromotionalMonthControl(target: FormControl<number | null>, sourceValue: unknown, clearWhenDisabled = true): void {
    if (this.toOptionalPositiveNumber(sourceValue) !== null) {
      target.enable({ emitEvent: false });
      return;
    }

    if (clearWhenDisabled) {
      target.reset(null, { emitEvent: false });
    }
    target.disable({ emitEvent: false });
  }

  private refreshPlanPromotionalMonthControls(): void {
    this.updatePromotionalMonthControl(
      this.createPlanForm.controls.mesesPromocionPrecio,
      this.createPlanForm.controls.precioPromocional.value,
      false
    );
    this.updatePromotionalMonthControl(
      this.createPlanForm.controls.mesesPromocionVelocidad,
      this.createPlanForm.controls.velocidadPromocional.value,
      false
    );
    this.updatePromotionalMonthControl(
      this.editPlanForm.controls.mesesPromocionPrecio,
      this.editPlanForm.controls.precioPromocional.value,
      false
    );
    this.updatePromotionalMonthControl(
      this.editPlanForm.controls.mesesPromocionVelocidad,
      this.editPlanForm.controls.velocidadPromocional.value,
      false
    );
  }

  setAccessMode(mode: CommunityAccessMode): void {
    this.accessMode.set(mode);
  }

  async initialize(mode: CommunityPageMode = 'mantenimiento'): Promise<void> {
    this.currentMode.set(mode);

    if (mode === 'finanzas') {
      if (this.canDisplayOperationalData()) {
        void this.loadAll();
      }
      await this.loadFinanceDashboard();
      return;
    }

    if (mode === 'mantenimiento') {
      await this.loadAll();
    }
  }

  setSection(section: CommunitySection): void {
    this.section.set(section);
    this.clearMessages();
  }

  async loadAll(): Promise<void> {
    if (!this.canDisplayOperationalData() || this.catalogLoadInFlight) {
      return;
    }

    this.catalogLoadInFlight = true;
    this.isLoading.set(true);
    this.clearMessages();
    try {
      const proveedores = await firstValueFrom(this.leadService.listarProveedores());
      this.proveedores.set(proveedores);

      const results = await Promise.allSettled([
        this.loadList('cuentas', () => firstValueFrom(this.leadService.listarCuentas())),
        this.loadList('cuentas activas', () => firstValueFrom(this.leadService.listarCuentasActivas())),
        this.refreshCampaigns(),
        this.loadList('adicionales', () => this.loadAdditionalsByProviders(proveedores)),
        this.loadList('planes', () => firstValueFrom(this.leadService.listarPlanes())),
        this.loadList('promociones', () => firstValueFrom(this.leadService.listarPromociones({}))),
        this.loadList('zonas', () => firstValueFrom(this.leadService.listarZonas())),
        this.refreshDigitalPlatforms()
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
      this.catalogLoadInFlight = false;
      this.isLoading.set(false);
    }
  }

  async loadFinanceDashboard(): Promise<void> {
    this.isLoadingFinance.set(true);
    this.clearMessages();
    try {
      const [daily, monthly] = await Promise.all([
        firstValueFrom(this.leadService.obtenerResumenGastosDiario(this.financeDate())),
        firstValueFrom(this.leadService.obtenerResumenGastosMensual(financeMonthYear(this.financeMonth()), financeMonthMonth(this.financeMonth())))
      ]);
      this.dailyExpenseSummary.set(daily);
      this.monthlyExpenseSummary.set(monthly);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar finanzas de campa�as.'));
    } finally {
      this.isLoadingFinance.set(false);
    }
  }

  openExpenseDialog(): void {
    if (!this.ensureCanMutate()) {
      return;
    }

    this.expenseForm.reset({ idCampana: 0, leads: '', costoTotal: '' });
    this.clearExpenseRegistrationStatus();
    this.expenseDialogOpen.set(true);
    this.clearMessages();
  }

  closeExpenseDialog(): void {
    this.expenseDialogOpen.set(false);
    this.clearExpenseRegistrationStatus();
  }

  async onExpenseCampaignChanged(idCampana: number | null): Promise<void> {
    const checkId = ++this.expenseRegistrationCheckId;
    this.expenseRegistrationStatus.set(null);
    this.expenseRegistrationCheckError.set(null);

    if (!idCampana) {
      return;
    }

    try {
      const status = await firstValueFrom(this.leadService.obtenerEstadoRegistroGastoCampana(idCampana));
      if (checkId === this.expenseRegistrationCheckId) {
        this.expenseRegistrationStatus.set(status);
      }
    } catch (error) {
      if (checkId === this.expenseRegistrationCheckId) {
        this.expenseRegistrationCheckError.set(
          this.getErrorMessage(error, 'No se pudo verificar la fecha del registro. Al guardar, el sistema la definir�.')
        );
      }
    }
  }

  async submitExpense(): Promise<void> {
    if (this.expenseForm.invalid) {
      this.errorMessage.set('Selecciona una campa�a e indica leads y costo acumulado.');
      return;
    }

    const raw = this.expenseForm.getRawValue();
    const leads = this.parseIntegerInput(raw.leads);
    const costoTotal = this.parseDecimalInput(raw.costoTotal);

    if (leads === null || costoTotal === null) {
      this.errorMessage.set('Ingresa leads y costo acumulado con un formato valido.');
      return;
    }

    const saved = await this.saveAction(
      () =>
        this.leadService.registrarGastoCampana(raw.idCampana, {
          leads,
          costoTotal
        }),
      '',
      async () => {
        this.closeExpenseDialog();
        await this.loadFinanceDashboard();
      }
    );
    if (saved) {
      this.successMessage.set(saved.cierreRetroactivo ? 'Gasto registrado como cierre del d�a anterior.' : 'Gasto de campa�a registrado.');
    }
  }

  async openExpenseSnapshots(row: FinanceRow): Promise<void> {
    this.selectedExpenseCampaign.set(row);
    this.campaignExpenseSnapshots.set([]);
    this.expenseSnapshotsOpen.set(true);
    this.isLoadingFinanceSnapshots.set(true);
    this.clearMessages();
    try {
      const snapshots = await firstValueFrom(this.leadService.listarGastosCampanaDia(row.idCampana, this.financeDate()));
      this.campaignExpenseSnapshots.set(snapshots);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo cargar el detalle de gastos de la campa�a.'));
    } finally {
      this.isLoadingFinanceSnapshots.set(false);
    }
  }

  closeExpenseSnapshots(): void {
    this.expenseSnapshotsOpen.set(false);
    this.selectedExpenseCampaign.set(null);
    this.campaignExpenseSnapshots.set([]);
  }

  private clearExpenseRegistrationStatus(): void {
    this.expenseRegistrationCheckId++;
    this.expenseRegistrationStatus.set(null);
    this.expenseRegistrationCheckError.set(null);
  }

  async onFinanceDateChanged(value: string): Promise<void> {
    this.financeDate.set(value || financeCurrentDateValue());
    await this.loadFinanceDashboard();
  }

  async onFinanceMonthChanged(value: string): Promise<void> {
    this.financeMonth.set(value || financeCurrentMonthValue());
    await this.loadFinanceDashboard();
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

  async toggleAccount(idCuenta: number): Promise<void> {
    await this.saveAction(() => this.leadService.alternarCuenta(idCuenta), 'Estado de cuenta actualizado.', () => this.refreshAccounts());
  }

  async submitCampaign(): Promise<void> {
    if (this.campaignForm.invalid) {
      this.errorMessage.set('Completa los datos de la campa�a.');
      return;
    }

    await this.saveAction(() => this.leadService.registrarCampana(this.campaignForm.getRawValue()), 'Campa�a registrada.', () =>
      this.refreshCampaigns()
    );
  }

  openEditAccountDialog(cuenta: CuentaPublicitariaResponse): void {
    if (!this.ensureCanMutate()) {
      return;
    }

    this.selectedAccountId.set(cuenta.id);
    this.editAccountForm.reset({ nombreCuenta: cuenta.nombreCuenta as string });
    this.editAccountDialogOpen.set(true);
  }

  closeEditAccountDialog(): void {
    this.editAccountDialogOpen.set(false);
    this.selectedAccountId.set(null);
    this.editAccountForm.reset();
  }

  async saveEditAccount(): Promise<void> {
    const id = this.selectedAccountId();
    if (!id || this.editAccountForm.invalid) {
      this.errorMessage.set('El nombre de la cuenta es obligatorio.');
      return;
    }
    const raw = this.editAccountForm.getRawValue();
    this.isSaving.set(true);
    try {
      await firstValueFrom(
        this.leadService.actualizarNombreCuenta(id, { nombreCuenta: raw.nombreCuenta })
      );
      await this.loadList('cuentas', () => firstValueFrom(this.leadService.listarCuentas()));
      this.clearMessages();
      this.successMessage.set('Nombre de cuenta actualizado.');
      this.closeEditAccountDialog();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo actualizar el nombre de la cuenta.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  openWhatsappDialog(campana: CampanaResponse): void {
    if (!this.ensureCanMutate()) {
      return;
    }

    this.selectedCampaign.set(campana);
    this.campaignWhatsappForm.reset({
      prefijo: campana.prefijo ?? '+51',
      numeroWhatsApp: campana.numeroWhatsApp ?? campana.numeroWhatsappEmpresa ?? ''
    });
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
      this.errorMessage.set('Indica la campa�a y el nuevo WhatsApp.');
      return;
    }

    const raw = this.campaignWhatsappForm.getRawValue();
    await this.saveAction(
      () => this.leadService.actualizarWhatsappCampana(campana.id, raw),
      'WhatsApp de campa�a actualizado.',
      async () => {
        await this.refreshCampaigns();
        this.closeWhatsappDialog();
      }
    );
  }

  campaignWhatsappLabel(campana: CampanaResponse): string {
    const number = campana.numeroWhatsApp ?? campana.numeroWhatsappEmpresa;
    if (!number) {
      return '-';
    }

    return campana.prefijo ? `${campana.prefijo} ${number}` : number;
  }

  money(value: unknown): string {
    return formatFinanceMoney(Number(value ?? 0).toFixed(2));
  }

  percentage(numerator: number | null | undefined, denominator: number | null | undefined): string {
    if (!denominator) {
      return '-';
    }
    return `${(((numerator ?? 0) / denominator) * 100).toFixed(1)}%`;
  }

  costPerResult(costoTotal: number | null | undefined, denominator: number | null | undefined): string {
    if (!denominator) {
      return '-';
    }
    return this.money((costoTotal ?? 0) / denominator);
  }

  deltaBadge(value: number | null | undefined): string | null {
    if (value === null || value === undefined || value === 0) {
      return null;
    }
    return value > 0 ? `+${value}` : String(value);
  }

  dateTime(value: string | null | undefined): string {
    return formatFinanceDateTime(value);
  }

  async toggleCampaign(idCampana: number): Promise<void> {
    await this.saveAction(() => this.leadService.alternarCampana(idCampana), 'Estado de campa�a actualizado.', () =>
      this.refreshCampaigns()
    );
  }

  async setShowInactiveCampaigns(value: boolean): Promise<void> {
    if (this.mostrarCampanasInactivas() === value) {
      return;
    }

    this.mostrarCampanasInactivas.set(value);
    await this.refreshCampaigns();
  }

  selectPlanCatalogProvider(idProveedor: number): void {
    this.selectedPlanCatalogProviderId.set(idProveedor);
  }

  selectPlanCatalogSort(sort: PlanCatalogSort): void {
    this.selectedPlanCatalogSort.set(sort);
  }

  selectPlanCatalogComposition(composition: PlanCatalogComposition): void {
    this.selectedPlanCatalogComposition.set(composition);
  }

  planCatalogTagClass(idProveedor: number, tone: 'info' | 'success' | 'danger'): string {
    const selected = this.selectedPlanCatalogProviderId() === idProveedor ? ' plan-catalog-tag--selected' : '';
    return `plan-catalog-tag plan-catalog-tag--${tone}${selected}`;
  }

  planCatalogCompositionLabel(plan: PlanResponse): string {
    return this.resolvePlanCatalogCompositionLabel(this.resolvePlanCatalogComposition(plan));
  }

  planCatalogCompositionSeverity(plan: PlanResponse): 'contrast' | 'info' | 'warn' | 'success' | 'danger' {
    switch (this.resolvePlanCatalogComposition(plan)) {
      case 'SOLO_INTERNET':
        return 'info';
      case 'INTERNET_TV':
      case 'INTERNET_TELEFONIA':
      case 'TV_TELEFONIA':
        return 'warn';
      case 'TRIPLE_PACK':
        return 'success';
      case 'SOLO_TV':
      case 'SOLO_TELEFONIA':
        return 'contrast';
      default:
        return 'contrast';
    }
  }

  planInternetLabel(plan: PlanResponse): string {
    const speed = this.getPlanInternetSpeed(plan);
    return speed ? `${speed} ${this.getPlanInternetUnit(plan) ?? 'MBPS'}` : '�';
  }

  planTelevisionLabel(plan: PlanResponse): string {
    return this.getPlanTelevisionName(plan) ?? (this.getPlanTelevisionChannels(plan) ? `${this.getPlanTelevisionChannels(plan)} ch` : '�');
  }

  planPhoneLabel(plan: PlanResponse): string {
    return this.getPlanPhoneDescription(plan) ?? (this.getPlanPhoneMinutes(plan) ? `${this.getPlanPhoneMinutes(plan)} min` : '�');
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
    if (!this.ensureCanMutate()) {
      return;
    }

    this.additionalForm.reset({ idProveedor: 0, nombre: '', precioUnitario: 0 });
    this.additionalDialogOpen.set(true);
    this.clearMessages();
  }

  closeAdditionalDialog(): void {
    this.additionalDialogOpen.set(false);
  }

  openCreatePlanDialog(): void {
    if (!this.ensureCanMutate()) {
      return;
    }

    this.createPlanForm.reset({
      idProveedor: 0,
      nombre: '',
      precio: null,
      precioPromocional: null,
      mesesPromocionPrecio: null,
      vigenciaDesde: '',
      vigenciaHasta: '',
      internetVelocidad: null,
      internetUnidad: 'MBPS',
      internetTecnologia: 'FTTH',
      televisionNombre: '',
      televisionCanales: null,
      telefonoMinutos: null,
      telefonoDescripcion: '',
      velocidadPromocional: null,
      mesesPromocionVelocidad: null,
      idZona: 0
    });
    this.refreshPlanPromotionalMonthControls();
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
    if (!this.ensureCanMutate()) {
      return;
    }

    this.activePlanId.set(plan.id);
    this.activePlanProviderName.set(plan.nombreProveedor ?? '');
    this.selectedPlanProviderId.set(plan.idProveedor ?? 0);
    this.editPlanForm.reset({
      nombre: plan.nombre ?? '',
      precio: this.toOptionalPositiveNumber(plan.precio),
      precioPromocional: this.toOptionalPositiveNumber(plan.precioPromocional),
      mesesPromocionPrecio: this.toOptionalPositiveInteger(plan.mesesPromocionPrecio),
      vigenciaDesde: this.toDateInputValue(plan.vigenciaDesde),
      vigenciaHasta: this.toDateInputValue(plan.vigenciaHasta),
      internetVelocidad: this.getPlanInternetSpeed(plan),
      internetUnidad: this.getPlanInternetUnit(plan) ?? 'MBPS',
      internetTecnologia: this.getPlanInternetTechnology(plan) ?? 'FTTH',
      televisionNombre: this.getPlanTelevisionName(plan) ?? '',
      televisionCanales: this.getPlanTelevisionChannels(plan),
      telefonoMinutos: this.getPlanPhoneMinutes(plan),
      telefonoDescripcion: this.getPlanPhoneDescription(plan) ?? '',
      velocidadPromocional: this.toOptionalPositiveInteger(plan.velocidadPromocional),
      mesesPromocionVelocidad: this.toOptionalPositiveInteger(plan.mesesPromocionVelocidad),
      idZona: plan.idZona ?? 0
    });
    this.refreshPlanPromotionalMonthControls();
    this.selectedPlanAdditionals.set(
      (plan.adicionales ?? []).map((adicional) => ({
        idAdicional: adicional.idAdicional,
        nombre: adicional.nombreAdicional ?? `Adicional ${adicional.idAdicional}`,
        cantidadIncluida: adicional.cantidadIncluida ?? 0,
        permiteCompraAdicional: adicional.permiteCompraAdicional ?? false,
        cantidadMaximaAdicional: adicional.cantidadMaximaAdicional ?? 0
      }))
    );
    this.editPlanDialogOpen.set(true);
    this.clearMessages();
  }

  closeEditPlanDialog(): void {
    this.editPlanDialogOpen.set(false);
    this.activePlanId.set(null);
    this.activePlanProviderName.set('');
    this.selectedPlanProviderId.set(0);
    this.selectedPlanAdditionals.set([]);
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

    await this.saveAction(
      () => this.leadService.registrarPromocion(this.buildPromotionRequest()),
      'Promocion registrada.',
      () => this.refreshPromotions()
    );
  }

  hasPromotionScope(scope: PromotionScope): boolean {
    return this.promotionForm.controls.scopes.value.includes(scope);
  }

  onPromotionScopesChanged(scopes: PromotionScope[]): void {
    const selectedScopes = scopes ?? [];
    if (!selectedScopes.includes('proveedor')) {
      this.promotionForm.patchValue({ idProveedor: 0 });
      this.selectedPromotionProviderId.set(0);
    }
    if (!selectedScopes.includes('zona')) {
      this.promotionForm.patchValue({ idZona: 0 });
    }
    if (!selectedScopes.includes('planes')) {
      this.promotionForm.patchValue({ idsPlanes: [] });
    }
    this.syncPromotionPlansWithProvider();
  }

  onPromotionProviderChanged(): void {
    this.selectedPromotionProviderId.set(this.promotionForm.controls.idProveedor.value);
    this.syncPromotionPlansWithProvider();
  }

  async filterPromotions(): Promise<void> {
    if (!this.canDisplayOperationalData()) {
      return;
    }

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

  async submitDigitalPlatform(): Promise<void> {
    if (this.digitalPlatformForm.invalid) {
      this.errorMessage.set('Indica el nombre de la plataforma digital.');
      return;
    }

    await this.saveAction(
      () => this.leadService.registrarPlataformaDigital(this.digitalPlatformForm.getRawValue()),
      'Plataforma digital registrada.',
      async () => {
        this.digitalPlatformForm.reset({ nombre: '' });
        await this.refreshDigitalPlatforms();
      }
    );
  }

  async submitPlatformPackage(): Promise<void> {
    if (this.platformPackageForm.invalid) {
      this.errorMessage.set('Completa plataforma, nombre, meses y usuarios del paquete.');
      return;
    }

    await this.saveAction(
      () => this.leadService.registrarPaquetePlataforma(this.buildPlatformPackageRequest()),
      'Paquete registrado.',
      async () => {
        const idPlataforma = this.platformPackageForm.controls.idPlataforma.value;
        this.platformPackageForm.patchValue({
          nombre: '',
          cantidadMeses: 1,
          cantidadUsuarios: 1,
          consumeCreditos: false,
          cantidadCreditosConsumidos: 0,
          precioVenta: 0
        });
        await this.selectDigitalPlatform(idPlataforma);
      }
    );
  }

  async submitPlatformCredential(): Promise<void> {
    if (this.platformCredentialForm.invalid) {
      this.errorMessage.set('Completa paquete, usuario, password y fecha de creacion.');
      return;
    }

    await this.saveAction(
      () => this.leadService.registrarCredencialPlataforma(this.buildPlatformCredentialRequest()),
      'Credencial registrada.',
      async () => {
        const idPaquete = this.platformCredentialForm.controls.idPaquete.value;
        this.platformCredentialForm.patchValue({
          usuario: '',
          password: '',
          fechaCreacion: this.currentDateInputValue(),
          observacion: ''
        });
        await this.selectCredentialPackage(idPaquete);
      }
    );
  }

  async selectDigitalPlatform(idPlataforma: number | null): Promise<void> {
    const nextId = idPlataforma ?? 0;
    this.selectedDigitalPlatformId.set(nextId);
    this.platformPackageForm.patchValue({ idPlataforma: nextId });
    this.paquetesPlataforma.set([]);
    this.credencialesPlataforma.set([]);
    this.selectedCredentialPackageId.set(0);
    this.platformCredentialForm.patchValue({ idPaquete: 0 });
    if (!nextId) {
      return;
    }
    await this.refreshDigitalPackages(nextId);
  }

  async selectCredentialPackage(idPaquete: number | null): Promise<void> {
    const nextId = idPaquete ?? 0;
    this.selectedCredentialPackageId.set(nextId);
    this.platformCredentialForm.patchValue({ idPaquete: nextId });
    this.credencialesPlataforma.set([]);
    if (!nextId) {
      return;
    }
    await this.refreshDigitalCredentials(nextId);
  }

  async openCreateZone(): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }

    this.zoneDialogMode.set('create');
    this.activeZoneId.set(null);
    this.zoneForm.reset({ nombre: '' });
    this.zoneRules.set([]);
    this.resetZoneRuleForm();
    this.zoneDialogOpen.set(true);
    await this.ensureDepartamentosLoaded();
  }

  async openEditZone(zona: ZonaResponse): Promise<void> {
    if (!this.ensureCanMutate()) {
      return;
    }

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
    const activeFilter = this.mostrarCampanasInactivas() ? undefined : true;
    this.campanas.set(await firstValueFrom(this.leadService.listarCampanas(activeFilter)));
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

  private async refreshDigitalPlatforms(): Promise<void> {
    const plataformas = await firstValueFrom(this.leadService.listarPlataformasDigitales());
    this.plataformasDigitales.set(plataformas);
    const selectedId = this.selectedDigitalPlatformId() || plataformas.find((plataforma) => plataforma.activo !== false)?.id || 0;
    if (selectedId) {
      await this.selectDigitalPlatform(selectedId);
    }
  }

  private async refreshDigitalPackages(idPlataforma: number): Promise<void> {
    const paquetes = await firstValueFrom(this.leadService.listarPaquetesPlataforma(idPlataforma));
    this.paquetesPlataforma.set(paquetes);
    const selectedId = this.selectedCredentialPackageId() || paquetes[0]?.id || 0;
    if (selectedId) {
      await this.selectCredentialPackage(selectedId);
    }
  }

  private async refreshDigitalCredentials(idPaquete: number): Promise<void> {
    this.credencialesPlataforma.set(await firstValueFrom(this.leadService.listarCredencialesPlataformaDisponibles(idPaquete)));
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

  private toOptionalText(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private toOptionalPositiveNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
  }

  private toOptionalPositiveInteger(value: unknown): number | null {
    const numericValue = this.toOptionalPositiveNumber(value);
    if (numericValue === null || !Number.isInteger(numericValue)) {
      return null;
    }

    return numericValue;
  }

  private toOptionalNonNegativeInteger(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue < 0) {
      return null;
    }

    return numericValue;
  }

  private toOptionalNonNegativeNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
  }

  private currentDateInputValue(): string {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
  }

  private buildPlanRequest(): Record<string, unknown> {
    const raw = this.createPlanForm.getRawValue();

    return this.cleanObject({
      idProveedor: raw.idProveedor,
      nombre: raw.nombre,
      precio: this.toOptionalPositiveNumber(raw.precio),
      precioPromocional: this.toOptionalPositiveNumber(raw.precioPromocional),
      mesesPromocionPrecio: this.toOptionalPositiveInteger(raw.mesesPromocionPrecio),
      vigenciaDesde: raw.vigenciaDesde || null,
      vigenciaHasta: raw.vigenciaHasta || null,
      internet: this.toOptionalPositiveInteger(raw.internetVelocidad)
        ? {
            velocidad: this.toOptionalPositiveInteger(raw.internetVelocidad),
            unidad: raw.internetUnidad,
            tecnologia: raw.internetTecnologia
          }
        : null,
      television: raw.televisionNombre
        ? {
            nombre: raw.televisionNombre,
            cantidadCanales: this.toOptionalNonNegativeInteger(raw.televisionCanales) ?? 0
          }
        : null,
      telefono: raw.telefonoDescripcion
        ? {
            minutos: this.toOptionalNonNegativeInteger(raw.telefonoMinutos) ?? 0,
            descripcion: raw.telefonoDescripcion
          }
        : null,
      velocidadPromocional: this.toOptionalPositiveInteger(raw.velocidadPromocional),
      mesesPromocionVelocidad: this.toOptionalPositiveInteger(raw.mesesPromocionVelocidad),
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
      precio: this.toOptionalPositiveNumber(raw.precio),
      precioPromocional: this.toOptionalPositiveNumber(raw.precioPromocional),
      mesesPromocionPrecio: this.toOptionalPositiveInteger(raw.mesesPromocionPrecio),
      vigenciaDesde: raw.vigenciaDesde || null,
      vigenciaHasta: raw.vigenciaHasta || null,
      internet: this.toOptionalPositiveInteger(raw.internetVelocidad)
        ? {
            velocidad: this.toOptionalPositiveInteger(raw.internetVelocidad),
            unidad: raw.internetUnidad,
            tecnologia: raw.internetTecnologia
          }
        : null,
      television: raw.televisionNombre
        ? {
            nombre: raw.televisionNombre,
            cantidadCanales: this.toOptionalNonNegativeInteger(raw.televisionCanales) ?? 0
          }
        : null,
      telefono: raw.telefonoDescripcion
        ? {
            minutos: this.toOptionalNonNegativeInteger(raw.telefonoMinutos) ?? 0,
            descripcion: raw.telefonoDescripcion
          }
        : null,
      velocidadPromocional: this.toOptionalPositiveInteger(raw.velocidadPromocional),
      mesesPromocionVelocidad: this.toOptionalPositiveInteger(raw.mesesPromocionVelocidad),
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

  private buildPromotionRequest(): Record<string, unknown> {
    const raw = this.promotionForm.getRawValue();
    const scopes = raw.scopes;
    return {
      reglaComercial: raw.reglaComercial,
      idProveedor: scopes.includes('proveedor') ? raw.idProveedor || null : null,
      idZona: scopes.includes('zona') ? raw.idZona || null : null,
      idsPlanes: scopes.includes('planes') && raw.idsPlanes.length ? raw.idsPlanes : null
    };
  }

  private buildPlatformPackageRequest(): Record<string, unknown> {
    const raw = this.platformPackageForm.getRawValue();
    return this.cleanObject({
      idPlataforma: raw.idPlataforma,
      nombre: raw.nombre,
      cantidadMeses: raw.cantidadMeses,
      cantidadUsuarios: raw.cantidadUsuarios,
      consumeCreditos: raw.consumeCreditos,
      cantidadCreditosConsumidos: raw.consumeCreditos ? raw.cantidadCreditosConsumidos : 0,
      precioVenta: this.toOptionalNonNegativeNumber(raw.precioVenta) ?? 0
    });
  }

  private buildPlatformCredentialRequest(): Record<string, unknown> {
    const raw = this.platformCredentialForm.getRawValue();
    return this.cleanObject({
      idPaquete: raw.idPaquete,
      usuario: raw.usuario,
      password: raw.password,
      fechaCreacion: raw.fechaCreacion,
      observacion: this.toOptionalText(raw.observacion)
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

  private cleanObject<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)) as T;
  }

  private syncPromotionPlansWithProvider(): void {
    const raw = this.promotionForm.getRawValue();
    if (!raw.scopes.includes('proveedor') || !raw.idProveedor || !raw.scopes.includes('planes') || !raw.idsPlanes.length) {
      return;
    }

    const allowedPlanIds = new Set(this.availablePromotionPlans().map((plan) => plan.id));
    const selectedPlanIds = raw.idsPlanes.filter((idPlan) => allowedPlanIds.has(idPlan));
    if (selectedPlanIds.length !== raw.idsPlanes.length) {
      this.promotionForm.patchValue({ idsPlanes: selectedPlanIds });
    }
  }

  private getPlanInternetSpeed(plan: PlanResponse): number | null {
    return this.toOptionalPositiveInteger(plan.internetVelocidad ?? plan.internet?.velocidad);
  }

  private getPlanInternetUnit(plan: PlanResponse): string | null {
    return plan.internetUnidad ?? plan.internet?.unidad ?? null;
  }

  private getPlanInternetTechnology(plan: PlanResponse): string | null {
    return plan.internetTecnologia ?? plan.internet?.tecnologia ?? null;
  }

  private getPlanTelevisionName(plan: PlanResponse): string | null {
    return this.toOptionalText(plan.televisionNombre) ?? this.toOptionalText(plan.television?.nombre);
  }

  private getPlanTelevisionChannels(plan: PlanResponse): number | null {
    return this.toOptionalPositiveInteger(plan.televisionCanales ?? plan.television?.cantidadCanales);
  }

  private getPlanPhoneMinutes(plan: PlanResponse): number | null {
    return this.toOptionalPositiveInteger(plan.telefonoMinutos ?? plan.telefono?.minutos);
  }

  private getPlanPhoneDescription(plan: PlanResponse): string | null {
    return this.toOptionalText(plan.telefonoDescripcion) ?? this.toOptionalText(plan.telefono?.descripcion);
  }

  private buildPromotionPlanLabel(plan: PlanResponse): string {
    const details = [
      this.getPlanInternetSpeed(plan) ? `${this.getPlanInternetSpeed(plan)} ${this.getPlanInternetUnit(plan) ?? 'MBPS'}` : null,
      plan.precioPromocional ? `Promo S/ ${plan.precioPromocional}` : plan.precio ? `S/ ${plan.precio}` : null
    ].filter(Boolean);

    return details.length ? `${plan.nombre} - ${details.join(' - ')}` : String(plan.nombre);
  }

  private toDateInputValue(value: string | undefined): string {
    return value ? value.slice(0, 10) : '';
  }

  private comparePlanCatalogItems(left: PlanResponse, right: PlanResponse, sort: PlanCatalogSort): number {
    switch (sort) {
      case 'price_asc':
        return (left.precio ?? Number.MAX_SAFE_INTEGER) - (right.precio ?? Number.MAX_SAFE_INTEGER) || this.compareText(left.nombre, right.nombre);
      case 'price_desc':
        return (right.precio ?? Number.MIN_SAFE_INTEGER) - (left.precio ?? Number.MIN_SAFE_INTEGER) || this.compareText(left.nombre, right.nombre);
      case 'name_asc':
        return this.compareText(left.nombre, right.nombre);
      case 'name_desc':
        return this.compareText(right.nombre, left.nombre);
      case 'provider_name':
      default:
        return (
          this.compareText(left.nombreProveedor, right.nombreProveedor) ||
          this.compareText(left.nombre, right.nombre) ||
          (left.precio ?? 0) - (right.precio ?? 0)
        );
    }
  }

  private matchesPlanCatalogComposition(plan: PlanResponse, composition: PlanCatalogComposition): boolean {
    if (composition === 'ALL') {
      return true;
    }

    return this.resolvePlanCatalogComposition(plan) === composition;
  }

  private resolvePlanCatalogComposition(plan: PlanResponse): PlanCatalogComposition {
    const hasInternet = this.getPlanInternetSpeed(plan) !== null;
    const hasTelevision = this.getPlanTelevisionName(plan) !== null || this.getPlanTelevisionChannels(plan) !== null;
    const hasTelefono = this.getPlanPhoneDescription(plan) !== null || this.getPlanPhoneMinutes(plan) !== null;

    if (hasInternet && hasTelevision && hasTelefono) {
      return 'TRIPLE_PACK';
    }
    if (hasInternet && hasTelevision) {
      return 'INTERNET_TV';
    }
    if (hasInternet && hasTelefono) {
      return 'INTERNET_TELEFONIA';
    }
    if (hasTelevision && hasTelefono) {
      return 'TV_TELEFONIA';
    }
    if (hasInternet) {
      return 'SOLO_INTERNET';
    }
    if (hasTelevision) {
      return 'SOLO_TV';
    }
    if (hasTelefono) {
      return 'SOLO_TELEFONIA';
    }
    return 'ALL';
  }

  private resolvePlanCatalogCompositionLabel(composition: PlanCatalogComposition): string {
    switch (composition) {
      case 'SOLO_INTERNET':
        return 'Solo Internet';
      case 'INTERNET_TV':
        return 'Internet + TV';
      case 'INTERNET_TELEFONIA':
        return 'Internet + Telefonia';
      case 'TRIPLE_PACK':
        return 'Triple pack';
      case 'SOLO_TV':
        return 'Solo TV';
      case 'SOLO_TELEFONIA':
        return 'Solo Telefonia';
      case 'TV_TELEFONIA':
        return 'TV + Telefonia';
      case 'ALL':
      default:
        return 'Sin servicios';
    }
  }

  private compareText(left: unknown, right: unknown): number {
    return String(left ?? '').localeCompare(String(right ?? ''), 'es', { sensitivity: 'base' });
  }

  private parseIntegerInput(value: string): number | null {
    if (!/^\d+$/.test(value)) {
      return null;
    }

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }

  private parseDecimalInput(value: string): number | null {
    const normalized = value.replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private async saveAction<T>(
    action: () => import('rxjs').Observable<T>,
    successMessage: string,
    afterSuccess?: () => Promise<void>
  ): Promise<T | null> {
    if (!this.ensureCanMutate()) {
      return null;
    }

    this.isSaving.set(true);
    this.clearMessages();
    try {
      const result = await firstValueFrom(action());
      if (afterSuccess) {
        await afterSuccess();
      }
      if (successMessage) {
        this.successMessage.set(successMessage);
      }
      return result;
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'No se pudo completar la operacion.'));
    } finally {
      this.isSaving.set(false);
    }
    return null;
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private ensureCanMutate(): boolean {
    if (this.canMutateOperationalData()) {
      return true;
    }

    this.errorMessage.set('Marca tu asistencia para continuar.');
    return false;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const responseError = (error as { error?: { message?: string; error?: string } }).error;
      return responseError?.message ?? responseError?.error ?? fallback;
    }

    return fallback;
  }
}
