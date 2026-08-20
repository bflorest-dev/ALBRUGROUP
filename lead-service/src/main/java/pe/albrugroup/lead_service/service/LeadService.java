package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.*;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.CampoConfigurable;
import pe.albrugroup.lead_service.entity.enums.CampoTipificacion;
import pe.albrugroup.lead_service.entity.enums.ModoConteo;
import pe.albrugroup.lead_service.entity.enums.OrdenRankingAsesor;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.CriterioZona;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoVenta;
import pe.albrugroup.lead_service.entity.enums.TipoNumeroLlamada;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionMasivaRequest;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionRequest;
import pe.albrugroup.lead_service.entity.request.LeadDatosPreventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadDireccionRequest;
import pe.albrugroup.lead_service.entity.request.LeadIdentidadRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRetroactivoRequest;
import pe.albrugroup.lead_service.entity.request.LeadNumeroParaLlamarRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaAdicionalRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaComercialRequest;
import pe.albrugroup.lead_service.entity.request.LeadSnapshotsRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionPostventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionVentaRequest;
import pe.albrugroup.lead_service.entity.request.LeadTomaGestionGtrRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.AsesorLeadsPendientesResponse;
import pe.albrugroup.lead_service.entity.response.CampoConfigResponse;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;
import pe.albrugroup.lead_service.entity.response.AsesorSinLeadsResponse;
import pe.albrugroup.lead_service.entity.response.LeadPendienteResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsignacionMasivaResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsignacionResultadoResponse;
import pe.albrugroup.lead_service.entity.response.LeadAdicionalDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadPlanDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadPromocionDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsesorVentasResponse;
import pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse;
import pe.albrugroup.lead_service.entity.response.AgendadosGtrResumenResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrMetricasResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionItemResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionesResponse;
import pe.albrugroup.lead_service.entity.response.LeadVentaAgrupacionesResponse;
import pe.albrugroup.lead_service.entity.response.LeadContextoLookupResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrLookupResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.InternetResponse;
import pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent;
import pe.albrugroup.lead_service.entity.response.MisPreventaResponse;
import pe.albrugroup.lead_service.entity.response.MisPreventasResumenResponse;
import pe.albrugroup.lead_service.entity.response.NumeroLlamadaResponse;
import pe.albrugroup.lead_service.entity.response.OportunidadHermanaResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.PlanAdicionalResponse;
import pe.albrugroup.lead_service.entity.response.PlanResponse;
import pe.albrugroup.lead_service.entity.response.GtrRankingAsesorResponse;
import pe.albrugroup.lead_service.entity.response.GtrTipificacionCampanaResponse;
import pe.albrugroup.lead_service.entity.response.GtrTipificacionRankingResponse;
import pe.albrugroup.lead_service.entity.response.GtrSubtipificacionRankingResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorVentasProveedorResumenResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorVentasResumenResponse;
import pe.albrugroup.lead_service.repository.projection.CampanaTipificacionCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.TipificacionCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.SubtipificacionCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.LeadGtrAgrupacionProjection;
import pe.albrugroup.lead_service.entity.response.TelefonoResponse;
import pe.albrugroup.lead_service.entity.response.TelevisionResponse;
import pe.albrugroup.lead_service.exception.BusinessException;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.exception.UnauthorizedException;
import pe.albrugroup.lead_service.repository.AdicionalRepository;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.ContactoRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.DistritoRepository;
import pe.albrugroup.lead_service.repository.EncuestaPostventaRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.PagoPostventaRepository;
import pe.albrugroup.lead_service.repository.PlanRepository;
import pe.albrugroup.lead_service.repository.PlataformaRepository;
import pe.albrugroup.lead_service.repository.PromocionComercialRepository;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.repository.ZonaReglaRepository;
import pe.albrugroup.lead_service.service.mapper.LeadMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final ContactoRepository contactoRepository;
    private final EquipoProveedorRepository equipoProveedorRepository;
    private final EquipoCampoService equipoCampoService;
    private final CampanaRepository campanaRepository;
    private final EventoRepository eventoRepository;
    private final LeadEtapaResumenRepository leadEtapaResumenRepository;
    private final EventoService eventoService;
    private final CurrentUser currentUser;
    private final PlanRepository planRepository;
    private final PlataformaRepository plataformaRepository;
    private final PagoPostventaRepository pagoPostventaRepository;
    private final EncuestaPostventaRepository encuestaPostventaRepository;
    private final PromocionComercialRepository promocionComercialRepository;
    private final AdicionalRepository adicionalRepository;
    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final TipificacionService tipificacionService;
    private final LeadMapper leadMapper;
    private final DistritoRepository distritoRepository;
    private final ZonaReglaRepository zonaReglaRepository;
    private final PaginationService paginationService;
    private final TransactionTemplate transactionTemplate;
    private final LeadRealtimeNotifier leadRealtimeNotifier;
    private final LeadAsignacionCounterService leadAsignacionCounterService;
    private final LeadEtapaResumenService leadEtapaResumenService;
    private final CalendarioFacturacionPostventaService calendarioFacturacionPostventaService;
    private final FacturacionPostventaService facturacionPostventaService;
    private final PostventaAsesorProveedorService postventaAsesorProveedorService;
    private final PlanService planService;
    private final AuthEquipoClient authEquipoClient;

    // La bandeja de Agendados GTR ya no cuelga de una tipi: el concepto vive en el comportamiento, que
    // cada equipo marca en las subtipis que correspondan (hoy, varias de NO DESEA).
    private static final ComportamientoTipificacion COMPORTAMIENTO_AGENDADO =
            ComportamientoTipificacion.APARECE_EN_AGENDADOS_GTR;
    private static final ComportamientoTipificacion COMPORTAMIENTO_CIERRE_PAGO_POSTVENTA =
            ComportamientoTipificacion.CIERRA_PERIODO_PAGO_CONFIRMADO;
    private static final ComportamientoTipificacion COMPORTAMIENTO_CIERRE_BAJA_POSTVENTA =
            ComportamientoTipificacion.CIERRA_PERIODO_BAJA;
    private static final String TIPIFICACION_PROGRAMADO = "PROGRAMADO";
    private static final Pattern NUMERO_LLAMADA_PATTERN = Pattern.compile("^9\\d{8}$");
    private static final String SUBTIPIFICACION_PROGRAMACION_CANCELADA = "PROGRAMACION_CANCELADA";
    private static final String TIPIFICACION_RETORNO_VENTA_PREVENTA = "NO DESEA";
    private static final String SUBTIPIFICACION_RETORNO_VENTA_PREVENTA = "PREVENTA DESAPROBADA";
    // "Cerró la preventa hacia venta": las subtipis con este comportamiento (COMPLETA y los PENDIENTE
    // que avanzan por causa del cliente). Reemplaza al viejo par PREVENTA_COMPLETA / VENTA_CERRADA, que
    // era una sola subtipi antes de que la etapa se abriera en matices.
    private static final ComportamientoTipificacion COMPORTAMIENTO_CIERRE_PREVENTA =
            ComportamientoTipificacion.ES_CIERRE_PREVENTA;
    private static final Instant MIS_PREVENTAS_FECHA_HASTA_ABIERTA = Instant.parse("9999-01-01T00:00:00Z");
    // Tope de gestiones que un asesor puede tener "aparcadas" (EN_GESTION) al mismo tiempo. Permite
    // trabajar varios leads en paralelo cuando alguno se retrasa, pero fuerza a cerrar antes de
    // seguir acumulando. Se valida en backend porque el asesor puede abrir varias pestañas que no
    // comparten estado entre sí.
    private static final long MAX_GESTIONES_SIMULTANEAS = 3;
    private static final LocalTime HORA_MINIMA_REGISTRO_RETROACTIVO = LocalTime.of(18, 0);
    private static final LocalTime HORA_MAXIMA_REGISTRO_RETROACTIVO = LocalTime.of(23, 59);
    private static final Pattern PREFIJO_PATTERN = Pattern.compile("^\\+\\d{1,3}$");
    private static final Pattern LEAD_PATTERN = Pattern.compile("^\\d{6,15}$");
    private static final Pattern USERMETA_PATTERN = Pattern.compile("^[A-Za-z0-9._-]{1,255}$");
    private static final List<Accion> ACCIONES_GESTION_LEAD = List.of(Accion.CONTACTO, Accion.TIPIFICACION);
    private static final Set<Base> ORIGENES_CON_CAMPANA = Set.of(Base.WHATSAPP, Base.MESSENGER);
    private static final Set<Base> ORIGENES_SIN_CAMPANA = Set.of(
            Base.RECONTACTO,
            Base.PREDICTIVO,
            Base.REFERIDO,
            Base.MASIVO,
            Base.SIN_IDENTIFICAR
    );
    private static final Set<String> LEAD_GTR_SORT_FIELDS = Set.of(
            "lastEntryAt",
            "createdAt",
            "primeraTipificacion",
            "mayorTipificacion",
            "ultimaTipificacion",
            "totalAsignacionesPreventa",
            "totalAsignacionesHoyPreventa",
            "estado"
    );
    private static final Set<String> LEAD_AGENDADOS_GTR_SORT_FIELDS = Set.of(
            "programado",
            "agendado",
            "tipificacion",
            "estado"
    );
    private static final Set<String> LEAD_ASESOR_SORT_FIELDS = Set.of(
            "lastEntryAt", "createdAt", "lead", "estado"
    );
    // Roles que pueden figurar en el ranking de asesores GTR. Se excluyen backoffice, migración y
    // cualquier otro rol que haya tocado leads de PREVENTA sin ser parte de la operación de ventas/GTR.
    private static final Set<String> ROLES_RANKING_ASESOR_GTR = Set.of(
            "ASESOR_VENTAS", "OJT", "SUPERVISOR_VENTAS", "ASESOR_GTR", "SUPERVISOR_GTR"
    );

    public PageResponse<LeadGtrResponse> listarBandejaGtr(
            LocalDate fecha,
            String lead,
            TipoGrupoGtr tipoGrupo,
            Long idGrupo,
            EstadoSeguimiento estadoGrupo,
            String codigoTipificacion,
            String codigoSubtipificacion,
            boolean sinValor,
            Long idEquipo,
            PageRequest pageRequest
    ) {
        boolean buscandoPorLead = lead != null && !lead.isBlank();
        String busquedaNormalizada = normalizarBusquedaIdentidad(lead);
        String leadPattern = (buscandoPorLead ? busquedaNormalizada : "") + "%";
        OperationalDateTime.InstantRange rangoDia = buscandoPorLead
                ? new OperationalDateTime.InstantRange(Instant.EPOCH, Instant.ofEpochSecond(253402300799L))
                : OperationalDateTime.dayRange(fecha);
        validarFiltroAgrupacionGtr(tipoGrupo, idGrupo, estadoGrupo, codigoTipificacion, sinValor);

        LeadOrderingRules.validarPageRequest(pageRequest, LEAD_GTR_SORT_FIELDS);
        boolean sortDesc = LeadOrderingRules.isDesc(pageRequest);
        var estadoOrden = LeadOrderingRules.estadoSeguimientoOrden();
        var pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPageNumber(),
                pageRequest.getPageSize()
        );
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);
        Page<LeadGtrResponse> leads = tipoGrupo == null
                ? leadRepository.listarBandejaGtr(
                        Etapa.PREVENTA,
                        leadPattern,
                        rangoDia.inicio(),
                        rangoDia.fin(),
                        equipos.filtrar(),
                        equipos.ids(),
                        pageRequest.getSortBy(),
                        sortDesc,
                        estadoOrden.nuevo(),
                        estadoOrden.enGestion(),
                        estadoOrden.asignado(),
                        estadoOrden.gestionado(),
                        pageable
                )
                : leadRepository.listarBandejaGtrFiltrada(
                        Etapa.PREVENTA,
                        leadPattern,
                        rangoDia.inicio(),
                        rangoDia.fin(),
                        tipoGrupo == TipoGrupoGtr.ASESOR,
                        tipoGrupo == TipoGrupoGtr.ESTADO,
                        tipoGrupo == TipoGrupoGtr.CAMPANA,
                        tipoGrupo == TipoGrupoGtr.PRIMERA_TIPIFICACION,
                        tipoGrupo == TipoGrupoGtr.ULTIMA_TIPIFICACION,
                        tipoGrupo == TipoGrupoGtr.MAYOR_TIPIFICACION,
                        idGrupo,
                        estadoGrupo,
                        normalizarCodigoAgrupacion(codigoTipificacion),
                        normalizarCodigoAgrupacion(codigoSubtipificacion),
                        sinValor,
                        equipos.filtrar(),
                        equipos.ids(),
                        pageRequest.getSortBy(),
                        sortDesc,
                        estadoOrden.nuevo(),
                        estadoOrden.enGestion(),
                        estadoOrden.asignado(),
                        estadoOrden.gestionado(),
                        pageable
                );
        aplicarTotalesAsignacionPreventa(
                leads.getContent(),
                LeadGtrResponse::getId,
                this::setTotalesAsignacion,
                this::setTotalesAsignacionPreventa,
                this::setTotalesAsignacionHoyPreventa,
                OperationalDateTime.dayRange(fecha)
        );
        if (!buscandoPorLead) {
            aplicarAlertasRegistrosDia(leads.getContent(), rangoDia.inicio(), rangoDia.fin());
        }
        return PageResponse.from(leads);
    }

    public LeadGtrAgrupacionesResponse listarAgrupacionesBandejaGtr(LocalDate fecha, Long idEquipo) {
        OperationalDateTime.InstantRange rangoDia = OperationalDateTime.dayRange(fecha);
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);
        return new LeadGtrAgrupacionesResponse(
                mapearAgrupaciones(
                        leadRepository.agruparBandejaGtrPorAsesor(
                                Etapa.PREVENTA, rangoDia.inicio(), rangoDia.fin(), equipos.filtrar(), equipos.ids()),
                        "Sin asignar"
                ),
                mapearAgrupaciones(
                        leadRepository.agruparBandejaGtrPorCampana(
                                Etapa.PREVENTA, rangoDia.inicio(), rangoDia.fin(), equipos.filtrar(), equipos.ids()),
                        "Sin campaña"
                ),
                // La bandeja GTR ya está acotada al equipo del usuario; no se agrupa por equipo.
                List.of(),
                mapearAgrupacionesPorEtiqueta(
                        leadRepository.agruparBandejaGtrPorEstado(
                                Etapa.PREVENTA, rangoDia.inicio(), rangoDia.fin(), equipos.filtrar(), equipos.ids())
                ),
                mapearAgrupacionesTipificacion(
                        leadRepository.agruparBandejaGtrPorPrimeraTipificacion(
                                Etapa.PREVENTA,
                                rangoDia.inicio(),
                                rangoDia.fin(),
                                equipos.filtrar(),
                                equipos.ids()
                        )
                ),
                mapearAgrupacionesTipificacion(
                        leadRepository.agruparBandejaGtrPorMayorTipificacion(
                                Etapa.PREVENTA,
                                rangoDia.inicio(),
                                rangoDia.fin(),
                                equipos.filtrar(),
                                equipos.ids()
                        )
                ),
                mapearAgrupacionesTipificacion(
                        leadRepository.agruparBandejaGtrPorUltimaTipificacion(
                                Etapa.PREVENTA,
                                rangoDia.inicio(),
                                rangoDia.fin(),
                                equipos.filtrar(),
                                equipos.ids()
                        )
                ),
                List.of(),
                // La bandeja GTR no usa el total de registros del día (es exclusivo de "Leads del día").
                null
        );
    }

    public LeadGtrLookupResponse buscarContextoLeadGtr(String lead) {
        String buscar = lead == null ? null : lead.trim();
        if (buscar == null || buscar.isBlank()) {
            throw new BadRequestException("Ingresa un telefono o usermeta para buscar el lead");
        }

        boolean buscarPorUsermeta = esBusquedaUsermeta(buscar);
        String numeroLead = buscarPorUsermeta ? null : normalizarLead(buscar);
        String usermeta = buscarPorUsermeta ? normalizarUsermeta(buscar) : null;
        if (buscarPorUsermeta) {
            validarIdentidadIntake(null, null, usermeta);
        } else if (!LEAD_PATTERN.matcher(numeroLead).matches()) {
            throw new BadRequestException("El lead debe contener solo digitos y tener entre 6 y 15 caracteres");
        }

        Optional<Lead> leadEncontrado = buscarPorUsermeta
                ? leadRepository.findFirstByUsermetaIgnoreCaseOrderByLastEntryAtDescIdDesc(usermeta)
                : leadRepository.findFirstByLeadOrderByLastEntryAtDescIdDesc(numeroLead);

        return leadEncontrado
                .map(this::mapearContextoLeadGtr)
                .orElseGet(() -> new LeadGtrLookupResponse(
                        false,
                        null,
                        null,
                        numeroLead,
                        usermeta,
                        null,
                        null,
                        false,
                        false,
                        "No encontramos ese lead en el sistema."
                ));
    }

    public LeadContextoLookupResponse buscarContextoLeadVenta(String lead) {
        BusquedaVentaFiltro busqueda = resolverBusquedaVenta(lead);
        if (!busqueda.buscando()) {
            throw new BadRequestException("El lead, documento o usermeta es obligatorio");
        }

        List<Lead> encontrados = busqueda.buscarPorUsermeta()
                ? leadRepository.buscarPorUsermeta(busqueda.valor())
                : leadRepository.buscarPorLeadODocumento(busqueda.valor());

        return encontrados.stream().findFirst()
                .map(this::mapearContextoLeadVenta)
                .orElseGet(() -> new LeadContextoLookupResponse(
                        false,
                        null,
                        null,
                        busqueda.valor(),
                        null,
                        null,
                        false,
                        false,
                        false,
                        null,
                        "No encontramos ese lead en el sistema."
                ));
    }

    /**
     * Lista, agrupados por asesor, los leads que siguen en manos de un asesor (ASIGNADO o
     * EN_GESTION en PREVENTA). El GTR cruza este resultado con la presencia en vivo para
     * detectar a los asesores ausentes que dejaron leads sin atender.
     */
    public List<AsesorLeadsPendientesResponse> listarLeadsPendientesPorAsesor() {
        RankingEquipoScope equipos = resolverEquiposActuales();
        List<Lead> leads = leadRepository.listarPendientesGtrPorAsesor(
                Etapa.PREVENTA,
                List.of(EstadoSeguimiento.ASIGNADO, EstadoSeguimiento.EN_GESTION),
                equipos.filtrar(),
                equipos.ids()
        );

        Map<Long, AsesorLeadsPendientesResponse> porAsesor = new LinkedHashMap<>();
        for (Lead lead : leads) {
            AsesorLeadsPendientesResponse grupo = porAsesor.computeIfAbsent(
                    lead.getIdAsesorAsignado(),
                    id -> AsesorLeadsPendientesResponse.builder()
                            .idAsesor(id)
                            .nombreAsesor(lead.getNombreAsesorAsignado())
                            .total(0)
                            .leads(new ArrayList<>())
                            .build()
            );
            grupo.getLeads().add(LeadPendienteResponse.builder()
                    .id(lead.getId())
                    .prefijo(lead.getPrefijo())
                    .lead(lead.getLead())
                    .usermeta(lead.getUsermeta())
                    .estadoSeguimiento(lead.getEstado())
                    .lastEntryAt(lead.getLastEntryAt())
                    .build());
            grupo.setTotal(grupo.getTotal() + 1);
        }

        return new ArrayList<>(porAsesor.values());
    }

    /**
     * Para cada asesor pedido, indica desde cuándo NO tiene leads para gestionar (0 leads
     * ASIGNADO/EN_GESTION en PREVENTA): sinLeadsDesde = createdAt de su último evento de lead.
     * Si actualmente tiene leads pendientes, sinLeadsDesde es null.
     */
    public List<AsesorSinLeadsResponse> listarSinLeadsDesde(List<Long> idsAsesor) {
        if (idsAsesor == null || idsAsesor.isEmpty()) {
            return List.of();
        }

        RankingEquipoScope equipos = resolverEquiposActuales();
        Set<Long> conLeads = leadRepository.resumirAsignadosActualesPorAsesor(
                        Etapa.PREVENTA,
                        List.of(EstadoSeguimiento.ASIGNADO, EstadoSeguimiento.EN_GESTION),
                        true,
                        idsAsesor,
                        equipos.filtrar(),
                        equipos.ids()
                ).stream()
                .map(row -> row.getIdAsesor())
                .collect(java.util.stream.Collectors.toSet());

        // "Sin leads desde" = cuándo terminó (tipificó) su último lead, no cuándo se lo asignaron.
        Map<Long, Instant> ultimoEvento = eventoRepository
                .ultimoEventoPorActorYAccion(idsAsesor, Accion.TIPIFICACION).stream()
                .filter(row -> row.getIdAsesor() != null && row.getUltimo() != null)
                .collect(java.util.stream.Collectors.toMap(row -> row.getIdAsesor(), row -> row.getUltimo()));

        List<AsesorSinLeadsResponse> resultado = new ArrayList<>();
        for (Long idAsesor : idsAsesor) {
            Instant sinLeadsDesde = conLeads.contains(idAsesor) ? null : ultimoEvento.get(idAsesor);
            resultado.add(AsesorSinLeadsResponse.builder()
                    .idAsesor(idAsesor)
                    .sinLeadsDesde(sinLeadsDesde)
                    .build());
        }
        return resultado;
    }

    public LeadGtrMetricasResponse obtenerMetricasGtr(LocalDate fecha, Long idEquipo) {
        OperationalDateTime.InstantRange rangoDia = OperationalDateTime.dayRange(fecha);
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);

        long nuevos = leadRepository.contarMetricasGtrPorEstado(
                Etapa.PREVENTA,
                EstadoSeguimiento.NUEVO,
                rangoDia.inicio(),
                rangoDia.fin(),
                equipos.filtrar(),
                equipos.ids()
        );
        long sinGestionar = leadRepository.contarMetricasGtrPorEstado(
                Etapa.PREVENTA,
                EstadoSeguimiento.ASIGNADO,
                rangoDia.inicio(),
                rangoDia.fin(),
                equipos.filtrar(),
                equipos.ids()
        );
        long gestionados = eventoRepository.contarGestionadosGtr(
                Etapa.PREVENTA,
                ACCIONES_GESTION_LEAD,
                COMPORTAMIENTO_CIERRE_PREVENTA,
                rangoDia.inicio(),
                rangoDia.fin(),
                equipos.filtrar(),
                equipos.ids()
        );
        long preventas = eventoRepository.contarPreventasGtr(
                Accion.TIPIFICACION,
                COMPORTAMIENTO_CIERRE_PREVENTA,
                rangoDia.inicio(),
                rangoDia.fin(),
                equipos.filtrar(),
                equipos.ids()
        );
        long ingresos = eventoRepository.contarIngresosGtr(
                Accion.REGISTRO,
                rangoDia.inicio(),
                rangoDia.fin(),
                equipos.filtrar(),
                equipos.ids()
        );

        return new LeadGtrMetricasResponse(nuevos, sinGestionar, gestionados, preventas, ingresos);
    }

    public PageResponse<LeadAgendadoGtrResponse> listarAgendadosGtr(PageRequest pageRequest, Long idEquipo) {
        Page<LeadAgendadoGtrResponse> leads = listarAgendadosGtrOrdenados(pageRequest, idEquipo);
        aplicarTotalesAsignacionPreventa(
                leads.getContent(),
                LeadAgendadoGtrResponse::getId,
                this::setTotalesAsignacion,
                this::setTotalesAsignacionPreventa,
                this::setTotalesAsignacionHoyPreventa,
                OperationalDateTime.dayRange(OperationalDateTime.today())
        );
        return PageResponse.from(leads);
    }

    public AgendadosGtrResumenResponse obtenerResumenAgendadosGtr(Long idEquipo) {
        java.time.LocalDate hoy = OperationalDateTime.today();
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);
        Map<String, Long> programadosHoyPorHora = new LinkedHashMap<>();
        for (int hora = 0; hora < 24; hora++) {
            programadosHoyPorHora.put(String.format("%02d", hora), 0L);
        }

        // Programados para HOY = citas cuya fecha_programacion cae hoy, sin importar cuando se
        // tipificaron (un agendado de ayer con hora ya pasada quedo programado para hoy). Se agrupa
        // por la hora de la cita para poder avisar cuando hay citas en la hora en curso.
        leadRepository.contarAgendadosGtrHoyPorHora(
                        Etapa.PREVENTA,
                        COMPORTAMIENTO_AGENDADO,
                        Accion.TIPIFICACION,
                        hoy,
                        equipos.filtrar(),
                        equipos.ids())
                .forEach(item -> programadosHoyPorHora.merge(
                        String.format("%02d", item.getHoraProgramada().getHour()),
                        item.getCantidad(),
                        Long::sum));

        long totalActivos = leadRepository.contarAgendadosGtrActivos(
                Etapa.PREVENTA, COMPORTAMIENTO_AGENDADO, Accion.TIPIFICACION, equipos.filtrar(), equipos.ids());
        return new AgendadosGtrResumenResponse(totalActivos, programadosHoyPorHora);
    }

    private Page<LeadAgendadoGtrResponse> listarAgendadosGtrOrdenados(PageRequest pageRequest, Long idEquipo) {
        LeadOrderingRules.validarDirection(pageRequest.getDirection());
        String sortBy = normalizarSortByAgendadosGtr(pageRequest.getSortBy());
        if (!LEAD_AGENDADOS_GTR_SORT_FIELDS.contains(sortBy)) {
            throw new BadRequestException("Campo de ordenamiento no permitido: " + pageRequest.getSortBy());
        }
        boolean desc = LeadOrderingRules.isDesc(pageRequest);
        var estadoOrden = LeadOrderingRules.estadoSeguimientoOrden();
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);
        var pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPageNumber(),
                pageRequest.getPageSize()
        );

        return leadRepository.listarLeadsAgendadosGtrOrdenados(
                Etapa.PREVENTA,
                COMPORTAMIENTO_AGENDADO,
                Accion.TIPIFICACION,
                equipos.filtrar(),
                equipos.ids(),
                sortBy,
                desc,
                estadoOrden.nuevo(),
                estadoOrden.enGestion(),
                estadoOrden.asignado(),
                estadoOrden.gestionado(),
                pageable
        );
    }

    private String normalizarSortByAgendadosGtr(String sortBy) {
        return "createdAt".equals(sortBy) ? "programado" : sortBy;
    }

    public PageResponse<LeadResponse> listarBandejaVenta(
            String lead,
            TipoGrupoVenta tipoGrupo,
            List<String> valoresGrupo,
            boolean sinValor,
            Long idEquipo,
            PageRequest pageRequest
    ) {
        BusquedaVentaFiltro busqueda = resolverBusquedaVenta(lead);
        boolean filtrarVentana = !busqueda.buscando();
        Instant inicioVentana = OperationalDateTime.now().minus(30, ChronoUnit.DAYS);
        GrupoVentaFiltro grupo = resolverFiltroGrupoVenta(tipoGrupo, valoresGrupo, sinValor);
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);
        // El orden lo fija la propia query (lastEntryAt DESC, id DESC): Pageable sin sort para no
        // agregar un ORDER BY extra que descuadre el orden y la paginacion entre paginas.
        Page<LeadResponse> leads = leadRepository.listarBandejaVenta(
                Etapa.VENTA,
                busqueda.searchPattern(),
                busqueda.buscarPorUsermeta(),
                filtrarVentana,
                inicioVentana,
                grupo.filtrar(),
                grupo.tipo(),
                grupo.valores(),
                grupo.sinValor(),
                Accion.TIPIFICACION,
                equipos.filtrar(),
                equipos.ids(),
                org.springframework.data.domain.PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize())
        );
        aplicarTotalesAsignacion(leads.getContent(), LeadResponse::getId, LeadResponse::setTotalAsignaciones);
        return PageResponse.from(leads);
    }

    public LeadVentaAgrupacionesResponse listarAgrupacionesBandejaVenta(String lead, Long idEquipo) {
        BusquedaVentaFiltro busqueda = resolverBusquedaVenta(lead);
        boolean filtrarVentana = !busqueda.buscando();
        Instant inicioVentana = OperationalDateTime.now().minus(30, ChronoUnit.DAYS);
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);
        return mapearAgrupacionesVenta(
                busqueda.searchPattern(),
                busqueda.buscarPorUsermeta(),
                filtrarVentana,
                inicioVentana,
                null,
                equipos
        );
    }

    public PageResponse<LeadResponse> listarLeadsVentaProgramadosAsignados(PageRequest pageRequest, Long idEquipo) {
        LocalDate hoy = OperationalDateTime.today();
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);
        Page<LeadResponse> leads = leadRepository.listarLeadsProgramadosVentaAsignados(
                Etapa.VENTA,
                TIPIFICACION_PROGRAMADO,
                SUBTIPIFICACION_PROGRAMACION_CANCELADA,
                Accion.TIPIFICACION,
                hoy,
                equipos.filtrar(),
                equipos.ids(),
                org.springframework.data.domain.PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize())
        );
        aplicarTotalesAsignacion(leads.getContent(), LeadResponse::getId, LeadResponse::setTotalAsignaciones);
        return PageResponse.from(leads);
    }

    public PageResponse<LeadAsesorVentasResponse> listarBandejaAsesorVentas(PageRequest pageRequest) {
        return listarBandejaAsesorVentas(currentUser.empleadoID(), pageRequest);
    }

    public PageResponse<LeadAsesorVentasResponse> listarBandejaAsesorVentas(Long idAsesor, PageRequest pageRequest) {
        Page<Lead> leads = obtenerLeadsPendientesAsesorVentas(idAsesor, pageRequest);
        return mapearBandejaAsesorVentas(leads);
    }

    public List<SupervisorVentasResumenResponse> listarResumenSupervisorVentas(List<Long> idsAsesor) {
        LocalDate hoy = OperationalDateTime.today();
        OperationalDateTime.InstantRange rangoHoy = OperationalDateTime.dayRange(hoy);
        OperationalDateTime.InstantRange rangoMes = OperationalDateTime.monthRange(YearMonth.from(hoy));

        List<Long> asesorIds = idsAsesor == null ? List.of() : idsAsesor.stream().distinct().toList();
        boolean filtrarAsesores = !asesorIds.isEmpty();
        RankingEquipoScope equipos = resolverEquiposActuales();

        Map<Long, ResumenSupervisorVentasAccumulator> acumulados = new HashMap<>();

        leadRepository.resumirAsignadosActualesPorAsesor(
                        Etapa.PREVENTA,
                        List.of(EstadoSeguimiento.ASIGNADO, EstadoSeguimiento.EN_GESTION),
                        filtrarAsesores,
                        asesorIds,
                        equipos.filtrar(),
                        equipos.ids()
                )
                .forEach(row -> {
                    ResumenSupervisorVentasAccumulator item = obtenerAcumulador(acumulados, row.getIdAsesor(), row.getNombreAsesor());
                    item.asignadosActuales = row.getCantidad();
                });

        eventoRepository.resumirTipificacionesPorAsesor(
                        Accion.TIPIFICACION,
                        rangoHoy.inicio(),
                        rangoHoy.fin(),
                        filtrarAsesores,
                        asesorIds
                )
                .forEach(row -> {
                    ResumenSupervisorVentasAccumulator item = obtenerAcumulador(acumulados, row.getIdAsesor(), row.getNombreAsesor());
                    item.gestionadosHoy = row.getCantidad();
                });

        eventoRepository.resumirPreventasPorAsesor(
                        Accion.TIPIFICACION,
                        COMPORTAMIENTO_CIERRE_PREVENTA,
                        rangoHoy.inicio(),
                        rangoHoy.fin(),
                        filtrarAsesores,
                        asesorIds
                )
                .forEach(row -> {
                    ResumenSupervisorVentasAccumulator item = obtenerAcumulador(acumulados, row.getIdAsesor(), row.getNombreAsesor());
                    item.preventasHoy = row.getCantidad();
                });

        eventoRepository.resumirPreventasMensualesPorProveedor(
                        Accion.TIPIFICACION,
                        COMPORTAMIENTO_CIERRE_PREVENTA,
                        rangoMes.inicio(),
                        rangoMes.fin(),
                        filtrarAsesores,
                        asesorIds
                )
                .forEach(row -> {
                    ResumenSupervisorVentasAccumulator item = obtenerAcumulador(acumulados, row.getIdAsesor(), row.getNombreAsesor());
                    item.preventasMes += row.getCantidad();
                    item.preventasMesPorProveedor.add(new SupervisorVentasProveedorResumenResponse(
                            row.getIdProveedor(),
                            row.getNombreProveedor(),
                            row.getCantidad()
                    ));
                });

        return acumulados.values().stream()
                .sorted(Comparator.comparing(ResumenSupervisorVentasAccumulator::nombreAsesorOrdenable)
                        .thenComparing(ResumenSupervisorVentasAccumulator::idAsesor))
                .map(ResumenSupervisorVentasAccumulator::toResponse)
                .toList();
    }

    public LeadDetalleResponse obtenerDetalleLeadAsignado(Long idLead, Etapa etapa) {
        Long idAsesor = currentUser.empleadoID();
        Lead lead = leadRepository.buscarDetalleAsesor(idLead, idAsesor, etapa)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        if (etapa == Etapa.POSTVENTA) {
            postventaAsesorProveedorService.validarLeadVisibleParaUsuarioActual(lead);
        }

        Instant fechaAsignacion = eventoRepository.findTopByIdLeadAndAccionOrderByCreatedAtDesc(idLead, Accion.ASIGNACION)
                .map(Evento::getCreatedAt)
                .orElse(null);

        return toDetalleResponse(lead, fechaAsignacion, obtenerTotalAsignaciones(lead.getId()));
    }

    public LeadDetalleResponse obtenerDetalleLeadPostventaConsulta(Long idLead) {
        Lead lead = leadRepository.buscarDetalleCompletoPorId(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        if (lead.getEtapa() != Etapa.POSTVENTA && lead.getEtapa() != Etapa.COBRANZA) {
            throw new NotFoundException(Lead.class, idLead);
        }
        postventaAsesorProveedorService.validarLeadVisibleParaUsuarioActual(lead);

        Instant fechaAsignacion = eventoRepository.findTopByIdLeadAndAccionOrderByCreatedAtDesc(idLead, Accion.ASIGNACION)
                .map(Evento::getCreatedAt)
                .orElse(null);

        return toDetalleResponse(lead, fechaAsignacion, obtenerTotalAsignaciones(lead.getId()));
    }

    // El asesor de PREVENTA puede ver el detalle de cualquier lead que tenga asignado, sin importar
    // la etapa: para PREVENTA es su gestión normal; para otra etapa es una atención GTR (solo lectura).
    public LeadDetalleResponse obtenerDetalleLeadAsignado(Long idLead) {
        Long idAsesor = currentUser.empleadoID();
        Lead lead = leadRepository.buscarDetalleAsesorCualquierEtapa(idLead, idAsesor)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));

        Instant fechaAsignacion = eventoRepository.findTopByIdLeadAndAccionOrderByCreatedAtDesc(idLead, Accion.ASIGNACION)
                .map(Evento::getCreatedAt)
                .orElse(null);

        return toDetalleResponse(lead, fechaAsignacion, obtenerTotalAsignaciones(lead.getId()));
    }

    // ── Mis preventas (read-only) ─────────────────────────────────────────────
    // Leads que el asesor autenticado paso a VENTA. Identificados por su evento de cierre
    // (TIPIFICACION / PREVENTA_COMPLETA / VENTA_CERRADA). Solo lectura: sirve de seguimiento.

    public PageResponse<MisPreventaResponse> listarMisPreventas(PageRequest pageRequest, LocalDate fechaDesde, LocalDate fechaHasta) {
        // Cotas concretas (centinelas si no hay filtro): evitamos parametros null en el WHERE, que en
        // Postgres provocan "could not determine data type of parameter" (42P18).
        Instant desde = fechaDesde == null ? Instant.EPOCH : OperationalDateTime.startOfDay(fechaDesde);
        Instant hasta = fechaHasta == null ? MIS_PREVENTAS_FECHA_HASTA_ABIERTA : OperationalDateTime.endExclusiveOfDay(fechaHasta);
        var page = eventoRepository.listarCierresMisPreventas(
                currentUser.empleadoID(),
                Accion.TIPIFICACION,
                Etapa.PREVENTA,
                COMPORTAMIENTO_CIERRE_PREVENTA,
                desde,
                hasta,
                org.springframework.data.domain.PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize())
        );
        return PageResponse.<MisPreventaResponse>builder()
                .page(page.getNumber())
                .size(page.getSize())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .content(page.getContent().stream().map(this::toMisPreventaResponse).toList())
                .build();
    }

    public MisPreventasResumenResponse obtenerResumenMisPreventas(LocalDate fechaDesde, LocalDate fechaHasta) {
        Instant desde = fechaDesde == null ? Instant.EPOCH : OperationalDateTime.startOfDay(fechaDesde);
        Instant hasta = fechaHasta == null ? MIS_PREVENTAS_FECHA_HASTA_ABIERTA : OperationalDateTime.endExclusiveOfDay(fechaHasta);
        List<Evento> cierres = eventoRepository.listarCierresMisPreventasResumen(
                currentUser.empleadoID(),
                Accion.TIPIFICACION,
                Etapa.PREVENTA,
                COMPORTAMIENTO_CIERRE_PREVENTA,
                desde,
                hasta
        );

        long instaladas = 0;
        long rechazadas = 0;
        for (Evento cierre : cierres) {
            IntentoVentaResultado resultado = resolverResultadoIntento(cierre);
            if (resultado.etapaDestino() == Etapa.POSTVENTA) {
                instaladas++;
            } else if (resultado.etapaDestino() == Etapa.PREVENTA) {
                rechazadas++;
            }
        }

        return new MisPreventasResumenResponse(cierres.size(), instaladas, rechazadas);
    }

    public PageResponse<MisPreventaResponse> listarMisPreventasPorResumenEtapa(
            PageRequest pageRequest,
            LocalDate fechaDesde,
            LocalDate fechaHasta
    ) {
        Instant desde = fechaDesde == null ? Instant.EPOCH : OperationalDateTime.startOfDay(fechaDesde);
        Instant hasta = fechaHasta == null ? MIS_PREVENTAS_FECHA_HASTA_ABIERTA : OperationalDateTime.endExclusiveOfDay(fechaHasta);
        LocalDate desdeDate = fechaDesde == null ? LocalDate.of(1, 1, 1) : fechaDesde;
        LocalDate hastaDate = fechaHasta == null ? LocalDate.of(9999, 1, 1) : fechaHasta.plusDays(1);
        List<MisPreventaResumenEtapaRow> rows = listarMisPreventasPorFechaVista(desde, hasta, desdeDate, hastaDate);
        int pageSize = pageRequest.getPageSize();
        int pageNumber = pageRequest.getPageNumber();
        int totalElements = rows.size();
        int fromIndex = Math.min(pageNumber * pageSize, totalElements);
        int toIndex = Math.min(fromIndex + pageSize, totalElements);
        List<MisPreventaResponse> content = rows.subList(fromIndex, toIndex).stream()
                .map(this::toMisPreventaResumenEtapaResponse)
                .toList();

        return PageResponse.<MisPreventaResponse>builder()
                .page(pageNumber)
                .size(pageSize)
                .totalPages(pageSize == 0 ? 0 : (int) Math.ceil((double) totalElements / pageSize))
                .totalElements(totalElements)
                .content(content)
                .build();
    }

    private List<MisPreventaResumenEtapaRow> listarMisPreventasPorFechaVista(
            Instant desde,
            Instant hasta,
            LocalDate desdeDate,
            LocalDate hastaDate
    ) {
        return leadEtapaResumenRepository.listarMisPreventasPorFechaVista(
                currentUser.empleadoID(),
                Etapa.PREVENTA,
                Etapa.VENTA,
                Etapa.POSTVENTA,
                desde,
                hasta,
                desdeDate,
                hastaDate
        ).stream()
                .map(this::toMisPreventaResumenEtapaRow)
                .sorted(Comparator.comparing(MisPreventaResumenEtapaRow::fechaVista)
                        .thenComparing(row -> row.lead().getId())
                        .reversed())
                .toList();
    }

    public MisPreventasResumenResponse obtenerResumenMisPreventasPorResumenEtapa(LocalDate fechaDesde, LocalDate fechaHasta) {
        Instant desde = fechaDesde == null ? Instant.EPOCH : OperationalDateTime.startOfDay(fechaDesde);
        Instant hasta = fechaHasta == null ? MIS_PREVENTAS_FECHA_HASTA_ABIERTA : OperationalDateTime.endExclusiveOfDay(fechaHasta);
        LocalDate desdeDate = fechaDesde == null ? LocalDate.of(1, 1, 1) : fechaDesde;
        LocalDate hastaDate = fechaHasta == null ? LocalDate.of(9999, 1, 1) : fechaHasta.plusDays(1);
        List<MisPreventaResumenEtapaRow> rows = listarMisPreventasPorFechaVista(desde, hasta, desdeDate, hastaDate);

        long cerradas = rows.size();
        long instaladas = 0;
        long rechazadas = 0;
        for (MisPreventaResumenEtapaRow row : rows) {
            if (row.lead().getEtapa() == Etapa.POSTVENTA) {
                instaladas++;
            } else if (row.lead().getEtapa() == Etapa.PREVENTA && row.resumenPreventa().getFechaMerito() == null) {
                rechazadas++;
            }
        }
        return new MisPreventasResumenResponse(cerradas, instaladas, rechazadas);
    }

    private MisPreventaResponse toMisPreventaResponse(Object[] row) {
        Evento cierre = (Evento) row[0];
        Lead lead = (Lead) row[1];
        IntentoVentaResultado resultado = resolverResultadoIntento(cierre);
        Etapa etapaActual = resultado.etapaDestino() == null ? Etapa.VENTA : resultado.etapaDestino();
        Evento gestionVenta = resultado.evento() == null ? buscarUltimaGestionVentaIntento(cierre) : resultado.evento();

        return MisPreventaResponse.builder()
                .idEventoCierre(cierre.getId())
                .idLead(lead.getId())
                .prefijo(lead.getPrefijo())
                .lead(lead.getLead())
                .usermeta(lead.getUsermeta())
                .numeroDocumento(numeroDocumentoPreventa(lead))
                .plan(nombrePlanPreventa(lead))
                .internetVelocidad(lead.getPlan() == null || lead.getPlan().getInternet() == null
                        ? null
                        : lead.getPlan().getInternet().getVelocidad())
                .internetUnidad(lead.getPlan() == null || lead.getPlan().getInternet() == null
                        ? null
                        : lead.getPlan().getInternet().getUnidad())
                .velocidadPromocional(lead.getPlan() == null ? null : lead.getPlan().getVelocidadPromocional())
                .mesesPromocionVelocidad(lead.getPlan() == null ? null : lead.getPlan().getMesesPromocionVelocidad())
                .adicionales(adicionalesPreventa(lead))
                .departamento(nombreDepartamentoPreventa(lead))
                .fechaRegistro(cierre.getCreatedAt())
                .etapaActual(etapaActual)
                .estado(estadoMisPreventa(lead, etapaActual, gestionVenta))
                .fechaInstalacionRechazo(resultado.evento() == null ? null : resultado.evento().getCreatedAt())
                .codigoTipificacion(gestionVenta == null ? null : gestionVenta.getTipificacion())
                .codigoSubtipificacion(gestionVenta == null ? null : gestionVenta.getSubtipificacion())
                .build();
    }

    private MisPreventaResumenEtapaRow toMisPreventaResumenEtapaRow(Object[] row) {
        LeadEtapaResumen resumen = (LeadEtapaResumen) row[0];
        Lead lead = (Lead) row[1];
        LocalDate fechaInstalacion = (LocalDate) row[2];
        Instant fechaUltimaGestionVenta = (Instant) row[3];
        Instant fechaVista = resolverFechaVistaMisPreventa(lead, resumen, fechaInstalacion, fechaUltimaGestionVenta);
        return new MisPreventaResumenEtapaRow(resumen, lead, fechaVista, fechaInstalacion, fechaUltimaGestionVenta);
    }

    private MisPreventaResponse toMisPreventaResumenEtapaResponse(MisPreventaResumenEtapaRow row) {
        LeadEtapaResumen resumen = row.resumenPreventa();
        Lead lead = row.lead();
        Instant fechaReferenciaVenta = resumen.getFechaMerito();
        IntentoVentaResultado resultado = fechaReferenciaVenta == null
                ? new IntentoVentaResultado(null, null)
                : resolverResultadoIntentoVentaDesde(lead.getId(), fechaReferenciaVenta);
        Evento gestionVenta = fechaReferenciaVenta == null
                ? null
                : (resultado.evento() == null
                        ? buscarUltimaGestionVentaDesde(lead.getId(), fechaReferenciaVenta)
                        : resultado.evento());

        return MisPreventaResponse.builder()
                .idEventoCierre(null)
                .idLead(lead.getId())
                .prefijo(lead.getPrefijo())
                .lead(lead.getLead())
                .usermeta(lead.getUsermeta())
                .numeroDocumento(numeroDocumentoPreventa(lead))
                .plan(nombrePlanPreventa(lead))
                .internetVelocidad(lead.getPlan() == null || lead.getPlan().getInternet() == null
                        ? null
                        : lead.getPlan().getInternet().getVelocidad())
                .internetUnidad(lead.getPlan() == null || lead.getPlan().getInternet() == null
                        ? null
                        : lead.getPlan().getInternet().getUnidad())
                .velocidadPromocional(lead.getPlan() == null ? null : lead.getPlan().getVelocidadPromocional())
                .mesesPromocionVelocidad(lead.getPlan() == null ? null : lead.getPlan().getMesesPromocionVelocidad())
                .adicionales(adicionalesPreventa(lead))
                .departamento(nombreDepartamentoPreventa(lead))
                .fechaRegistro(row.fechaVista())
                .etapaActual(lead.getEtapa())
                .estado(estadoMisPreventa(lead, lead.getEtapa(), gestionVenta))
                .fechaInstalacionRechazo(row.fechaVista())
                .codigoTipificacion(gestionVenta == null ? null : gestionVenta.getTipificacion())
                .codigoSubtipificacion(gestionVenta == null ? null : gestionVenta.getSubtipificacion())
                .build();
    }

    private Instant resolverFechaVistaMisPreventa(
            Lead lead,
            LeadEtapaResumen resumen,
            LocalDate fechaInstalacion,
            Instant fechaUltimaGestionVenta
    ) {
        if (lead.getEtapa() == Etapa.POSTVENTA && fechaInstalacion != null) {
            return OperationalDateTime.startOfDay(fechaInstalacion);
        }
        if (lead.getEtapa() == Etapa.PREVENTA && resumen.getFechaMerito() == null) {
            return fechaUltimaGestionVenta;
        }
        return resumen.getFechaMerito();
    }

    private String numeroDocumentoPreventa(Lead lead) {
        if (lead.getDatosPreventa() != null && lead.getDatosPreventa().getNumeroDocumentoTitularServicio() != null) {
            return lead.getDatosPreventa().getNumeroDocumentoTitularServicio();
        }
        return lead.getNumeroDocumentoTitularServicioSnapshot();
    }

    private String nombrePlanPreventa(Lead lead) {
        if (lead.getNombrePlanSnapshot() != null && !lead.getNombrePlanSnapshot().isBlank()) {
            return lead.getNombrePlanSnapshot();
        }
        return lead.getPlan() == null ? null : lead.getPlan().getNombre();
    }

    private List<LeadAdicionalDetalleResponse> adicionalesPreventa(Lead lead) {
        return lead.getAdicionales().stream()
                .map(adicional -> new LeadAdicionalDetalleResponse(
                        adicional.getAdicional() == null ? null : adicional.getAdicional().getId(),
                        adicional.getAdicional() == null ? null : adicional.getAdicional().getNombre(),
                        adicional.getCantidad(),
                        adicional.getPrecioUnitario(),
                        adicional.getSubtotal()
                ))
                .sorted(java.util.Comparator.comparing(
                        LeadAdicionalDetalleResponse::getNombreAdicional,
                        java.util.Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                ))
                .toList();
    }

    private String nombreDepartamentoPreventa(Lead lead) {
        String ubigeo = lead.getDireccion() == null ? null : lead.getDireccion().getUbigeoDomicilio();
        if (ubigeo == null || ubigeo.isBlank()) {
            return null;
        }
        return distritoRepository.findByCodigoConUbicacion(ubigeo)
                .map(Distrito::getDepartamento)
                .map(Departamento::getNombre)
                .orElse(null);
    }

    private IntentoVentaResultado resolverResultadoIntento(Evento cierre) {
        Instant fechaHasta = fechaSiguienteCierre(cierre);
        List<Object[]> resultados = eventoRepository.buscarResultadoIntentoVenta(
                cierre.getIdLead(),
                Accion.TIPIFICACION,
                Etapa.VENTA,
                cierre.getCreatedAt(),
                fechaHasta,
                List.of(Etapa.POSTVENTA, Etapa.PREVENTA),
                org.springframework.data.domain.PageRequest.of(0, 1)
        );
        if (resultados.isEmpty()) {
            return new IntentoVentaResultado(null, null);
        }
        Object[] row = resultados.get(0);
        return new IntentoVentaResultado((Evento) row[0], (Etapa) row[1]);
    }

    private IntentoVentaResultado resolverResultadoIntentoVentaDesde(Long idLead, Instant fechaDesde) {
        List<Object[]> resultados = eventoRepository.buscarResultadoIntentoVenta(
                idLead,
                Accion.TIPIFICACION,
                Etapa.VENTA,
                fechaDesde,
                MIS_PREVENTAS_FECHA_HASTA_ABIERTA,
                List.of(Etapa.POSTVENTA, Etapa.PREVENTA),
                org.springframework.data.domain.PageRequest.of(0, 1)
        );
        if (resultados.isEmpty()) {
            return new IntentoVentaResultado(null, null);
        }
        Object[] row = resultados.get(0);
        return new IntentoVentaResultado((Evento) row[0], (Etapa) row[1]);
    }

    private Evento buscarUltimaGestionVentaIntento(Evento cierre) {
        List<Evento> gestiones = eventoRepository.buscarUltimaGestionVentaIntento(
                cierre.getIdLead(),
                Accion.TIPIFICACION,
                Etapa.VENTA,
                cierre.getCreatedAt(),
                fechaSiguienteCierre(cierre),
                org.springframework.data.domain.PageRequest.of(0, 1)
        );
        return gestiones.isEmpty() ? null : gestiones.get(0);
    }

    private Evento buscarUltimaGestionVentaDesde(Long idLead, Instant fechaDesde) {
        List<Evento> gestiones = eventoRepository.buscarUltimaGestionVentaIntento(
                idLead,
                Accion.TIPIFICACION,
                Etapa.VENTA,
                fechaDesde,
                MIS_PREVENTAS_FECHA_HASTA_ABIERTA,
                org.springframework.data.domain.PageRequest.of(0, 1)
        );
        return gestiones.isEmpty() ? null : gestiones.get(0);
    }

    private Instant fechaSiguienteCierre(Evento cierre) {
        return eventoRepository.buscarFechaSiguienteCierrePreventa(
                cierre.getIdLead(),
                Accion.TIPIFICACION,
                Etapa.PREVENTA,
                COMPORTAMIENTO_CIERRE_PREVENTA,
                cierre.getCreatedAt()
        ).orElse(MIS_PREVENTAS_FECHA_HASTA_ABIERTA);
    }

    private String estadoMisPreventa(Etapa etapaActual, Evento gestionVenta) {
        return estadoMisPreventa(null, etapaActual, gestionVenta);
    }

    private String estadoMisPreventa(Lead lead, Etapa etapaActual, Evento gestionVenta) {
        if (etapaActual == Etapa.PREVENTA) {
            return "RECHAZADA";
        }
        if (etapaActual == Etapa.POSTVENTA) {
            return lead == null || lead.getEstadoClientePostventa() == null
                    ? "ACTIVO"
                    : lead.getEstadoClientePostventa().name();
        }
        if (gestionVenta == null || gestionVenta.getTipificacion() == null || gestionVenta.getTipificacion().isBlank()) {
            return "SIN INGRESAR";
        }
        String codigo = gestionVenta.getTipificacion().trim().toUpperCase();
        if (TIPIFICACION_PROGRAMADO.equals(codigo)) {
            return "PROGRAMADO";
        }
        if ("OBSERVADA".equals(codigo)) {
            return "SUBSANABLE";
        }
        return "INGRESADO";
    }

    public LeadDetalleResponse obtenerDetalleMiPreventa(Long idLead) {
        Long idAsesor = currentUser.empleadoID();
        Lead lead = leadRepository.buscarDetalleCompletoPorId(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        // "Mi preventa": solo la ve el asesor que concreto la etapa PREVENTA (merito del resumen).
        if (!leadEtapaResumenService.esAsesorMeritoEtapa(idLead, Etapa.PREVENTA, idAsesor)) {
            throw new NotFoundException(Lead.class, idLead);
        }

        Instant fechaAsignacion = eventoRepository.findTopByIdLeadAndAccionOrderByCreatedAtDesc(idLead, Accion.ASIGNACION)
                .map(Evento::getCreatedAt)
                .orElse(null);

        return toDetalleResponse(lead, fechaAsignacion, obtenerTotalAsignaciones(lead.getId()));
    }

    @Transactional
    public void actualizarSnapshotsLead(Long idLead, LeadSnapshotsRequest request) {
        Lead lead = leadRepository.findByIdAndEtapa(idLead, Etapa.PREVENTA)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));

        String numeroDocumento = leadMapper.trimToNull(request.getNumeroDocumentoTitularServicio());
        String direccion = leadMapper.trimToNull(request.getDireccion());
        boolean solicitoNumeroDocumento = numeroDocumento != null;
        boolean solicitoDireccion = direccion != null;
        boolean actualizoSnapshot = false;

        if (solicitoNumeroDocumento && lead.getDatosPreventa() == null) {
            lead.setNumeroDocumentoTitularServicioSnapshot(numeroDocumento);
            actualizoSnapshot = true;
        }
        if (solicitoDireccion && lead.getDireccion() == null) {
            lead.setDireccionSnapshot(direccion);
            actualizoSnapshot = true;
        }
        if (!actualizoSnapshot) {
            throw new BadRequestException(
                    "Los snapshots solicitados ya no son editables porque sus entidades ya existen",
                    idLead,
                    Map.of(
                            "datosPreventaCreada", lead.getDatosPreventa() != null,
                            "direccionCreada", lead.getDireccion() != null
                    )
            );
        }

        Lead savedLead = leadRepository.save(lead);
        notificarCambioLead("SNAPSHOTS_ACTUALIZADOS", savedLead, null, null);
    }

    @Transactional
    public void completarIdentidadLead(Long idLead, LeadIdentidadRequest request) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        Contacto contacto = lead.getContacto();
        if (contacto == null || contacto.getId() == null) {
            throw new BadRequestException("El lead no tiene un contacto asociado para completar identidad");
        }

        String prefijo = normalizarPrefijo(request.getPrefijo());
        String numeroLead = normalizarLead(request.getLead());
        String usermeta = normalizarUsermeta(request.getUsermeta());
        validarIdentidadIntake(prefijo, numeroLead, usermeta);
        validarIdentidadParaCompletar(lead, contacto, prefijo, numeroLead, usermeta);

        boolean actualizado = completarIdentidadContacto(contacto, prefijo, numeroLead, usermeta);
        if (!actualizado) {
            throw new BadRequestException("El contacto no tiene datos de identidad pendientes por completar");
        }

        Contacto contactoGuardado = contactoRepository.save(contacto);
        LeadIdentidad identidad = new LeadIdentidad(
                contactoGuardado.getPrefijo(),
                contactoGuardado.getLead(),
                contactoGuardado.getUsermeta(),
                contactoGuardado
        );
        List<Lead> leadsContacto = leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(contactoGuardado.getId());
        if (leadsContacto.isEmpty()) {
            leadsContacto = List.of(lead);
        }
        leadsContacto.forEach(item -> sincronizarIdentidadLead(item, identidad));
        List<Lead> guardados = leadRepository.saveAll(leadsContacto);
        guardados.forEach(item -> notificarCambioLead("IDENTIDAD_ACTUALIZADA", item, null, null, item.getEtapa() != Etapa.PREVENTA));
    }

    public List<NumeroLlamadaResponse> listarNumerosLlamada(Long idLead) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        DatosPreventa datosPreventa = lead.getDatosPreventa();
        Map<String, NumeroLlamadaResponse> opciones = new LinkedHashMap<>();

        agregarNumeroLlamada(opciones, TipoNumeroLlamada.NUMERO_PARA_LLAMAR, "Numero para llamar",
                lead.getNumeroParaLlamar(), 1);
        agregarNumeroLlamada(opciones, TipoNumeroLlamada.LEAD, "Numero lead", lead.getLead(), 2);
        agregarNumeroLlamada(opciones, TipoNumeroLlamada.CELULAR_REFERENCIA, "Celular de referencia",
                datosPreventa == null ? null : datosPreventa.getCelularReferencia(), 3);
        agregarNumeroLlamada(opciones, TipoNumeroLlamada.CELULAR_REGISTRO, "Celular de registro",
                datosPreventa == null ? null : datosPreventa.getCelularRegistro(), 4);

        return new ArrayList<>(opciones.values());
    }

    @Transactional
    public void actualizarNumeroParaLlamar(Long idLead, LeadNumeroParaLlamarRequest request) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        String numeroParaLlamar = normalizarNumeroParaLlamar(request.getNumeroParaLlamar());
        lead.setNumeroParaLlamar(numeroParaLlamar);
        Lead savedLead = leadRepository.save(lead);
        notificarCambioLead("NUMERO_PARA_LLAMAR_ACTUALIZADO", savedLead, null, null, savedLead.getEtapa() != Etapa.PREVENTA);
    }

    @Transactional
    public void eliminarLeadIntegral(Long idLead) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        Etapa etapa = lead.getEtapa();
        Long idAsesorAsignado = lead.getIdAsesorAsignado();

        pagoPostventaRepository.deleteByLeadId(idLead);
        encuestaPostventaRepository.deleteByLeadId(idLead);
        eventoRepository.deleteByIdLead(idLead);
        leadRepository.delete(lead);
        leadRepository.flush();

        leadRealtimeNotifier.publishAfterCommit(LeadRealtimeEvent.builder()
                .tipo("ELIMINACION")
                .idLead(idLead)
                .etapa(etapa)
                .idAsesorAsignado(idAsesorAsignado)
                .occurredAt(OperationalDateTime.now())
                .build());
    }

    @Transactional
    public void actualizarDatosPreventa(Long idLead, LeadDatosPreventaRequest request) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        Lead savedLead = actualizarDatosPreventaInterno(lead, request);
        notificarCambioLead("DATOS_PREVENTA_ACTUALIZADOS", savedLead, null, idAsesorAnterior);
    }

    @Transactional
    public void actualizarDireccion(Long idLead, LeadDireccionRequest request) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        Lead savedLead = actualizarDireccionInterno(lead, request);
        notificarCambioLead("DIRECCION_ACTUALIZADA", savedLead, null, idAsesorAnterior);
    }

    @Transactional
    public void actualizarOfertaComercial(Long idLead, LeadOfertaComercialRequest request) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        Lead savedLead = actualizarOfertaComercialInterno(lead, request);
        notificarCambioLead("OFERTA_COMERCIAL_ACTUALIZADA", savedLead, null, idAsesorAnterior);
    }

    @Transactional
    public void actualizarDatosPreventaVenta(Long idLead, LeadDatosPreventaRequest request) {
        Lead lead = obtenerLeadAsignadoEnEtapa(idLead, Etapa.VENTA);
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        Lead savedLead = actualizarDatosPreventaInterno(lead, request);
        registrarEventoActualizacion(savedLead, Accion.ACTUALIZACION_DATOS_PREVENTA, null);
        notificarCambioLead("DATOS_PREVENTA_ACTUALIZADOS", savedLead, null, idAsesorAnterior);
    }

    @Transactional
    public void actualizarDireccionVenta(Long idLead, LeadDireccionRequest request) {
        Lead lead = obtenerLeadAsignadoEnEtapa(idLead, Etapa.VENTA);
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        Lead savedLead = actualizarDireccionInterno(lead, request);
        registrarEventoActualizacion(savedLead, Accion.ACTUALIZACION_DIRECCION, null);
        notificarCambioLead("DIRECCION_ACTUALIZADA", savedLead, null, idAsesorAnterior);
    }

    @Transactional
    public void actualizarOfertaComercialVenta(Long idLead, LeadOfertaComercialRequest request) {
        Lead lead = obtenerLeadAsignadoEnEtapa(idLead, Etapa.VENTA);
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        validarOfertaComercialVentaObligatoria(request);
        validarOfertaComercialEditableEnCicloActualVenta(lead);
        Lead savedLead = actualizarOfertaComercialInterno(lead, request);
        Long idPlanOfrecido = savedLead.getPlan() == null ? null : savedLead.getPlan().getId();
        registrarEventoActualizacion(savedLead, Accion.ACTUALIZACION_OFERTA_COMERCIAL, idPlanOfrecido);
        notificarCambioLead("OFERTA_COMERCIAL_ACTUALIZADA", savedLead, null, idAsesorAnterior);
    }

    private Lead actualizarDatosPreventaInterno(Lead lead, LeadDatosPreventaRequest request) {
        DatosPreventa datosPreventa = lead.getDatosPreventa() == null ? new DatosPreventa() : lead.getDatosPreventa();
        leadMapper.updateDatosPreventa(request, datosPreventa);

        lead.setNumeroDocumentoTitularServicioSnapshot(datosPreventa.getNumeroDocumentoTitularServicio());
        lead.setDatosPreventa(datosPreventa);
        moverAEnGestionSiAplica(lead);
        return leadRepository.save(lead);
    }

    private Lead actualizarDireccionInterno(Lead lead, LeadDireccionRequest request) {
        Direccion direccion = lead.getDireccion() == null ? new Direccion() : lead.getDireccion();
        leadMapper.updateDireccion(request, direccion);

        lead.setDireccionSnapshot(direccion.getDireccion());
        lead.setDireccion(direccion);
        moverAEnGestionSiAplica(lead);
        return leadRepository.save(lead);
    }

    private Lead actualizarOfertaComercialInterno(Lead lead, LeadOfertaComercialRequest request) {
        Plan plan = request.getIdPlan() == null ? null : obtenerPlanVigente(request.getIdPlan());
        PromocionComercial promocionInterna = request.getIdPromocionInterna() == null ? null
                : obtenerPromocionInternaActiva(request.getIdPromocionInterna(), plan, lead);

        lead.setPlan(plan);
        lead.setNombrePlanSnapshot(plan == null ? null : plan.getNombre());
        lead.setNombreProveedorSnapshot(plan == null || plan.getProveedor() == null ? null : plan.getProveedor().getNombre());
        lead.setPrecioPlanSnapshot(plan == null ? null : plan.getPrecio());

        lead.setPromocionInterna(promocionInterna);
        lead.setNombrePromocionInternaSnapshot(promocionInterna == null ? null : promocionInterna.getReglaComercial());

        reemplazarAdicionales(lead, request.getAdicionales());
        moverAEnGestionSiAplica(lead);
        return leadRepository.save(lead);
    }

    // Catálogo de tipificaciones que aplica a un lead concreto: el equipo lo resuelve el backend desde
    // el lead (no desde el usuario, que puede estar en varios equipos). Es la ruta que usan las vistas de
    // gestión para mostrar exactamente la matriz que el backend usará al tipificar (misma partición por equipo).
    public CatalogoResponse getCatalogoTipificacionesPorLead(Long idLead, Etapa etapa) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        return tipificacionService.getCatalogo(etapa, lead.getIdEquipo());
    }

    @Transactional
    public void tipificarLead(Long idLead, LeadTipificacionRequest request) {
        Lead lead = obtenerLeadAsignadoDelAsesor(idLead);
        // Atención GTR: el lead sigue en otra etapa. La tipificación es informativa: se guarda como
        // evento (catálogo PREVENTA del asesor) pero NO cambia etapa/tipificación/datos del lead.
        if (lead.getEtapa() != Etapa.PREVENTA) {
            tipificarLeadOtraEtapaInformativo(lead, request);
            return;
        }
        Etapa etapaActual = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        String nombreAsesorAnterior = lead.getNombreAsesorAsignado();

        Tipificacion tipificacion = tipificacionRepository.findByEtapaAndIdEquipoAndCodigoAndActivoTrue(
                        etapaActual,
                        lead.getIdEquipo(),
                        request.getCodigoTipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getCodigoTipificacion()));
        Subtipificacion subtipificacion = subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                        tipificacion.getId(),
                        request.getCodigoSubtipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, request.getCodigoSubtipificacion()));

        validarHoraProgramada(subtipificacion, request.getHoraProgramada());
        aplicarPlataformaDigitalOfrecidaSiCorresponde(lead, request.getIdPlataformaDigitalOfrecida());
        Etapa etapaDestino = subtipificacion.getEtapaCambio();
        if (etapaDestino != null && etapaDestino != etapaActual) {
            if (etapaActual == Etapa.PREVENTA && etapaDestino == Etapa.VENTA) {
                validarPreventaCompleta(lead);
                // Atribucion de preventa (merito de PREVENTA): la mantiene el resumen por etapa
                // (registrarMerito via actualizarResumenEtapaTipificacion, esMerito=true mas abajo).
            }
            lead.setEtapa(etapaDestino);
            lead.setLastEntryAt(OperationalDateTime.now());
            lead.setEstado(EstadoSeguimiento.NUEVO);
            lead.setIdAsesorAsignado(null);
            lead.setNombreAsesorAsignado(null);
            lead.setIdTipificacion(null);
            lead.setCodigoTipificacion(null);
            lead.setIdSubtipificacion(null);
            lead.setCodigoSubtipificacion(null);
        } else {
            lead.setIdTipificacion(tipificacion.getId());
            lead.setCodigoTipificacion(tipificacion.getCodigo());
            lead.setIdSubtipificacion(subtipificacion.getId());
            lead.setCodigoSubtipificacion(subtipificacion.getCodigo());
            lead.setEstado(EstadoSeguimiento.GESTIONADO);
            lead.setIdAsesorAsignado(null);
            lead.setNombreAsesorAsignado(null);
        }

        Lead savedLead = leadRepository.save(lead);
        actualizarResumenEtapaTipificacion(
                savedLead, etapaActual, etapaDestino, tipificacion, subtipificacion, idAsesorAnterior, nombreAsesorAnterior,
                subtipificacion.getComportamientos().contains(ComportamientoTipificacion.RECIBE_MERITO));
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoTipificacion(
                savedLead.getId(),
                idCampana,
                etapaActual,
                null,
                tipificacion.getCodigo(),
                subtipificacion.getCodigo(),
                request.getComentario(),
                request.getHoraProgramada()
        );
        notificarCambioLead("TIPIFICACION", savedLead, etapaActual, idAsesorAnterior);
    }

    // Tipificación informativa de un lead que sigue gestionándose en otra etapa (atención GTR).
    // Resuelve la tipificación contra el catálogo PREVENTA (el que usa el asesor) y la guarda como
    // evento, SIN mutar etapa/tipificación/datos del lead. Cierra la atención liberando al asesor
    // (idAsesorAsignado = null, estado = GESTIONADO) para que el lead vuelva a estar disponible en
    // su etapa actual y salga de la bandeja del asesor.
    private void tipificarLeadOtraEtapaInformativo(Lead lead, LeadTipificacionRequest request) {
        Etapa etapaLead = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();

        Tipificacion tipificacion = tipificacionRepository.findByEtapaAndIdEquipoAndCodigoAndActivoTrue(
                        Etapa.PREVENTA,
                        lead.getIdEquipo(),
                        request.getCodigoTipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getCodigoTipificacion()));
        Subtipificacion subtipificacion = subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                        tipificacion.getId(),
                        request.getCodigoSubtipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, request.getCodigoSubtipificacion()));
        validarHoraProgramada(subtipificacion, request.getHoraProgramada());

        // Liberar la atención sin tocar la gestión del lead en su etapa actual.
        lead.setRequiereAtencionGtr(false);
        lead.setIdAsesorAsignado(null);
        lead.setNombreAsesorAsignado(null);
        lead.setEstado(EstadoSeguimiento.GESTIONADO);

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        // El evento se registra en PREVENTA (el catálogo que usó el asesor), coherente con el resto
        // de tipificaciones de preventa. Es solo un registro informativo: no impacta el lead.
        registrarEventoTipificacion(
                savedLead.getId(),
                idCampana,
                Etapa.PREVENTA,
                null,
                tipificacion.getCodigo(),
                subtipificacion.getCodigo(),
                request.getComentario(),
                request.getHoraProgramada()
        );
        notificarCambioLead("TIPIFICACION", savedLead, etapaLead, idAsesorAnterior, true);
    }

    private void aplicarPlataformaDigitalOfrecidaSiCorresponde(Lead lead, Long idPlataformaDigitalOfrecida) {
        if (idPlataformaDigitalOfrecida == null) {
            return;
        }
        Plataforma plataforma = plataformaRepository.findById(idPlataformaDigitalOfrecida)
                .orElseThrow(() -> new NotFoundException(Plataforma.class, idPlataformaDigitalOfrecida));
        lead.setPlataformaDigitalOfrecida(plataforma);
    }

    // Cierra la atención GTR de un lead en otra etapa cuando el asesor no lo tipifica (p. ej. solo
    // creó nuevas oportunidades). Libera al asesor sin registrar tipificación ni alterar la gestión.
    @Transactional
    public void cerrarAtencion(Long idLead) {
        Lead lead = obtenerLeadAsignadoDelAsesor(idLead);
        if (lead.getEtapa() == Etapa.PREVENTA) {
            throw new BadRequestException("Este lead está en PREVENTA; debe tipificarse, no cerrarse como atención");
        }
        Etapa etapaLead = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        lead.setRequiereAtencionGtr(false);
        lead.setIdAsesorAsignado(null);
        lead.setNombreAsesorAsignado(null);
        lead.setEstado(EstadoSeguimiento.GESTIONADO);
        Lead savedLead = leadRepository.save(lead);
        notificarCambioLead("ATENCION_CERRADA", savedLead, etapaLead, idAsesorAnterior, true);
    }

    @Transactional
    public void tipificarLeadVenta(Long idLead, LeadTipificacionVentaRequest request) {
        Lead lead = obtenerLeadAsignadoEnEtapa(idLead, Etapa.VENTA);
        Etapa etapaActual = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        String nombreAsesorAnterior = lead.getNombreAsesorAsignado();

        Tipificacion tipificacion = tipificacionRepository.findByEtapaAndIdEquipoAndCodigoAndActivoTrue(
                        etapaActual,
                        lead.getIdEquipo(),
                        request.getCodigoTipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getCodigoTipificacion()));
        Subtipificacion subtipificacion = subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                        tipificacion.getId(),
                        request.getCodigoSubtipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, request.getCodigoSubtipificacion()));

        Etapa etapaDestino = subtipificacion.getEtapaCambio();
        boolean requiereProgramacion = subtipificacion.getComportamientos()
                .contains(ComportamientoTipificacion.REQUIERE_FECHA_PROGRAMACION);
        validarProgramacionVenta(requiereProgramacion, request.getFechaProgramacion(), request.getHoraProgramada());
        aplicarSecSotVentaSiCorresponde(lead, tipificacion, subtipificacion, request.getSec(), request.getSot());

        // Atribucion de venta (merito de VENTA): el responsable es quien tipifica la subtipi marcada con
        // RECIBE_MERITO (hoy INSTALADO / SERVICIO INSTALADO), no quien cambia de etapa. La mantiene el
        // resumen por etapa (esMerito mas abajo, resuelto por comportamiento).

        TipificacionRetornoPreventa tipificacionRetornoPreventa =
                etapaActual == Etapa.VENTA && etapaDestino == Etapa.PREVENTA
                        ? obtenerTipificacionRetornoVentaPreventa(lead.getIdEquipo())
                        : null;

        if (etapaDestino != null && etapaDestino != etapaActual) {
            aplicarDatosPostventaSiCorresponde(lead, etapaDestino, request.getFechaInstalacion());
            lead.setEtapa(etapaDestino);
            lead.setLastEntryAt(OperationalDateTime.now());
            lead.setEstado(EstadoSeguimiento.NUEVO);
            lead.setIdAsesorAsignado(null);
            lead.setNombreAsesorAsignado(null);
            if (tipificacionRetornoPreventa != null) {
                lead.setIdTipificacion(tipificacionRetornoPreventa.tipificacion().getId());
                lead.setCodigoTipificacion(tipificacionRetornoPreventa.tipificacion().getCodigo());
                lead.setIdSubtipificacion(tipificacionRetornoPreventa.subtipificacion().getId());
                lead.setCodigoSubtipificacion(tipificacionRetornoPreventa.subtipificacion().getCodigo());
            } else {
                lead.setIdTipificacion(null);
                lead.setCodigoTipificacion(null);
                lead.setIdSubtipificacion(null);
                lead.setCodigoSubtipificacion(null);
            }
        } else {
            lead.setIdTipificacion(tipificacion.getId());
            lead.setCodigoTipificacion(tipificacion.getCodigo());
            lead.setIdSubtipificacion(subtipificacion.getId());
            lead.setCodigoSubtipificacion(subtipificacion.getCodigo());
            lead.setEstado(EstadoSeguimiento.GESTIONADO);
            lead.setIdAsesorAsignado(null);
            lead.setNombreAsesorAsignado(null);
        }

        Lead savedLead = leadRepository.save(lead);
        if (etapaDestino == Etapa.POSTVENTA) {
            calendarioFacturacionPostventaService.inicializarGestionPostventa(savedLead, request.getFechaInstalacion());
        }
        actualizarResumenEtapaTipificacion(
                savedLead, etapaActual, etapaDestino, tipificacion, subtipificacion, idAsesorAnterior, nombreAsesorAnterior,
                subtipificacion.getComportamientos().contains(ComportamientoTipificacion.RECIBE_MERITO));
        if (tipificacionRetornoPreventa != null) {
            leadEtapaResumenService.registrarRetornoVentaPreventa(
                    savedLead.getId(),
                    Etapa.PREVENTA,
                    tipificacionRetornoPreventa.tipificacion().getCodigo(),
                    tipificacionRetornoPreventa.subtipificacion().getCodigo(),
                    tipificacionRetornoPreventa.tipificacion().getOrden(),
                    idAsesorAnterior,
                    nombreAsesorAnterior,
                    OperationalDateTime.now());
        }
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        Long idPlanOfrecido = savedLead.getPlan() == null ? null : savedLead.getPlan().getId();
        registrarEventoTipificacion(
                savedLead.getId(),
                idCampana,
                etapaActual,
                idPlanOfrecido,
                tipificacion.getCodigo(),
                subtipificacion.getCodigo(),
                request.getComentario(),
                etapaDestino == Etapa.POSTVENTA ? request.getFechaInstalacion() : null,
                requiereProgramacion ? request.getFechaProgramacion() : null,
                requiereProgramacion ? request.getHoraProgramada() : null
        );
        notificarCambioLead("TIPIFICACION", savedLead, etapaActual, idAsesorAnterior);
    }

    private TipificacionRetornoPreventa obtenerTipificacionRetornoVentaPreventa(Long idEquipo) {
        Tipificacion tipificacion = tipificacionRepository.findByEtapaAndIdEquipoAndCodigoAndActivoTrue(
                        Etapa.PREVENTA,
                        idEquipo,
                        TIPIFICACION_RETORNO_VENTA_PREVENTA
                )
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, TIPIFICACION_RETORNO_VENTA_PREVENTA));
        Subtipificacion subtipificacion = subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                        tipificacion.getId(),
                        SUBTIPIFICACION_RETORNO_VENTA_PREVENTA
                )
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, SUBTIPIFICACION_RETORNO_VENTA_PREVENTA));
        return new TipificacionRetornoPreventa(tipificacion, subtipificacion);
    }

    @Transactional
    public void tipificarLeadPostventa(Long idLead, LeadTipificacionPostventaRequest request) {
        tipificarLeadSeguimientoPostventa(idLead, Etapa.POSTVENTA, request);
    }

    private void tipificarLeadSeguimientoPostventa(Long idLead, Etapa etapa, LeadTipificacionPostventaRequest request) {
        Lead lead = obtenerLeadAsignadoEnEtapa(idLead, etapa);
        Etapa etapaActual = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        String nombreAsesorAnterior = lead.getNombreAsesorAsignado();

        Tipificacion tipificacion = tipificacionRepository.findByEtapaAndIdEquipoAndCodigoAndActivoTrue(
                        etapaActual,
                        lead.getIdEquipo(),
                        request.getCodigoTipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getCodigoTipificacion()));
        Subtipificacion subtipificacion = subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                        tipificacion.getId(),
                        request.getCodigoSubtipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, request.getCodigoSubtipificacion()));

        Etapa etapaDestinoCatalogo = subtipificacion.getEtapaCambio();
        Etapa etapaDestino = normalizarEtapaDestinoPostventa(etapaActual, etapaDestinoCatalogo);

        if (etapaDestino != null && etapaDestino != etapaActual) {
            lead.setEtapa(etapaDestino);
            lead.setLastEntryAt(OperationalDateTime.now());
            lead.setEstado(EstadoSeguimiento.NUEVO);
            lead.setIdAsesorAsignado(null);
            lead.setNombreAsesorAsignado(null);
            lead.setIdTipificacion(null);
            lead.setCodigoTipificacion(null);
            lead.setIdSubtipificacion(null);
            lead.setCodigoSubtipificacion(null);
        } else {
            lead.setIdTipificacion(tipificacion.getId());
            lead.setCodigoTipificacion(tipificacion.getCodigo());
            lead.setIdSubtipificacion(subtipificacion.getId());
            lead.setCodigoSubtipificacion(subtipificacion.getCodigo());

            if (etapaActual == Etapa.POSTVENTA) {
                // POSTVENTA es un pool compartido: al tipificar, la gestion termina y el lead se
                // libera para que cualquier asesor pueda retomarlo despues (mismo criterio que VENTA).
                lead.setEstado(EstadoSeguimiento.GESTIONADO);
                lead.setIdAsesorAsignado(null);
                lead.setNombreAsesorAsignado(null);
            } else {
                moverAEnGestionSiAplica(lead);
            }
        }

        Lead savedLead = leadRepository.save(lead);
        boolean esMeritoSeguimiento = etapaActual == Etapa.POSTVENTA && etapaDestino == Etapa.COBRANZA;
        actualizarResumenEtapaTipificacion(
                savedLead, etapaActual, etapaDestino, tipificacion, subtipificacion, idAsesorAnterior, nombreAsesorAnterior,
                esMeritoSeguimiento);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        Long idPlanOfrecido = savedLead.getPlan() == null ? null : savedLead.getPlan().getId();
        registrarEventoTipificacion(
                savedLead.getId(),
                idCampana,
                etapaActual,
                idPlanOfrecido,
                tipificacion.getCodigo(),
                subtipificacion.getCodigo(),
                request.getComentario(),
                (java.time.LocalTime) null
        );
        aplicarCierrePeriodoPostventaSiCorresponde(savedLead, etapaActual, tipificacion, subtipificacion);
        notificarCambioLead("TIPIFICACION", savedLead, etapaActual, idAsesorAnterior);
    }

    private void aplicarCierrePeriodoPostventaSiCorresponde(
            Lead lead,
            Etapa etapaActual,
            Tipificacion tipificacion,
            Subtipificacion subtipificacion
    ) {
        if (etapaActual != Etapa.POSTVENTA) {
            return;
        }
        if (disparaCierrePagoPostventa(tipificacion, subtipificacion)) {
            facturacionPostventaService.cerrarPeriodoPagoConfirmadoPorTipificacion(lead.getId());
            return;
        }
        if (disparaCierreBajaPostventa(tipificacion, subtipificacion)) {
            facturacionPostventaService.cerrarPeriodoBajaPorTipificacion(lead.getId());
        }
    }

    private boolean disparaCierrePagoPostventa(Tipificacion tipificacion, Subtipificacion subtipificacion) {
        return tieneComportamiento(subtipificacion, COMPORTAMIENTO_CIERRE_PAGO_POSTVENTA)
                || (codigoEquals(tipificacion.getCodigo(), "COBRANZA")
                && codigoEquals(subtipificacion.getCodigo(), "PAGO_CONFIRMADO"));
    }

    private boolean disparaCierreBajaPostventa(Tipificacion tipificacion, Subtipificacion subtipificacion) {
        return tieneComportamiento(subtipificacion, COMPORTAMIENTO_CIERRE_BAJA_POSTVENTA)
                || (codigoEquals(tipificacion.getCodigo(), "BAJA")
                && codigoEquals(subtipificacion.getCodigo(), "FINALIZADA"));
    }

    private boolean tieneComportamiento(
            Subtipificacion subtipificacion,
            ComportamientoTipificacion comportamiento
    ) {
        return subtipificacion.getComportamientos() != null
                && subtipificacion.getComportamientos().contains(comportamiento);
    }

    private boolean codigoEquals(String actual, String esperado) {
        return normalizarCodigoOperativo(actual).equals(normalizarCodigoOperativo(esperado));
    }

    private String normalizarCodigoOperativo(String codigo) {
        if (codigo == null) {
            return "";
        }
        return codigo.trim()
                .toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');
    }

    private Etapa normalizarEtapaDestinoPostventa(Etapa etapaActual, Etapa etapaDestino) {
        if (etapaActual == Etapa.POSTVENTA && etapaDestino == Etapa.COBRANZA) {
            return null;
        }
        return etapaDestino;
    }

    private void aplicarDatosPostventaSiCorresponde(Lead lead, Etapa etapaDestino, LocalDate fechaInstalacion) {
        if (etapaDestino != Etapa.POSTVENTA) {
            return;
        }
        validarFechaInstalacionVenta(fechaInstalacion);

        Plan plan = lead.getPlan();
        if (plan == null) {
            throw new BadRequestException("Falta seleccionar un plan para pasar a POSTVENTA");
        }
        Proveedor proveedor = plan.getProveedor();
        if (proveedor == null) {
            throw new BadRequestException("El plan no tiene proveedor configurado");
        }

        lead.setDiaCorteFacturacion(resolverDiaCorteFacturacion(proveedor, fechaInstalacion));
        lead.setMesesPermanenciaSnapshot(proveedor.getMesesPermanencia());
        lead.setEstadoClientePostventa(EstadoClientePostventa.ACTIVO);
    }

    /**
     * Dual-write de la metadata por etapa en cada tipificacion: actualiza primera/ultima/mayor rango
     * y el ultimo gestor de la etapa; marca el merito si esta tipificacion concreta la etapa; y
     * registra salida/entrada cuando el lead avanza. No toca el estado operativo del Lead.
     */
    private void actualizarResumenEtapaTipificacion(
            Lead lead,
            Etapa etapaActual,
            Etapa etapaDestino,
            Tipificacion tipificacion,
            Subtipificacion subtipificacion,
            Long idAsesor,
            String nombreAsesor,
            boolean esMerito
    ) {
        Instant ahora = OperationalDateTime.now();
        leadEtapaResumenService.registrarTipificacion(
                lead.getId(), etapaActual, tipificacion.getCodigo(), subtipificacion.getCodigo(),
                tipificacion.getOrden(), idAsesor, nombreAsesor, ahora);
        if (esMerito) {
            leadEtapaResumenService.registrarMerito(lead.getId(), etapaActual, idAsesor, nombreAsesor, ahora);
        }
        if (etapaDestino != null && etapaDestino != etapaActual) {
            leadEtapaResumenService.registrarSalidaEtapa(lead.getId(), etapaActual, ahora);
            leadEtapaResumenService.registrarEntradaEtapa(lead.getId(), etapaDestino, ahora);
        }
    }

    private void aplicarSecSotVentaSiCorresponde(
            Lead lead, Tipificacion tipificacion, Subtipificacion subtipificacion, String secRequest, String sotRequest) {
        if (!subtipificacion.getComportamientos().contains(ComportamientoTipificacion.REQUIERE_SEC_SOT)
                && !esTipificacionSubidaVenta(tipificacion)) {
            return;
        }
        if (!requiereSecSotVenta(lead)) {
            return;
        }

        String sec = normalizarCodigoNumerico(secRequest);
        String sot = normalizarCodigoNumerico(sotRequest);
        if (sec == null) {
            sec = normalizarCodigoNumerico(lead.getSec());
        }
        if (sot == null) {
            sot = normalizarCodigoNumerico(lead.getSot());
        }
        validarCodigoExacto(sec, 9, "SEC");
        validarCodigoExacto(sot, 8, "SOT");
        lead.setSec(sec);
        lead.setSot(sot);
    }

    private boolean esTipificacionSubidaVenta(Tipificacion tipificacion) {
        if (tipificacion == null || tipificacion.getCodigo() == null) {
            return false;
        }
        String codigo = tipificacion.getCodigo().trim().toUpperCase(Locale.ROOT);
        return codigo.equals("SUBIDO") || codigo.equals("INGRESADO");
    }

    private boolean requiereSecSotVenta(Lead lead) {
        Proveedor proveedor = resolverProveedorOperativoVenta(lead);
        return proveedor != null && Boolean.TRUE.equals(proveedor.getRequiereSecSotVenta());
    }

    private Proveedor resolverProveedorOperativoVenta(Lead lead) {
        if (lead.getPlan() != null && lead.getPlan().getProveedor() != null) {
            return lead.getPlan().getProveedor();
        }
        if (lead.getCampana() != null && lead.getCampana().getProveedor() != null) {
            return lead.getCampana().getProveedor();
        }
        return obtenerProveedorFallbackEntidadDeEquipo(lead.getIdEquipo());
    }

    private String normalizarCodigoNumerico(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validarCodigoExacto(String value, int length, String label) {
        if (value == null || !value.matches("\\d{" + length + "}")) {
            throw new BadRequestException(label + " debe tener " + length + " digitos");
        }
    }

    private Integer resolverDiaCorteFacturacion(Proveedor proveedor, LocalDate fechaInstalacion) {
        if (fechaInstalacion == null) {
            throw new BadRequestException("La fechaInstalacion es obligatoria para pasar a POSTVENTA");
        }
        List<Integer> cortesOrdenados = proveedor.getCortesFacturacion() == null
                ? List.of()
                : proveedor.getCortesFacturacion().stream()
                        .filter(dia -> dia != null)
                        .sorted()
                        .toList();
        if (cortesOrdenados.isEmpty()) {
            throw new BadRequestException("El proveedor no tiene cortes de facturacion configurados");
        }

        // Regla unica para todos los proveedores: el corte de facturacion es el primer dia de corte
        // configurado que sea >= al dia de instalacion. Si la instalacion cae despues del ultimo corte
        // del mes, se factura en el primer corte del siguiente ciclo (el menor dia configurado).
        int diaInstalacion = fechaInstalacion.getDayOfMonth();
        return cortesOrdenados.stream()
                .filter(corte -> corte >= diaInstalacion)
                .findFirst()
                .orElse(cortesOrdenados.get(0));
    }

    @Transactional
    public void registrarIngresoLead(LeadIntakeRequest request) {
        registrarIngresoLead(request, null);
    }

    @Transactional
    public void registrarIngresoLeadRetroactivo(LeadIntakeRetroactivoRequest request) {
        Instant registroAt = calcularRegistroRetroactivo(
                OperationalDateTime.today(),
                request.getHoraRegistro()
        );
        registrarIngresoLead(request, registroAt);
    }

    Instant calcularRegistroRetroactivo(LocalDate fechaActual, LocalTime horaRegistro) {
        validarHoraRegistroRetroactivo(horaRegistro);
        return fechaActual
                .minusDays(1)
                .atTime(horaRegistro)
                .atZone(OperationalDateTime.ZONE)
                .toInstant();
    }

    private void registrarIngresoLead(LeadIntakeRequest request, Instant registroAt) {
        String prefijo = normalizarPrefijo(request.getPrefijo());
        String numeroLead = normalizarLead(request.getLead());
        String usermeta = normalizarUsermeta(request.getUsermeta());
        validarIdentidadIntake(prefijo, numeroLead, usermeta);
        Campana campana = request.getIdCampana() == null ? null : obtenerCampanaActiva(request.getIdCampana());
        validarOrigenIntake(request.getBase(), campana != null);
        LeadIdentidad identidad = resolverIdentidadContacto(prefijo, numeroLead, usermeta);

        // El lead PREVENTA del contacto (si existe) tiene prioridad: es el que el GTR gestiona y
        // asigna normalmente. Si no hay ninguno en PREVENTA pero sí uno en otra etapa, lo marcamos
        // para atención GTR (visible en la bandeja diaria solo para asignarlo, sin tocar su gestión).
        Optional<Lead> leadPreventa = leadRepository
                .findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(identidad.contacto().getId(), Etapa.PREVENTA);
        if (leadPreventa.isPresent()) {
            registrarIngresoLeadExistente(leadPreventa.get(), identidad, request, campana, registroAt);
            return;
        }
        List<Lead> oportunidadesContacto =
                leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(identidad.contacto().getId());
        if (!oportunidadesContacto.isEmpty()) {
            registrarAtencionGtrLeadOtraEtapa(oportunidadesContacto.get(0), identidad, request, campana, registroAt);
            return;
        }
        registrarLeadNuevo(identidad, request, campana, registroAt);
    }

    private void validarOrigenIntake(Base origen, boolean tieneCampana) {
        if (origen == null) {
            throw new BadRequestException("Selecciona un origen para registrar el lead");
        }
        if (tieneCampana && !ORIGENES_CON_CAMPANA.contains(origen)) {
            throw new BadRequestException("Cuando eliges una campana, el origen debe ser WhatsApp o Messenger");
        }
        if (!tieneCampana && !ORIGENES_SIN_CAMPANA.contains(origen)) {
            throw new BadRequestException("Cuando no eliges campana, selecciona un origen sin campana");
        }
    }

    private void validarHoraRegistroRetroactivo(LocalTime horaRegistro) {
        if (horaRegistro == null
                || horaRegistro.isBefore(HORA_MINIMA_REGISTRO_RETROACTIVO)
                || horaRegistro.isAfter(HORA_MAXIMA_REGISTRO_RETROACTIVO)) {
            throw new BadRequestException("La hora del registro debe estar entre las 18:00 y las 23:59");
        }
    }

    @Transactional
    public Lead registrarIngresoLeadMasivo(
            String prefijo,
            String lead,
            Base base,
            String documentoSnapshot,
            String direccionSnapshot,
            Long idCampanaBaseMasivo,
            List<String> advertencias
    ) {
        String prefijoNormalizado = normalizarPrefijo(prefijo);
        String numeroLead = normalizarLead(lead);
        return leadRepository.findFirstByPrefijoAndLeadOrderByLastEntryAtDescIdDesc(prefijoNormalizado, numeroLead)
                .map(existingLead -> registrarIngresoLeadMasivoExistente(
                        existingLead,
                        prefijoNormalizado,
                        numeroLead,
                        base,
                        documentoSnapshot,
                        direccionSnapshot,
                        idCampanaBaseMasivo,
                        advertencias,
                        false
                ))
                .orElseGet(() -> registrarLeadMasivoNuevo(
                        prefijoNormalizado,
                        numeroLead,
                        base,
                        documentoSnapshot,
                        direccionSnapshot,
                        idCampanaBaseMasivo,
                        advertencias,
                        false
                ));
    }

    @Transactional
    public void asignarLead(Long idLead, LeadAsignacionRequest request) {
        asignarLeadInterno(
                idLead,
                request.getIdAsesorAsignado(),
                request.getNombreAsesorAsignado(),
                Boolean.TRUE.equals(request.getConfirmarReasignacion()),
                Boolean.TRUE.equals(request.getConfirmarGestionPrevia()),
                true
        );
    }

    @Transactional
    public void tomarGestionGtr(Long idLead, LeadTomaGestionGtrRequest request) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        validarLeadDentroAlcanceGtr(lead);

        Long idGtr = currentUser.empleadoID();
        String nombreGtr = currentUser.nombreCompleto().trim();
        if (idGtr.equals(lead.getIdAsesorAsignado())) {
            moverAEnGestionSiAplica(lead);
            lead.setLastEntryAt(OperationalDateTime.now());
            Lead savedLead = leadRepository.save(lead);
            notificarCambioLead("GESTION_INICIADA", savedLead, null, idGtr, savedLead.getEtapa() != Etapa.PREVENTA);
            return;
        }

        asignarLeadInterno(
                idLead,
                idGtr,
                nombreGtr,
                Boolean.TRUE.equals(request.getConfirmarReasignacion()),
                Boolean.TRUE.equals(request.getConfirmarGestionPrevia()),
                true
        );
        Lead savedLead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        moverAEnGestionSiAplica(savedLead);
        savedLead.setLastEntryAt(OperationalDateTime.now());
        savedLead = leadRepository.save(savedLead);
        notificarCambioLead("GESTION_INICIADA", savedLead, null, idGtr, savedLead.getEtapa() != Etapa.PREVENTA);
    }

    private void validarLeadDentroAlcanceGtr(Lead lead) {
        if (currentUser.tieneVisibilidadGlobalEquipos()) {
            return;
        }
        List<Long> equipos = currentUser.equipos();
        if (equipos == null || equipos.isEmpty()
                || lead.getIdEquipo() == null
                || !equipos.contains(lead.getIdEquipo())) {
            throw new NotFoundException(Lead.class, lead.getId());
        }
    }

    @Transactional
    public void iniciarGestionPreventa(Long idLead) {
        // Cualquier etapa asignada al asesor: también inicia la gestión de una atención GTR de un
        // lead en otra etapa (lo deja EN_GESTION para que nadie más lo tome mientras se atiende).
        Lead lead = obtenerLeadAsignadoDelAsesor(idLead);
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        if (lead.getEstado() == EstadoSeguimiento.EN_GESTION) {
            return;
        }
        if (lead.getEstado() != EstadoSeguimiento.ASIGNADO) {
            throw new BadRequestException("Solo se puede gestionar un Lead ASIGNADO");
        }
        // Un lead ASIGNADO -> EN_GESTION cuenta como una nueva gestión aparcada. Retomar un lead que
        // ya está EN_GESTION no pasa por aquí (retorna arriba), así que no consume cupo adicional.
        long gestionesAbiertas = leadRepository.countByIdAsesorAsignadoAndEstadoAndEtapa(
                currentUser.empleadoID(), EstadoSeguimiento.EN_GESTION, Etapa.PREVENTA);
        if (gestionesAbiertas >= MAX_GESTIONES_SIMULTANEAS) {
            throw new BadRequestException(
                    "Ya tienes " + MAX_GESTIONES_SIMULTANEAS
                            + " gestiones abiertas. Retoma y tipifica una antes de abrir otra.");
        }

        lead.setEstado(EstadoSeguimiento.EN_GESTION);
        lead.setLastEntryAt(OperationalDateTime.now());
        Lead savedLead = leadRepository.save(lead);
        notificarCambioLead("GESTION_INICIADA", savedLead, null, idAsesorAnterior);
    }

    @Transactional
    public void tomarLeadDisponible(Long idLead, Etapa etapa) {
        Lead lead = leadRepository.findByIdAndEtapa(idLead, etapa)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        Long idAsesorAnterior = lead.getIdAsesorAsignado();

        validarLeadDisponibleParaToma(lead);

        lead.setIdAsesorAsignado(currentUser.empleadoID());
        lead.setNombreAsesorAsignado(currentUser.nombreCompleto().trim());
        lead.setEstado(EstadoSeguimiento.ASIGNADO);

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoAsignacion(
                savedLead.getId(),
                idCampana,
                savedLead.getEtapa(),
                savedLead.getIdAsesorAsignado(),
                savedLead.getNombreAsesorAsignado()
        );
        leadEtapaResumenService.registrarAsignacion(savedLead.getId(), savedLead.getEtapa(), OperationalDateTime.now());
        notificarCambioLead("ASIGNACION", savedLead, null, idAsesorAnterior);
    }

    @Transactional
    public void tomarLeadVenta(Long idLead, boolean confirmarReasignacion) {
        Lead lead = leadRepository.findByIdAndEtapa(idLead, Etapa.VENTA)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        Long idAsesorActual = currentUser.empleadoID();
        boolean mismoAsesor = idAsesorAnterior != null && idAsesorAnterior.equals(idAsesorActual);

        validarTomaVentaPermitida(lead, confirmarReasignacion);

        lead.setIdAsesorAsignado(idAsesorActual);
        lead.setNombreAsesorAsignado(currentUser.nombreCompleto().trim());
        lead.setEstado(EstadoSeguimiento.EN_GESTION);
        lead.setLastEntryAt(OperationalDateTime.now());

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        if (!mismoAsesor) {
            registrarEventoAsignacion(
                    savedLead.getId(),
                    idCampana,
                    savedLead.getEtapa(),
                    savedLead.getIdAsesorAsignado(),
                    savedLead.getNombreAsesorAsignado()
            );
            leadEtapaResumenService.registrarAsignacion(savedLead.getId(), savedLead.getEtapa(), OperationalDateTime.now());
        }
        notificarCambioLead("ASIGNACION", savedLead, null, idAsesorAnterior);
    }

    @Transactional
    public void liberarAsignacionVenta(Long idLead) {
        Lead lead = leadRepository.findByIdAndEtapa(idLead, Etapa.VENTA)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        if (idAsesorAnterior == null) {
            return;
        }
        if (!idAsesorAnterior.equals(currentUser.empleadoID())) {
            throw new BadRequestException("Solo quien tiene el lead en gestion puede liberarlo.");
        }

        lead.setIdAsesorAsignado(null);
        lead.setNombreAsesorAsignado(null);
        lead.setEstado(lead.getCodigoTipificacion() == null ? EstadoSeguimiento.NUEVO : EstadoSeguimiento.GESTIONADO);

        Lead savedLead = leadRepository.save(lead);
        notificarCambioLead("ASIGNACION_LIBERADA", savedLead, null, idAsesorAnterior);
    }

    // Toma de gestion de POSTVENTA con relevo. A diferencia de tomarLeadDisponible (que solo toma
    // leads nuevos sin tipificacion), aqui el lead ya suele tener historial: cualquier asesor de
    // Postventa puede gestionarlo. Mientras lo gestiona queda asignado a el; si otro lo tiene en
    // gestion, el 409 pide confirmar el relevo. Mismo mecanismo que tomarLeadVenta.
    @Transactional
    public void tomarLeadPostventaGestion(Long idLead, boolean confirmarReasignacion) {
        Lead lead = leadRepository.findByIdAndEtapa(idLead, Etapa.POSTVENTA)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        postventaAsesorProveedorService.validarLeadVisibleParaUsuarioActual(lead);
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        Long idAsesorActual = currentUser.empleadoID();
        boolean mismoAsesor = idAsesorAnterior != null && idAsesorAnterior.equals(idAsesorActual);

        validarTomaPostventaPermitida(lead, confirmarReasignacion);

        lead.setIdAsesorAsignado(idAsesorActual);
        lead.setNombreAsesorAsignado(currentUser.nombreCompleto().trim());
        lead.setEstado(EstadoSeguimiento.EN_GESTION);
        lead.setLastEntryAt(OperationalDateTime.now());

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        if (!mismoAsesor) {
            registrarEventoAsignacion(
                    savedLead.getId(),
                    idCampana,
                    savedLead.getEtapa(),
                    savedLead.getIdAsesorAsignado(),
                    savedLead.getNombreAsesorAsignado()
            );
            leadEtapaResumenService.registrarAsignacion(savedLead.getId(), savedLead.getEtapa(), OperationalDateTime.now());
        }
        notificarCambioLead("ASIGNACION", savedLead, null, idAsesorAnterior);
    }

    private void validarTomaPostventaPermitida(Lead lead, boolean confirmarReasignacion) {
        Long idAsesorActual = lead.getIdAsesorAsignado();
        if (idAsesorActual == null) {
            return;
        }
        if (idAsesorActual.equals(currentUser.empleadoID())) {
            return;
        }
        if (confirmarReasignacion) {
            return;
        }
        throw new ConflictException(
                "Este lead esta siendo gestionado por otro asesor de Postventa",
                lead.getId(),
                detalleConfirmacionAsignacion(
                        "CONFIRMACION_ASIGNACION_REQUERIDA",
                        idAsesorActual,
                        lead.getNombreAsesorAsignado(),
                        true,
                        false,
                        lead.getEstado() == EstadoSeguimiento.EN_GESTION,
                        lead.getId(),
                        currentUser.empleadoID()
                )
        );
    }

    public List<PlanResponse> listarPlanesOfertaVenta(Long idLead) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        if (lead.getEtapa() != Etapa.VENTA) {
            throw new NotFoundException(Lead.class, idLead);
        }
        Proveedor proveedor = resolverProveedorOperativoVenta(lead);
        if (proveedor == null || proveedor.getId() == null) {
            return List.of();
        }
        return planService.listarPlanes(proveedor.getId(), true);
    }

    public LeadAsignacionMasivaResponse asignarLeads(LeadAsignacionMasivaRequest request) {
        List<Long> idsLead = request.getIdsLead().stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();

        if (idsLead.isEmpty()) {
            throw new BadRequestException("Debe enviar al menos un idLead valido");
        }

        validarAsignacionMasivaUnSoloEquipo(idsLead);

        List<LeadAsignacionResultadoResponse> resultados = new ArrayList<>();
        for (Long idLead : idsLead) {
            try {
                ejecutarAsignacionIndependiente(
                        idLead,
                        request.getIdAsesorAsignado(),
                        request.getNombreAsesorAsignado(),
                        Boolean.TRUE.equals(request.getConfirmarReasignacion())
                );
                resultados.add(LeadAsignacionResultadoResponse.builder()
                        .idLead(idLead)
                        .asignado(true)
                        .mensaje("Lead asignado correctamente")
                        .build());
            } catch (BusinessException e) {
                resultados.add(crearResultadoFallido(idLead, e.getMessage()));
            } catch (Exception e) {
                resultados.add(crearResultadoFallido(idLead, "Ocurrio un error inesperado"));
            }
        }

        int totalAsignados = (int) resultados.stream().filter(LeadAsignacionResultadoResponse::isAsignado).count();
        return LeadAsignacionMasivaResponse.builder()
                .totalSolicitados(request.getIdsLead().size())
                .totalProcesados(resultados.size())
                .totalAsignados(totalAsignados)
                .totalFallidos(resultados.size() - totalAsignados)
                .resultados(resultados)
                .build();
    }

    private void validarAsignacionMasivaUnSoloEquipo(List<Long> idsLead) {
        var equipos = leadRepository.findAllById(idsLead).stream()
                .map(Lead::getIdEquipo)
                .collect(Collectors.toSet());
        if (equipos.size() > 1) {
            throw new BadRequestException("Selecciona leads del mismo equipo para asignarlos juntos.");
        }
    }

    private void ejecutarAsignacionIndependiente(
            Long idLead,
            Long idAsesorAsignado,
            String nombreAsesorAsignado,
            boolean confirmarReasignacion
    ) {
        TransactionTemplate transaction = new TransactionTemplate(transactionTemplate.getTransactionManager());
        transaction.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
        transaction.executeWithoutResult(
                status -> asignarLeadInterno(idLead, idAsesorAsignado, nombreAsesorAsignado, confirmarReasignacion, false, false)
        );
    }

    private LeadAsignacionResultadoResponse crearResultadoFallido(Long idLead, String mensaje) {
        return LeadAsignacionResultadoResponse.builder()
                .idLead(idLead)
                .asignado(false)
                .mensaje(mensaje)
                .build();
    }

    private void asignarLeadInterno(
            Long idLead,
            Long idAsesorAsignado,
            String nombreAsesorAsignado,
            boolean confirmarReasignacion,
            boolean confirmarGestionPrevia,
            boolean permitirConfirmarLeadEnGestion
    ) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        Long idAsesorAnterior = lead.getIdAsesorAsignado();

        validarLeadDentroAlcanceGtr(lead);
        validarAsesorPerteneceEquipoLead(lead, idAsesorAsignado);
        validarAsignacionPermitida(
                lead,
                idAsesorAsignado,
                confirmarReasignacion,
                confirmarGestionPrevia,
                permitirConfirmarLeadEnGestion
        );

        lead.setIdAsesorAsignado(idAsesorAsignado);
        lead.setNombreAsesorAsignado(nombreAsesorAsignado.trim());
        lead.setIdTipificacion(null);
        lead.setCodigoTipificacion(null);
        lead.setIdSubtipificacion(null);
        lead.setCodigoSubtipificacion(null);
        lead.setEstado(EstadoSeguimiento.ASIGNADO);
        lead.setLastEntryAt(OperationalDateTime.now());

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoAsignacion(
                savedLead.getId(),
                idCampana,
                savedLead.getEtapa(),
                savedLead.getIdAsesorAsignado(),
                savedLead.getNombreAsesorAsignado()
        );
        // Metadata por etapa: cuenta la asignación en la etapa actual del lead.
        leadEtapaResumenService.registrarAsignacion(savedLead.getId(), savedLead.getEtapa(), OperationalDateTime.now());
        // Atención GTR: si el lead asignado vive en otra etapa, notificar también a la bandeja del GTR.
        notificarCambioLead("ASIGNACION", savedLead, null, idAsesorAnterior, savedLead.getEtapa() != Etapa.PREVENTA);
        propagarAsesorAHermanas(savedLead, idAsesorAsignado, savedLead.getNombreAsesorAsignado());
    }

    private void validarAsesorPerteneceEquipoLead(Lead lead, Long idAsesorAsignado) {
        if (lead.getIdEquipo() == null) {
            throw new BadRequestException("El Lead no tiene equipo asignado.");
        }
        if (idAsesorAsignado != null && idAsesorAsignado.equals(currentUser.empleadoID())) {
            return;
        }
        if (!authEquipoClient.asesorPerteneceEquipo(lead.getIdEquipo(), idAsesorAsignado)) {
            throw new BadRequestException("El asesor seleccionado no pertenece al equipo del Lead.");
        }
    }

    // Coherencia multi-titular: al asignar un lead, sus hermanas (mismo contacto+equipo) en PREVENTA
    // pasan al mismo asesor, para que una sola persona maneje toda la comunicación del contacto.
    // El @Filter acota a las del equipo del que asigna.
    private void propagarAsesorAHermanas(Lead lead, Long idAsesor, String nombreAsesor) {
        if (lead.getContacto() == null) {
            return;
        }
        List<Lead> hermanas = leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(lead.getContacto().getId());
        for (Lead hermana : hermanas) {
            if (hermana.getId().equals(lead.getId()) || hermana.getEtapa() != Etapa.PREVENTA) {
                continue;
            }
            if (java.util.Objects.equals(hermana.getIdAsesorAsignado(), idAsesor)) {
                continue;
            }
            hermana.setIdAsesorAsignado(idAsesor);
            hermana.setNombreAsesorAsignado(nombreAsesor);
            Lead guardada = leadRepository.save(hermana);
            Long idCampana = guardada.getCampana() == null ? null : guardada.getCampana().getId();
            registrarEventoAsignacion(guardada.getId(), idCampana, guardada.getEtapa(), idAsesor, nombreAsesor);
            leadEtapaResumenService.registrarAsignacion(guardada.getId(), guardada.getEtapa(), OperationalDateTime.now());
            notificarCambioLead("ASIGNACION", guardada, null, null);
        }
    }

    private void validarAsignacionPermitida(
            Lead lead,
            Long idAsesorAsignado,
            boolean confirmarReasignacion,
            boolean confirmarGestionPrevia,
            boolean permitirConfirmarLeadEnGestion
    ) {
        Long idAsesorActual = lead.getIdAsesorAsignado();
        if (idAsesorActual != null && idAsesorActual.equals(idAsesorAsignado)) {
            throw new ConflictException(
                    "El Lead ya esta asignado a este asesor",
                    lead.getId(),
                    detalleConflictoAsignacion(
                            "LEAD_YA_ASIGNADO_MISMO_ASESOR",
                            idAsesorActual,
                            lead.getNombreAsesorAsignado()
                    )
            );
        }

        boolean leadEnGestion = idAsesorActual != null && lead.getEstado() == EstadoSeguimiento.EN_GESTION;
        if (leadEnGestion && !permitirConfirmarLeadEnGestion) {
            throw new ConflictException(
                    "El Lead ya esta en gestion y no puede reasignarse en asignacion masiva",
                    lead.getId(),
                    detalleConflictoAsignacion("LEAD_EN_GESTION", idAsesorActual, lead.getNombreAsesorAsignado())
            );
        }

        boolean requiereConfirmarReasignacion = idAsesorActual != null && !confirmarReasignacion;
        boolean asesorYaGestiono = asesorGestionoLead(lead.getId(), idAsesorAsignado);
        boolean requiereConfirmarGestionPrevia = asesorYaGestiono && !confirmarGestionPrevia;

        if (requiereConfirmarReasignacion || requiereConfirmarGestionPrevia) {
            String tipo = tipoConfirmacionAsignacion(leadEnGestion, requiereConfirmarReasignacion, requiereConfirmarGestionPrevia);
            throw new ConflictException(
                    mensajeConfirmacionAsignacion(leadEnGestion, requiereConfirmarReasignacion, requiereConfirmarGestionPrevia),
                    lead.getId(),
                    detalleConfirmacionAsignacion(
                            tipo,
                            idAsesorActual,
                            lead.getNombreAsesorAsignado(),
                            requiereConfirmarReasignacion,
                            requiereConfirmarGestionPrevia,
                            leadEnGestion,
                            lead.getId(),
                            idAsesorAsignado
                    )
            );
        }
    }

    private Map<String, Object> detalleConflictoAsignacion(String tipo, Long idAsesor, String nombreAsesor) {
        Map<String, Object> details = new HashMap<>();
        details.put("tipo", tipo);
        details.put("idAsesorActual", idAsesor);
        details.put("nombreAsesorActual", nombreAsesor);
        return details;
    }

    private Map<String, Object> detalleConfirmacionAsignacion(
            String tipo,
            Long idAsesor,
            String nombreAsesor,
            boolean requiereConfirmarReasignacion,
            boolean requiereConfirmarGestionPrevia,
            boolean requiereConfirmarLeadEnGestion,
            Long idLead,
            Long idAsesorAsignado
    ) {
        Map<String, Object> details = detalleConflictoAsignacion(tipo, idAsesor, nombreAsesor);
        details.put("requiereConfirmarReasignacion", requiereConfirmarReasignacion);
        details.put("requiereConfirmarGestionPrevia", requiereConfirmarGestionPrevia);
        details.put("requiereConfirmarLeadEnGestion", requiereConfirmarLeadEnGestion);
        if (requiereConfirmarGestionPrevia && idLead != null && idAsesorAsignado != null) {
            eventoRepository
                    .findTopByIdLeadAndIdActorAndAccionInOrderByCreatedAtDesc(idLead, idAsesorAsignado, ACCIONES_GESTION_LEAD)
                    .map(Evento::getCreatedAt)
                    .ifPresent(ultimaGestionAt -> details.put("ultimaGestionAt", ultimaGestionAt));
        }
        return details;
    }

    private String tipoConfirmacionAsignacion(
            boolean leadEnGestion,
            boolean requiereConfirmarReasignacion,
            boolean requiereConfirmarGestionPrevia
    ) {
        if (requiereConfirmarReasignacion && requiereConfirmarGestionPrevia) {
            return "CONFIRMACION_ASIGNACION_REQUERIDA";
        }
        if (leadEnGestion) {
            return "LEAD_EN_GESTION";
        }
        if (requiereConfirmarGestionPrevia) {
            return "ASESOR_YA_GESTIONO_LEAD";
        }
        return "LEAD_YA_ASIGNADO";
    }

    private String mensajeConfirmacionAsignacion(
            boolean leadEnGestion,
            boolean requiereConfirmarReasignacion,
            boolean requiereConfirmarGestionPrevia
    ) {
        if (leadEnGestion && requiereConfirmarGestionPrevia) {
            return "El Lead esta en gestion y el asesor seleccionado ya lo gestiono anteriormente. Confirma para continuar";
        }
        if (leadEnGestion) {
            return "El Lead esta en gestion. Confirma la reasignacion para continuar";
        }
        if (requiereConfirmarReasignacion && requiereConfirmarGestionPrevia) {
            return "El Lead ya esta asignado y el asesor seleccionado ya lo gestiono anteriormente. Confirma para continuar";
        }
        if (requiereConfirmarGestionPrevia) {
            return "El asesor seleccionado ya gestiono el Lead anteriormente. Confirma para continuar";
        }
        return "El Lead ya esta asignado. Confirma la reasignacion para continuar";
    }

    private boolean asesorGestionoLead(Long idLead, Long idAsesorAsignado) {
        return eventoRepository.existsByIdLeadAndIdActorAndAccionIn(
                idLead,
                idAsesorAsignado,
                ACCIONES_GESTION_LEAD
        );
    }

    private void validarLeadDisponibleParaToma(Lead lead) {
        if (lead.getIdAsesorAsignado() != null || lead.getNombreAsesorAsignado() != null) {
            throw new ConflictException("El Lead ya fue tomado por otro asesor");
        }
        if (lead.getIdTipificacion() != null || lead.getCodigoTipificacion() != null
                || lead.getIdSubtipificacion() != null || lead.getCodigoSubtipificacion() != null) {
            throw new ConflictException("El Lead ya no se encuentra disponible para ser tomado");
        }
    }

    private void validarTomaVentaPermitida(Lead lead, boolean confirmarReasignacion) {
        Long idAsesorActual = lead.getIdAsesorAsignado();
        if (idAsesorActual == null) {
            return;
        }
        if (idAsesorActual.equals(currentUser.empleadoID())) {
            return;
        }
        if (confirmarReasignacion) {
            return;
        }
        throw new ConflictException(
                "Este lead esta siendo gestionado por otro Backoffice",
                lead.getId(),
                detalleConfirmacionAsignacion(
                        "CONFIRMACION_ASIGNACION_REQUERIDA",
                        idAsesorActual,
                        lead.getNombreAsesorAsignado(),
                        true,
                        false,
                        lead.getEstado() == EstadoSeguimiento.EN_GESTION,
                        lead.getId(),
                        currentUser.empleadoID()
                )
        );
    }

    @Transactional
    public void registrarContacto(Long idLead) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        registrarContactoInterno(lead);
    }

    @Transactional
    public void registrarContactoVenta(Long idLead) {
        Lead lead = obtenerLeadAsignadoEnEtapa(idLead, Etapa.VENTA);
        registrarContactoInterno(lead);
    }

    @Transactional
    public void registrarContactoPostventa(Long idLead) {
        Lead lead = obtenerLeadAsignadoEnEtapa(idLead, Etapa.POSTVENTA);
        registrarContactoInterno(lead);
    }

    private void registrarContactoInterno(Lead lead) {
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        validarEstadoParaContacto(lead);
        moverAEnGestionSiAplica(lead);

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoContacto(savedLead.getId(), idCampana, savedLead.getEtapa());
        notificarCambioLead("CONTACTO", savedLead, null, idAsesorAnterior);
    }

    // Resuelve (o crea) el Contacto identidad por prefijo+lead. No se ve afectado por el filtro
    // por equipo (el filtro aplica solo a Lead): el contacto es identidad compartida.
    private Contacto resolverContacto(String prefijo, String numeroLead) {
        return contactoRepository.findByPrefijoAndLead(prefijo, numeroLead)
                .orElseGet(() -> contactoRepository.save(
                        Contacto.builder().prefijo(prefijo).lead(numeroLead).build()));
    }

    private LeadIdentidad resolverIdentidadContacto(String prefijo, String numeroLead, String usermeta) {
        Optional<Contacto> contactoPorTelefono = tieneTelefono(prefijo, numeroLead)
                ? contactoRepository.findByPrefijoAndLead(prefijo, numeroLead)
                : Optional.empty();
        Optional<Contacto> contactoPorUsermeta = usermeta == null
                ? Optional.empty()
                : contactoRepository.findByUsermetaIgnoreCase(usermeta);

        if (contactoPorTelefono.isPresent()
                && contactoPorUsermeta.isPresent()
                && !contactoPorTelefono.get().getId().equals(contactoPorUsermeta.get().getId())) {
            throw new ConflictException("El telefono y el usermeta pertenecen a contactos distintos. Revisa el lead antes de registrarlo.");
        }

        Contacto contacto = contactoPorTelefono
                .or(() -> contactoPorUsermeta)
                .orElseGet(() -> contactoRepository.save(
                        Contacto.builder().prefijo(prefijo).lead(numeroLead).usermeta(usermeta).build()));

        validarCompatibilidadIdentidad(contacto, prefijo, numeroLead, usermeta);
        boolean actualizado = completarIdentidadContacto(contacto, prefijo, numeroLead, usermeta);
        if (actualizado && contacto.getId() != null) {
            contacto = contactoRepository.save(contacto);
        }
        return new LeadIdentidad(contacto.getPrefijo(), contacto.getLead(), contacto.getUsermeta(), contacto);
    }

    private void validarCompatibilidadIdentidad(Contacto contacto, String prefijo, String numeroLead, String usermeta) {
        if (tieneTelefono(prefijo, numeroLead)
                && tieneTelefono(contacto.getPrefijo(), contacto.getLead())
                && (!contacto.getPrefijo().equals(prefijo) || !contacto.getLead().equals(numeroLead))) {
            throw new ConflictException("El contacto ya tiene otro telefono registrado. Revisa el lead antes de registrarlo.");
        }
        if (usermeta != null
                && contacto.getUsermeta() != null
                && !contacto.getUsermeta().equalsIgnoreCase(usermeta)) {
            throw new ConflictException("El contacto ya tiene otro usermeta registrado. Revisa el lead antes de registrarlo.");
        }
    }

    private void validarIdentidadParaCompletar(Lead lead, Contacto contacto, String prefijo, String numeroLead, String usermeta) {
        Optional<Contacto> contactoPorTelefono = tieneTelefono(prefijo, numeroLead)
                ? contactoRepository.findByPrefijoAndLead(prefijo, numeroLead)
                : Optional.empty();
        if (contactoPorTelefono.isPresent() && !contactoPorTelefono.get().getId().equals(contacto.getId())) {
            throw new ConflictException("El telefono pertenece a otro contacto. Revisa el lead antes de completar la identidad.");
        }

        if (tieneTelefono(prefijo, numeroLead)) {
            leadRepository.findByPrefijoAndLead(prefijo, numeroLead)
                    .filter(leadPorTelefono -> !leadPorTelefono.getId().equals(lead.getId()))
                    .filter(leadPorTelefono -> leadPorTelefono.getContacto() == null
                            || leadPorTelefono.getContacto().getId() == null
                            || !leadPorTelefono.getContacto().getId().equals(contacto.getId()))
                    .ifPresent(leadPorTelefono -> {
                        throw new ConflictException("El telefono ya figura en otro lead. Revisa el lead antes de completar la identidad.");
                    });
        }

        Optional<Contacto> contactoPorUsermeta = usermeta == null
                ? Optional.empty()
                : contactoRepository.findByUsermetaIgnoreCase(usermeta);
        if (contactoPorUsermeta.isPresent() && !contactoPorUsermeta.get().getId().equals(contacto.getId())) {
            throw new ConflictException("El usermeta pertenece a otro contacto. Revisa el lead antes de completar la identidad.");
        }

        validarCompatibilidadIdentidad(contacto, prefijo, numeroLead, usermeta);
    }

    private boolean completarIdentidadContacto(Contacto contacto, String prefijo, String numeroLead, String usermeta) {
        boolean actualizado = false;
        if (tieneTelefono(prefijo, numeroLead) && !tieneTelefono(contacto.getPrefijo(), contacto.getLead())) {
            contacto.setPrefijo(prefijo);
            contacto.setLead(numeroLead);
            actualizado = true;
        }
        if (usermeta != null && (contacto.getUsermeta() == null || contacto.getUsermeta().isBlank())) {
            contacto.setUsermeta(usermeta);
            actualizado = true;
        }
        return actualizado;
    }

    private void sincronizarIdentidadLead(Lead lead, LeadIdentidad identidad) {
        lead.setPrefijo(identidad.prefijo());
        lead.setLead(identidad.lead());
        lead.setUsermeta(identidad.usermeta());
        lead.setContacto(identidad.contacto());
        completarNumeroParaLlamarSiFalta(lead);
    }

    // Deriva el equipo del lead: si el usuario pertenece a un único equipo, ese; si no, del
    // proveedor de la campaña (mapping equipo_proveedor). Puede ser null (contexto sin equipo).
    private Long derivarIdEquipo(Campana campana) {
        List<Long> equipos = currentUser.equipos();
        if (equipos != null && equipos.size() == 1) {
            return equipos.get(0);
        }
        if (campana != null && campana.getProveedor() != null) {
            return equipoProveedorRepository.findFirstByProveedorId(campana.getProveedor().getId())
                    .map(EquipoProveedor::getIdEquipo)
                    .orElse(null);
        }
        return null;
    }

    private void registrarLeadNuevo(
            LeadIdentidad identidad,
            LeadIntakeRequest request,
            Campana campana,
            Instant registroAt
    ) {
        Lead lead = leadMapper.toNuevoLead(
                identidad.prefijo(), identidad.lead(), identidad.usermeta(), request.getBase(), campana, OperationalDateTime.now());
        lead.setContacto(identidad.contacto());
        lead.setIdEquipo(derivarIdEquipo(campana));
        completarNumeroParaLlamarSiFalta(lead);

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoRegistro(savedLead.getId(), idCampana, savedLead.getEtapa(), registroAt);
        // Metadata por etapa: el lead nuevo ENTRA a PREVENTA.
        leadEtapaResumenService.registrarEntradaEtapa(
                savedLead.getId(), savedLead.getEtapa(), registroAt != null ? registroAt : OperationalDateTime.now());
        notificarCambioLead("REGISTRO", savedLead, null, null);
    }

    private Lead registrarLeadMasivoNuevo(
            String prefijo,
            String numeroLead,
            Base base,
            String documentoSnapshot,
            String direccionSnapshot,
            Long idCampanaBaseMasivo,
            List<String> advertencias,
            boolean notificarRealtime
    ) {
        Campana campana = obtenerCampanaBaseMasivo(idCampanaBaseMasivo, advertencias);
        Lead lead = leadMapper.toNuevoLead(prefijo, numeroLead, null, base, campana, OperationalDateTime.now());
        aplicarSnapshotsMasivo(lead, documentoSnapshot, direccionSnapshot, advertencias);
        lead.setContacto(resolverContacto(prefijo, numeroLead));
        lead.setIdEquipo(derivarIdEquipo(campana));
        completarNumeroParaLlamarSiFalta(lead);

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoRegistro(savedLead.getId(), idCampana, savedLead.getEtapa());
        // Metadata por etapa: el lead nuevo (masivo) ENTRA a PREVENTA.
        leadEtapaResumenService.registrarEntradaEtapa(savedLead.getId(), savedLead.getEtapa(), OperationalDateTime.now());
        if (notificarRealtime) {
            notificarCambioLead("REGISTRO", savedLead, null, null);
        }
        return savedLead;
    }

    private void registrarIngresoLeadExistente(
            Lead lead,
            LeadIdentidad identidad,
            LeadIntakeRequest request,
            Campana campana,
            Instant registroAt
    ) {
        Etapa etapaAnterior = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        sincronizarIdentidadLead(lead, identidad);
        // Si el re-registro no indica campana, se conserva la que ya tenia el lead (no se borra).
        if (campana != null) {
            lead.setCampana(campana);
        }
        lead.setBase(request.getBase());
        lead.setLastEntryAt(OperationalDateTime.now());
        if (lead.getIdEquipo() == null) {
            lead.setIdEquipo(derivarIdEquipo(campana));
        }

        // Solo se reinicia a NUEVO si el lead no tuvo gestion hoy. Si ya hubo asignacion, contacto
        // o tipificacion en el dia, el re-registro conserva su estado, tipificacion y asesor.
        if (lead.getEtapa() == Etapa.PREVENTA && !tieneGestionHoy(lead.getId())) {
            lead.setIdAsesorAsignado(null);
            lead.setNombreAsesorAsignado(null);
            lead.setIdTipificacion(null);
            lead.setCodigoTipificacion(null);
            lead.setIdSubtipificacion(null);
            lead.setCodigoSubtipificacion(null);
            lead.setEstado(EstadoSeguimiento.NUEVO);
        }

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoRegistro(savedLead.getId(), idCampana, savedLead.getEtapa(), registroAt);
        notificarCambioLead("REGISTRO", savedLead, etapaAnterior, idAsesorAnterior);
    }

    // El contacto vuelve a comunicarse y su único lead ya no está en PREVENTA. Lo marcamos para
    // atención GTR: visible en la bandeja diaria solo para asignarlo a un asesor que atienda la
    // comunicación. NO se toca su etapa/estado/tipificación/datos ni su asignación: sigue
    // gestionándose en su etapa actual. Solo se refresca lastEntryAt para que entre en el día.
    private void registrarAtencionGtrLeadOtraEtapa(
            Lead lead,
            LeadIdentidad identidad,
            LeadIntakeRequest request,
            Campana campana,
            Instant registroAt
    ) {
        Etapa etapaAnterior = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        sincronizarIdentidadLead(lead, identidad);
        if (lead.getIdEquipo() == null) {
            lead.setIdEquipo(derivarIdEquipo(campana));
        }
        lead.setRequiereAtencionGtr(true);
        lead.setLastEntryAt(OperationalDateTime.now());

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoRegistro(savedLead.getId(), idCampana, savedLead.getEtapa(), registroAt);
        notificarCambioLead("REGISTRO", savedLead, etapaAnterior, idAsesorAnterior, true);
    }

    private boolean tieneGestionHoy(Long idLead) {
        if (idLead == null) {
            return false;
        }
        OperationalDateTime.InstantRange hoy = OperationalDateTime.dayRange(null);
        return eventoRepository.existsByIdLeadAndAccionInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                idLead,
                List.of(Accion.ASIGNACION, Accion.CONTACTO, Accion.TIPIFICACION),
                hoy.inicio(),
                hoy.fin());
    }

    private Lead registrarIngresoLeadMasivoExistente(
            Lead lead,
            String prefijo,
            String numeroLead,
            Base base,
            String documentoSnapshot,
            String direccionSnapshot,
            Long idCampanaBaseMasivo,
            List<String> advertencias,
            boolean notificarRealtime
    ) {
        Etapa etapaAnterior = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        Campana campana = lead.getCampana();
        if (campana == null) {
            campana = obtenerCampanaBaseMasivo(idCampanaBaseMasivo, advertencias);
        }

        lead.setPrefijo(prefijo);
        lead.setLead(numeroLead);
        completarNumeroParaLlamarSiFalta(lead);
        lead.setCampana(campana);
        lead.setBase(base);
        lead.setLastEntryAt(OperationalDateTime.now());
        aplicarSnapshotsMasivo(lead, documentoSnapshot, direccionSnapshot, advertencias);
        if (lead.getContacto() == null) {
            lead.setContacto(resolverContacto(prefijo, numeroLead));
        }
        if (lead.getIdEquipo() == null) {
            lead.setIdEquipo(derivarIdEquipo(campana));
        }

        // Solo se reinicia a NUEVO si el lead no tuvo gestion hoy. Si ya hubo asignacion, contacto
        // o tipificacion en el dia, el re-registro conserva su estado, tipificacion y asesor.
        if (lead.getEtapa() == Etapa.PREVENTA && !tieneGestionHoy(lead.getId())) {
            lead.setIdAsesorAsignado(null);
            lead.setNombreAsesorAsignado(null);
            lead.setIdTipificacion(null);
            lead.setCodigoTipificacion(null);
            lead.setIdSubtipificacion(null);
            lead.setCodigoSubtipificacion(null);
            lead.setEstado(EstadoSeguimiento.NUEVO);
        }

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoRegistro(savedLead.getId(), idCampana, savedLead.getEtapa());
        if (notificarRealtime) {
            notificarCambioLead("REGISTRO", savedLead, etapaAnterior, idAsesorAnterior);
        }
        return savedLead;
    }

    private Campana obtenerCampanaBaseMasivo(Long idCampanaBaseMasivo, List<String> advertencias) {
        // Campana de respaldo opcional: si no esta configurada (o ya no existe/activa),
        // el lead masivo queda sin campana, en la bandeja del equipo.
        if (idCampanaBaseMasivo == null) {
            return null;
        }
        Campana campana = campanaRepository.findByIdAndActivoTrue(idCampanaBaseMasivo).orElse(null);
        advertencias.add(campana == null
                ? "Campana BASE no disponible; el lead queda sin campana"
                : "Campana BASE aplicada");
        return campana;
    }

    private void aplicarSnapshotsMasivo(
            Lead lead,
            String documentoSnapshot,
            String direccionSnapshot,
            List<String> advertencias
    ) {
        String documento = leadMapper.trimToNull(documentoSnapshot);
        String direccion = leadMapper.trimToNull(direccionSnapshot);

        if (documento != null) {
            if (lead.getDatosPreventa() == null) {
                lead.setNumeroDocumentoTitularServicioSnapshot(documento);
            } else {
                advertencias.add("Documento ignorado porque el Lead ya tiene datos de preventa");
            }
        }
        if (direccion != null) {
            if (lead.getDireccion() == null) {
                lead.setDireccionSnapshot(direccion);
            } else {
                advertencias.add("Direccion ignorada porque el Lead ya tiene direccion");
            }
        }
    }

    private void registrarEventoRegistro(Long idLead, Long idCampana, Etapa etapa) {
        registrarEventoRegistro(idLead, idCampana, etapa, null);
    }

    private void registrarEventoRegistro(Long idLead, Long idCampana, Etapa etapa, Instant registroAt) {
        RegistrarEventoRequest request = RegistrarEventoRequest.builder()
                .idLead(idLead)
                .idCampana(idCampana)
                .accion(Accion.REGISTRO)
                .etapa(etapa)
                .build();
        if (registroAt == null) {
            eventoService.registrarEvento(request);
            return;
        }
        eventoService.registrarEvento(request, registroAt);
    }

    // Multi-titular: el alta de una oportunidad adicional NO es un registro de lead nuevo.
    // Se emite como NUEVA_OPORTUNIDAD para no inflar los conteos/alertas de REGISTRO.
    private void registrarEventoNuevaOportunidad(Long idLead, Long idCampana, Etapa etapa) {
        eventoService.registrarEvento(
                RegistrarEventoRequest.builder()
                        .idLead(idLead)
                        .idCampana(idCampana)
                        .accion(Accion.NUEVA_OPORTUNIDAD)
                        .etapa(etapa)
                        .build()
        );
    }

    private void registrarEventoAsignacion(
            Long idLead,
            Long idCampana,
            Etapa etapa,
            Long idAsesorAsignado,
            String nombreAsesorAsignado
    ) {
        eventoService.registrarEvento(
                RegistrarEventoRequest.builder()
                        .idLead(idLead)
                        .idCampana(idCampana)
                        .accion(Accion.ASIGNACION)
                        .etapa(etapa)
                        .idAsesorAsignado(idAsesorAsignado)
                        .nombreAsesorAsignado(nombreAsesorAsignado)
                        .build()
        );
    }

    private void registrarEventoContacto(Long idLead, Long idCampana, Etapa etapa) {
        eventoService.registrarEvento(
                RegistrarEventoRequest.builder()
                        .idLead(idLead)
                        .idCampana(idCampana)
                        .accion(Accion.CONTACTO)
                        .etapa(etapa)
                        .build()
        );
    }

    private void registrarEventoTipificacion(
            Long idLead,
            Long idCampana,
            Etapa etapa,
            Long idPlanOfrecido,
            String tipificacion,
            String subtipificacion,
            String comentario,
            java.time.LocalTime horaProgramada
    ) {
        // AGENDADO de preventa: el asesor solo elige la hora de la cita. La fecha se deriva y se
        // guarda aqui con la regla de negocio (hora anterior a la hora actual => manana; igual o
        // posterior => hoy), para que la cita quede con fecha-hora completa y ordenable.
        java.time.LocalDate fechaProgramacion = horaProgramada == null
                ? null
                : OperationalDateTime.scheduledDateFromTime(OperationalDateTime.now(), horaProgramada);
        eventoService.registrarEvento(
                RegistrarEventoRequest.builder()
                        .idLead(idLead)
                        .idCampana(idCampana)
                        .accion(Accion.TIPIFICACION)
                        .etapa(etapa)
                        .idPlanOfrecido(idPlanOfrecido)
                        .tipificacion(tipificacion)
                        .subtipificacion(subtipificacion)
                        .comentario(comentario)
                        .fechaProgramacion(fechaProgramacion)
                        .horaProgramada(horaProgramada)
                        .build()
        );
    }

    private void registrarEventoTipificacion(
            Long idLead,
            Long idCampana,
            Etapa etapa,
            Long idPlanOfrecido,
            String tipificacion,
            String subtipificacion,
            String comentario,
            java.time.LocalDate fechaInstalacion
    ) {
        eventoService.registrarEvento(
                RegistrarEventoRequest.builder()
                        .idLead(idLead)
                        .idCampana(idCampana)
                        .accion(Accion.TIPIFICACION)
                        .etapa(etapa)
                        .idPlanOfrecido(idPlanOfrecido)
                        .tipificacion(tipificacion)
                        .subtipificacion(subtipificacion)
                        .comentario(comentario)
                        .fechaInstalacion(fechaInstalacion)
                        .build()
        );
    }

    private void registrarEventoTipificacion(
            Long idLead,
            Long idCampana,
            Etapa etapa,
            Long idPlanOfrecido,
            String tipificacion,
            String subtipificacion,
            String comentario,
            java.time.LocalDate fechaInstalacion,
            java.time.LocalDate fechaProgramacion,
            java.time.LocalTime horaProgramada
    ) {
        eventoService.registrarEvento(
                RegistrarEventoRequest.builder()
                        .idLead(idLead)
                        .idCampana(idCampana)
                        .accion(Accion.TIPIFICACION)
                        .etapa(etapa)
                        .idPlanOfrecido(idPlanOfrecido)
                        .tipificacion(tipificacion)
                        .subtipificacion(subtipificacion)
                        .comentario(comentario)
                        .fechaInstalacion(fechaInstalacion)
                        .fechaProgramacion(fechaProgramacion)
                        .horaProgramada(horaProgramada)
                        .build()
        );
    }

    private void registrarEventoActualizacion(Lead lead, Accion accion, Long idPlanOfrecido) {
        Long idCampana = lead.getCampana() == null ? null : lead.getCampana().getId();
        eventoService.registrarEvento(
                RegistrarEventoRequest.builder()
                        .idLead(lead.getId())
                        .idCampana(idCampana)
                        .accion(accion)
                        .etapa(lead.getEtapa())
                        .idPlanOfrecido(idPlanOfrecido)
                        .build()
        );
    }

    private void validarHoraProgramada(Subtipificacion subtipificacion, java.time.LocalTime horaProgramada) {
        if (subtipificacion.getComportamientos().contains(ComportamientoTipificacion.REQUIERE_HORA_PROGRAMADA)) {
            if (horaProgramada == null) {
                throw new BadRequestException("La horaProgramada es obligatoria para esta tipificacion");
            }
            return;
        }

        if (horaProgramada != null) {
            throw new BadRequestException("La horaProgramada solo se permite para tipificaciones que la requieren");
        }
    }

    private void validarProgramacionVenta(
            boolean requiereProgramacion,
            java.time.LocalDate fechaProgramacion,
            java.time.LocalTime horaProgramada
    ) {
        if (!requiereProgramacion) {
            return;
        }

        if (fechaProgramacion == null) {
            throw new BadRequestException("La fechaProgramacion es obligatoria para la tipificacion PROGRAMADO");
        }

        if (horaProgramada == null) {
            throw new BadRequestException("La horaProgramada es obligatoria para la tipificacion PROGRAMADO");
        }

        // TEMPORAL: regularizacion de leads antiguos. Descomentar al cerrar la regularizacion.
        // validarFechaNoAnteriorAHoy(fechaProgramacion, "La fecha de programacion no puede ser anterior a hoy");
    }

    private void validarFechaInstalacionVenta(java.time.LocalDate fechaInstalacion) {
        if (fechaInstalacion == null) {
            throw new BadRequestException("La fecha de instalacion es obligatoria para pasar a POSTVENTA");
        }
        // TEMPORAL: regularizacion de leads antiguos. Descomentar al cerrar la regularizacion.
        // validarFechaNoAnteriorAHoy(fechaInstalacion, "La fecha de instalacion no puede ser anterior a hoy");
    }

    private void validarFechaNoAnteriorAHoy(java.time.LocalDate fecha, String mensajeUsuario) {
        if (fecha != null && fecha.isBefore(OperationalDateTime.today())) {
            throw new BadRequestException(mensajeUsuario);
        }
    }

    private Campana obtenerCampanaActiva(Long idCampana) {
        return campanaRepository.findByIdAndActivoTrue(idCampana)
                .orElseThrow(() -> new NotFoundException(Campana.class, idCampana));
    }

    private String normalizarPrefijo(String prefijo) {
        String normalizado = prefijo == null ? null : prefijo.trim();
        return normalizado == null || normalizado.isBlank() ? null : normalizado;
    }

    private String normalizarLead(String lead) {
        String normalizado = lead == null ? null : lead.trim();
        return normalizado == null || normalizado.isBlank() ? null : normalizado;
    }

    private String normalizarNumeroParaLlamar(String numeroParaLlamar) {
        String normalizado = leadMapper.trimToNull(numeroParaLlamar);
        if (normalizado == null || !NUMERO_LLAMADA_PATTERN.matcher(normalizado).matches()) {
            throw new BadRequestException("numeroParaLlamar debe tener 9 digitos y empezar en 9");
        }
        return normalizado;
    }

    private void completarNumeroParaLlamarSiFalta(Lead lead) {
        if (lead.getNumeroParaLlamar() != null && !lead.getNumeroParaLlamar().isBlank()) {
            return;
        }
        String numeroLead = normalizarLead(lead.getLead());
        if (numeroLead != null && NUMERO_LLAMADA_PATTERN.matcher(numeroLead).matches()) {
            lead.setNumeroParaLlamar(numeroLead);
        }
    }

    private void agregarNumeroLlamada(
            Map<String, NumeroLlamadaResponse> opciones,
            TipoNumeroLlamada tipo,
            String label,
            String numero,
            int prioridad
    ) {
        String normalizado = leadMapper.trimToNull(numero);
        if (normalizado == null || !NUMERO_LLAMADA_PATTERN.matcher(normalizado).matches()) {
            return;
        }
        opciones.putIfAbsent(normalizado, NumeroLlamadaResponse.builder()
                .tipo(tipo)
                .label(label)
                .numero(normalizado)
                .prioridad(prioridad)
                .build());
    }

    private String normalizarUsermeta(String usermeta) {
        if (usermeta == null) {
            return null;
        }
        String normalizado = usermeta.trim();
        if (normalizado.startsWith("@")) {
            normalizado = normalizado.substring(1).trim();
        }
        return normalizado.isBlank() ? null : normalizado;
    }

    private void validarIdentidadIntake(String prefijo, String numeroLead, String usermeta) {
        boolean tienePrefijo = prefijo != null;
        boolean tieneLead = numeroLead != null;
        boolean tieneUsermeta = usermeta != null;

        if (!tieneLead && !tieneUsermeta && !tienePrefijo) {
            throw new BadRequestException("Ingresa un telefono o un usermeta para registrar el lead");
        }
        if (tieneLead != tienePrefijo) {
            throw new BadRequestException("Para registrar por telefono debes enviar prefijo y lead");
        }
        if (tienePrefijo && !PREFIJO_PATTERN.matcher(prefijo).matches()) {
            throw new BadRequestException("El prefijo debe tener formato +1, +51 o similar");
        }
        if (tieneLead && !LEAD_PATTERN.matcher(numeroLead).matches()) {
            throw new BadRequestException("El lead debe contener solo digitos y tener entre 6 y 15 caracteres");
        }
        if (tieneUsermeta && !USERMETA_PATTERN.matcher(usermeta).matches()) {
            throw new BadRequestException("El usermeta solo puede contener letras, numeros, punto, guion o guion bajo");
        }
    }

    private boolean tieneTelefono(String prefijo, String numeroLead) {
        return prefijo != null && numeroLead != null;
    }

    private boolean esBusquedaUsermeta(String buscar) {
        String normalizado = buscar == null ? null : buscar.trim();
        if (normalizado == null || normalizado.isBlank()) {
            return false;
        }
        return normalizado.startsWith("@") || !normalizado.matches("^\\d+$");
    }

    private String normalizarBusquedaIdentidad(String buscar) {
        if (buscar == null || buscar.isBlank()) {
            return "";
        }
        if (esBusquedaUsermeta(buscar)) {
            String usermeta = normalizarUsermeta(buscar);
            if (usermeta == null || !USERMETA_PATTERN.matcher(usermeta).matches()) {
                throw new BadRequestException("El usermeta solo puede contener letras, numeros, punto, guion o guion bajo");
            }
            return usermeta;
        }
        return normalizarLead(buscar);
    }

    private BusquedaVentaFiltro resolverBusquedaVenta(String lead) {
        String buscar = lead == null ? null : lead.trim();
        if (buscar == null || buscar.isBlank()) {
            return new BusquedaVentaFiltro(false, false, null, "%");
        }
        boolean buscarPorUsermeta = esBusquedaUsermeta(buscar);
        String valor;
        if (buscarPorUsermeta) {
            valor = normalizarUsermeta(buscar);
            if (valor == null || !USERMETA_PATTERN.matcher(valor).matches()) {
                throw new BadRequestException("El usermeta solo puede contener letras, numeros, punto, guion o guion bajo");
            }
        } else {
            valor = normalizarLead(buscar);
        }
        return new BusquedaVentaFiltro(true, buscarPorUsermeta, valor, valor + "%");
    }

    private void validarFiltroAgrupacionGtr(
            TipoGrupoGtr tipoGrupo,
            Long idGrupo,
            EstadoSeguimiento estadoGrupo,
            String codigoTipificacion,
            boolean sinValor
    ) {
        if (tipoGrupo == null) {
            if (idGrupo != null || estadoGrupo != null || codigoTipificacion != null || sinValor) {
                throw new BadRequestException("Debes indicar el tipo de agrupacion para filtrar la bandeja");
            }
            return;
        }

        if (sinValor) {
            return;
        }

        if ((tipoGrupo == TipoGrupoGtr.ASESOR || tipoGrupo == TipoGrupoGtr.CAMPANA) && idGrupo == null) {
            throw new BadRequestException("Debes indicar el grupo seleccionado");
        }

        if (tipoGrupo == TipoGrupoGtr.ESTADO && estadoGrupo == null) {
            throw new BadRequestException("Debes indicar el estado seleccionado");
        }

        if ((tipoGrupo == TipoGrupoGtr.PRIMERA_TIPIFICACION
                || tipoGrupo == TipoGrupoGtr.MAYOR_TIPIFICACION
                || tipoGrupo == TipoGrupoGtr.ULTIMA_TIPIFICACION)
                && normalizarCodigoAgrupacion(codigoTipificacion) == null) {
            throw new BadRequestException("Debes indicar la tipificacion seleccionada");
        }
    }

    private String normalizarCodigoAgrupacion(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return null;
        }
        return codigo.trim();
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupaciones(
            List<LeadGtrAgrupacionProjection> rows,
            String etiquetaSinValor
    ) {
        Map<Long, Long> cantidades = new LinkedHashMap<>();
        Map<Long, String> etiquetas = new LinkedHashMap<>();
        long sinValorCantidad = 0;
        for (LeadGtrAgrupacionProjection row : rows) {
            if (row.getIdGrupo() == null) {
                sinValorCantidad += row.getCantidad();
                continue;
            }
            cantidades.merge(row.getIdGrupo(), row.getCantidad(), Long::sum);
            if (row.getEtiqueta() != null && !row.getEtiqueta().isBlank()) {
                etiquetas.put(row.getIdGrupo(), row.getEtiqueta());
            }
        }

        List<LeadGtrAgrupacionItemResponse> agrupaciones = new ArrayList<>();
        cantidades.forEach((idGrupo, cantidad) -> agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                idGrupo,
                null,
                null,
                etiquetas.getOrDefault(idGrupo, "Sin nombre"),
                cantidad,
                false
        )));
        if (sinValorCantidad > 0) {
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    etiquetaSinValor,
                    sinValorCantidad,
                    true
            ));
        }
        return ordenarAgrupaciones(agrupaciones);
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupacionesPorEtiqueta(
            List<LeadGtrAgrupacionProjection> rows
    ) {
        Map<String, Long> cantidades = new LinkedHashMap<>();
        for (LeadGtrAgrupacionProjection row : rows) {
            String etiqueta = normalizarCodigoAgrupacion(row.getEtiqueta());
            if (etiqueta == null) {
                continue;
            }
            cantidades.merge(etiqueta, row.getCantidad(), Long::sum);
        }

        List<LeadGtrAgrupacionItemResponse> agrupaciones = new ArrayList<>();
        cantidades.forEach((etiqueta, cantidad) -> agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                null,
                null,
                null,
                etiqueta,
                cantidad,
                false
        )));
        return ordenarAgrupaciones(agrupaciones);
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupacionesTipificacion(
            List<LeadGtrAgrupacionProjection> rows
    ) {
        List<LeadGtrAgrupacionItemResponse> agrupaciones = new ArrayList<>();
        long sinTipificar = 0;
        for (LeadGtrAgrupacionProjection row : rows) {
            String tipificacion = normalizarCodigoAgrupacion(row.getCodigoTipificacion());
            String subtipificacion = normalizarCodigoAgrupacion(row.getCodigoSubtipificacion());
            if (tipificacion == null) {
                sinTipificar += row.getCantidad();
                continue;
            }
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    tipificacion,
                    subtipificacion,
                    tipificacion + (subtipificacion == null ? "" : " / " + subtipificacion),
                    row.getCantidad(),
                    false
            ));
        }
        if (sinTipificar > 0) {
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    "Sin tipificar",
                    sinTipificar,
                    true
            ));
        }
        return ordenarAgrupaciones(agrupaciones);
    }

    private LeadVentaAgrupacionesResponse mapearAgrupacionesVenta(
            String searchPattern,
            boolean buscarPorUsermeta,
            boolean filtrarVentana,
            Instant inicioVentana,
            Long idAsesor,
            RankingEquipoScope equipos
    ) {
        boolean filtrarAsesor = idAsesor != null;
        return new LeadVentaAgrupacionesResponse(
                mapearAgrupacionesVentaValor(
                        leadRepository.agruparVentaPorEstado(
                                Etapa.VENTA, searchPattern, buscarPorUsermeta, filtrarVentana, inicioVentana, filtrarAsesor, idAsesor,
                                equipos.filtrar(), equipos.ids()),
                        "Sin estado"
                ),
                mapearAgrupacionesVentaValor(
                        leadRepository.agruparVentaPorProveedor(
                                Etapa.VENTA, searchPattern, buscarPorUsermeta, filtrarVentana, inicioVentana, filtrarAsesor, idAsesor,
                                equipos.filtrar(), equipos.ids()),
                        "Sin proveedor"
                ),
                mapearAgrupacionesVentaValor(
                        leadRepository.agruparVentaPorPlan(
                                Etapa.VENTA, searchPattern, buscarPorUsermeta, filtrarVentana, inicioVentana, filtrarAsesor, idAsesor,
                                equipos.filtrar(), equipos.ids()),
                        "Sin plan"
                ),
                mapearAgrupacionesVentaValor(
                        leadRepository.agruparVentaPorUltimoGestor(
                                Etapa.VENTA, searchPattern, buscarPorUsermeta, filtrarVentana, inicioVentana, filtrarAsesor, idAsesor,
                                equipos.filtrar(), equipos.ids()),
                        "Sin gestor"
                ),
                mapearAgrupacionesVentaTipificacion(
                        leadRepository.agruparVentaPorTipificacion(
                                Etapa.VENTA, searchPattern, buscarPorUsermeta, filtrarVentana, inicioVentana, filtrarAsesor, idAsesor,
                                equipos.filtrar(), equipos.ids())
                )
        );
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupacionesVentaValor(
            List<LeadGtrAgrupacionProjection> rows,
            String etiquetaSinValor
    ) {
        List<LeadGtrAgrupacionItemResponse> agrupaciones = new ArrayList<>();
        long sinValorCantidad = 0;
        for (LeadGtrAgrupacionProjection row : rows) {
            String etiqueta = row.getEtiqueta();
            if (etiqueta == null || etiqueta.isBlank()) {
                sinValorCantidad += row.getCantidad();
                continue;
            }
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    etiqueta,
                    row.getCantidad(),
                    false,
                    etiqueta
            ));
        }
        if (sinValorCantidad > 0) {
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    etiquetaSinValor,
                    sinValorCantidad,
                    true,
                    null
            ));
        }
        return ordenarAgrupaciones(agrupaciones);
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupacionesVentaTipificacion(
            List<LeadGtrAgrupacionProjection> rows
    ) {
        List<LeadGtrAgrupacionItemResponse> agrupaciones = new ArrayList<>();
        long sinTipificar = 0;
        for (LeadGtrAgrupacionProjection row : rows) {
            String tipificacion = normalizarCodigoAgrupacion(row.getCodigoTipificacion());
            if (tipificacion == null) {
                sinTipificar += row.getCantidad();
                continue;
            }
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    tipificacion,
                    null,
                    tipificacion,
                    row.getCantidad(),
                    false,
                    tipificacion
            ));
        }
        if (sinTipificar > 0) {
            agrupaciones.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    "Sin tipificar",
                    sinTipificar,
                    true,
                    null
            ));
        }
        return ordenarAgrupaciones(agrupaciones);
    }

    private GrupoVentaFiltro resolverFiltroGrupoVenta(
            TipoGrupoVenta tipoGrupo,
            List<String> valoresGrupo,
            boolean sinValor
    ) {
        List<String> valores = valoresGrupo == null
                ? List.of()
                : valoresGrupo.stream()
                .filter(valor -> valor != null && !valor.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        boolean filtrar = tipoGrupo != null && (sinValor || !valores.isEmpty());
        return new GrupoVentaFiltro(
                filtrar,
                tipoGrupo == null ? "" : tipoGrupo.name(),
                valores.isEmpty() ? List.of("__SIN_VALOR_SELECCIONADO__") : valores,
                sinValor
        );
    }

    private record GrupoVentaFiltro(
            boolean filtrar,
            String tipo,
            List<String> valores,
            boolean sinValor
    ) {}

    private record BusquedaVentaFiltro(
            boolean buscando,
            boolean buscarPorUsermeta,
            String valor,
            String searchPattern
    ) {}

    private record LeadIdentidad(
            String prefijo,
            String lead,
            String usermeta,
            Contacto contacto
    ) {}

    private List<LeadGtrAgrupacionItemResponse> ordenarAgrupaciones(
            List<LeadGtrAgrupacionItemResponse> agrupaciones
    ) {
        return agrupaciones.stream()
                .sorted(Comparator.comparingLong(LeadGtrAgrupacionItemResponse::getCantidad)
                        .reversed()
                        .thenComparing(
                                LeadGtrAgrupacionItemResponse::getEtiqueta,
                                String.CASE_INSENSITIVE_ORDER
                        ))
                .toList();
    }

    private LeadGtrLookupResponse mapearContextoLeadGtr(Lead lead) {
        Etapa etapaActual = lead.getEtapa();
        // El contacto tiene un lead PREVENTA si el resuelto lo es, o existe otra oportunidad PREVENTA.
        boolean tienePreventa = etapaActual == Etapa.PREVENTA
                || (lead.getContacto() != null
                        && leadRepository.findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(
                                lead.getContacto().getId(), Etapa.PREVENTA).isPresent());
        // Lead en otra etapa y sin PREVENTA: el GTR puede registrarlo solo para asignar la atención.
        boolean atencionOtraEtapa = !tienePreventa;
        boolean puedeGestionarseEnGtr = tienePreventa || atencionOtraEtapa;

        return new LeadGtrLookupResponse(
                true,
                lead.getId(),
                lead.getPrefijo(),
                lead.getLead(),
                lead.getUsermeta(),
                etapaActual,
                lead.getEstado(),
                puedeGestionarseEnGtr,
                atencionOtraEtapa,
                construirMensajeContextoGtr(etapaActual, tienePreventa)
        );
    }

    private LeadContextoLookupResponse mapearContextoLeadVenta(Lead lead) {
        Etapa etapaActual = lead.getEtapa();
        boolean enVenta = etapaActual == Etapa.VENTA;
        Long idAsesorAsignado = lead.getIdAsesorAsignado();
        boolean disponibleParaTomar = enVenta && idAsesorAsignado == null;
        boolean gestionadoPorMi = enVenta && idAsesorAsignado != null
                && idAsesorAsignado.equals(currentUser.empleadoID());
        boolean gestionadoPorOtroAsesor = enVenta && idAsesorAsignado != null && !gestionadoPorMi;

        return new LeadContextoLookupResponse(
                true,
                lead.getId(),
                lead.getPrefijo(),
                lead.getLead(),
                etapaActual,
                lead.getEstado(),
                enVenta,
                disponibleParaTomar,
                gestionadoPorOtroAsesor,
                lead.getNombreAsesorAsignado(),
                construirMensajeContextoVenta(etapaActual, disponibleParaTomar, gestionadoPorMi, lead.getNombreAsesorAsignado())
        );
    }

    private String construirMensajeContextoVenta(
            Etapa etapaActual,
            boolean disponibleParaTomar,
            boolean gestionadoPorMi,
            String nombreAsesorAsignado
    ) {
        if (etapaActual == Etapa.VENTA) {
            if (disponibleParaTomar) {
                return null;
            }
            if (gestionadoPorMi) {
                return "Ya tienes este lead en tu bandeja de Gestion.";
            }
            String asesor = (nombreAsesorAsignado == null || nombreAsesorAsignado.isBlank())
                    ? "otro asesor"
                    : nombreAsesorAsignado;
            return "Ese lead ya lo esta gestionando " + asesor + ". No esta disponible para tomarlo.";
        }

        if (etapaActual == null) {
            return "No pudimos identificar la etapa de ese lead.";
        }

        return switch (etapaActual) {
            case PREVENTA -> "Ese lead todavia esta en gestion inicial y aun no llega a Venta.";
            case POSTVENTA -> "Ese lead ya avanzo a Postventa.";
            case COBRANZA -> "Ese lead ya esta en Postventa con gestion de pago pendiente.";
            case VENTA -> null;
        };
    }

    private String construirMensajeContextoGtr(Etapa etapaActual, boolean tienePreventa) {
        if (etapaActual == null || etapaActual == Etapa.PREVENTA || tienePreventa) {
            return null;
        }

        // Sin PREVENTA: el lead solo se puede registrar para asignar la atención de la comunicación.
        return switch (etapaActual) {
            case VENTA -> "Este lead está en Validaciones. Al registrarlo podrás asignarlo a un asesor para atender al contacto, sin afectar su gestión en Validaciones.";
            case POSTVENTA -> "Este lead está en Postventa. Al registrarlo podrás asignarlo a un asesor para atender al contacto, sin afectar su gestión en Postventa.";
            case COBRANZA -> "Este lead está en Cobranza. Al registrarlo podrás asignarlo a un asesor para atender al contacto, sin afectar su gestión en Cobranza.";
            case PREVENTA -> null;
        };
    }

    private Map<Long, Instant> obtenerFechasAsignacion(List<Lead> leads) {
        if (leads.isEmpty()) {
            return Map.of();
        }

        List<Long> leadIds = leads.stream().map(Lead::getId).toList();
        Map<Long, Instant> fechas = new HashMap<>();
        for (Object[] row : eventoRepository.listarUltimaFechaPorLeadIdsYAccion(leadIds, Accion.ASIGNACION)) {
            fechas.put((Long) row[0], (Instant) row[1]);
        }
        return fechas;
    }

    private Page<Lead> obtenerLeadsPendientesAsesorVentas(Long idAsesor, PageRequest pageRequest) {
        return leadRepository.listarPendientesAsesorVentas(
                idAsesor,
                Etapa.PREVENTA,
                COMPORTAMIENTO_AGENDADO,
                List.of(EstadoSeguimiento.ASIGNADO, EstadoSeguimiento.EN_GESTION),
                paginationService.toPageable(pageRequest, LEAD_ASESOR_SORT_FIELDS)
        );
    }

    private PageResponse<LeadAsesorVentasResponse> mapearBandejaAsesorVentas(Page<Lead> leads) {
        Map<Long, Instant> fechasAsignacion = obtenerFechasAsignacion(leads.getContent());
        Map<Long, Long> totalesAsignacion = obtenerTotalesAsignacion(leads.getContent(), Lead::getId);
        Map<Long, String> proveedoresEquipo = obtenerProveedoresFallbackPorEquipo(leads.getContent());
        Page<LeadAsesorVentasResponse> responsePage = leads.map(lead -> toAsesorResponse(
                lead,
                fechasAsignacion.get(lead.getId()),
                totalesAsignacion.getOrDefault(lead.getId(), 0L),
                lead.getIdEquipo() == null ? null : proveedoresEquipo.get(lead.getIdEquipo())
        ));
        return PageResponse.from(responsePage);
    }

    // Proveedor fallback de cada equipo presente en la página (un único query, sin N+1). Es el que se
    // muestra como origen cuando el lead no tiene campaña, igual que en la bandeja GTR.
    private Map<Long, String> obtenerProveedoresFallbackPorEquipo(List<Lead> leads) {
        Set<Long> idsEquipo = leads.stream()
                .map(Lead::getIdEquipo)
                .filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        if (idsEquipo.isEmpty()) {
            return Map.of();
        }
        Map<Long, String> porEquipo = new HashMap<>();
        for (EquipoProveedor ep : equipoProveedorRepository.findByIdEquipoIn(idsEquipo)) {
            if (ep.isFallbackLeadSinCampana() && ep.getProveedor() != null) {
                porEquipo.put(ep.getIdEquipo(), ep.getProveedor().getNombre());
            }
        }
        return porEquipo;
    }

    private LeadAsesorVentasResponse toAsesorResponse(
            Lead lead, Instant fechaAsignacion, long totalAsignaciones, String nombreProveedorEquipo) {
        DatosPreventa datosPreventa = lead.getDatosPreventa();
        Direccion direccion = lead.getDireccion();
        String nombreProveedorCampana = lead.getCampana() == null || lead.getCampana().getProveedor() == null
                ? null : lead.getCampana().getProveedor().getNombre();
        Long idCampana = lead.getCampana() == null ? null : lead.getCampana().getId();
        String nombreCampana = lead.getCampana() == null ? null : lead.getCampana().getNombre();

        // Valor efectivo documento/direccion: si ya existe la entidad de preventa se usa esa; si no,
        // el snapshot que pudo llenar el GTR. Misma resolucion que el detalle, para que coincidan.
        String numeroDocumento = datosPreventa == null
                ? lead.getNumeroDocumentoTitularServicioSnapshot()
                : datosPreventa.getNumeroDocumentoTitularServicio();
        String direccionTexto = direccion == null ? lead.getDireccionSnapshot() : direccion.getDireccion();

        return new LeadAsesorVentasResponse(
                lead.getId(),
                fechaAsignacion,
                lead.getPrefijo(),
                lead.getLead(),
                lead.getUsermeta(),
                idCampana,
                nombreCampana,
                numeroDocumento,
                direccionTexto,
                lead.getEstado(),
                totalAsignaciones,
                lead.getEtapa(),
                lead.getEtapa() != Etapa.PREVENTA,
                nombreProveedorCampana,
                nombreProveedorEquipo
        );
    }

    private LeadDetalleResponse toDetalleResponse(Lead lead, Instant fechaAsignacion, long totalAsignaciones) {
        DatosPreventa datosPreventa = lead.getDatosPreventa();
        Direccion direccion = lead.getDireccion();
        List<LeadAdicionalDetalleResponse> adicionales = lead.getAdicionales().stream()
                .map(adicional -> new LeadAdicionalDetalleResponse(
                        adicional.getAdicional() == null ? null : adicional.getAdicional().getId(),
                        adicional.getAdicional() == null ? null : adicional.getAdicional().getNombre(),
                        adicional.getCantidad(),
                        adicional.getPrecioUnitario(),
                        adicional.getSubtotal()
                ))
                .sorted(java.util.Comparator.comparing(
                        LeadAdicionalDetalleResponse::getNombreAdicional,
                        java.util.Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                ))
                .toList();
        LeadPlanDetalleResponse plan = toLeadPlanDetalleResponse(lead.getPlan());
        LeadPromocionDetalleResponse promocionInterna = toLeadPromocionDetalleResponse(lead.getPromocionInterna());
        Evento ultimaProgramacionVenta = eventoRepository
                .findTopByIdLeadAndAccionAndTipificacionOrderByCreatedAtDesc(lead.getId(), Accion.TIPIFICACION, TIPIFICACION_PROGRAMADO)
                .orElse(null);

        // Resolvemos los nombres de la ubicacion del domicilio desde el codigo de ubigeo con un unico
        // lookup indexado, para que las vistas (incluida la read-only) no tengan que hacer la cascada.
        String departamentoDomicilio = null;
        String provinciaDomicilio = null;
        String distritoDomicilio = null;
        String ubigeoDomicilio = direccion == null ? null : direccion.getUbigeoDomicilio();
        if (ubigeoDomicilio != null && !ubigeoDomicilio.isBlank()) {
            var distritoUbicacion = distritoRepository.findByCodigoConUbicacion(ubigeoDomicilio).orElse(null);
            if (distritoUbicacion != null) {
                distritoDomicilio = distritoUbicacion.getNombre();
                provinciaDomicilio = distritoUbicacion.getProvincia() == null ? null : distritoUbicacion.getProvincia().getNombre();
                departamentoDomicilio = distritoUbicacion.getDepartamento() == null ? null : distritoUbicacion.getDepartamento().getNombre();
            }
        }

        return new LeadDetalleResponse(
                lead.getId(),
                fechaAsignacion,
                lead.getLastEntryAt(),
                lead.getPrefijo(),
                lead.getLead(),
                lead.getNumeroParaLlamar(),
                lead.getUsermeta(),
                lead.getCampana() == null ? null : lead.getCampana().getNombre(),
                lead.getCampana() == null || lead.getCampana().getProveedor() == null ? null : lead.getCampana().getProveedor().getNombre(),
                lead.getBase(),
                lead.getEstado(),
                lead.getIdAsesorAsignado(),
                lead.getNombreAsesorAsignado(),
                datosPreventa == null ? null : datosPreventa.getTipoDocumento(),
                datosPreventa == null ? lead.getNumeroDocumentoTitularServicioSnapshot() : datosPreventa.getNumeroDocumentoTitularServicio(),
                datosPreventa == null ? null : datosPreventa.getNombreTitularServicio(),
                datosPreventa == null ? null : datosPreventa.getCelularRegistro(),
                datosPreventa == null ? null : datosPreventa.getCelularReferencia(),
                datosPreventa == null ? null : datosPreventa.getCorreo(),
                datosPreventa == null ? null : datosPreventa.getNombreMadre(),
                datosPreventa == null ? null : datosPreventa.getNombrePadre(),
                datosPreventa == null ? null : datosPreventa.getNumeroDocumentoTitularCelularRegistro(),
                datosPreventa == null ? null : datosPreventa.getNombreTitularCelularRegistro(),
                datosPreventa == null ? null : datosPreventa.getUbigeoNacimiento(),
                direccion == null ? null : direccion.getUbigeoDomicilio(),
                departamentoDomicilio,
                provinciaDomicilio,
                distritoDomicilio,
                direccion == null ? null : direccion.getTipoDomicilio(),
                direccion == null ? null : direccion.getTipoVia(),
                direccion == null ? null : direccion.getVia(),
                direccion == null ? lead.getDireccionSnapshot() : direccion.getDireccion(),
                direccion == null ? null : direccion.getReferencia(),
                direccion == null ? null : direccion.getLatitud(),
                direccion == null ? null : direccion.getLongitud(),
                direccion == null ? null : direccion.getUrbanizacion(),
                direccion == null ? null : direccion.getNumero(),
                direccion == null ? null : direccion.getManzana(),
                direccion == null ? null : direccion.getLote(),
                direccion == null ? null : direccion.getNombreEdificio(),
                direccion == null ? null : direccion.getNombreCondominio(),
                direccion == null ? null : direccion.getPlano(),
                direccion == null ? null : direccion.getPiso(),
                direccion == null ? null : direccion.getInterior(),
                lead.getSec(),
                lead.getSot(),
                requiereSecSotVenta(lead),
                lead.getPlan() == null ? null : lead.getPlan().getId(),
                lead.getNombrePlanSnapshot(),
                lead.getNombreProveedorSnapshot(),
                lead.getPrecioPlanSnapshot(),
                lead.getPromocionInterna() == null ? null : lead.getPromocionInterna().getId(),
                lead.getNombrePromocionInternaSnapshot(),
                lead.getPrecioAdicionalesSnapshot(),
                lead.getPrecioFinal(),
                lead.getDiaCorteFacturacion(),
                lead.getMesesPermanenciaSnapshot(),
                ultimaProgramacionVenta == null ? null : ultimaProgramacionVenta.getFechaProgramacion(),
                ultimaProgramacionVenta == null ? null : ultimaProgramacionVenta.getHoraProgramada(),
                plan,
                promocionInterna,
                adicionales,
                totalAsignaciones,
                lead.getEtapa(),
                lead.getEtapa() != Etapa.PREVENTA,
                resolverConfigCamposCaptura(lead),
                obtenerProveedorFallbackDeEquipo(lead.getIdEquipo())
        );
    }

    private List<CampoConfigResponse> resolverConfigCamposCaptura(Lead lead) {
        Long idProveedorPlan = lead.getPlan() == null || lead.getPlan().getProveedor() == null
                ? null
                : lead.getPlan().getProveedor().getId();
        if (idProveedorPlan != null) {
            return equipoCampoService.resolverConfigPorProveedorVisible(idProveedorPlan);
        }
        return equipoCampoService.resolverConfig(lead.getIdEquipo());
    }

    // Proveedor fallback de un equipo (null-safe). Origen a mostrar cuando el lead no tiene campaña.
    private String obtenerProveedorFallbackDeEquipo(Long idEquipo) {
        Proveedor proveedor = obtenerProveedorFallbackEntidadDeEquipo(idEquipo);
        return proveedor == null ? null : proveedor.getNombre();
    }

    private Proveedor obtenerProveedorFallbackEntidadDeEquipo(Long idEquipo) {
        if (idEquipo == null) {
            return null;
        }
        return equipoProveedorRepository.findByIdEquipo(idEquipo).stream()
                .filter(ep -> ep.isFallbackLeadSinCampana() && ep.getProveedor() != null)
                .map(EquipoProveedor::getProveedor)
                .findFirst()
                .orElse(null);
    }

    private LeadPlanDetalleResponse toLeadPlanDetalleResponse(Plan plan) {
        if (plan == null) {
            return null;
        }

        List<PlanAdicionalResponse> adicionalesIncluidos = plan.getAdicionales().stream()
                .map(adicional -> new PlanAdicionalResponse(
                        adicional.getAdicional() == null ? null : adicional.getAdicional().getId(),
                        adicional.getAdicional() == null ? null : adicional.getAdicional().getNombre(),
                        adicional.getCantidadIncluida(),
                        adicional.getPermiteCompraAdicional(),
                        adicional.getCantidadMaximaAdicional()
                ))
                .sorted(Comparator.comparing(
                        PlanAdicionalResponse::getNombreAdicional,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                ))
                .toList();

        InternetResponse internet = plan.getInternet() == null ? null : new InternetResponse(
                plan.getInternet().getId(),
                plan.getInternet().getVelocidad(),
                plan.getInternet().getUnidad(),
                plan.getInternet().getTecnologia()
        );
        TelevisionResponse television = plan.getTelevision() == null ? null : new TelevisionResponse(
                plan.getTelevision().getId(),
                plan.getTelevision().getNombre(),
                plan.getTelevision().getCantidadCanales()
        );
        TelefonoResponse telefono = plan.getTelefono() == null ? null : new TelefonoResponse(
                plan.getTelefono().getId(),
                plan.getTelefono().getMinutos(),
                plan.getTelefono().getDescripcion()
        );

        return new LeadPlanDetalleResponse(
                plan.getId(),
                plan.getNombre(),
                plan.getPrecio(),
                plan.getPrecioPromocional(),
                plan.getMesesPromocionPrecio(),
                plan.getVigenciaDesde(),
                plan.getVigenciaHasta(),
                plan.getProveedor() == null ? null : plan.getProveedor().getNombre(),
                internet,
                television,
                telefono,
                plan.getVelocidadPromocional(),
                plan.getMesesPromocionVelocidad(),
                plan.getZona() == null ? null : plan.getZona().getNombre(),
                adicionalesIncluidos
        );
    }

    private LeadPromocionDetalleResponse toLeadPromocionDetalleResponse(PromocionComercial promocionInterna) {
        if (promocionInterna == null) {
            return null;
        }

        return new LeadPromocionDetalleResponse(
                promocionInterna.getId(),
                promocionInterna.getReglaComercial(),
                promocionInterna.getProveedor() == null ? null : promocionInterna.getProveedor().getNombre(),
                promocionInterna.getZona() == null ? null : promocionInterna.getZona().getNombre()
        );
    }

    private <T> void aplicarTotalesAsignacion(
            List<T> items,
            java.util.function.Function<T, Long> idExtractor,
            java.util.function.ObjLongConsumer<T> totalSetter
    ) {
        Map<Long, Long> totales = obtenerTotalesAsignacion(items, idExtractor);
        for (T item : items) {
            totalSetter.accept(item, totales.getOrDefault(idExtractor.apply(item), 0L));
        }
    }

    private <T> void aplicarTotalesAsignacionPreventa(
            List<T> items,
            java.util.function.Function<T, Long> idExtractor,
            java.util.function.ObjLongConsumer<T> totalSetter,
            java.util.function.ObjLongConsumer<T> totalPreventaSetter,
            java.util.function.ObjLongConsumer<T> totalHoyPreventaSetter,
            OperationalDateTime.InstantRange rangoDia
    ) {
        List<Long> ids = items.stream()
                .map(idExtractor)
                .filter(id -> id != null && id > 0)
                .toList();
        Map<Long, Long> totalesPreventa = leadAsignacionCounterService.contarAsignacionesPreventaPorLeadIds(ids);
        Map<Long, Long> totalesHoyPreventa = leadAsignacionCounterService.contarAsignacionesHoyPreventaPorLeadIds(
                ids,
                rangoDia.inicio(),
                rangoDia.fin()
        );
        for (T item : items) {
            Long id = idExtractor.apply(item);
            long totalPreventa = totalesPreventa.getOrDefault(id, 0L);
            totalSetter.accept(item, totalPreventa);
            totalPreventaSetter.accept(item, totalPreventa);
            totalHoyPreventaSetter.accept(item, totalesHoyPreventa.getOrDefault(id, 0L));
        }
    }

    private <T> Map<Long, Long> obtenerTotalesAsignacion(
            List<T> items,
            java.util.function.Function<T, Long> idExtractor
    ) {
        List<Long> ids = items.stream()
                .map(idExtractor)
                .filter(id -> id != null && id > 0)
                .toList();
        return leadAsignacionCounterService.contarAsignacionesPorLeadIds(ids);
    }

    private long obtenerTotalAsignaciones(Long idLead) {
        return leadAsignacionCounterService.contarAsignacionesPorLeadIds(List.of(idLead))
                .getOrDefault(idLead, 0L);
    }

    private void setTotalesAsignacion(LeadGtrResponse response, long totalAsignaciones) {
        response.setTotalAsignaciones(totalAsignaciones);
    }

    private void setTotalesAsignacion(LeadAgendadoGtrResponse response, long totalAsignaciones) {
        response.setTotalAsignaciones(totalAsignaciones);
    }

    private void setTotalesAsignacionPreventa(LeadGtrResponse response, long totalAsignaciones) {
        response.setTotalAsignacionesPreventa(totalAsignaciones);
    }

    private void setTotalesAsignacionPreventa(LeadAgendadoGtrResponse response, long totalAsignaciones) {
        response.setTotalAsignacionesPreventa(totalAsignaciones);
    }

    private void setTotalesAsignacionHoyPreventa(LeadGtrResponse response, long totalAsignaciones) {
        response.setTotalAsignacionesHoyPreventa(totalAsignaciones);
    }

    private void setTotalesAsignacionHoyPreventa(LeadAgendadoGtrResponse response, long totalAsignaciones) {
        response.setTotalAsignacionesHoyPreventa(totalAsignaciones);
    }

    private void aplicarAlertasRegistrosDia(List<LeadGtrResponse> leads, Instant inicioDia, Instant finDia) {
        List<Long> leadIds = leads.stream()
                .map(LeadGtrResponse::getId)
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
        if (leadIds.isEmpty()) {
            return;
        }

        Map<Long, Long> totalRegistrosPorLead = new HashMap<>();
        for (Object[] row : eventoRepository.contarPorLeadIdsYAccionYFechas(
                leadIds,
                Accion.REGISTRO,
                inicioDia,
                finDia
        )) {
            totalRegistrosPorLead.put((Long) row[0], (Long) row[1]);
        }

        List<Long> leadsConMultiplesRegistros = totalRegistrosPorLead.entrySet().stream()
                .filter(entry -> entry.getValue() > 1)
                .map(Map.Entry::getKey)
                .toList();
        if (leadsConMultiplesRegistros.isEmpty()) {
            return;
        }

        Set<Long> leadsConCampanaDuplicada = new HashSet<>();
        for (Object[] row : eventoRepository.listarCampanasDuplicadasPorLeadIdsYAccionYFechas(
                leadsConMultiplesRegistros,
                Accion.REGISTRO,
                inicioDia,
                finDia
        )) {
            leadsConCampanaDuplicada.add((Long) row[0]);
        }

        Set<Long> leadsConMultiplesRegistrosSet = new HashSet<>(leadsConMultiplesRegistros);
        for (LeadGtrResponse lead : leads) {
            boolean multiplesRegistros = leadsConMultiplesRegistrosSet.contains(lead.getId());
            boolean mismaCampana = leadsConCampanaDuplicada.contains(lead.getId());
            lead.setTieneMultiplesRegistrosDia(multiplesRegistros);
            lead.setTieneRegistrosMismaCampanaDia(mismaCampana);
            lead.setTieneAlertaRegistrosDia(multiplesRegistros || mismaCampana);
        }
    }

    // ── Multi-titular: oportunidades en paralelo del mismo contacto (Fase 1.5) ──

    /**
     * Crea una oportunidad hermana para el mismo contacto/equipo: la origina el asesor durante la
     * gestión (la actual debe tener documento del titular). Nace asignada al mismo asesor y en
     * gestión, con datos en blanco (otro titular/documento). Devuelve el id de la nueva.
     */
    @Transactional
    public Long crearOportunidadAdicional(Long idLead) {
        // Cualquier etapa asignada al asesor: también puede crear oportunidades partiendo de un
        // lead que sigue en otra etapa (atención GTR). Sin restricciones de documento/plan/dirección:
        // la responsabilidad de crear una nueva oportunidad es del asesor y se evalúa en su llamada.
        Lead original = obtenerLeadAsignadoDelAsesor(idLead);

        Lead nueva = leadMapper.toNuevoLead(
                original.getPrefijo(), original.getLead(), original.getUsermeta(), original.getBase(),
                original.getCampana(), OperationalDateTime.now());
        nueva.setContacto(original.getContacto());
        nueva.setIdEquipo(original.getIdEquipo());
        nueva.setIdAsesorAsignado(currentUser.empleadoID());
        nueva.setNombreAsesorAsignado(currentUser.nombreCompleto().trim());
        nueva.setEstado(EstadoSeguimiento.EN_GESTION);
        completarNumeroParaLlamarSiFalta(nueva);

        Lead saved = leadRepository.save(nueva);
        Long idCampana = saved.getCampana() == null ? null : saved.getCampana().getId();
        registrarEventoNuevaOportunidad(saved.getId(), idCampana, saved.getEtapa());
        registrarEventoAsignacion(
                saved.getId(),
                idCampana,
                saved.getEtapa(),
                currentUser.empleadoID(),
                currentUser.nombreCompleto().trim()
        );
        leadEtapaResumenService.registrarAsignacion(saved.getId(), saved.getEtapa(), OperationalDateTime.now());
        notificarCambioLead("REGISTRO", saved, null, null);
        return saved.getId();
    }

    /** Lista las oportunidades del contacto (acotadas al equipo) para el selector y la lupa. */
    @Transactional(readOnly = true)
    public List<OportunidadHermanaResponse> listarOportunidadesDelContacto(Long idLead) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        if (lead.getContacto() == null) {
            return List.of(toHermanaResponse(lead));
        }
        return leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(lead.getContacto().getId())
                .stream()
                .map(this::toHermanaResponse)
                .toList();
    }

    /**
     * Descarta (elimina) una oportunidad hermana creada por error: solo si es del asesor, está
     * completamente vacía (sin DatosPreventa/Direccion/Oferta, sin tipificación ni documento) y no
     * es la única del contacto. Si ya tiene datos, debe cerrarse con una tipificación de descarte.
     */
    @Transactional
    public void descartarOportunidad(Long idLead) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        String docSnapshot = lead.getNumeroDocumentoTitularServicioSnapshot();
        boolean vacia = lead.getDatosPreventa() == null
                && lead.getDireccion() == null
                && lead.getPlan() == null
                && lead.getIdTipificacion() == null
                && (docSnapshot == null || docSnapshot.isBlank());
        if (!vacia) {
            throw new ConflictException(
                    "Solo se puede descartar una oportunidad vacía; si ya tiene datos, tipifícala con un descarte");
        }
        if (lead.getContacto() != null
                && leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(lead.getContacto().getId()).size() <= 1) {
            throw new ConflictException("No se puede descartar la única oportunidad del contacto");
        }
        eventoRepository.deleteByIdLead(lead.getId());
        leadRepository.delete(lead);
    }

    private OportunidadHermanaResponse toHermanaResponse(Lead lead) {
        return new OportunidadHermanaResponse(
                lead.getId(),
                lead.getUsermeta(),
                lead.getNumeroDocumentoTitularServicioSnapshot(),
                lead.getEstado(),
                lead.getEtapa(),
                lead.getNombreAsesorAsignado(),
                lead.getNombrePlanSnapshot(),
                lead.getLastEntryAt());
    }

    private Lead obtenerLeadPreventaDelAsesor(Long idLead) {
        return obtenerLeadAsignadoEnEtapa(idLead, Etapa.PREVENTA);
    }

    // Lead asignado al asesor actual en cualquier etapa: para crear oportunidades y para la
    // tipificación informativa de un lead que sigue gestionándose en otra etapa.
    private Lead obtenerLeadAsignadoDelAsesor(Long idLead) {
        return leadRepository.findByIdAndIdAsesorAsignado(idLead, currentUser.empleadoID())
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
    }

    private Lead obtenerLeadAsignadoEnEtapa(Long idLead, Etapa etapa) {
        Lead lead = leadRepository.findByIdAndIdAsesorAsignadoAndEtapa(idLead, currentUser.empleadoID(), etapa)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        if (etapa == Etapa.POSTVENTA) {
            postventaAsesorProveedorService.validarLeadVisibleParaUsuarioActual(lead);
        }
        return lead;
    }

    private void validarOfertaComercialVentaObligatoria(LeadOfertaComercialRequest request) {
        if (request == null || request.getIdPlan() == null || request.getIdPlan() <= 0) {
            throw new BadRequestException("Selecciona un plan antes de guardar la oferta comercial");
        }
    }

    private void validarOfertaComercialEditableEnCicloActualVenta(Lead lead) {
        if (lead.getPlan() == null) {
            return;
        }
        List<Evento> eventos = eventoRepository.findAllByIdLeadOrderByCreatedAtDesc(lead.getId());
        for (Evento evento : eventos) {
            if (evento.getEtapa() != Etapa.VENTA) {
                break;
            }
            if (evento.getAccion() == Accion.ACTUALIZACION_OFERTA_COMERCIAL) {
                throw new ConflictException("La oferta comercial ya fue actualizada en el ciclo actual de VENTA");
            }
        }
    }

    private void reemplazarAdicionales(Lead lead, List<LeadOfertaAdicionalRequest> adicionalesRequest) {
        lead.getAdicionales().clear();

        BigDecimal totalAdicionales = BigDecimal.ZERO;
        if (adicionalesRequest != null) {
            for (LeadOfertaAdicionalRequest adicionalRequest : adicionalesRequest) {
                Adicional adicional = adicionalRepository.findByIdAndActivoTrue(adicionalRequest.getIdAdicional())
                        .orElseThrow(() -> new NotFoundException(Adicional.class, adicionalRequest.getIdAdicional()));
                BigDecimal precioUnitario = adicional.getPrecioUnitario() == null ? BigDecimal.ZERO : adicional.getPrecioUnitario();
                BigDecimal subtotal = precioUnitario.multiply(BigDecimal.valueOf(adicionalRequest.getCantidad()));

                LeadAdicional leadAdicional = LeadAdicional.builder()
                        .lead(lead)
                        .adicional(adicional)
                        .cantidad(adicionalRequest.getCantidad())
                        .precioUnitario(precioUnitario)
                        .subtotal(subtotal)
                        .build();

                lead.getAdicionales().add(leadAdicional);
                totalAdicionales = totalAdicionales.add(subtotal);
            }
        }

        lead.setPrecioAdicionalesSnapshot(totalAdicionales);
        BigDecimal precioPlan = lead.getPrecioPlanSnapshot() == null ? BigDecimal.ZERO : lead.getPrecioPlanSnapshot();
        lead.setPrecioFinal(precioPlan.add(totalAdicionales));
    }

    private void moverAEnGestionSiAplica(Lead lead) {
        if (lead.getEstado() == EstadoSeguimiento.ASIGNADO) {
            lead.setEstado(EstadoSeguimiento.EN_GESTION);
        }
    }

    private void validarEstadoParaContacto(Lead lead) {
        if (lead.getEstado() != EstadoSeguimiento.ASIGNADO
                && lead.getEstado() != EstadoSeguimiento.EN_GESTION) {
            throw new BadRequestException("Solo se puede registrar contacto para leads ASIGNADO o EN_GESTION");
        }
    }

    private Plan obtenerPlanVigente(Long idPlan) {
        Plan plan = planRepository.findByIdAndActivoTrue(idPlan)
                .orElseThrow(() -> new NotFoundException(Plan.class, idPlan));

        LocalDate fechaActual = OperationalDateTime.today();
        boolean vigente = (plan.getVigenciaDesde() == null || !plan.getVigenciaDesde().isAfter(fechaActual))
                && (plan.getVigenciaHasta() == null || !plan.getVigenciaHasta().isBefore(fechaActual));

        if (!vigente) {
            throw new NotFoundException(Plan.class, idPlan);
        }
        return plan;
    }

    private PromocionComercial obtenerPromocionInternaActiva(Long idPromocion, Plan plan, Lead lead) {
        PromocionComercial promocion = promocionComercialRepository.findByIdAndActivoTrue(idPromocion)
                .orElseThrow(() -> new NotFoundException(PromocionComercial.class, idPromocion));

        if (plan == null) {
            throw new BadRequestException("No se puede seleccionar una promocion interna sin plan");
        }
        if (!promocion.getPlanes().isEmpty() && promocion.getPlanes().stream().noneMatch(item -> item.getId().equals(plan.getId()))) {
            throw new BadRequestException(
                    "La promocion interna no aplica al plan seleccionado",
                    null,
                    Map.of(
                            "idPromocion", idPromocion,
                            "idPlan", plan.getId()
                    )
            );
        }
        if (promocion.getProveedor() != null && (plan.getProveedor() == null
                || !promocion.getProveedor().getId().equals(plan.getProveedor().getId()))) {
            Map<String, Object> details = new HashMap<>();
            details.put("idPromocion", idPromocion);
            details.put("idPlan", plan.getId());
            details.put("idProveedorPlan", plan.getProveedor() == null ? null : plan.getProveedor().getId());
            details.put("idProveedorPromocion", promocion.getProveedor().getId());
            throw new BadRequestException(
                    "La promocion interna no pertenece al proveedor del plan",
                    null,
                    details
            );
        }
        validarPromocionAplicaAZonaLead(promocion, lead);
        return promocion;
    }

    private void validarPromocionAplicaAZonaLead(PromocionComercial promocion, Lead lead) {
        if (promocion.getZona() == null) {
            return;
        }
        if (lead.getDireccion() == null || leadMapper.trimToNull(lead.getDireccion().getUbigeoDomicilio()) == null) {
            throw new BadRequestException(
                    "La promocion interna requiere ubigeo de domicilio del lead",
                    null,
                    Map.of("idPromocion", promocion.getId())
            );
        }

        Distrito distrito = distritoRepository.findByCodigo(lead.getDireccion().getUbigeoDomicilio())
                .orElseThrow(() -> new BadRequestException(
                        "El ubigeo de domicilio del lead no existe",
                        null,
                        Map.of("ubigeoDomicilio", lead.getDireccion().getUbigeoDomicilio())
                ));
        List<ZonaRegla> reglas = zonaReglaRepository.findByZonaIdAndZonaActivoTrue(promocion.getZona().getId());
        boolean tieneInclusiones = reglas.stream().anyMatch(regla -> regla.getCriterio() == CriterioZona.INCLUIR);
        boolean coincideExclusion = reglas.stream()
                .anyMatch(regla -> regla.getCriterio() == CriterioZona.EXCLUIR && coincideReglaZona(regla, distrito));
        if (coincideExclusion) {
            throw new BadRequestException(
                    "La promocion interna no aplica porque el ubigeo del lead esta excluido de la zona",
                    null,
                    Map.of("idPromocion", promocion.getId(), "ubigeoDomicilio", distrito.getCodigo())
            );
        }
        boolean coincideInclusion = reglas.stream()
                .anyMatch(regla -> regla.getCriterio() == CriterioZona.INCLUIR && coincideReglaZona(regla, distrito));
        if (tieneInclusiones && !coincideInclusion) {
            throw new BadRequestException(
                    "La promocion interna no aplica porque el ubigeo del lead no esta incluido en la zona",
                    null,
                    Map.of("idPromocion", promocion.getId(), "ubigeoDomicilio", distrito.getCodigo())
            );
        }
    }

    private boolean coincideReglaZona(ZonaRegla regla, Distrito distrito) {
        return switch (regla.getNivelGeografico()) {
            case DEPARTAMENTO -> distrito.getDepartamento() != null
                    && regla.getGeoId().equals(distrito.getDepartamento().getId());
            case PROVINCIA -> distrito.getProvincia() != null
                    && regla.getGeoId().equals(distrito.getProvincia().getId());
            case DISTRITO -> regla.getGeoId().equals(distrito.getId());
        };
    }

    private void validarPreventaCompleta(Lead lead) {
        DatosPreventa datosPreventa = lead.getDatosPreventa();
        Direccion direccion = lead.getDireccion();

        if (datosPreventa == null) {
            throw new BadRequestException("Faltan datos de preventa");
        }
        if (direccion == null) {
            throw new BadRequestException("Faltan datos de direccion");
        }
        if (lead.getPlan() == null) {
            throw new BadRequestException("Falta seleccionar un plan");
        }

        if (datosPreventa.getTipoDocumento() == null) {
            throw new BadRequestException("Falta tipoDocumento");
        }
        validarTextoObligatorio(datosPreventa.getNumeroDocumentoTitularServicio(), "Falta numeroDocumentoTitularServicio");
        validarTextoObligatorio(datosPreventa.getNombreTitularServicio(), "Falta nombreTitularServicio");
        validarTextoObligatorio(datosPreventa.getCelularRegistro(), "Falta celularRegistro");
        validarTextoObligatorio(datosPreventa.getCorreo(), "Falta correo");
        validarCamposConfigurablesObligatorios(lead, datosPreventa, direccion);

        validarTextoObligatorio(direccion.getUbigeoDomicilio(), "Falta ubigeoDomicilio");
        if (direccion.getTipoDomicilio() == null) {
            throw new BadRequestException("Falta tipoDomicilio");
        }
        // tipoVia y via son opcionales: una direccion puede no tener via (opcion "Sin Via" en la UI).
        validarTextoObligatorio(direccion.getDireccion(), "Falta direccion");
        validarTextoObligatorio(direccion.getReferencia(), "Falta referencia");
    }

    private void validarCamposConfigurablesObligatorios(Lead lead, DatosPreventa datosPreventa, Direccion direccion) {
        for (CampoConfigResponse campo : resolverConfigCamposCaptura(lead)) {
            if (!campo.isVisible() || !campo.isRequerido()) {
                continue;
            }
            CampoConfigurable campoConfigurable = campo.getCampo();
            switch (campoConfigurable) {
                case NOMBRE_MADRE -> validarTextoObligatorio(datosPreventa.getNombreMadre(), "Falta nombreMadre");
                case NOMBRE_PADRE -> validarTextoObligatorio(datosPreventa.getNombrePadre(), "Falta nombrePadre");
                case DOC_TITULAR_CELULAR -> validarTextoObligatorio(
                        datosPreventa.getNumeroDocumentoTitularCelularRegistro(),
                        "Falta numeroDocumentoTitularCelularRegistro");
                case NOMBRE_TITULAR_CELULAR -> validarTextoObligatorio(
                        datosPreventa.getNombreTitularCelularRegistro(),
                        "Falta nombreTitularCelularRegistro");
                case PLANO -> validarTextoObligatorio(direccion.getPlano(), "Falta plano");
            }
        }
    }

    private void validarTextoObligatorio(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
    }

    private void notificarCambioLead(String tipo, Lead lead, Etapa etapaAnterior, Long idAsesorAnterior) {
        notificarCambioLead(tipo, lead, etapaAnterior, idAsesorAnterior, false);
    }

    private void notificarCambioLead(
            String tipo, Lead lead, Etapa etapaAnterior, Long idAsesorAnterior, boolean tambienBandejaGtr) {
        leadRealtimeNotifier.publishAfterCommit(LeadRealtimeEvent.builder()
                .tipo(tipo)
                .idLead(lead.getId())
                .etapa(lead.getEtapa())
                .etapaAnterior(etapaAnterior)
                .estado(lead.getEstado())
                .idAsesorAsignado(lead.getIdAsesorAsignado())
                .idAsesorAnterior(idAsesorAnterior)
                .codigoTipificacion(lead.getCodigoTipificacion())
                .codigoSubtipificacion(lead.getCodigoSubtipificacion())
                .occurredAt(OperationalDateTime.now())
                .tambienBandejaGtr(tambienBandejaGtr)
                .build());
    }

    // ── Ranking GTR ──────────────────────────────────────────────────────────

    public List<GtrRankingAsesorResponse> listarRankingGtr(
            LocalDate desde, LocalDate hasta, boolean soloActivos) {
        return listarRankingGtr(desde, hasta, soloActivos, null,
                ModoConteo.GESTIONADOS, OrdenRankingAsesor.PREVENTAS_PERIODO);
    }

    public List<GtrRankingAsesorResponse> listarRankingGtr(
            LocalDate desde, LocalDate hasta, boolean soloActivos, Long idEquipo,
            ModoConteo modo, OrdenRankingAsesor ordenarPor) {

        LocalDate desdeResuelta = OperationalDateTime.resolveDate(desde);
        LocalDate hastaResuelta = hasta == null ? OperationalDateTime.today() : hasta;
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);

        OperationalDateTime.InstantRange rangoPeriodo = new OperationalDateTime.InstantRange(
                OperationalDateTime.dayRange(desdeResuelta).inicio(),
                OperationalDateTime.dayRange(hastaResuelta).fin()
        );
        OperationalDateTime.InstantRange rangoMes =
                OperationalDateTime.monthRange(YearMonth.from(desdeResuelta));

        boolean ingresados = modo == ModoConteo.INGRESADOS;
        Map<Long, GtrRankingAccumulator> acumulados = new HashMap<>();

        eventoRepository.resumirNuevosGestionadosPorAsesorGtr(
                        Accion.TIPIFICACION, Accion.REGISTRO,
                        rangoPeriodo.inicio(), rangoPeriodo.fin(), soloActivos,
                        equipos.filtrar(), equipos.ids())
                .forEach(row -> {
                    GtrRankingAccumulator item = obtenerAcumuladorGtr(acumulados, row.getIdAsesor(), row.getNombreAsesor());
                    item.nuevosGestionadosPeriodo = row.getCantidad();
                });

        eventoRepository.resumirAsignacionesPorAsesorDestinoGtr(
                        Accion.ASIGNACION, ingresados, Accion.REGISTRO,
                        rangoPeriodo.inicio(), rangoPeriodo.fin(), soloActivos,
                        equipos.filtrar(), equipos.ids())
                .forEach(row -> {
                    GtrRankingAccumulator item = obtenerAcumuladorGtr(acumulados, row.getIdAsesor(), row.getNombreAsesor());
                    item.asignadosPeriodo = row.getCantidad();
                });

        eventoRepository.resumirTipificacionesPorAsesorGtr(
                        Accion.TIPIFICACION, ingresados, Accion.REGISTRO,
                        rangoPeriodo.inicio(), rangoPeriodo.fin(), soloActivos,
                        equipos.filtrar(), equipos.ids())
                .forEach(row -> {
                    GtrRankingAccumulator item = obtenerAcumuladorGtr(acumulados, row.getIdAsesor(), row.getNombreAsesor());
                    item.gestionadosPeriodo = row.getCantidad();
                });

        eventoRepository.resumirNuevasOportunidadesPorAsesorGtr(
                        Accion.NUEVA_OPORTUNIDAD, ingresados, Accion.REGISTRO,
                        rangoPeriodo.inicio(), rangoPeriodo.fin(), soloActivos,
                        equipos.filtrar(), equipos.ids())
                .forEach(row -> {
                    GtrRankingAccumulator item = obtenerAcumuladorGtr(acumulados, row.getIdAsesor(), row.getNombreAsesor());
                    item.nuevasOportunidadesPeriodo = row.getCantidad();
                });

        leadRepository.resumirPreventasPorAsesorLeadGtr(
                        ingresados, Accion.REGISTRO,
                        rangoPeriodo.inicio(), rangoPeriodo.fin(), soloActivos,
                        equipos.filtrar(), equipos.ids())
                .forEach(row -> {
                    GtrRankingAccumulator item = obtenerAcumuladorGtr(acumulados, row.getIdAsesor(), null);
                    item.preventasPeriodo = row.getCantidad();
                });

        leadRepository.resumirPreventasMensualesPorProveedorLeadGtr(
                        rangoMes.inicio(), rangoMes.fin(), soloActivos,
                        equipos.filtrar(), equipos.ids())
                .forEach(row -> {
                    GtrRankingAccumulator item = obtenerAcumuladorGtr(acumulados, row.getIdAsesor(), null);
                    item.preventasMes += row.getCantidad();
                    item.preventasMesPorProveedor.add(new SupervisorVentasProveedorResumenResponse(
                            row.getIdProveedor(), row.getNombreProveedor(), row.getCantidad()));
                });

        // Solo asesores de ventas/GTR (excluye backoffice/migración/etc.). Un actor entra al ranking
        // sólo si actuó con un rol válido en el período y scope; así no aparece un backoffice aunque
        // haya recibido asignaciones o tipificado leads de PREVENTA.
        Set<Long> asesoresValidos = new HashSet<>(eventoRepository.idsAsesoresRankingGtr(
                ROLES_RANKING_ASESOR_GTR, rangoPeriodo.inicio(), rangoPeriodo.fin(),
                equipos.filtrar(), equipos.ids()));
        acumulados.keySet().retainAll(asesoresValidos);

        resolverNombresAsesoresFaltantes(acumulados);

        Comparator<GtrRankingAccumulator> comparator = ordenarPor == OrdenRankingAsesor.PREVENTAS_MES
                ? Comparator.comparingLong(GtrRankingAccumulator::preventasMes).reversed()
                : Comparator.comparingLong(GtrRankingAccumulator::preventasPeriodo).reversed();

        return acumulados.values().stream()
                .sorted(comparator.thenComparing(GtrRankingAccumulator::nombreAsesorOrdenable))
                .map(GtrRankingAccumulator::toResponse)
                .toList();
    }

    public List<GtrTipificacionCampanaResponse> listarTipificacionesCampanaGtr(
            LocalDate desde, LocalDate hasta, boolean soloActivos) {
        return listarTipificacionesCampanaGtr(desde, hasta, soloActivos, null);
    }

    public List<GtrTipificacionCampanaResponse> listarTipificacionesCampanaGtr(
            LocalDate desde, LocalDate hasta, boolean soloActivos, Long idEquipo) {

        LocalDate desdeResuelta = OperationalDateTime.resolveDate(desde);
        LocalDate hastaResuelta = hasta == null ? OperationalDateTime.today() : hasta;
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);

        OperationalDateTime.InstantRange rangoPeriodo = new OperationalDateTime.InstantRange(
                OperationalDateTime.dayRange(desdeResuelta).inicio(),
                OperationalDateTime.dayRange(hastaResuelta).fin()
        );

        List<CampanaTipificacionCantidadProjection> rows =
                eventoRepository.resumirTipificacionesPorCampanaGtr(
                        Accion.TIPIFICACION, rangoPeriodo.inicio(), rangoPeriodo.fin(), soloActivos,
                        equipos.filtrar(), equipos.ids());

        Map<Long, Long> totalPorCampana = rows.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        CampanaTipificacionCantidadProjection::getIdCampana,
                        java.util.stream.Collectors.summingLong(CampanaTipificacionCantidadProjection::getCantidad)
                ));

        return rows.stream()
                .map(r -> {
                    long total = totalPorCampana.getOrDefault(r.getIdCampana(), 1L);
                    double pct = total > 0 ? Math.round((r.getCantidad() * 1000.0) / total) / 10.0 : 0.0;
                    return new GtrTipificacionCampanaResponse(
                            r.getIdCampana(), r.getNombreCampana(),
                            r.getTipificacion(), r.getSubtipificacion(),
                            r.getCantidad(), pct);
                })
                .sorted(Comparator.comparing(GtrTipificacionCampanaResponse::getNombreCampana,
                                Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparingLong(r -> -r.getCantidad()))
                .toList();
    }

    public List<GtrTipificacionRankingResponse> listarTipificacionesRankingGtr(
            LocalDate desde, LocalDate hasta, boolean soloActivos, Long idEquipo,
            ModoConteo modo, CampoTipificacion campo) {
        OperationalDateTime.InstantRange rango = resolverRangoRanking(desde, hasta);
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);
        // Cuenta LEADS distintos por su tipificacion del campo elegido en PREVENTA (uno por lead), no
        // eventos. modo/campo con la misma semantica que el DASHBOARD del ADMIN. soloActivos no aplica.
        boolean ingresados = modo == ModoConteo.INGRESADOS;
        List<TipificacionCantidadProjection> rows = switch (campo) {
            case PRIMERA -> leadRepository.resumirTipiRankingGtrPrimera(
                    ingresados, Accion.REGISTRO, rango.inicio(), rango.fin(), equipos.filtrar(), equipos.ids());
            case ULTIMA -> leadRepository.resumirTipiRankingGtrUltima(
                    ingresados, Accion.REGISTRO, rango.inicio(), rango.fin(), equipos.filtrar(), equipos.ids());
            case MAYOR -> leadRepository.resumirTipiRankingGtrMayor(
                    ingresados, Accion.REGISTRO, rango.inicio(), rango.fin(), equipos.filtrar(), equipos.ids());
        };
        long tipificados = rows.stream().mapToLong(TipificacionCantidadProjection::getCantidad).sum();
        long sinTipificar = 0;
        if (ingresados) {
            long totalLeads = eventoRepository.contarLeadsUnicosRegistrados(
                    Accion.REGISTRO, rango.inicio(), rango.fin(), equipos.filtrar(), equipos.ids());
            sinTipificar = totalLeads - tipificados;
        }
        long total = tipificados + Math.max(sinTipificar, 0);

        List<GtrTipificacionRankingResponse> resultado = new ArrayList<>(rows.stream()
                .map(row -> new GtrTipificacionRankingResponse(
                        row.getTipificacion(),
                        row.getCantidad(),
                        calcularPorcentajeRanking(row.getCantidad(), total)
                ))
                .sorted(Comparator.comparingLong(GtrTipificacionRankingResponse::getCantidad).reversed()
                        .thenComparing(GtrTipificacionRankingResponse::getCodigoTipificacion,
                                Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList());
        if (sinTipificar > 0) {
            resultado.add(new GtrTipificacionRankingResponse(
                    "SIN_TIPIFICAR", sinTipificar, calcularPorcentajeRanking(sinTipificar, total)));
        }
        return resultado;
    }

    public List<GtrSubtipificacionRankingResponse> listarSubtipificacionesRankingGtr(
            String codigoTipificacion,
            LocalDate desde,
            LocalDate hasta,
            boolean soloActivos,
            Long idEquipo,
            ModoConteo modo,
            CampoTipificacion campo
    ) {
        if (codigoTipificacion == null || codigoTipificacion.isBlank()) {
            throw new BadRequestException("Selecciona una tipificación para ver su detalle.");
        }
        OperationalDateTime.InstantRange rango = resolverRangoRanking(desde, hasta);
        RankingEquipoScope equipos = resolverEquiposRanking(idEquipo);
        // Detalle de subtipificaciones del mismo modo/campo que el diagrama de tipificaciones: leads
        // distintos cuyo campo de tipificacion es la tipi elegida, desglosados por su subtipi del campo.
        boolean ingresados = modo == ModoConteo.INGRESADOS;
        String tipi = codigoTipificacion.trim();
        List<SubtipificacionCantidadProjection> rows = switch (campo) {
            case PRIMERA -> leadRepository.resumirSubtipiRankingGtrPrimera(
                    ingresados, Accion.REGISTRO, tipi, rango.inicio(), rango.fin(), equipos.filtrar(), equipos.ids());
            case ULTIMA -> leadRepository.resumirSubtipiRankingGtrUltima(
                    ingresados, Accion.REGISTRO, tipi, rango.inicio(), rango.fin(), equipos.filtrar(), equipos.ids());
            case MAYOR -> leadRepository.resumirSubtipiRankingGtrMayor(
                    ingresados, Accion.REGISTRO, tipi, rango.inicio(), rango.fin(), equipos.filtrar(), equipos.ids());
        };
        long total = rows.stream().mapToLong(SubtipificacionCantidadProjection::getCantidad).sum();

        return rows.stream()
                .map(row -> new GtrSubtipificacionRankingResponse(
                        "SIN_SUBTIPIFICACION".equals(row.getSubtipificacion())
                                ? "Sin subtipificación"
                                : row.getSubtipificacion(),
                        row.getCantidad(),
                        calcularPorcentajeRanking(row.getCantidad(), total)
                ))
                .sorted(Comparator.comparingLong(GtrSubtipificacionRankingResponse::getCantidad).reversed()
                        .thenComparing(GtrSubtipificacionRankingResponse::getCodigoSubtipificacion,
                                Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private OperationalDateTime.InstantRange resolverRangoRanking(LocalDate desde, LocalDate hasta) {
        LocalDate desdeResuelta = OperationalDateTime.resolveDate(desde);
        LocalDate hastaResuelta = hasta == null ? OperationalDateTime.today() : hasta;
        if (desdeResuelta.isAfter(hastaResuelta)) {
            throw new BadRequestException("La fecha de inicio no puede ser posterior a la fecha final.");
        }
        return new OperationalDateTime.InstantRange(
                OperationalDateTime.dayRange(desdeResuelta).inicio(),
                OperationalDateTime.dayRange(hastaResuelta).fin()
        );
    }

    private RankingEquipoScope resolverEquiposRanking(Long idEquipoSolicitado) {
        if (currentUser.tieneVisibilidadGlobalEquipos()) {
            return idEquipoSolicitado == null
                    ? new RankingEquipoScope(false, List.of(-1L))
                    : new RankingEquipoScope(true, List.of(idEquipoSolicitado));
        }

        List<Long> equiposUsuario = currentUser.equipos();
        if (equiposUsuario == null || equiposUsuario.isEmpty()) {
            return new RankingEquipoScope(true, List.of(-1L));
        }
        if (idEquipoSolicitado != null && !equiposUsuario.contains(idEquipoSolicitado)) {
            throw new UnauthorizedException("No tienes acceso al equipo seleccionado.");
        }
        return idEquipoSolicitado == null
                ? new RankingEquipoScope(true, equiposUsuario)
                : new RankingEquipoScope(true, List.of(idEquipoSolicitado));
    }

    private RankingEquipoScope resolverEquiposActuales() {
        if (currentUser.tieneVisibilidadGlobalEquipos()) {
            return new RankingEquipoScope(false, List.of(-1L));
        }
        List<Long> equiposUsuario = currentUser.equipos();
        if (equiposUsuario == null || equiposUsuario.isEmpty()) {
            return new RankingEquipoScope(true, List.of(-1L));
        }
        return new RankingEquipoScope(true, equiposUsuario);
    }

    private double calcularPorcentajeRanking(long cantidad, long total) {
        return total > 0 ? Math.round((cantidad * 1000.0) / total) / 10.0 : 0.0;
    }

    private record RankingEquipoScope(boolean filtrar, List<Long> ids) { }

    private GtrRankingAccumulator obtenerAcumuladorGtr(
            Map<Long, GtrRankingAccumulator> acumulados, Long idAsesor, String nombreAsesor) {
        GtrRankingAccumulator item = acumulados.computeIfAbsent(idAsesor, k -> new GtrRankingAccumulator(idAsesor));
        if (item.nombreAsesor == null && nombreAsesor != null && !nombreAsesor.isBlank()) {
            item.nombreAsesor = nombreAsesor;
        }
        return item;
    }

    // Algunos asesores entran al ranking solo por su preventa (id leido del Lead) y aun no tienen
    // nombre desde los conteos de gestion. Se resuelve el nombre denormalizado en una sola consulta.
    private void resolverNombresAsesoresFaltantes(Map<Long, GtrRankingAccumulator> acumulados) {
        List<Long> idsSinNombre = acumulados.values().stream()
                .filter(item -> item.nombreAsesor == null || item.nombreAsesor.isBlank())
                .map(item -> item.idAsesor)
                .filter(id -> id != null)
                .toList();
        if (idsSinNombre.isEmpty()) {
            return;
        }

        for (Object[] fila : eventoRepository.resolverNombresActores(idsSinNombre)) {
            Long idActor = (Long) fila[0];
            String nombre = (String) fila[1];
            GtrRankingAccumulator item = acumulados.get(idActor);
            if (item != null && nombre != null && !nombre.isBlank()) {
                item.nombreAsesor = nombre;
            }
        }
    }

    private static final class GtrRankingAccumulator {
        private final Long idAsesor;
        private String nombreAsesor;
        private long nuevosGestionadosPeriodo;
        private long asignadosPeriodo;
        private long gestionadosPeriodo;
        private long nuevasOportunidadesPeriodo;
        private long preventasPeriodo;
        private long preventasMes;
        private final List<SupervisorVentasProveedorResumenResponse> preventasMesPorProveedor = new ArrayList<>();

        private GtrRankingAccumulator(Long idAsesor) {
            this.idAsesor = idAsesor;
        }

        private long gestionadosPeriodo() { return gestionadosPeriodo; }
        private long preventasPeriodo() { return preventasPeriodo; }
        private long preventasMes() { return preventasMes; }
        private String nombreAsesorOrdenable() { return nombreAsesor == null ? "" : nombreAsesor; }

        private GtrRankingAsesorResponse toResponse() {
            List<SupervisorVentasProveedorResumenResponse> proveedores = preventasMesPorProveedor.stream()
                    .sorted(Comparator.comparing(SupervisorVentasProveedorResumenResponse::getNombreProveedor,
                            Comparator.nullsLast(String::compareToIgnoreCase)))
                    .toList();
            return new GtrRankingAsesorResponse(
                    idAsesor, nombreAsesor,
                    nuevosGestionadosPeriodo, asignadosPeriodo, gestionadosPeriodo,
                    nuevasOportunidadesPeriodo, preventasPeriodo, preventasMes, proveedores);
        }
    }

    private ResumenSupervisorVentasAccumulator obtenerAcumulador(
            Map<Long, ResumenSupervisorVentasAccumulator> acumulados,
            Long idAsesor,
            String nombreAsesor
    ) {
        ResumenSupervisorVentasAccumulator item = acumulados.computeIfAbsent(
                idAsesor,
                key -> new ResumenSupervisorVentasAccumulator(idAsesor)
        );
        if (item.nombreAsesor == null && nombreAsesor != null && !nombreAsesor.isBlank()) {
            item.nombreAsesor = nombreAsesor;
        }
        return item;
    }

    private record MisPreventaResumenEtapaRow(
            LeadEtapaResumen resumenPreventa,
            Lead lead,
            Instant fechaVista,
            LocalDate fechaInstalacion,
            Instant fechaUltimaGestionVenta
    ) { }
    private record IntentoVentaResultado(Evento evento, Etapa etapaDestino) { }
    private record TipificacionRetornoPreventa(Tipificacion tipificacion, Subtipificacion subtipificacion) { }

    private static final class ResumenSupervisorVentasAccumulator {
        private final Long idAsesor;
        private String nombreAsesor;
        private long asignadosActuales;
        private long gestionadosHoy;
        private long preventasHoy;
        private long preventasMes;
        private final List<SupervisorVentasProveedorResumenResponse> preventasMesPorProveedor = new ArrayList<>();

        private ResumenSupervisorVentasAccumulator(Long idAsesor) {
            this.idAsesor = idAsesor;
        }

        private Long idAsesor() {
            return idAsesor;
        }

        private String nombreAsesorOrdenable() {
            return nombreAsesor == null ? "" : nombreAsesor;
        }

        private SupervisorVentasResumenResponse toResponse() {
            List<SupervisorVentasProveedorResumenResponse> proveedores = preventasMesPorProveedor.stream()
                    .sorted(Comparator.comparing(SupervisorVentasProveedorResumenResponse::getNombreProveedor,
                            Comparator.nullsLast(String::compareToIgnoreCase)))
                    .toList();

            return new SupervisorVentasResumenResponse(
                    idAsesor,
                    nombreAsesor,
                    asignadosActuales,
                    gestionadosHoy,
                    preventasHoy,
                    preventasMes,
                    proveedores
            );
        }
    }
}
