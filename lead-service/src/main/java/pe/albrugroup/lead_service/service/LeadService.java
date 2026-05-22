package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.*;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.CriterioZona;
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionMasivaRequest;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionRequest;
import pe.albrugroup.lead_service.entity.request.LeadDatosPreventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadDireccionRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaAdicionalRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaComercialRequest;
import pe.albrugroup.lead_service.entity.request.LeadSnapshotsRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionPostventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionVentaRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.LeadAsignacionMasivaResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsignacionResultadoResponse;
import pe.albrugroup.lead_service.entity.response.LeadAdicionalDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadPlanDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadPromocionDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsesorVentasResponse;
import pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrMetricasResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.InternetResponse;
import pe.albrugroup.lead_service.entity.response.LeadPostventaResponse;
import pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.PlanAdicionalResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorVentasProveedorResumenResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorVentasResumenResponse;
import pe.albrugroup.lead_service.entity.response.TelefonoResponse;
import pe.albrugroup.lead_service.entity.response.TelevisionResponse;
import pe.albrugroup.lead_service.exception.BusinessException;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.AdicionalRepository;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.DistritoRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.PlanRepository;
import pe.albrugroup.lead_service.repository.PromocionComercialRepository;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.repository.ZonaReglaRepository;
import pe.albrugroup.lead_service.service.mapper.LeadMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final CampanaRepository campanaRepository;
    private final EventoRepository eventoRepository;
    private final EventoService eventoService;
    private final CurrentUser currentUser;
    private final PlanRepository planRepository;
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
    private static final String TIPIFICACION_SCORE_PREVENTA = "SCORE_PREVENTA";
    private static final String TIPIFICACION_PREVENTA_COMPLETA = "PREVENTA_COMPLETA";
    private static final String SUBTIPIFICACION_PREVENTA = "PREVENTA";
    private static final String SUBTIPIFICACION_VENTA_CERRADA = "VENTA_CERRADA";
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
    private static final Set<String> LEAD_AGENDADO_SORT_FIELDS = Set.of(
            "horaProgramada", "createdAt", "lead", "nombreAsesorAsignado", "estado"
    );

    public PageResponse<LeadGtrResponse> listarBandejaGtr(LocalDate fecha, PageRequest pageRequest) {
        LocalDate fechaTrabajo = fecha == null ? LocalDate.now(ZoneId.systemDefault()) : fecha;
        Instant inicioDia = fechaTrabajo.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant finDia = fechaTrabajo.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        Page<LeadGtrResponse> leads = leadRepository.listarBandejaGtr(
                Etapa.PREVENTA,
                inicioDia,
                finDia,
                paginationService.toPageable(pageRequest, LEAD_GTR_SORT_FIELDS)
        );
        aplicarTotalesAsignacion(leads.getContent(), LeadGtrResponse::getId, this::setTotalesAsignacion);
        return PageResponse.from(leads);
    }

    public LeadGtrMetricasResponse obtenerMetricasGtr(LocalDate fecha) {
        LocalDate fechaTrabajo = fecha == null ? LocalDate.now(ZoneId.systemDefault()) : fecha;
        Instant inicioDia = fechaTrabajo.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant finDia = fechaTrabajo.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        long nuevos = leadRepository.countByEtapaAndEstadoAndLastEntryAtGreaterThanEqualAndLastEntryAtLessThan(
                Etapa.PREVENTA,
                EstadoSeguimiento.NUEVO,
                inicioDia,
                finDia
        );
        long sinGestionar = leadRepository.countByEtapaAndEstadoAndLastEntryAtGreaterThanEqualAndLastEntryAtLessThan(
                Etapa.PREVENTA,
                EstadoSeguimiento.ASIGNADO,
                inicioDia,
                finDia
        );
        long gestionados = eventoRepository.contarGestionadosGtr(
                Etapa.PREVENTA,
                ACCIONES_GESTION_LEAD,
                TIPIFICACION_PREVENTA_COMPLETA,
                inicioDia,
                finDia
        );
        long preventas = eventoRepository.contarPreventasGtr(
                Accion.TIPIFICACION,
                TIPIFICACION_PREVENTA_COMPLETA,
                SUBTIPIFICACION_VENTA_CERRADA,
                inicioDia,
                finDia
        );

        return new LeadGtrMetricasResponse(nuevos, sinGestionar, gestionados, preventas);
    }

    public PageResponse<LeadAgendadoGtrResponse> listarAgendadosGtr(PageRequest pageRequest) {
        Page<LeadAgendadoGtrResponse> leads = leadRepository.listarLeadsAgendadosGtr(
                Etapa.PREVENTA,
                TIPIFICACION_AGENDADO,
                Accion.TIPIFICACION,
                paginationService.toPageable(pageRequest, LEAD_AGENDADO_SORT_FIELDS)
        );
        aplicarTotalesAsignacion(leads.getContent(), LeadAgendadoGtrResponse::getId, this::setTotalesAsignacion);
        return PageResponse.from(leads);
    }

    public PageResponse<LeadResponse> listarBandejaVenta(PageRequest pageRequest) {
        Page<LeadResponse> leads = leadRepository.listarLeadsDisponiblesPorEtapa(
                Etapa.VENTA,
                paginationService.toPageable(pageRequest, LEAD_GTR_SORT_FIELDS)
        );
        aplicarTotalesAsignacion(leads.getContent(), LeadResponse::getId, LeadResponse::setTotalAsignaciones);
        return PageResponse.from(leads);
    }

    public PageResponse<LeadResponse> listarLeadsVentaAsignados(PageRequest pageRequest) {
        Page<LeadResponse> leads = leadRepository.listarLeadsAsignadosPorEtapaYAsesor(
                Etapa.VENTA,
                currentUser.empleadoID(),
                paginationService.toPageable(pageRequest, LEAD_ASESOR_SORT_FIELDS)
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
        ZoneId zoneId = ZoneId.systemDefault();
        LocalDate hoy = LocalDate.now(zoneId);
        Instant inicioHoy = hoy.atStartOfDay(zoneId).toInstant();
        Instant finHoy = hoy.plusDays(1).atStartOfDay(zoneId).toInstant();
        LocalDate inicioMesLocal = hoy.withDayOfMonth(1);
        Instant inicioMes = inicioMesLocal.atStartOfDay(zoneId).toInstant();
        Instant finMes = inicioMesLocal.plusMonths(1).atStartOfDay(zoneId).toInstant();

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
                        inicioHoy,
                        finHoy,
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
                        inicioHoy,
                        finHoy,
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
                        inicioMes,
                        finMes,
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
            }
            lead.setEtapa(etapaDestino);
            lead.setEstado(EstadoSeguimiento.GESTIONADO);
            lead.setIdAsesorAsignado(null);
            lead.setNombreAsesorAsignado(null);
        }
        lead.setIdTipificacion(tipificacion.getId());
        lead.setCodigoTipificacion(tipificacion.getCodigo());
        lead.setIdSubtipificacion(subtipificacion.getId());
        lead.setCodigoSubtipificacion(subtipificacion.getCodigo());
        if (etapaDestino == null || etapaDestino == etapaActual) {
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
        registrarPrimeraTipificacionSiFalta(lead, tipificacion.getCodigo(), subtipificacion.getCodigo());

        if (etapaDestino != null && etapaDestino != etapaActual) {
            aplicarDatosPostventaSiCorresponde(lead, etapaDestino, request.getFechaInstalacion());
            lead.setEtapa(etapaDestino);
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
                request.getFechaInstalacion()
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

        if (etapaDestino != null && etapaDestino != etapaActual) {
            lead.setEtapa(etapaDestino);
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
        String prefijo = normalizarPrefijo(request.getPrefijo());
        String numeroLead = normalizarLead(request.getLead());
        Campana campana = obtenerCampanaActiva(request.getIdCampana());

        leadRepository.findByPrefijoAndLead(prefijo, numeroLead)
                .ifPresentOrElse(
                        lead -> registrarIngresoLeadExistente(lead, request, campana),
                        () -> registrarLeadNuevo(prefijo, numeroLead, request, campana)
                );
    }

    @Transactional
    public void asignarLead(Long idLead, LeadAsignacionRequest request) {
        asignarLeadInterno(idLead, request.getIdAsesorAsignado(), request.getNombreAsesorAsignado());
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
                ejecutarAsignacionIndependiente(idLead, request.getIdAsesorAsignado(), request.getNombreAsesorAsignado());
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

    private void ejecutarAsignacionIndependiente(Long idLead, Long idAsesorAsignado, String nombreAsesorAsignado) {
        TransactionTemplate transaction = new TransactionTemplate(transactionTemplate.getTransactionManager());
        transaction.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
        transaction.executeWithoutResult(status -> asignarLeadInterno(idLead, idAsesorAsignado, nombreAsesorAsignado));
    }

    private LeadAsignacionResultadoResponse crearResultadoFallido(Long idLead, String mensaje) {
        return LeadAsignacionResultadoResponse.builder()
                .idLead(idLead)
                .asignado(false)
                .mensaje(mensaje)
                .build();
    }

    private void asignarLeadInterno(Long idLead, Long idAsesorAsignado, String nombreAsesorAsignado) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        Long idAsesorAnterior = lead.getIdAsesorAsignado();

        validarAsesorNoGestionoLead(idLead, idAsesorAsignado);

        lead.setIdAsesorAsignado(idAsesorAsignado);
        lead.setNombreAsesorAsignado(nombreAsesorAsignado.trim());
        lead.setIdTipificacion(null);
        lead.setCodigoTipificacion(null);
        lead.setIdSubtipificacion(null);
        lead.setCodigoSubtipificacion(null);
        lead.setEstado(EstadoSeguimiento.ASIGNADO);
        lead.setLastEntryAt(Instant.now());

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

    private void validarAsesorNoGestionoLead(Long idLead, Long idAsesorAsignado) {
        boolean yaGestionado = eventoRepository.existsByIdLeadAndIdActorAndAccionIn(
                idLead,
                idAsesorAsignado,
                ACCIONES_GESTION_LEAD
        );
        if (yaGestionado) {
            throw new ConflictException("Asesor de Ventas ya ha gestionado el Lead anteriormente");
        }
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

    private void registrarLeadNuevo(String prefijo, String numeroLead, LeadIntakeRequest request, Campana campana) {
        Lead lead = leadMapper.toNuevoLead(prefijo, numeroLead, request.getBase(), campana, Instant.now());

        Lead savedLead = leadRepository.save(lead);
        registrarEventoRegistro(savedLead.getId(), campana.getId(), savedLead.getEtapa());
        notificarCambioLead("REGISTRO", savedLead, null, null);
    }

    private void registrarIngresoLeadExistente(Lead lead, LeadIntakeRequest request, Campana campana) {
        Etapa etapaAnterior = lead.getEtapa();
        Long idAsesorAnterior = lead.getIdAsesorAsignado();
        lead.setPrefijo(normalizarPrefijo(request.getPrefijo()));
        lead.setLead(normalizarLead(request.getLead()));
        lead.setCampana(campana);
        lead.setBase(request.getBase());
        lead.setLastEntryAt(Instant.now());

        if (lead.getEtapa() == Etapa.PREVENTA) {
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
        notificarCambioLead("REGISTRO", savedLead, etapaAnterior, idAsesorAnterior);
    }

    private void registrarEventoRegistro(Long idLead, Long idCampana, Etapa etapa) {
        eventoService.registrarEvento(
                RegistrarEventoRequest.builder()
                        .idLead(idLead)
                        .idCampana(idCampana)
                        .accion(Accion.REGISTRO)
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

        LocalDate fechaActual = LocalDate.now(ZoneId.systemDefault());
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
        validarTextoObligatorio(datosPreventa.getNumeroDocumentoTitularCelularRegistro(), "Falta numeroDocumentoTitularCelularRegistro");
        validarTextoObligatorio(datosPreventa.getNombreTitularCelularRegistro(), "Falta nombreTitularCelularRegistro");

        validarTextoObligatorio(direccion.getUbigeoDomicilio(), "Falta ubigeoDomicilio");
        if (direccion.getTipoDomicilio() == null) {
            throw new BadRequestException("Falta tipoDomicilio");
        }
        if (direccion.getTipoVia() == null) {
            throw new BadRequestException("Falta tipoVia");
        }
        validarTextoObligatorio(direccion.getVia(), "Falta via");
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
                .occurredAt(Instant.now())
                .build());
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
