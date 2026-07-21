import { PageResponse } from '../common/page-response';

export type Direction = 'asc' | 'desc';
export type Etapa = 'PREVENTA' | 'VENTA' | 'POSTVENTA' | 'COBRANZA';
export type EstadoSeguimiento = 'NUEVO' | 'ASIGNADO' | 'EN_GESTION' | 'AGENDADO' | 'GESTIONADO';
export type BaseLead =
  | 'WHATSAPP'
  | 'MESSENGER'
  | 'RECONTACTO'
  | 'PREDICTIVO'
  | 'REFERIDO'
  | 'MASIVO'
  | 'SIN_IDENTIFICAR';

export interface PageQuery {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  direction: Direction;
}

export interface LeadPendienteResponse {
  id: number;
  prefijo: string;
  lead: string;
  estadoSeguimiento?: EstadoSeguimiento | string | null;
  lastEntryAt?: string | null;
}

export interface AsesorLeadsPendientesResponse {
  idAsesor: number;
  nombreAsesor: string;
  total: number;
  leads: LeadPendienteResponse[];
}

export interface AsesorSinLeadsResponse {
  idAsesor: number;
  sinLeadsDesde?: string | null;
}

export interface SupervisorVentasProveedorResumenResponse {
  idProveedor: number;
  nombreProveedor: string;
  cantidad: number;
}

export interface SupervisorVentasResumenResponse {
  idAsesor: number;
  nombreAsesor: string;
  asignadosActuales: number;
  gestionadosHoy: number;
  preventasHoy: number;
  preventasMes: number;
  preventasMesPorProveedor: SupervisorVentasProveedorResumenResponse[];
}

export interface SupervisorVentasReporteQuery {
  fechaDesde: string;
  fechaHasta: string;
}

export interface SupervisorVentasReporteProveedorCantidadResponse {
  idProveedor: number;
  nombreProveedor: string;
  cantidad: number;
}

export interface SupervisorVentasReporteAsesorResponse {
  idAsesor: number;
  nombreAsesor: string;
  preventasCompletas: number;
  ventasInstaladas: number;
  preventasPorProveedor: SupervisorVentasReporteProveedorCantidadResponse[];
  ventasInstaladasPorProveedor: SupervisorVentasReporteProveedorCantidadResponse[];
}

export interface SupervisorVentasReporteResponse {
  fechaDesde: string;
  fechaHasta: string;
  asesores: SupervisorVentasReporteAsesorResponse[];
}

export interface LeadGtrResponse {
  id: number;
  createdAt: string;
  lastEntryAt?: string | null;
  prefijo: string;
  lead: string;
  nombreCampana?: string | null;
  nombreProveedorCampana?: string | null;
  nombreProveedorEquipo?: string | null;
  numeroWhatsappEmpresa?: string | null;
  base?: BaseLead | string | null;
  nombreTitular?: string | null;
  numeroDocumentoTitularServicio?: string | null;
  direccionSnapshot?: string | null;
  primeraCodigoTipificacion?: string | null;
  primeraCodigoSubtipificacion?: string | null;
  mayorRangoCodigoTipificacion?: string | null;
  mayorRangoCodigoSubtipificacion?: string | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
  nombrePlanOfrecido?: string | null;
  nombreAsesorAsignado?: string | null;
  estadoSeguimiento?: EstadoSeguimiento | string | null;
  totalAsignaciones: number;
  tieneAlertaRegistrosDia?: boolean;
  tieneMultiplesRegistrosDia?: boolean;
  tieneRegistrosMismaCampanaDia?: boolean;
  // Etapa real del lead. En la bandeja diaria casi siempre PREVENTA; si es otra, es una atención GTR.
  etapa?: Etapa | string | null;
}

export type LeadGtrGroupType =
  | 'ASESOR'
  | 'CAMPANA'
  | 'ESTADO'
  | 'INGRESO'
  | 'PRIMERA_TIPIFICACION'
  | 'MAYOR_TIPIFICACION'
  | 'ULTIMA_TIPIFICACION';

