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
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.CriterioZona;
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionMasivaRequest;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionRequest;
import pe.albrugroup.lead_service.entity.request.LeadDatosPreventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadDireccionRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRetroactivoRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaAdicionalRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaComercialRequest;
import pe.albrugroup.lead_service.entity.request.LeadSnapshotsRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionPostventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionVentaRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.AsesorLeadsPendientesResponse;
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
import pe.albrugroup.lead_service.entity.response.LeadContextoLookupResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrLookupResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.InternetResponse;
import pe.albrugroup.lead_service.entity.response.LeadPostventaResponse;
import pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent;
import pe.albrugroup.lead_service.entity.response.MisPreventaResponse;
import pe.albrugroup.lead_service.entity.response.OportunidadHermanaResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.PlanAdicionalResponse;
import pe.albrugroup.lead_service.entity.response.GtrRankingAsesorResponse;
import pe.albrugroup.lead_service.entity.response.GtrTipificacionCampanaResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorVentasProveedorResumenResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorVentasResumenResponse;
import pe.albrugroup.lead_service.repository.projection.CampanaTipificacionCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.LeadGtrAgrupacionProjection;
import pe.albrugroup.lead_service.entity.response.TelefonoResponse;
import pe.albrugroup.lead_service.entity.response.TelevisionResponse;
import pe.albrugroup.lead_service.exception.BusinessException;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.AdicionalRepository;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.ContactoRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.DistritoRepository;
import pe.albrugroup.lead_service.repository.EncuestaPostventaRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.PagoPostventaRepository;
import pe.albrugroup.lead_service.repository.PlanRepository;
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
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final ContactoRepository contactoRepository;
    private final EquipoProveedorRepository equipoProveedorRepository;
    private final CampanaRepository campanaRepository;
    private final EventoRepository eventoRepository;
    private final EventoService eventoService;
    private final CurrentUser currentUser;
    private final PlanRepository planRepository;
    private final PagoPostventaRepository pagoPostventaRepository;
    private final EncuestaPostventaRepository encuestaPostventaRepository;
    private final PromocionComercialRepository promocionComercialRepository;
    private final AdicionalRepository adicionalRepository;
    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final LeadMapper leadMapper;
    private final DistritoRepository distritoRepository;
    private final ZonaReglaRepository zonaReglaRepository;
    private final PaginationService paginationService;
    private final TransactionTemplate transactionTemplate;
    private final LeadRealtimeNotifier leadRealtimeNotifier;
    private final LeadAsignacionCounterService leadAsignacionCounterService;

    private static final String TIPIFICACION_AGENDADO = "AGENDADO";
    private static final String TIPIFICACION_PROGRAMADO = "PROGRAMADO";
    private static final String TIPIFICACION_SCORE_PREVENTA = "SCORE_PREVENTA";
    private static final String TIPIFICACION_PREVENTA_COMPLETA = "PREVENTA_COMPLETA";
    private static final String TIPIFICACION_GRABADO = "GRABADO";
    private static final Instant MIS_PREVENTAS_FECHA_HASTA_ABIERTA = Instant.parse("9999-01-01T00:00:00Z");
    private static final String SUBTIPIFICACION_PREVENTA = "PREVENTA";
    private static final String SUBTIPIFICACION_VENTA_CERRADA = "VENTA_CERRADA";
    private static final LocalTime HORA_MINIMA_REGISTRO_RETROACTIVO = LocalTime.of(18, 0);
    private static final LocalTime HORA_MAXIMA_REGISTRO_RETROACTIVO = LocalTime.of(23, 59);
    private static final List<Accion> ACCIONES_GESTION_LEAD = List.of(Accion.CONTACTO, Accion.TIPIFICACION);
    private static final Set<String> LEAD_GTR_SORT_FIELDS = Set.of(
            "lastEntryAt", "createdAt", "lead", "nombreAsesorAsignado", "estado"
    );
    private static final Set<String> LEAD_ASESOR_SORT_FIELDS = Set.of(
            "lastEntryAt", "createdAt", "lead", "estado"
    );
    private static final Set<String> LEAD_POSTVENTA_SORT_FIELDS = Set.of(
            "lastEntryAt", "createdAt", "lead", "nombreProveedorSnapshot", "estadoPostventa", "diaCorteFacturacion"
    );

    public PageResponse<LeadGtrResponse> listarBandejaGtr(
            LocalDate fecha,
            String lead,
            TipoGrupoGtr tipoGrupo,
            Long idGrupo,
            String codigoTipificacion,
            String codigoSubtipificacion,
            boolean sinValor,
            PageRequest pageRequest
    ) {
        boolean buscandoPorLead = lead != null && !lead.isBlank();
        String leadPattern = (buscandoPorLead ? lead.trim() : "") + "%";
        OperationalDateTime.InstantRange rangoDia = buscandoPorLead
                ? new OperationalDateTime.InstantRange(Instant.EPOCH, Instant.ofEpochSecond(253402300799L))
                : OperationalDateTime.dayRange(fecha);
        validarFiltroAgrupacionGtr(tipoGrupo, idGrupo, codigoTipificacion, sinValor);

        var pageable = paginationService.toPageable(pageRequest, LEAD_GTR_SORT_FIELDS);
        Page<LeadGtrResponse> leads = tipoGrupo == null
                ? leadRepository.listarBandejaGtr(
                        Etapa.PREVENTA,
                        leadPattern,
                        rangoDia.inicio(),
                        rangoDia.fin(),
                        pageable
                )
                : leadRepository.listarBandejaGtrFiltrada(
                        Etapa.PREVENTA,
                        leadPattern,
                        rangoDia.inicio(),
                        rangoDia.fin(),
                        tipoGrupo == TipoGrupoGtr.ASESOR,
                        tipoGrupo == TipoGrupoGtr.CAMPANA,
                        tipoGrupo == TipoGrupoGtr.PRIMERA_TIPIFICACION,
                        tipoGrupo == TipoGrupoGtr.ULTIMA_TIPIFICACION,
                        idGrupo,
                        normalizarCodigoAgrupacion(codigoTipificacion),
                        normalizarCodigoAgrupacion(codigoSubtipificacion),
                        sinValor,
                        pageable
                );
        aplicarTotalesAsignacion(leads.getContent(), LeadGtrResponse::getId, this::setTotalesAsignacion);
        if (!buscandoPorLead) {
            aplicarAlertasRegistrosDia(leads.getContent(), rangoDia.inicio(), rangoDia.fin());
        }
        return PageResponse.from(leads);
    }

    public LeadGtrAgrupacionesResponse listarAgrupacionesBandejaGtr(LocalDate fecha) {
        OperationalDateTime.InstantRange rangoDia = OperationalDateTime.dayRange(fecha);
        return new LeadGtrAgrupacionesResponse(
                mapearAgrupaciones(
                        leadRepository.agruparBandejaGtrPorAsesor(Etapa.PREVENTA, rangoDia.inicio(), rangoDia.fin()),
                        "Sin asignar"
                ),
                mapearAgrupaciones(
                        leadRepository.agruparBandejaGtrPorCampana(Etapa.PREVENTA, rangoDia.inicio(), rangoDia.fin()),
                        "Sin campaña"
                ),
                // La bandeja GTR ya está acotada al equipo del usuario; no se agrupa por equipo.
                List.of(),
                mapearAgrupacionesTipificacion(
                        leadRepository.agruparBandejaGtrPorPrimeraTipificacion(
                                Etapa.PREVENTA,
                                rangoDia.inicio(),
                                rangoDia.fin()
                        )
                ),
                mapearAgrupacionesTipificacion(
                        leadRepository.agruparBandejaGtrPorUltimaTipificacion(
                                Etapa.PREVENTA,
                                rangoDia.inicio(),
                                rangoDia.fin()
                        )
                )
        );
    }

    public LeadGtrLookupResponse buscarContextoLeadGtr(String lead) {
        String numeroLead = normalizarLead(lead);
        if (numeroLead == null || numeroLead.isBlank()) {
            throw new BadRequestException("El numero del lead es obligatorio");
        }

        return leadRepository.findFirstByLeadOrderByLastEntryAtDescIdDesc(numeroLead)
                .map(this::mapearContextoLeadGtr)
                .orElseGet(() -> new LeadGtrLookupResponse(
                        false,
                        null,
                        null,
                        numeroLead,
                        null,
                        null,
                        false,
                        "No encontramos ese lead en el sistema."
                ));
    }

    public LeadContextoLookupResponse buscarContextoLeadVenta(String lead) {
        String numeroLead = normalizarLead(lead);
        if (numeroLead == null || numeroLead.isBlank()) {
            throw new BadRequestException("El numero del lead es obligatorio");
        }

        return leadRepository.findFirstByLeadOrderByLastEntryAtDescIdDesc(numeroLead)
                .map(this::mapearContextoLeadVenta)
                .orElseGet(() -> new LeadContextoLookupResponse(
                        false,
                        null,
                        null,
                        numeroLead,
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
        List<Lead> leads = leadRepository.findByEtapaAndEstadoInAndIdAsesorAsignadoIsNotNullOrderByIdAsesorAsignadoAscLastEntryAtDesc(
                Etapa.PREVENTA,
                List.of(EstadoSeguimiento.ASIGNADO, EstadoSeguimiento.EN_GESTION)
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

        Set<Long> conLeads = leadRepository.resumirAsignadosActualesPorAsesor(
                        Etapa.PREVENTA,
                        List.of(EstadoSeguimiento.ASIGNADO, EstadoSeguimiento.EN_GESTION),
                        true,
                        idsAsesor
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

    public LeadGtrMetricasResponse obtenerMetricasGtr(LocalDate fecha) {
        OperationalDateTime.InstantRange rangoDia = OperationalDateTime.dayRange(fecha);

        long nuevos = leadRepository.countByEtapaAndEstadoAndLastEntryAtGreaterThanEqualAndLastEntryAtLessThan(
                Etapa.PREVENTA,
                EstadoSeguimiento.NUEVO,
                rangoDia.inicio(),
                rangoDia.fin()
        );
        long sinGestionar = leadRepository.countByEtapaAndEstadoAndLastEntryAtGreaterThanEqualAndLastEntryAtLessThan(
                Etapa.PREVENTA,
                EstadoSeguimiento.ASIGNADO,
                rangoDia.inicio(),
                rangoDia.fin()
        );
        long gestionados = eventoRepository.contarGestionadosGtr(
                Etapa.PREVENTA,
                ACCIONES_GESTION_LEAD,
                TIPIFICACION_PREVENTA_COMPLETA,
                rangoDia.inicio(),
                rangoDia.fin()
        );
        long preventas = eventoRepository.contarPreventasGtr(
                Accion.TIPIFICACION,
                TIPIFICACION_PREVENTA_COMPLETA,
                SUBTIPIFICACION_VENTA_CERRADA,
                rangoDia.inicio(),
                rangoDia.fin()
        );
        long ingresos = eventoRepository.contarIngresosGtr(
                Accion.REGISTRO,
                rangoDia.inicio(),
                rangoDia.fin()
        );

        return new LeadGtrMetricasResponse(nuevos, sinGestionar, gestionados, preventas, ingresos);
    }

    public PageResponse<LeadAgendadoGtrResponse> listarAgendadosGtr(PageRequest pageRequest) {
        Page<LeadAgendadoGtrResponse> leads = listarAgendadosGtrOrdenados(pageRequest);
        aplicarTotalesAsignacion(leads.getContent(), LeadAgendadoGtrResponse::getId, this::setTotalesAsignacion);
        return PageResponse.from(leads);
    }

    public AgendadosGtrResumenResponse obtenerResumenAgendadosGtr() {
        OperationalDateTime.InstantRange hoy = OperationalDateTime.dayRange(null);
        Map<String, Long> programadosHoyPorHora = new LinkedHashMap<>();
        for (int hora = 0; hora < 24; hora++) {
            programadosHoyPorHora.put(String.format("%02d", hora), 0L);
        }

        leadRepository.contarAgendadosGtrHoyPorHora(
                        Etapa.PREVENTA,
                        TIPIFICACION_AGENDADO,
                        Accion.TIPIFICACION,
                        hoy.inicio(),
                        hoy.fin())
                .forEach(item -> programadosHoyPorHora.merge(
                        String.format("%02d", item.getHoraProgramada().getHour()),
                        item.getCantidad(),
                        Long::sum));

        long totalActivos = leadRepository.contarAgendadosGtrActivos(Etapa.PREVENTA, TIPIFICACION_AGENDADO);
        return new AgendadosGtrResumenResponse(totalActivos, programadosHoyPorHora);
    }

    private Page<LeadAgendadoGtrResponse> listarAgendadosGtrOrdenados(PageRequest pageRequest) {
        validarDirection(pageRequest.getDirection());
        boolean desc = "desc".equalsIgnoreCase(pageRequest.getDirection());
        var pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPageNumber(),
                pageRequest.getPageSize()
        );

        // "agendado" ordena por el momento en que se tipifico (Evento.createdAt);
        // "programado" (default) ordena por la hora de la cita (Evento.horaProgramada).
        if ("agendado".equals(pageRequest.getSortBy())) {
            return desc
                    ? leadRepository.listarLeadsAgendadosGtrPorAgendadoDesc(
                            Etapa.PREVENTA, TIPIFICACION_AGENDADO, Accion.TIPIFICACION, pageable)
                    : leadRepository.listarLeadsAgendadosGtrPorAgendadoAsc(
                            Etapa.PREVENTA, TIPIFICACION_AGENDADO, Accion.TIPIFICACION, pageable);
        }

        return desc
                ? leadRepository.listarLeadsAgendadosGtrPorHoraDesc(
                        Etapa.PREVENTA, TIPIFICACION_AGENDADO, Accion.TIPIFICACION, pageable)
                : leadRepository.listarLeadsAgendadosGtrPorHoraAsc(
                        Etapa.PREVENTA, TIPIFICACION_AGENDADO, Accion.TIPIFICACION, pageable);
    }

    private void validarDirection(String direction) {
        if (!direction.equalsIgnoreCase("asc") && !direction.equalsIgnoreCase("desc")) {
            throw new BadRequestException("direction debe ser asc o desc");
        }
    }

    public PageResponse<LeadResponse> listarBandejaVenta(String lead, PageRequest pageRequest) {
        String numeroLead = normalizarLead(lead);
        boolean buscandoPorLead = numeroLead != null && !numeroLead.isBlank();
        String leadPattern = buscandoPorLead ? numeroLead + "%" : "%";
        // Por defecto la Plataforma muestra solo el dia operativo de hoy (America/Lima).
        // Al buscar un numero puntual se ignora el filtro de dia para poder ubicarlo en cualquier fecha.
        OperationalDateTime.InstantRange rango = buscandoPorLead
                ? new OperationalDateTime.InstantRange(Instant.EPOCH, Instant.ofEpochSecond(253402300799L))
                : OperationalDateTime.dayRange(null);
        Page<LeadResponse> leads = leadRepository.listarBandejaVentaDelDia(
                Etapa.VENTA,
                leadPattern,
                rango.inicio(),
                rango.fin(),
                paginationService.toPageable(pageRequest, LEAD_GTR_SORT_FIELDS)
        );
        aplicarTotalesAsignacion(leads.getContent(), LeadResponse::getId, LeadResponse::setTotalAsignaciones);
        return PageResponse.from(leads);
    }

    public PageResponse<LeadResponse> listarLeadsVentaAsignados(PageRequest pageRequest) {
        // El orden de Gestion lo define la consulta (sin tipificar primero, luego agrupado por
        // tipificacion/subtipificacion), por eso se usa un Pageable sin sort.
        Page<LeadResponse> leads = leadRepository.listarLeadsAsignadosPorEtapaYAsesor(
                Etapa.VENTA,
                currentUser.empleadoID(),
                org.springframework.data.domain.PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize())
        );
        aplicarTotalesAsignacion(leads.getContent(), LeadResponse::getId, LeadResponse::setTotalAsignaciones);
        return PageResponse.from(leads);
    }

    public PageResponse<LeadResponse> listarLeadsVentaProgramadosAsignados(PageRequest pageRequest) {
        LocalDate hoy = OperationalDateTime.today();
        LocalTime horaDesde = LocalTime.now(OperationalDateTime.ZONE).truncatedTo(ChronoUnit.HOURS);
        Page<LeadResponse> leads = leadRepository.listarLeadsProgramadosVentaAsignados(
                Etapa.VENTA,
                currentUser.empleadoID(),
                TIPIFICACION_PROGRAMADO,
                Accion.TIPIFICACION,
                hoy,
                horaDesde,
                org.springframework.data.domain.PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize())
        );
        aplicarTotalesAsignacion(leads.getContent(), LeadResponse::getId, LeadResponse::setTotalAsignaciones);
        return PageResponse.from(leads);
    }

    public PageResponse<LeadPostventaResponse> listarBandejaPostventa(PageRequest pageRequest) {
        Page<Lead> leads = leadRepository.listarLeadsPostventaDisponibles(
                Etapa.POSTVENTA,
                paginationService.toPageable(pageRequest, LEAD_POSTVENTA_SORT_FIELDS)
        );
        return mapearBandejaPostventa(leads);
    }

    public PageResponse<LeadPostventaResponse> listarLeadsPostventaAsignados(PageRequest pageRequest) {
        Page<Lead> leads = leadRepository.listarLeadsPostventaAsignados(
                Etapa.POSTVENTA,
                currentUser.empleadoID(),
                paginationService.toPageable(pageRequest, LEAD_POSTVENTA_SORT_FIELDS)
        );
        return mapearBandejaPostventa(leads);
    }

    public PageResponse<LeadPostventaResponse> listarBandejaCobranza(PageRequest pageRequest) {
        Page<Lead> leads = leadRepository.listarLeadsPostventaDisponibles(
                Etapa.COBRANZA,
                paginationService.toPageable(pageRequest, LEAD_POSTVENTA_SORT_FIELDS)
        );
        return mapearBandejaPostventa(leads);
    }

    public PageResponse<LeadPostventaResponse> listarLeadsCobranzaAsignados(PageRequest pageRequest) {
        Page<Lead> leads = leadRepository.listarLeadsPostventaAsignados(
                Etapa.COBRANZA,
                currentUser.empleadoID(),
                paginationService.toPageable(pageRequest, LEAD_POSTVENTA_SORT_FIELDS)
        );
        return mapearBandejaPostventa(leads);
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

        Map<Long, ResumenSupervisorVentasAccumulator> acumulados = new HashMap<>();

        leadRepository.resumirAsignadosActualesPorAsesor(
                        Etapa.PREVENTA,
                        List.of(EstadoSeguimiento.ASIGNADO, EstadoSeguimiento.EN_GESTION),
                        filtrarAsesores,
                        asesorIds
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
                        TIPIFICACION_SCORE_PREVENTA,
                        SUBTIPIFICACION_PREVENTA,
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
                        TIPIFICACION_SCORE_PREVENTA,
                        SUBTIPIFICACION_PREVENTA,
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
        var page = leadRepository.listarMisPreventas(
                currentUser.empleadoID(),
                desde,
                hasta,
                org.springframework.data.domain.PageRequest.of(pageRequest.getPageNumber(), pageRequest.getPageSize())
        );
        return PageResponse.from(page);
    }

    public LeadDetalleResponse obtenerDetalleMiPreventa(Long idLead) {
        Long idAsesor = currentUser.empleadoID();
        Lead lead = leadRepository.buscarDetalleCompletoPorId(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        if (!idAsesor.equals(lead.getIdAsesorPreventa())) {
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
        validarOfertaComercialEditableEnCicloActualVenta(lead.getId());
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

    @Transactional
    public void tipificarLead(Long idLead, LeadTipificacionRequest request) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        Etapa etapaActual = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();

        Tipificacion tipificacion = tipificacionRepository.findByEtapaAndCodigoAndActivoTrue(
                        etapaActual,
                        request.getCodigoTipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getCodigoTipificacion()));
        Subtipificacion subtipificacion = subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                        tipificacion.getId(),
                        request.getCodigoSubtipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, request.getCodigoSubtipificacion()));

        validarHoraProgramada(tipificacion.getCodigo(), request.getHoraProgramada());
        Etapa etapaDestino = subtipificacion.getEtapaCambio();
        registrarPrimeraTipificacionSiFalta(lead, tipificacion.getCodigo(), subtipificacion.getCodigo());
        if (etapaDestino != null && etapaDestino != etapaActual) {
            if (etapaActual == Etapa.PREVENTA && etapaDestino == Etapa.VENTA) {
                validarPreventaCompleta(lead);
                // Atribucion de preventa: quien la concreta (paso a VENTA). Se sobrescribe en cada
                // cierre, asi el merito queda en el ultimo asesor que la concluyo correctamente.
                lead.setIdAsesorPreventa(idAsesorAnterior);
                lead.setFechaPreventa(OperationalDateTime.now());
            }
            lead.setEtapa(etapaDestino);
            lead.setLastEntryAt(OperationalDateTime.now());
            lead.setEstado(EstadoSeguimiento.GESTIONADO);
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
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoTipificacion(
                savedLead.getId(),
                idCampana,
                etapaActual,
                obtenerIdPlanOfrecido(lead, tipificacion.getCodigo(), subtipificacion.getCodigo()),
                tipificacion.getCodigo(),
                subtipificacion.getCodigo(),
                request.getComentario(),
                request.getHoraProgramada()
        );
        notificarCambioLead("TIPIFICACION", savedLead, etapaActual, idAsesorAnterior);
    }

    @Transactional
    public void tipificarLeadVenta(Long idLead, LeadTipificacionVentaRequest request) {
        Lead lead = obtenerLeadAsignadoEnEtapa(idLead, Etapa.VENTA);
        Etapa etapaActual = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();

        Tipificacion tipificacion = tipificacionRepository.findByEtapaAndCodigoAndActivoTrue(
                        etapaActual,
                        request.getCodigoTipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getCodigoTipificacion()));
        Subtipificacion subtipificacion = subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                        tipificacion.getId(),
                        request.getCodigoSubtipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, request.getCodigoSubtipificacion()));

        Etapa etapaDestino = subtipificacion.getEtapaCambio();
        boolean requiereProgramacion = TIPIFICACION_PROGRAMADO.equals(tipificacion.getCodigo());
        validarProgramacionVenta(requiereProgramacion, request.getFechaProgramacion(), request.getHoraProgramada());
        registrarPrimeraTipificacionSiFalta(lead, tipificacion.getCodigo(), subtipificacion.getCodigo());

        // Atribucion de venta: el responsable no es quien cambia de etapa, sino quien tipifica
        // GRABADO (cualquier subtipificacion), que mantiene el lead en VENTA por los pasos extra.
        if (TIPIFICACION_GRABADO.equals(tipificacion.getCodigo())) {
            lead.setIdAsesorVenta(idAsesorAnterior);
            lead.setFechaVenta(OperationalDateTime.now());
        }

        if (etapaDestino != null && etapaDestino != etapaActual) {
            aplicarDatosPostventaSiCorresponde(lead, etapaDestino, request.getFechaInstalacion());
            lead.setEtapa(etapaDestino);
            lead.setLastEntryAt(OperationalDateTime.now());
            lead.setEstado(EstadoSeguimiento.GESTIONADO);
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
            moverAEnGestionSiAplica(lead);
        }

        Lead savedLead = leadRepository.save(lead);
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

    @Transactional
    public void tipificarLeadPostventa(Long idLead, LeadTipificacionPostventaRequest request) {
        tipificarLeadSeguimientoPostventa(idLead, Etapa.POSTVENTA, request);
    }

    @Transactional
    public void tipificarLeadCobranza(Long idLead, LeadTipificacionPostventaRequest request) {
        tipificarLeadSeguimientoPostventa(idLead, Etapa.COBRANZA, request);
    }

    private void tipificarLeadSeguimientoPostventa(Long idLead, Etapa etapa, LeadTipificacionPostventaRequest request) {
        Lead lead = obtenerLeadAsignadoEnEtapa(idLead, etapa);
        Etapa etapaActual = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();

        Tipificacion tipificacion = tipificacionRepository.findByEtapaAndCodigoAndActivoTrue(
                        etapaActual,
                        request.getCodigoTipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, request.getCodigoTipificacion()));
        Subtipificacion subtipificacion = subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                        tipificacion.getId(),
                        request.getCodigoSubtipificacion().trim()
                )
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, request.getCodigoSubtipificacion()));

        Etapa etapaDestino = subtipificacion.getEtapaCambio();
        EstadoPostventa estadoDestino = resolverEstadoPostventaDestino(etapaActual, etapaDestino, subtipificacion);
        registrarPrimeraTipificacionSiFalta(lead, tipificacion.getCodigo(), subtipificacion.getCodigo());

        if (estadoDestino != null) {
            lead.setEstadoPostventa(estadoDestino);
        }

        // Atribucion por etapa: postventa se concreta al avanzar a COBRANZA; cobranza se concreta al
        // llegar a un estado final (no hay etapa posterior). Se sobrescribe en cada concrecion.
        if (etapaActual == Etapa.POSTVENTA && etapaDestino == Etapa.COBRANZA) {
            lead.setIdAsesorPostventa(idAsesorAnterior);
            lead.setFechaPostventa(OperationalDateTime.now());
        }
        if (etapaActual == Etapa.COBRANZA && esEstadoPostventaFinal(estadoDestino)) {
            lead.setIdAsesorCobranza(idAsesorAnterior);
            lead.setFechaCobranza(OperationalDateTime.now());
        }

        if (etapaDestino != null && etapaDestino != etapaActual) {
            lead.setEtapa(etapaDestino);
            lead.setLastEntryAt(OperationalDateTime.now());
            lead.setEstado(EstadoSeguimiento.GESTIONADO);
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

            if (esEstadoPostventaFinal(estadoDestino)) {
                lead.setEstado(EstadoSeguimiento.GESTIONADO);
                lead.setIdAsesorAsignado(null);
                lead.setNombreAsesorAsignado(null);
            } else {
                moverAEnGestionSiAplica(lead);
            }
        }

        Lead savedLead = leadRepository.save(lead);
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
        notificarCambioLead("TIPIFICACION", savedLead, etapaActual, idAsesorAnterior);
    }

    private EstadoPostventa resolverEstadoPostventaDestino(
            Etapa etapaActual,
            Etapa etapaDestino,
            Subtipificacion subtipificacion
    ) {
        if (subtipificacion.getEstadoPostventaCambio() != null) {
            return subtipificacion.getEstadoPostventaCambio();
        }
        if (etapaDestino == Etapa.COBRANZA) {
            return EstadoPostventa.EN_COBRANZA;
        }
        if (etapaActual == Etapa.COBRANZA && etapaDestino == Etapa.POSTVENTA) {
            return EstadoPostventa.EN_SEGUIMIENTO;
        }
        return null;
    }

    private boolean esEstadoPostventaFinal(EstadoPostventa estadoPostventa) {
        return estadoPostventa == EstadoPostventa.EFECTIVO
                || estadoPostventa == EstadoPostventa.NO_EFECTIVO
                || estadoPostventa == EstadoPostventa.BAJA_CONFIRMADA;
    }

    private void aplicarDatosPostventaSiCorresponde(Lead lead, Etapa etapaDestino, LocalDate fechaInstalacion) {
        if (etapaDestino != Etapa.POSTVENTA) {
            return;
        }

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
        lead.setEstadoPostventa(EstadoPostventa.EN_SEGUIMIENTO);
    }

    private Integer resolverDiaCorteFacturacion(Proveedor proveedor, LocalDate fechaInstalacion) {
        if (fechaInstalacion == null) {
            throw new BadRequestException("La fechaInstalacion es obligatoria para pasar a POSTVENTA");
        }
        if (proveedor.getCortesFacturacion() == null || proveedor.getCortesFacturacion().isEmpty()) {
            throw new BadRequestException("El proveedor no tiene cortes de facturacion configurados");
        }

        if ("WIN".equalsIgnoreCase(proveedor.getNombre())) {
            Integer diaCorte = fechaInstalacion.getDayOfMonth() <= 22 ? 1 : 2;
            validarCorteFacturacionConfigurado(proveedor, diaCorte);
            return diaCorte;
        }

        if (proveedor.getCortesFacturacion().size() == 1) {
            return proveedor.getCortesFacturacion().iterator().next();
        }

        throw new BadRequestException("No existe regla de corte de facturacion para el proveedor");
    }

    private void validarCorteFacturacionConfigurado(Proveedor proveedor, Integer diaCorte) {
        if (!proveedor.getCortesFacturacion().contains(diaCorte)) {
            throw new BadRequestException(
                    "El corte de facturacion calculado no esta configurado para el proveedor",
                    null,
                    Map.of(
                            "proveedor", proveedor.getNombre(),
                            "diaCorteFacturacion", diaCorte
                    )
            );
        }
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
        Campana campana = obtenerCampanaActiva(request.getIdCampana());

        leadRepository.findFirstByPrefijoAndLeadOrderByLastEntryAtDescIdDesc(prefijo, numeroLead)
                .ifPresentOrElse(
                        lead -> registrarIngresoLeadExistente(lead, request, campana, registroAt),
                        () -> registrarLeadNuevo(prefijo, numeroLead, request, campana, registroAt)
                );
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
    public void iniciarGestionPreventa(Long idLead) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        if (lead.getEstado() == EstadoSeguimiento.EN_GESTION) {
            return;
        }
        if (lead.getEstado() != EstadoSeguimiento.ASIGNADO) {
            throw new BadRequestException("Solo se puede gestionar un Lead ASIGNADO");
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
        notificarCambioLead("ASIGNACION", savedLead, null, idAsesorAnterior);
    }

    public LeadAsignacionMasivaResponse asignarLeads(LeadAsignacionMasivaRequest request) {
        List<Long> idsLead = request.getIdsLead().stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();

        if (idsLead.isEmpty()) {
            throw new BadRequestException("Debe enviar al menos un idLead valido");
        }

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
        notificarCambioLead("ASIGNACION", savedLead, null, idAsesorAnterior);
        propagarAsesorAHermanas(savedLead, idAsesorAsignado, savedLead.getNombreAsesorAsignado());
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

    @Transactional
    public void registrarContactoCobranza(Long idLead) {
        Lead lead = obtenerLeadAsignadoEnEtapa(idLead, Etapa.COBRANZA);
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
            String prefijo,
            String numeroLead,
            LeadIntakeRequest request,
            Campana campana,
            Instant registroAt
    ) {
        Lead lead = leadMapper.toNuevoLead(prefijo, numeroLead, request.getBase(), campana, OperationalDateTime.now());
        lead.setContacto(resolverContacto(prefijo, numeroLead));
        lead.setIdEquipo(derivarIdEquipo(campana));

        Lead savedLead = leadRepository.save(lead);
        registrarEventoRegistro(savedLead.getId(), campana.getId(), savedLead.getEtapa(), registroAt);
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
        Lead lead = leadMapper.toNuevoLead(prefijo, numeroLead, base, campana, OperationalDateTime.now());
        aplicarSnapshotsMasivo(lead, documentoSnapshot, direccionSnapshot, advertencias);
        lead.setContacto(resolverContacto(prefijo, numeroLead));
        lead.setIdEquipo(derivarIdEquipo(campana));

        Lead savedLead = leadRepository.save(lead);
        registrarEventoRegistro(savedLead.getId(), campana.getId(), savedLead.getEtapa());
        if (notificarRealtime) {
            notificarCambioLead("REGISTRO", savedLead, null, null);
        }
        return savedLead;
    }

    private void registrarIngresoLeadExistente(
            Lead lead,
            LeadIntakeRequest request,
            Campana campana,
            Instant registroAt
    ) {
        Etapa etapaAnterior = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        lead.setPrefijo(normalizarPrefijo(request.getPrefijo()));
        lead.setLead(normalizarLead(request.getLead()));
        lead.setCampana(campana);
        lead.setBase(request.getBase());
        lead.setLastEntryAt(OperationalDateTime.now());
        if (lead.getContacto() == null) {
            lead.setContacto(resolverContacto(lead.getPrefijo(), lead.getLead()));
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
        registrarEventoRegistro(savedLead.getId(), campana.getId(), savedLead.getEtapa(), registroAt);
        notificarCambioLead("REGISTRO", savedLead, etapaAnterior, idAsesorAnterior);
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
        registrarEventoRegistro(savedLead.getId(), campana.getId(), savedLead.getEtapa());
        if (notificarRealtime) {
            notificarCambioLead("REGISTRO", savedLead, etapaAnterior, idAsesorAnterior);
        }
        return savedLead;
    }

    private Campana obtenerCampanaBaseMasivo(Long idCampanaBaseMasivo, List<String> advertencias) {
        if (idCampanaBaseMasivo == null) {
            throw new BadRequestException("No esta configurada la campana BASE para carga masiva");
        }
        Campana campana = obtenerCampanaActiva(idCampanaBaseMasivo);
        advertencias.add("Campana BASE aplicada");
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

    private void validarHoraProgramada(String codigoTipificacion, java.time.LocalTime horaProgramada) {
        if (TIPIFICACION_AGENDADO.equals(codigoTipificacion)) {
            if (horaProgramada == null) {
                throw new BadRequestException("La horaProgramada es obligatoria para la tipificacion AGENDADO");
            }
            return;
        }

        if (horaProgramada != null) {
            throw new BadRequestException("La horaProgramada solo se permite para la tipificacion AGENDADO");
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

        if (fechaProgramacion.isBefore(OperationalDateTime.today())) {
            throw new BadRequestException("La fechaProgramacion no puede ser anterior a hoy");
        }
    }

    private Campana obtenerCampanaActiva(Long idCampana) {
        return campanaRepository.findByIdAndActivoTrue(idCampana)
                .orElseThrow(() -> new NotFoundException(Campana.class, idCampana));
    }

    private String normalizarPrefijo(String prefijo) {
        return prefijo == null ? null : prefijo.trim();
    }

    private String normalizarLead(String lead) {
        return lead == null ? null : lead.trim();
    }

    private void validarFiltroAgrupacionGtr(
            TipoGrupoGtr tipoGrupo,
            Long idGrupo,
            String codigoTipificacion,
            boolean sinValor
    ) {
        if (tipoGrupo == null) {
            if (idGrupo != null || codigoTipificacion != null || sinValor) {
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

        if ((tipoGrupo == TipoGrupoGtr.PRIMERA_TIPIFICACION
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
        boolean puedeGestionarseEnGtr = etapaActual == Etapa.PREVENTA;

        return new LeadGtrLookupResponse(
                true,
                lead.getId(),
                lead.getPrefijo(),
                lead.getLead(),
                etapaActual,
                lead.getEstado(),
                puedeGestionarseEnGtr,
                construirMensajeContextoGtr(etapaActual)
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
            case COBRANZA -> "Ese lead ya avanzo a Cobranza.";
            case VENTA -> null;
        };
    }

    private String construirMensajeContextoGtr(Etapa etapaActual) {
        if (etapaActual == null || etapaActual == Etapa.PREVENTA) {
            return null;
        }

        return switch (etapaActual) {
            case VENTA -> "Este lead ya paso a Validaciones y no puede gestionarse desde GTR por el momento.";
            case POSTVENTA -> "Este lead ya paso a Postventa y no puede gestionarse desde GTR por el momento.";
            case COBRANZA -> "Este lead ya paso a Cobranza y no puede gestionarse desde GTR por el momento.";
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
                TIPIFICACION_AGENDADO,
                List.of(EstadoSeguimiento.ASIGNADO, EstadoSeguimiento.EN_GESTION),
                paginationService.toPageable(pageRequest, LEAD_ASESOR_SORT_FIELDS)
        );
    }

    private PageResponse<LeadAsesorVentasResponse> mapearBandejaAsesorVentas(Page<Lead> leads) {
        Map<Long, Instant> fechasAsignacion = obtenerFechasAsignacion(leads.getContent());
        Map<Long, Long> totalesAsignacion = obtenerTotalesAsignacion(leads.getContent(), Lead::getId);
        Page<LeadAsesorVentasResponse> responsePage = leads.map(lead -> toAsesorResponse(
                lead,
                fechasAsignacion.get(lead.getId()),
                totalesAsignacion.getOrDefault(lead.getId(), 0L)
        ));
        return PageResponse.from(responsePage);
    }

    private PageResponse<LeadPostventaResponse> mapearBandejaPostventa(Page<Lead> leads) {
        List<Lead> content = leads.getContent();
        Map<Long, String> asesoresPreventa = obtenerUltimosActoresPorEtapaYAccion(
                content,
                Etapa.PREVENTA,
                Accion.TIPIFICACION
        );
        Map<Long, LocalDate> fechasInstalacion = obtenerFechasInstalacionVenta(content);
        Map<String, String> departamentosPorUbigeo = obtenerDepartamentosPorUbigeo(content);
        Map<Long, Long> totalesAsignacion = obtenerTotalesAsignacion(content, Lead::getId);

        Page<LeadPostventaResponse> responsePage = leads.map(lead -> toPostventaResponse(
                lead,
                asesoresPreventa.get(lead.getId()),
                fechasInstalacion.get(lead.getId()),
                obtenerDepartamentoLead(lead, departamentosPorUbigeo),
                totalesAsignacion.getOrDefault(lead.getId(), 0L)
        ));
        return PageResponse.from(responsePage);
    }

    private LeadPostventaResponse toPostventaResponse(
            Lead lead,
            String asesorPreventa,
            LocalDate fechaInstalacion,
            String departamento,
            long totalAsignaciones
    ) {
        DatosPreventa datosPreventa = lead.getDatosPreventa();
        return new LeadPostventaResponse(
                lead.getId(),
                lead.getNombreProveedorSnapshot(),
                asesorPreventa,
                lead.getLead(),
                datosPreventa == null ? null : datosPreventa.getTipoDocumento(),
                datosPreventa == null ? lead.getNumeroDocumentoTitularServicioSnapshot() : datosPreventa.getNumeroDocumentoTitularServicio(),
                datosPreventa == null ? null : datosPreventa.getNombreTitularServicio(),
                departamento,
                fechaInstalacion,
                lead.getDiaCorteFacturacion(),
                lead.getEstadoPostventa(),
                totalAsignaciones
        );
    }

    private Map<Long, String> obtenerUltimosActoresPorEtapaYAccion(List<Lead> leads, Etapa etapa, Accion accion) {
        if (leads.isEmpty()) {
            return Map.of();
        }
        List<Long> leadIds = leads.stream().map(Lead::getId).toList();
        Map<Long, String> actores = new HashMap<>();
        for (Object[] row : eventoRepository.listarUltimoActorPorLeadIdsEtapaYAccion(leadIds, etapa, accion)) {
            actores.putIfAbsent((Long) row[0], (String) row[1]);
        }
        return actores;
    }

    private Map<Long, LocalDate> obtenerFechasInstalacionVenta(List<Lead> leads) {
        if (leads.isEmpty()) {
            return Map.of();
        }
        List<Long> leadIds = leads.stream().map(Lead::getId).toList();
        Map<Long, LocalDate> fechas = new HashMap<>();
        for (Object[] row : eventoRepository.listarUltimaFechaInstalacionPorLeadIds(leadIds, Etapa.VENTA)) {
            fechas.putIfAbsent((Long) row[0], (LocalDate) row[1]);
        }
        return fechas;
    }

    private Map<String, String> obtenerDepartamentosPorUbigeo(List<Lead> leads) {
        Set<String> ubigeos = new HashSet<>();
        for (Lead lead : leads) {
            Direccion direccion = lead.getDireccion();
            if (direccion != null && direccion.getUbigeoDomicilio() != null && !direccion.getUbigeoDomicilio().isBlank()) {
                ubigeos.add(direccion.getUbigeoDomicilio());
            }
        }
        if (ubigeos.isEmpty()) {
            return Map.of();
        }

        Map<String, String> departamentos = new HashMap<>();
        distritoRepository.findByCodigoInWithDepartamento(ubigeos)
                .forEach(distrito -> departamentos.put(
                        distrito.getCodigo(),
                        distrito.getDepartamento() == null ? null : distrito.getDepartamento().getNombre()
                ));
        return departamentos;
    }

    private String obtenerDepartamentoLead(Lead lead, Map<String, String> departamentosPorUbigeo) {
        Direccion direccion = lead.getDireccion();
        if (direccion == null || direccion.getUbigeoDomicilio() == null) {
            return null;
        }
        return departamentosPorUbigeo.get(direccion.getUbigeoDomicilio());
    }

    private LeadAsesorVentasResponse toAsesorResponse(Lead lead, Instant fechaAsignacion, long totalAsignaciones) {
        DatosPreventa datosPreventa = lead.getDatosPreventa();

        return new LeadAsesorVentasResponse(
                lead.getId(),
                fechaAsignacion,
                lead.getPrefijo(),
                lead.getLead(),
                datosPreventa == null ? null : datosPreventa.getNombreTitularServicio(),
                datosPreventa == null ? null : datosPreventa.getCorreo(),
                lead.getEstado(),
                totalAsignaciones
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
                plan,
                promocionInterna,
                adicionales,
                totalAsignaciones
        );
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

    private void registrarPrimeraTipificacionSiFalta(
            Lead lead,
            String codigoTipificacionEntrante,
            String codigoSubtipificacionEntrante
    ) {
        String primeraTipificacion = leadMapper.trimToNull(lead.getPrimeraCodigoTipificacion());
        String primeraSubtipificacion = leadMapper.trimToNull(lead.getPrimeraCodigoSubtipificacion());
        if (primeraTipificacion != null && primeraSubtipificacion != null) {
            return;
        }

        String codigoTipificacionActual = leadMapper.trimToNull(lead.getCodigoTipificacion());
        String codigoSubtipificacionActual = leadMapper.trimToNull(lead.getCodigoSubtipificacion());

        if (primeraTipificacion == null) {
            lead.setPrimeraCodigoTipificacion(
                    codigoTipificacionActual == null ? codigoTipificacionEntrante : codigoTipificacionActual
            );
        }
        if (primeraSubtipificacion == null) {
            lead.setPrimeraCodigoSubtipificacion(
                    codigoSubtipificacionActual == null ? codigoSubtipificacionEntrante : codigoSubtipificacionActual
            );
        }
    }

    private Long obtenerIdPlanOfrecido(Lead lead, String codigoTipificacion, String codigoSubtipificacion) {
        if (!esTipificacionPreventa(codigoTipificacion, codigoSubtipificacion)) {
            return null;
        }
        return lead.getPlan() == null ? null : lead.getPlan().getId();
    }

    private boolean esTipificacionPreventa(String codigoTipificacion, String codigoSubtipificacion) {
        return TIPIFICACION_SCORE_PREVENTA.equals(codigoTipificacion)
                && SUBTIPIFICACION_PREVENTA.equals(codigoSubtipificacion);
    }

    // ── Multi-titular: oportunidades en paralelo del mismo contacto (Fase 1.5) ──

    /**
     * Crea una oportunidad hermana para el mismo contacto/equipo: la origina el asesor durante la
     * gestión (la actual debe tener documento del titular). Nace asignada al mismo asesor y en
     * gestión, con datos en blanco (otro titular/documento). Devuelve el id de la nueva.
     */
    @Transactional
    public Long crearOportunidadAdicional(Long idLead) {
        Lead original = obtenerLeadPreventaDelAsesor(idLead);
        // El documento puede haberse guardado como snapshot (guardado parcial sin tipificar) o en
        // DatosPreventa. Aceptamos cualquiera de los dos para no obligar a tipificar antes de crear.
        String documento = original.getNumeroDocumentoTitularServicioSnapshot();
        if ((documento == null || documento.isBlank()) && original.getDatosPreventa() != null) {
            documento = original.getDatosPreventa().getNumeroDocumentoTitularServicio();
        }
        if (documento == null || documento.isBlank()) {
            throw new BadRequestException(
                    "Registra el documento del titular de la oportunidad actual antes de crear otra");
        }

        Lead nueva = leadMapper.toNuevoLead(
                original.getPrefijo(), original.getLead(), original.getBase(),
                original.getCampana(), OperationalDateTime.now());
        nueva.setContacto(original.getContacto());
        nueva.setIdEquipo(original.getIdEquipo());
        nueva.setIdAsesorAsignado(currentUser.empleadoID());
        nueva.setNombreAsesorAsignado(currentUser.nombreCompleto().trim());
        nueva.setEstado(EstadoSeguimiento.EN_GESTION);

        Lead saved = leadRepository.save(nueva);
        Long idCampana = saved.getCampana() == null ? null : saved.getCampana().getId();
        registrarEventoRegistro(saved.getId(), idCampana, saved.getEtapa());
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

    private Lead obtenerLeadAsignadoEnEtapa(Long idLead, Etapa etapa) {
        return leadRepository.findByIdAndIdAsesorAsignadoAndEtapa(idLead, currentUser.empleadoID(), etapa)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
    }

    private void validarOfertaComercialEditableEnCicloActualVenta(Long idLead) {
        List<Evento> eventos = eventoRepository.findAllByIdLeadOrderByCreatedAtDesc(idLead);
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

        validarTextoObligatorio(direccion.getUbigeoDomicilio(), "Falta ubigeoDomicilio");
        if (direccion.getTipoDomicilio() == null) {
            throw new BadRequestException("Falta tipoDomicilio");
        }
        // tipoVia y via son opcionales: una direccion puede no tener via (opcion "Sin Via" en la UI).
        validarTextoObligatorio(direccion.getDireccion(), "Falta direccion");
        validarTextoObligatorio(direccion.getReferencia(), "Falta referencia");
    }

    private void validarTextoObligatorio(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
    }

    private void notificarCambioLead(String tipo, Lead lead, Etapa etapaAnterior, Long idAsesorAnterior) {
        leadRealtimeNotifier.publishAfterCommit(LeadRealtimeEvent.builder()
                .tipo(tipo)
                .idLead(lead.getId())
                .etapa(lead.getEtapa())
                .etapaAnterior(etapaAnterior)
                .estado(lead.getEstado())
                .estadoPostventa(lead.getEstadoPostventa())
                .idAsesorAsignado(lead.getIdAsesorAsignado())
                .idAsesorAnterior(idAsesorAnterior)
                .codigoTipificacion(lead.getCodigoTipificacion())
                .codigoSubtipificacion(lead.getCodigoSubtipificacion())
                .occurredAt(OperationalDateTime.now())
                .build());
    }

    // ── Ranking GTR ──────────────────────────────────────────────────────────

    public List<GtrRankingAsesorResponse> listarRankingGtr(
            LocalDate desde, LocalDate hasta, boolean soloActivos) {

        LocalDate desdeResuelta = OperationalDateTime.resolveDate(desde);
        LocalDate hastaResuelta = hasta == null ? OperationalDateTime.today() : hasta;

        OperationalDateTime.InstantRange rangoPeriodo = new OperationalDateTime.InstantRange(
                OperationalDateTime.dayRange(desdeResuelta).inicio(),
                OperationalDateTime.dayRange(hastaResuelta).fin()
        );
        OperationalDateTime.InstantRange rangoMes =
                OperationalDateTime.monthRange(YearMonth.from(desdeResuelta));

        Map<Long, GtrRankingAccumulator> acumulados = new HashMap<>();

        eventoRepository.resumirNuevosGestionadosPorAsesorGtr(
                        Accion.TIPIFICACION, rangoPeriodo.inicio(), rangoPeriodo.fin(), soloActivos)
                .forEach(row -> {
                    GtrRankingAccumulator item = obtenerAcumuladorGtr(acumulados, row.getIdAsesor(), row.getNombreAsesor());
                    item.nuevosGestionadosPeriodo = row.getCantidad();
                });

        eventoRepository.resumirTipificacionesPorAsesorGtr(
                        Accion.TIPIFICACION, rangoPeriodo.inicio(), rangoPeriodo.fin(), soloActivos)
                .forEach(row -> {
                    GtrRankingAccumulator item = obtenerAcumuladorGtr(acumulados, row.getIdAsesor(), row.getNombreAsesor());
                    item.gestionadosPeriodo = row.getCantidad();
                });

        // Preventas concretadas: fuente de verdad = Lead (idAsesorPreventa/fechaPreventa), no eventos.
        leadRepository.resumirPreventasPorAsesorLeadGtr(
                        rangoPeriodo.inicio(), rangoPeriodo.fin(), soloActivos)
                .forEach(row -> {
                    GtrRankingAccumulator item = obtenerAcumuladorGtr(acumulados, row.getIdAsesor(), null);
                    item.preventasPeriodo = row.getCantidad();
                });

        leadRepository.resumirPreventasMensualesPorProveedorLeadGtr(
                        rangoMes.inicio(), rangoMes.fin(), soloActivos)
                .forEach(row -> {
                    GtrRankingAccumulator item = obtenerAcumuladorGtr(acumulados, row.getIdAsesor(), null);
                    item.preventasMes += row.getCantidad();
                    item.preventasMesPorProveedor.add(new SupervisorVentasProveedorResumenResponse(
                            row.getIdProveedor(), row.getNombreProveedor(), row.getCantidad()));
                });

        resolverNombresAsesoresFaltantes(acumulados);

        return acumulados.values().stream()
                .sorted(Comparator.comparingLong(GtrRankingAccumulator::gestionadosPeriodo).reversed()
                        .thenComparing(GtrRankingAccumulator::nombreAsesorOrdenable))
                .map(GtrRankingAccumulator::toResponse)
                .toList();
    }

    public List<GtrTipificacionCampanaResponse> listarTipificacionesCampanaGtr(
            LocalDate desde, LocalDate hasta, boolean soloActivos) {

        LocalDate desdeResuelta = OperationalDateTime.resolveDate(desde);
        LocalDate hastaResuelta = hasta == null ? OperationalDateTime.today() : hasta;

        OperationalDateTime.InstantRange rangoPeriodo = new OperationalDateTime.InstantRange(
                OperationalDateTime.dayRange(desdeResuelta).inicio(),
                OperationalDateTime.dayRange(hastaResuelta).fin()
        );

        List<CampanaTipificacionCantidadProjection> rows =
                eventoRepository.resumirTipificacionesPorCampanaGtr(
                        Accion.TIPIFICACION, rangoPeriodo.inicio(), rangoPeriodo.fin(), soloActivos);

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
        private long gestionadosPeriodo;
        private long preventasPeriodo;
        private long preventasMes;
        private final List<SupervisorVentasProveedorResumenResponse> preventasMesPorProveedor = new ArrayList<>();

        private GtrRankingAccumulator(Long idAsesor) {
            this.idAsesor = idAsesor;
        }

        private long gestionadosPeriodo() { return gestionadosPeriodo; }
        private String nombreAsesorOrdenable() { return nombreAsesor == null ? "" : nombreAsesor; }

        private GtrRankingAsesorResponse toResponse() {
            List<SupervisorVentasProveedorResumenResponse> proveedores = preventasMesPorProveedor.stream()
                    .sorted(Comparator.comparing(SupervisorVentasProveedorResumenResponse::getNombreProveedor,
                            Comparator.nullsLast(String::compareToIgnoreCase)))
                    .toList();
            return new GtrRankingAsesorResponse(
                    idAsesor, nombreAsesor,
                    nuevosGestionadosPeriodo, gestionadosPeriodo,
                    preventasPeriodo, preventasMes, proveedores);
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
