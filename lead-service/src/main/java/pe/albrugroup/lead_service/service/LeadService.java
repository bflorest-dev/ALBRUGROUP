package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.*;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionMasivaRequest;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionRequest;
import pe.albrugroup.lead_service.entity.request.LeadDatosPreventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadDireccionRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaAdicionalRequest;
import pe.albrugroup.lead_service.entity.request.LeadOfertaComercialRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.LeadAsignacionMasivaResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsignacionResultadoResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsesorDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsesorVentasResponse;
import pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorVentasProveedorResumenResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorVentasResumenResponse;
import pe.albrugroup.lead_service.exception.BusinessException;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.AdicionalRepository;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.PlanRepository;
import pe.albrugroup.lead_service.repository.PromocionComercialRepository;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.service.mapper.LeadMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
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
    private final PaginationService paginationService;
    private final TransactionTemplate transactionTemplate;

    private static final String TIPIFICACION_AGENDADO = "AGENDADO";
    private static final String TIPIFICACION_SCORE_PREVENTA = "SCORE_PREVENTA";
    private static final String SUBTIPIFICACION_PREVENTA = "PREVENTA";
    private static final List<Accion> ACCIONES_GESTION_LEAD = List.of(Accion.CONTACTO, Accion.TIPIFICACION);
    private static final Set<String> LEAD_GTR_SORT_FIELDS = Set.of(
            "lastEntryAt", "createdAt", "lead", "nombreAsesorAsignado", "estado"
    );
    private static final Set<String> LEAD_ASESOR_SORT_FIELDS = Set.of(
            "lastEntryAt", "createdAt", "lead", "estado"
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
                Accion.ASIGNACION,
                inicioDia,
                finDia,
                paginationService.toPageable(pageRequest, LEAD_GTR_SORT_FIELDS)
        ).map(this::normalizarLeadGtr);
        return PageResponse.from(leads);
    }

    public PageResponse<LeadAgendadoGtrResponse> listarAgendadosGtr(PageRequest pageRequest) {
        Page<LeadAgendadoGtrResponse> leads = leadRepository.listarLeadsAgendadosGtr(
                Etapa.PREVENTA,
                TIPIFICACION_AGENDADO,
                Accion.TIPIFICACION,
                Accion.ASIGNACION,
                paginationService.toPageable(pageRequest, LEAD_AGENDADO_SORT_FIELDS)
        );
        return PageResponse.from(leads);
    }

    public PageResponse<LeadGtrResponse> listarBandejaVenta(PageRequest pageRequest) {
        Page<LeadGtrResponse> leads = leadRepository.listarLeadsDisponiblesPorEtapa(
                Etapa.VENTA,
                paginationService.toPageable(pageRequest, LEAD_GTR_SORT_FIELDS)
        );
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

    public LeadAsesorDetalleResponse obtenerDetalleAsesor(Long idLead) {
        Long idAsesor = currentUser.empleadoID();
        Lead lead = leadRepository.buscarDetalleAsesor(idLead, idAsesor)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));

        Instant fechaAsignacion = eventoRepository.findTopByIdLeadAndAccionOrderByCreatedAtDesc(idLead, Accion.ASIGNACION)
                .map(Evento::getCreatedAt)
                .orElse(null);

        return toAsesorDetalleResponse(lead, fechaAsignacion);
    }

    @Transactional
    public void actualizarDatosPreventa(Long idLead, LeadDatosPreventaRequest request) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        DatosPreventa datosPreventa = lead.getDatosPreventa() == null ? new DatosPreventa() : lead.getDatosPreventa();
        leadMapper.updateDatosPreventa(request, datosPreventa);

        lead.setDatosPreventa(datosPreventa);
        moverAEnGestionSiAplica(lead);
        leadRepository.save(lead);
    }

    @Transactional
    public void actualizarDireccion(Long idLead, LeadDireccionRequest request) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        Direccion direccion = lead.getDireccion() == null ? new Direccion() : lead.getDireccion();
        leadMapper.updateDireccion(request, direccion);

        lead.setDireccion(direccion);
        moverAEnGestionSiAplica(lead);
        leadRepository.save(lead);
    }

    @Transactional
    public void actualizarOfertaComercial(Long idLead, LeadOfertaComercialRequest request) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);

        Plan plan = request.getIdPlan() == null ? null : obtenerPlanVigente(request.getIdPlan());
        PromocionComercial promocionInterna = request.getIdPromocionInterna() == null ? null
                : obtenerPromocionInternaActiva(request.getIdPromocionInterna(), plan);

        lead.setPlan(plan);
        lead.setNombrePlanSnapshot(plan == null ? null : plan.getNombre());
        lead.setNombreProveedorSnapshot(plan == null || plan.getProveedor() == null ? null : plan.getProveedor().getNombre());
        lead.setPrecioPlanSnapshot(plan == null ? null : plan.getPrecio());

        lead.setPromocionInterna(promocionInterna);
        lead.setNombrePromocionInternaSnapshot(promocionInterna == null ? null : promocionInterna.getReglaComercial());

        reemplazarAdicionales(lead, request.getAdicionales());
        moverAEnGestionSiAplica(lead);
        leadRepository.save(lead);
    }

    @Transactional
    public void tipificarLead(Long idLead, LeadTipificacionRequest request) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        Etapa etapaActual = lead.getEtapa();

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

        validarAsesorNoGestionoLead(idLead, idAsesorAsignado);

        lead.setIdAsesorAsignado(idAsesorAsignado);
        lead.setNombreAsesorAsignado(nombreAsesorAsignado.trim());
        lead.setIdTipificacion(null);
        lead.setCodigoTipificacion(null);
        lead.setIdSubtipificacion(null);
        lead.setCodigoSubtipificacion(null);
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

    @Transactional
    public void registrarContacto(Long idLead) {
        Lead lead = obtenerLeadPreventaDelAsesor(idLead);
        validarEstadoParaContacto(lead);
        moverAEnGestionSiAplica(lead);

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoContacto(savedLead.getId(), idCampana, savedLead.getEtapa());
    }

    private void registrarLeadNuevo(String prefijo, String numeroLead, LeadIntakeRequest request, Campana campana) {
        Lead lead = leadMapper.toNuevoLead(prefijo, numeroLead, request.getBase(), campana, Instant.now());

        Lead savedLead = leadRepository.save(lead);
        registrarEventoRegistro(savedLead.getId(), campana.getId(), savedLead.getEtapa());
    }

    private void registrarIngresoLeadExistente(Lead lead, LeadIntakeRequest request, Campana campana) {
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
        Page<LeadAsesorVentasResponse> responsePage = leads.map(lead -> toAsesorResponse(lead, fechasAsignacion.get(lead.getId())));
        return PageResponse.from(responsePage);
    }

    private LeadAsesorVentasResponse toAsesorResponse(Lead lead, Instant fechaAsignacion) {
        DatosPreventa datosPreventa = lead.getDatosPreventa();

        return new LeadAsesorVentasResponse(
                lead.getId(),
                fechaAsignacion,
                lead.getPrefijo(),
                lead.getLead(),
                datosPreventa == null ? null : datosPreventa.getNombreTitularServicio(),
                datosPreventa == null ? null : datosPreventa.getCorreo(),
                lead.getEstado()
        );
    }

    private LeadAsesorDetalleResponse toAsesorDetalleResponse(Lead lead, Instant fechaAsignacion) {
        DatosPreventa datosPreventa = lead.getDatosPreventa();
        Direccion direccion = lead.getDireccion();

        return new LeadAsesorDetalleResponse(
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
                datosPreventa == null ? null : datosPreventa.getNumeroDocumentoTitularServicio(),
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
                direccion == null ? null : direccion.getDireccion(),
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
                direccion == null ? null : direccion.getInterior()
        );
    }

    private LeadGtrResponse normalizarLeadGtr(LeadGtrResponse response) {
        return response;
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
        return leadRepository.findByIdAndIdAsesorAsignadoAndEtapa(idLead, currentUser.empleadoID(), Etapa.PREVENTA)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
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

    private PromocionComercial obtenerPromocionInternaActiva(Long idPromocion, Plan plan) {
        PromocionComercial promocion = promocionComercialRepository.findByIdAndActivoTrue(idPromocion)
                .orElseThrow(() -> new NotFoundException(PromocionComercial.class, idPromocion));

        if (plan == null) {
            throw new BadRequestException("No se puede seleccionar una promocion interna sin plan");
        }
        boolean aplicaAlPlan = promocion.getPlanes().stream()
                .anyMatch(item -> item.getId().equals(plan.getId()));
        if (!aplicaAlPlan) {
            throw new BadRequestException(
                    "La promocion interna no aplica al plan seleccionado",
                    null,
                    Map.of(
                            "idPromocion", idPromocion,
                            "idPlan", plan.getId()
                    )
            );
        }
        if (promocion.getProveedor() != null && plan.getProveedor() != null
                && !promocion.getProveedor().getId().equals(plan.getProveedor().getId())) {
            throw new BadRequestException(
                    "La promocion interna no pertenece al proveedor del plan",
                    null,
                    Map.of(
                            "idPromocion", idPromocion,
                            "idPlan", plan.getId(),
                            "idProveedorPlan", plan.getProveedor().getId(),
                            "idProveedorPromocion", promocion.getProveedor().getId()
                    )
            );
        }
        return promocion;
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