export type LeadGtrGroupMode = 'SIN_AGRUPAR' | LeadGtrGroupType;
export type CampoTipificacion = 'PRIMERA' | 'MAYOR' | 'ULTIMA';

export interface LeadGtrGroupItemResponse {
  idGrupo?: number | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
  etiqueta: string;
  cantidad: number;
  sinValor: boolean;
  valor?: string | null;
}

export interface LeadGtrGroupsResponse {
  asesores: LeadGtrGroupItemResponse[];
  campanas: LeadGtrGroupItemResponse[];
  estados: LeadGtrGroupItemResponse[];
  primerasTipificaciones: LeadGtrGroupItemResponse[];
  mayoresTipificaciones: LeadGtrGroupItemResponse[];
  ultimasTipificaciones: LeadGtrGroupItemResponse[];
  ingresos?: LeadGtrGroupItemResponse[];
}

export interface LeadGtrGroupFilter {
  tipoGrupo?: LeadGtrGroupType;
  idGrupo?: number;
  estado?: EstadoSeguimiento | string;
  codigoTipificacion?: string;
  codigoSubtipificacion?: string;
  fechaIngreso?: string;
  sinValor?: boolean;
}

export interface LeadAgendadoGtrResponse {
  id: number;
  createdAt: string;
  prefijo: string;
  lead: string;
  nombreCampana?: string | null;
  nombreProveedorCampana?: string | null;
  nombreProveedorEquipo?: string | null;
  base?: BaseLead | string | null;
  nombreTitular?: string | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
  nombreAsesorAsignado?: string | null;
  nombreAsesorTipifico?: string | null;
  estadoSeguimiento?: EstadoSeguimiento | string | null;
  totalAsignaciones: number;
  fechaAgendamiento?: string | null;
  comentario?: string | null;
  horaProgramada?: string | null;
  fechaProgramacion?: string | null;
}

export interface AgendadosGtrResumenResponse {
  totalActivos: number;
  programadosHoyPorHora: Record<string, number>;
}

export interface MasivoLeadFilters {
  idProveedor?: number;
  etapa?: Etapa | string;
  codigosTipificacion?: string[];
  codigosSubtipificacion?: string[];
  campoTipificacion?: CampoTipificacion;
  fechaDesde?: string;
  fechaHasta?: string;
  tipoGrupo?: LeadGtrGroupType;
  estado?: EstadoSeguimiento | string;
  codigoTipificacion?: string;
  codigoSubtipificacion?: string;
  fechaIngreso?: string;
  sinValor?: boolean;
}

export interface LeadAsesorVentasResponse {
  id: number;
  fechaAsignacion?: string | null;
  prefijo: string;
  lead: string;
  idCampana?: number | null;
  nombreCampana?: string | null;
  // Snapshots del contacto (documento y direccion) que el GTR puede llenar, o el valor real de
  // preventa si ya existe: identifican el lead en la bandeja sin abrir el modal.
  numeroDocumento?: string | null;
  direccion?: string | null;
  // Origen del lead (logo de proveedor): campaña si la tiene; si no, el fallback del equipo del lead.
  nombreProveedorCampana?: string | null;
  nombreProveedorEquipo?: string | null;
  estadoSeguimiento?: EstadoSeguimiento | string | null;
  // Etapa real del lead y bandera de atención: si el lead no está en PREVENTA, el asesor lo atiende
  // en solo lectura y solo puede tipificarlo (informativo) o crear nuevas oportunidades.
  etapa?: Etapa | string | null;
  atencionOtraEtapa?: boolean;
}

export interface LeadVentaResponse {
  id: number;
  prefijo: string;
  lead: string;
  etapa?: Etapa | string | null;
  estadoSeguimiento?: EstadoSeguimiento | string | null;
  idAsesorAsignado?: number | null;
  nombreAsesorAsignado?: string | null;
  numeroDocumentoTitularServicio?: string | null;
  base?: BaseLead | string | null;
  idTipificacion?: number | null;
  codigoTipificacion?: string | null;
  idSubtipificacion?: number | null;
  codigoSubtipificacion?: string | null;
  nombrePlanSnapshot?: string | null;
  nombreProveedorSnapshot?: string | null;
  precioPlanSnapshot?: number | null;
  nombrePromocionInternaSnapshot?: string | null;
  precioAdicionalesSnapshot?: number | null;
  precioFinal?: number | null;
  diaCorteFacturacion?: number | null;
  mesesPermanenciaSnapshot?: number | null;
  createdAt?: string | null;
  lastEntryAt?: string | null;
  updatedAt?: string | null;
  totalAsignaciones?: number | null;
  fechaProgramacion?: string | null;
  horaProgramada?: string | null;
  sec?: string | null;
  sot?: string | null;
  requiereSecSotVenta?: boolean | null;
  // Enriquecimiento del plan ofrecido (velocidad regular y promocional) para la bandeja BackOffice.
  internetVelocidad?: number | null;
  internetUnidad?: string | null;
  velocidadPromocional?: number | null;
  mesesPromocionVelocidad?: number | null;
  // Fecha/hora de la ultima tipificacion del lead.
  ultimaTipificacionAt?: string | null;
}

export interface LeadGtrMetricasResponse {
  nuevos: number;
  sinGestionar: number;
  gestionados: number;
  preventas: number;
  ingresos: number;
}

export interface LeadGtrLookupResponse {
  existe: boolean;
  idLead?: number | null;
  prefijo?: string | null;
  lead?: string | null;
  etapaActual?: Etapa | string | null;
  estadoActual?: EstadoSeguimiento | string | null;
  puedeGestionarseEnGtr: boolean;
  // El lead está en otra etapa y el contacto no tiene ninguno en PREVENTA: al registrarlo solo se
  // asigna para que un asesor atienda la comunicación, sin afectar su gestión actual.
  atencionOtraEtapa?: boolean;
  mensajeUsuario?: string | null;
}

export interface LeadContextoLookupResponse {
  existe: boolean;
  idLead?: number | null;
  prefijo?: string | null;
  lead?: string | null;
  etapaActual?: Etapa | string | null;
  estadoActual?: EstadoSeguimiento | string | null;
  puedeGestionar: boolean;
  disponibleParaTomar: boolean;
  gestionadoPorOtroAsesor: boolean;
  nombreAsesorAsignado?: string | null;
  mensajeUsuario?: string | null;
}

// Catálogo de campos de captura cuya visibilidad/obligatoriedad varía por equipo (espejo del enum
// CampoConfigurable del backend). Los campos núcleo no entran aquí: van siempre visibles/obligatorios.
export type CampoCaptura =
  | 'NOMBRE_MADRE'
  | 'NOMBRE_PADRE'
  | 'DOC_TITULAR_CELULAR'
  | 'NOMBRE_TITULAR_CELULAR'
  | 'PLANO';

export interface CampoConfigItem {
  campo: CampoCaptura;
  tab: 'DATOS' | 'DIRECCION';
  descripcion: string;
  visible: boolean;
  requerido: boolean;
}

export interface LeadDetalleResponse extends LeadAsesorVentasResponse {
  lastEntryAt?: string | null;
  nombreCampana?: string | null;
  nombreProveedorCampana?: string | null;
  nombreProveedorEquipo?: string | null;
  base?: string | null;
  idAsesorAsignado?: number | null;
  nombreAsesorAsignado?: string | null;
  tipoDocumento?: string | null;
  numeroDocumentoTitularServicio?: string | null;
  // El detalle sí resuelve titular y correo desde datosPreventa (la bandeja ya no los expone). Se
  // declaran aquí porque el padre dejó de tenerlos al pasar a Documento/Direccion.
  nombreTitular?: string | null;
  correo?: string | null;
  celularRegistro?: string | null;
  celularReferencia?: string | null;
  nombreMadre?: string | null;
  nombrePadre?: string | null;
  numeroDocumentoTitularCelularRegistro?: string | null;
  nombreTitularCelularRegistro?: string | null;
  ubigeoNacimiento?: string | null;
  ubigeoDomicilio?: string | null;
  departamentoDomicilio?: string | null;
  provinciaDomicilio?: string | null;
  distritoDomicilio?: string | null;
  tipoDomicilio?: string | null;
  tipoVia?: string | null;
  via?: string | null;
  direccion?: string | null;
  referencia?: string | null;
  latitud?: string | null;
  longitud?: string | null;
  sec?: string | null;
  sot?: string | null;
  requiereSecSotVenta?: boolean | null;
  urbanizacion?: string | null;
  numero?: string | null;
  manzana?: string | null;
  lote?: string | null;
  nombreEdificio?: string | null;
  nombreCondominio?: string | null;
  plano?: string | null;
  piso?: string | null;
  interior?: string | null;
  idPlan?: number | null;
  nombrePlan?: string | null;
  nombreProveedorPlan?: string | null;
  precioPlan?: number | null;
  idPromocionInterna?: number | null;
  nombrePromocionInterna?: string | null;
  precioAdicionales?: number | null;
  precioFinal?: number | null;
  adicionales?: LeadAdicionalDetalleResponse[] | null;
  fechaProgramacion?: string | null;
  horaProgramada?: string | null;
  // Config de campos de captura resuelta por el backend según el equipo del lead (no inferida en el
  // front): por cada campo configurable, si se muestra y si es obligatorio para cerrar la venta.
  camposConfig?: CampoConfigItem[] | null;
}

export interface LeadAdicionalDetalleResponse {
  idAdicional?: number | null;
  nombreAdicional?: string | null;
  cantidad?: number | null;
  precioUnitario?: number | null;
  subtotal?: number | null;
}

export interface MisPreventaResponse {
  idEventoCierre: number;
  idLead: number;
  prefijo: string;
  lead: string;
  numeroDocumento?: string | null;
  fechaRegistro?: string | null;
  etapaActual?: Etapa | string | null;
  estadoPostventa?: string | null;
  estado?: string | null;
  fechaInstalacionRechazo?: string | null;
  // Ultima gestion de venta dentro del intento; queda disponible para auditoria visual futura.
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
}

export interface MisPreventasResumenResponse {
  cerradas: number;
  instaladas: number;
  rechazadas: number;
}

export interface LeadRealtimeEvent {
  tipo: string;
  idLead?: number;
  etapa?: Etapa | string | null;
  etapaAnterior?: Etapa | string | null;
  estado?: EstadoSeguimiento | string | null;
  idAsesorAsignado?: number | null;
  idAsesorAnterior?: number | null;
  codigoTipificacion?: string | null;
  codigoSubtipificacion?: string | null;
  idCampanaAnterior?: number | null;
  idCampanaNueva?: number | null;
  nombreCampanaAnterior?: string | null;
  nombreCampanaNueva?: string | null;
  eventosActualizados?: number;
  totalProcesados?: number;
  totalRegistrados?: number;
  totalFallidos?: number;
  occurredAt?: string | null;
}

export interface LeadIntakeRequest {
  prefijo: string;
  lead: string;
  idCampana?: number | null;
  base: string;
}

export interface LeadIntakeRetroactivoRequest extends LeadIntakeRequest {
  horaRegistro: string;
}

export interface LeadSnapshotsRequest {
  numeroDocumentoTitularServicio?: string | null;
  direccion?: string | null;
}

export interface LeadAsignacionRequest {
  idAsesorAsignado: number;
  nombreAsesorAsignado: string;
  confirmarReasignacion?: boolean;
  confirmarGestionPrevia?: boolean;
}

export interface LeadTomaGestionGtrRequest {
  confirmarReasignacion?: boolean;
  confirmarGestionPrevia?: boolean;
}

export interface LeadTomaVentaRequest {
  confirmarReasignacion?: boolean;
}

export interface LeadAsignacionMasivaRequest {
  idsLead: number[];
  idAsesorAsignado: number;
  nombreAsesorAsignado: string;
  confirmarReasignacion?: boolean;
}

export interface LeadAsignacionResultadoResponse {
  idLead: number;
  asignado: boolean;
  mensaje?: string | null;
}

export interface LeadAsignacionMasivaResponse {
  totalSolicitados: number;
  totalProcesados: number;
  totalAsignados: number;
  totalFallidos: number;
  resultados: LeadAsignacionResultadoResponse[];
}

export interface LeadIntakeMasivoExcelResultadoResponse {
  fila: number;
  lead?: string | null;
  idLead?: number | null;
  registrado: boolean;
  mensaje?: string | null;
  advertencias?: string[] | null;
  baseUsada?: BaseLead | string | null;
  idCampanaUsada?: number | null;
  campanaUsada?: string | null;
  campanaInferida: boolean;
}

export interface LeadIntakeMasivoExcelResponse {
  totalSolicitados: number;
  totalProcesados: number;
  totalRegistrados: number;
  totalFallidos: number;
  resultados: LeadIntakeMasivoExcelResultadoResponse[];
}

export interface LeadDatosPreventaRequest {
  tipoDocumento: string;
  numeroDocumentoTitularServicio: string;
  ubigeoNacimiento?: string | null;
  nombreTitularServicio?: string | null;
  celularRegistro?: string | null;
  celularReferencia?: string | null;
  correo?: string | null;
  nombreMadre?: string | null;
  nombrePadre?: string | null;
  numeroDocumentoTitularCelularRegistro?: string | null;
  nombreTitularCelularRegistro?: string | null;
}

export interface OportunidadHermana {
  id: number;
  numeroDocumentoTitular?: string | null;
  estado?: string | null;
  etapa?: string | null;
  nombreAsesorAsignado?: string | null;
  nombrePlanSnapshot?: string | null;
  lastEntryAt?: string | null;
}

export interface LeadDireccionRequest {
  ubigeoDomicilio: string;
  tipoDomicilio?: string | null;
  tipoVia?: string | null;
  via?: string | null;
  direccion: string;
  referencia?: string | null;
  latitud: string;
  longitud: string;
  urbanizacion?: string | null;
  numero?: string | null;
  manzana?: string | null;
  lote?: string | null;
  nombreEdificio?: string | null;
  nombreCondominio?: string | null;
  plano?: string | null;
  piso?: string | null;
  interior?: string | null;
}

export interface LeadOfertaAdicionalRequest {
  idAdicional: number;
  cantidad: number;
}

export interface LeadOfertaComercialRequest {
  idPlan?: number | null;
  idPromocionInterna?: number | null;
  adicionales?: LeadOfertaAdicionalRequest[] | null;
}

export interface LeadTipificacionRequest {
  codigoTipificacion: string;
  codigoSubtipificacion: string;
  comentario?: string | null;
  horaProgramada?: string | null;
}

export interface LeadTipificacionVentaRequest {
  codigoTipificacion: string;
  codigoSubtipificacion: string;
  comentario?: string | null;
  fechaInstalacion?: string | null;
  fechaProgramacion?: string | null;
  horaProgramada?: string | null;
  sec?: string | null;
  sot?: string | null;
}

export interface EventoResponse {
  id: number;
  idLead: number;
  // Numero de lead (humano). Solo lo pobla el listado de eventos por empleado.
  lead?: string | null;
  idCampana?: number | null;
  idActor?: number | null;
  nombreActor?: string | null;
  rolActor?: string | null;
  idAsesorAsignado?: number | null;
  nombreAsesorAsignado?: string | null;
  idPlanOfrecido?: number | null;
  accion?: string | null;
  etapa?: Etapa | string | null;
  tipificacion?: string | null;
  subtipificacion?: string | null;
  fechaInstalacion?: string | null;
  fechaProgramacion?: string | null;
  comentario?: string | null;
  horaProgramada?: string | null;
  createdAt?: string | null;
}

export interface CatalogoResponse {
  etapa: string;
  tipificaciones: TipificacionResponse[];
}

export interface TipificacionResponse {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
  subtipificaciones: SubtipificacionResponse[];
}

// Comportamientos data-driven que una subtipi puede disparar (espejo del enum del backend).
export type ComportamientoTipificacion =
  | 'REQUIERE_HORA_PROGRAMADA'
  | 'REQUIERE_FECHA_PROGRAMACION'
  | 'REQUIERE_FECHA_INSTALACION'
  | 'REQUIERE_SEC_SOT'
  | 'RECIBE_MERITO'
  | 'ES_CIERRE_PREVENTA'
  | 'APARECE_EN_AGENDADOS_GTR'
  | 'ES_CANCELACION_PROGRAMACION';

export interface SubtipificacionResponse {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
  etapaCambio?: string | null;
  estadoPostventaCambio?: string | null;
  comportamientos?: ComportamientoTipificacion[];
}

export interface SubtipificacionCatalogoRequest {
  id?: number | null;
  codigo: string;
  descripcion: string;
  orden: number;
  etapaCambio?: string | null;
  estadoPostventaCambio?: string | null;
  comportamientos?: ComportamientoTipificacion[];
}

export interface TipificacionCatalogoRequest {
  id?: number | null;
  codigo: string;
  descripcion: string;
  orden: number;
  subtipificaciones: SubtipificacionCatalogoRequest[];
}

export interface CatalogoRequest {
  etapa: string;
  // Equipo dueño de la matriz: cada equipo tiene su propia matriz por etapa.
  idEquipo: number;
  tipificaciones: TipificacionCatalogoRequest[];
}

export type MatrizCatalogoRequest = CatalogoRequest;

// Clona la matriz de una etapa desde un equipo origen a uno destino.
export interface ClonarMatrizRequest {
  etapa: string;
  idEquipoOrigen: number;
  idEquipoDestino: number;
}

export interface CatalogoEstadoRequest {
  etapa: string;
  idEquipo: number;
  tipificacionesActivar: number[];
  tipificacionesDesactivar: number[];
  subtipificacionesActivar: number[];
  subtipificacionesDesactivar: number[];
}

export interface CampanaResponse {
  id: number;
  nombre: string;
  numeroWhatsappEmpresa?: string;
  idProveedor?: number;
  nombreProveedor?: string;
  activo?: boolean;
}

export interface PlanResponse {
  id: number;
  nombre: string;
  precio?: number;
  precioPromocional?: number | null;
  mesesPromocionPrecio?: number | null;
  idProveedor?: number;
  nombreProveedor?: string;
  idZona?: number | null;
  nombreZona?: string | null;
  activo?: boolean;
  // Internet
  internetVelocidad?: number | null;
  internetUnidad?: string | null;
  internetTecnologia?: string | null;
  velocidadPromocional?: number | null;
  mesesPromocionVelocidad?: number | null;
  // Television
  televisionNombre?: string | null;
  televisionCanales?: number | null;
  // Telefono
  telefonoMinutos?: number | null;
  telefonoDescripcion?: string | null;
  // Vigencia
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
}

export interface PromocionComercialResponse {
  id: number;
  reglaComercial: string;
  idProveedor?: number;
  nombreProveedor?: string;
  idZona?: number | null;
  nombreZona?: string | null;
  idsPlanes?: number[];
  nombresPlanes?: string[];
}

export interface AdicionalResponse {
  id: number;
  nombre: string;
  precioUnitario?: number;
  idProveedor?: number;
  nombreProveedor?: string;
}

export interface ZonaResponse {
  id: number;
  nombre: string;
  activo?: boolean;
}

export interface UbigeoItem {
  id: number;
  nombre: string;
  codigo?: string;
}

export type LeadPage<T> = PageResponse<T>;

export interface GtrRankingAsesorResponse {
  idAsesor: number;
  nombreAsesor: string | null;
  nuevosGestionadosPeriodo: number;
  asignadosPeriodo: number;
  gestionadosPeriodo: number;
  nuevasOportunidadesPeriodo: number;
  preventasPeriodo: number;
  preventasMes: number;
  preventasMesPorProveedor: { idProveedor: number; nombreProveedor: string; cantidad: number }[];
}

export interface GtrTipificacionCampanaResponse {
  idCampana: number;
  nombreCampana: string;
  codigoTipificacion: string | null;
  codigoSubtipificacion: string | null;
  cantidad: number;
  porcentaje: number;
}

export interface GtrTipificacionRankingResponse {
  codigoTipificacion: string;
  cantidad: number;
  porcentaje: number;
}

export interface GtrSubtipificacionRankingResponse {
  codigoSubtipificacion: string;
  cantidad: number;
  porcentaje: number;
}
