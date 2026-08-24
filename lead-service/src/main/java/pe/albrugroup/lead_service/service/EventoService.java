package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.CampoTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.ModoConteo;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.AfluenciaPorHoraCeldaResponse;
import pe.albrugroup.lead_service.entity.response.GestionPorCampanaCeldaResponse;
import pe.albrugroup.lead_service.entity.response.LeadDiarioResponse;
import pe.albrugroup.lead_service.entity.response.LeadsDiariosMetricasEquipoResponse;
import pe.albrugroup.lead_service.entity.response.LeadsDiariosMetricasResponse;
import pe.albrugroup.lead_service.entity.response.RegistroDiarioLeadResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionItemResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionesResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.projection.LeadGtrAgrupacionProjection;
import pe.albrugroup.lead_service.repository.projection.LeadUltimaAsignacionProjection;
import pe.albrugroup.lead_service.service.mapper.EventoMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final LeadRepository leadRepository;
    private final LeadEtapaResumenRepository leadEtapaResumenRepository;
    private final CurrentUser currentUser;
    private final EventoMapper eventoMapper;
    private final PaginationService paginationService;
    private final LeadAsignacionCounterService leadAsignacionCounterService;

    private static final Set<String> EVENTO_SORT_FIELDS = Set.of("createdAt", "accion", "etapa", "tipificacion", "subtipificacion");
    private static final Set<String> LEADS_DIARIOS_SORT_FIELDS = Set.of(
            "createdAt",
            "totalAsignacionesDia",
            "totalAsignacionesHoyPreventa",
            "primeraTipificacion",
            "mayorTipificacion",
            "ultimaTipificacion"
    );

    @Transactional
    public EventoResponse registrarEvento(RegistrarEventoRequest request) {
        return registrarEvento(request, null);
    }

    @Transactional
    EventoResponse registrarEvento(RegistrarEventoRequest request, Instant createdAt) {
        if (!leadRepository.existsById(request.getIdLead())) {
            throw new NotFoundException(Lead.class, request.getIdLead());
        }

        Evento evento = Evento.builder()
                .idLead(request.getIdLead())
                .idCampana(request.getIdCampana())
                .idActor(currentUser.empleadoID())
                .nombreActor(currentUser.nombreCompleto())
                .rolActor(currentUser.rolPrincipal())
                .idAsesorAsignado(request.getIdAsesorAsignado())
                .nombreAsesorAsignado(request.getNombreAsesorAsignado())
                .idPlanOfrecido(request.getIdPlanOfrecido())
                .accion(request.getAccion())
                .etapa(request.getEtapa())
                .tipificacion(request.getTipificacion())
                .subtipificacion(request.getSubtipificacion())
                .fechaInstalacion(request.getFechaInstalacion())
                .fechaProgramacion(request.getFechaProgramacion())
                .fechaRechazo(request.getFechaRechazo())
                .comentario(request.getComentario())
                .horaProgramada(request.getHoraProgramada())
                .createdAt(createdAt)
                .build();

        return eventoMapper.toResponse(eventoRepository.save(evento));
    }

    public PageResponse<EventoResponse> listarPorLead(
            Long idLead,
            Accion accion,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            PageRequest pageRequest
    ) {
        if (!leadRepository.existsById(idLead)) {
            throw new NotFoundException(Lead.class, idLead);
        }

        Instant fechaDesdeInstant = inicioDia(fechaDesde);
        Instant fechaHastaInstant = finDiaInclusivo(fechaHasta);

        var pageable = paginationService.toPageable(pageRequest, EVENTO_SORT_FIELDS);
        EquipoScope equipoScope = equipoScopeActual();
        var eventos = eventoRepository.listarEventosLeadVisibles(
                idLead,
                accion != null,
                accion,
                fechaDesdeInstant != null,
                fechaDesdeInstant == null ? Instant.EPOCH : fechaDesdeInstant,
                fechaHastaInstant != null,
                fechaHastaInstant == null ? Instant.EPOCH : fechaHastaInstant,
                equipoScope.filtrar(),
                equipoScope.ids(),
                pageable
        );
        var response = eventos.map(eventoMapper::toResponse);
        return PageResponse.from(response);
    }

    public PageResponse<EventoResponse> listarPorLeadAsignado(Long idLead, Etapa etapa, PageRequest pageRequest) {
        if (leadRepository.findByIdAndIdAsesorAsignadoAndEtapa(idLead, currentUser.empleadoID(), etapa).isEmpty()) {
            throw new NotFoundException(Lead.class, idLead);
        }

        var eventos = eventoRepository.findByIdLeadOrderByCreatedAtDesc(
                idLead,
                paginationService.toPageable(pageRequest, EVENTO_SORT_FIELDS)
        ).map(eventoMapper::toResponse);
        return PageResponse.from(eventos);
    }

    public PageResponse<EventoResponse> listarPorEmpleado(
            Long idEmpleado,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            PageRequest pageRequest
    ) {
        Instant fechaDesdeInstant = inicioDia(fechaDesde);
        Instant fechaHastaInstant = finDiaInclusivo(fechaHasta);

        EquipoScope equipoScope = equipoScopeActual();
        var pageEventos = eventoRepository.listarEventosActorVisibles(
                idEmpleado,
                fechaDesdeInstant != null,
                fechaDesdeInstant == null ? Instant.EPOCH : fechaDesdeInstant,
                fechaHastaInstant != null,
                fechaHastaInstant == null ? Instant.EPOCH : fechaHastaInstant,
                equipoScope.filtrar(),
                equipoScope.ids(),
                paginationService.toPageable(pageRequest, EVENTO_SORT_FIELDS)
        );

        Map<Long, String> leadNumeros = obtenerLeadNumeros(pageEventos.getContent());
        var eventos = pageEventos.map(evento -> {
            EventoResponse response = eventoMapper.toResponse(evento);
            response.setLead(leadNumeros.get(evento.getIdLead()));
            return response;
        });
        return PageResponse.from(eventos);
    }

    private EquipoScope equipoScopeActual() {
        if (currentUser.tieneVisibilidadGlobalEquipos()) {
            return new EquipoScope(false, List.of(-1L));
        }
        List<Long> equipos = currentUser.equipos();
        if (equipos == null || equipos.isEmpty()) {
            return new EquipoScope(true, List.of(-1L));
        }
        return new EquipoScope(true, equipos);
    }

    /** Resuelve en un solo query el numero de lead (humano) para los eventos de la pagina. */
    private Map<Long, String> obtenerLeadNumeros(List<Evento> eventos) {
        Set<Long> idsLead = eventos.stream()
                .map(Evento::getIdLead)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (idsLead.isEmpty()) {
            return Map.of();
        }

        Map<Long, String> numeros = new HashMap<>();
        for (Object[] fila : leadRepository.findLeadNumerosByIds(idsLead)) {
            numeros.put((Long) fila[0], (String) fila[1]);
        }
        return numeros;
    }

    public PageResponse<LeadDiarioResponse> listarRegistrosDiarios(
            LocalDate fecha,
            TipoGrupoGtr tipoGrupo,
            Long idGrupo,
            String codigoTipificacion,
            String codigoSubtipificacion,
            String lead,
            boolean sinValor,
            PageRequest pageRequest
    ) {
        OperationalDateTime.InstantRange rango = OperationalDateTime.dayRange(fecha);
        validarFiltroAgrupacion(tipoGrupo, idGrupo, codigoTipificacion, sinValor);
        String leadNormalizado = normalizarBusquedaLead(lead);

        LeadOrderingRules.validarPageRequest(pageRequest, LEADS_DIARIOS_SORT_FIELDS);
        boolean sortDesc = LeadOrderingRules.isDesc(pageRequest);
        var pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPageNumber(),
                pageRequest.getPageSize()
        );

        var registros = eventoRepository.listarRegistrosDiarios(
                Accion.REGISTRO,
                Accion.ASIGNACION,
                Etapa.PREVENTA,
                rango.inicio(),
                rango.fin(),
                tipoGrupo == TipoGrupoGtr.ASESOR,
                tipoGrupo == TipoGrupoGtr.CAMPANA,
                tipoGrupo == TipoGrupoGtr.EQUIPO,
                tipoGrupo == TipoGrupoGtr.PRIMERA_TIPIFICACION,
                tipoGrupo == TipoGrupoGtr.MAYOR_TIPIFICACION,
                tipoGrupo == TipoGrupoGtr.ULTIMA_TIPIFICACION,
                idGrupo,
                normalizarCodigo(codigoTipificacion),
                normalizarCodigo(codigoSubtipificacion),
                leadNormalizado != null,
                leadNormalizado,
                sinValor,
                pageRequest.getSortBy(),
                sortDesc,
                pageable
        );
        Map<Long, Long> registrosDiaPorLead = contarRegistrosDia(registros.getContent(), rango);
        Map<Long, String> ultimaAsignacionPorLead = obtenerUltimasAsignaciones(registros.getContent());
        var respuesta = registros.map(registro -> {
            registro.setTotalRegistrosDia(registrosDiaPorLead.getOrDefault(registro.getIdLead(), 1L));
            registro.setUltimoNombreAsesorAsignacion(ultimaAsignacionPorLead.get(registro.getIdLead()));
            return registro;
        });
        return PageResponse.from(respuesta);
    }

    private Map<Long, String> obtenerUltimasAsignaciones(List<LeadDiarioResponse> registros) {
        List<Long> idsLead = registros.stream()
                .map(LeadDiarioResponse::getIdLead)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (idsLead.isEmpty()) {
            return Map.of();
        }
        return eventoRepository.listarUltimosAsesoresAsignados(idsLead, Accion.ASIGNACION)
                .stream()
                .collect(Collectors.toMap(
                        LeadUltimaAsignacionProjection::getIdLead,
                        LeadUltimaAsignacionProjection::getNombreAsesorAsignado,
                        (actual, ignorado) -> actual
                ));
    }

    /** Cuenta cuántos eventos REGISTRO tuvo cada lead en el día (>= 1); alimenta el despliegue de repeticiones. */
    private Map<Long, Long> contarRegistrosDia(
            List<LeadDiarioResponse> registros,
            OperationalDateTime.InstantRange rango
    ) {
        List<Long> idsLead = registros.stream()
                .map(LeadDiarioResponse::getIdLead)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (idsLead.isEmpty()) {
            return Map.of();
        }
        return eventoRepository.contarRegistrosDiariosPorLead(Accion.REGISTRO, rango.inicio(), rango.fin(), idsLead)
                .stream()
                .collect(Collectors.toMap(
                        fila -> (Long) fila[0],
                        fila -> (Long) fila[1]
                ));
    }

    /**
     * Eventos REGISTRO del lead en el día operativo (hora, GTR, campaña de cada uno), para el
     * despliegue de repeticiones. Va acotado al equipo del usuario vía el filtro Hibernate sobre Lead.
     */
    public List<RegistroDiarioLeadResponse> listarRegistrosDiariosDeLead(Long idLead, LocalDate fecha) {
        OperationalDateTime.InstantRange rango = OperationalDateTime.dayRange(fecha);
        return eventoRepository.listarRegistrosDiariosDeLead(idLead, Accion.REGISTRO, rango.inicio(), rango.fin());
    }

    public LeadGtrAgrupacionesResponse listarAgrupacionesRegistrosDiarios(LocalDate fecha, String lead) {
        OperationalDateTime.InstantRange rango = OperationalDateTime.dayRange(fecha);
        String leadNormalizado = normalizarBusquedaLead(lead);
        return new LeadGtrAgrupacionesResponse(
                mapearAgrupaciones(
                        eventoRepository.agruparRegistrosDiariosPorAsesor(
                                Accion.REGISTRO,
                                rango.inicio(),
                                rango.fin(),
                                leadNormalizado != null,
                                leadNormalizado
                        ),
                        "Sin asesor"
                ),
                mapearAgrupaciones(
                        eventoRepository.agruparRegistrosDiariosPorCampana(
                                Accion.REGISTRO,
                                rango.inicio(),
                                rango.fin(),
                                leadNormalizado != null,
                                leadNormalizado
                        ),
                        "Sin campaña"
                ),
                mapearAgrupacionesEquipo(
                        eventoRepository.agruparRegistrosDiariosPorEquipo(
                                Accion.REGISTRO,
                                rango.inicio(),
                                rango.fin(),
                                leadNormalizado != null,
                                leadNormalizado
                        ),
                        eventoRepository.contarRegistrosDiariosPorEquipo(
                                Accion.REGISTRO,
                                rango.inicio(),
                                rango.fin(),
                                leadNormalizado != null,
                                leadNormalizado
                        ),
                        "Sin equipo"
                ),
                List.of(),
                mapearAgrupacionesTipificacion(
                        eventoRepository.agruparRegistrosDiariosPorPrimeraTipificacion(
                                Accion.REGISTRO,
                                rango.inicio(),
                                rango.fin(),
                                leadNormalizado != null,
                                leadNormalizado
                        )
                ),
                mapearAgrupacionesTipificacion(
                        eventoRepository.agruparRegistrosDiariosPorMayorTipificacion(
                                Accion.REGISTRO,
                                rango.inicio(),
                                rango.fin(),
                                leadNormalizado != null,
                                leadNormalizado
                        )
                ),
                mapearAgrupacionesTipificacion(
                        eventoRepository.agruparRegistrosDiariosPorUltimaTipificacion(
                                Accion.REGISTRO,
                                rango.inicio(),
                                rango.fin(),
                                leadNormalizado != null,
                                leadNormalizado
                        )
                ),
                List.of(),
                eventoRepository.contarRegistrosDiarios(
                        Accion.REGISTRO,
                        rango.inicio(),
                        rango.fin(),
                        leadNormalizado != null,
                        leadNormalizado
                )
        );
    }

    // Una preventa es cualquier lead cuya ultima tipificacion de la etapa sea PREVENTA: la subtipi solo
    // matiza el desenlace (COMPLETA, INCOMPLETA, DESAPROBADA, los PENDIENTE) y no cambia que sea preventa.
    private static final String TIPIFICACION_PREVENTA = "PREVENTA";

    /**
     * Acciones que ponen un lead en la cartera del período: ingresó, se lo trajo de otro día, o se
     * lo tipificó (esto último como blindaje, para que gestionados nunca exceda a la cartera).
     */
    private static final List<Accion> ACCIONES_CARTERA =
            List.of(Accion.REGISTRO, Accion.ASIGNACION, Accion.TIPIFICACION);

    /**
     * Métricas del día para "Leads del día" (día completo con el scope de equipo del usuario).
     * A/B/D salen de los eventos REGISTRO; F/G/H del resumen por etapa (PREVENTA). C y E se derivan
     * en el frontend a partir de A y B.
     */
    public LeadsDiariosMetricasResponse obtenerMetricasRegistrosDiarios(LocalDate fecha) {
        OperationalDateTime.InstantRange rango = OperationalDateTime.dayRange(fecha);
        Instant inicio = rango.inicio();
        Instant fin = rango.fin();

        long registros = eventoRepository.contarRegistrosDiarios(Accion.REGISTRO, inicio, fin, false, null);
        long leadsUnicos = eventoRepository.contarLeadsUnicosDiarios(Accion.REGISTRO, inicio, fin);
        long leadsRepetidos = eventoRepository.listarLeadsDiariosConRepeticion(Accion.REGISTRO, inicio, fin).size();
        long leadsTipificados = eventoRepository.contarLeadsDiariosTipificados(Accion.REGISTRO, Etapa.PREVENTA, inicio, fin);
        long leadsVentaCerrada = eventoRepository.contarLeadsDiariosPorUltimaTipificacion(
                Accion.REGISTRO, Etapa.PREVENTA, inicio, fin, TIPIFICACION_PREVENTA);

        long bloque1 = 0;
        long bloque2 = 0;
        long bloque3 = 0;
        for (Object[] fila : eventoRepository.agruparLeadsDiariosPorOrdenUltimaTipificacion(
                Accion.REGISTRO, Etapa.PREVENTA, inicio, fin)) {
            Integer orden = (Integer) fila[0];
            long cantidad = (Long) fila[1];
            if (orden == null) {
                continue;
            }
            if (orden <= 3) {
                bloque1 += cantidad;
            } else if (orden <= 6) {
                bloque2 += cantidad;
            } else {
                bloque3 += cantidad;
            }
        }

        return new LeadsDiariosMetricasResponse(
                registros, leadsUnicos, leadsRepetidos, leadsTipificados, bloque1, bloque2, bloque3, leadsVentaCerrada);
    }

    /**
     * Mismas métricas del día pero desglosadas por equipo (para el DASHBOARD del ADMIN). Un usuario
     * con visibilidad global ve todos los equipos; uno acotado, solo el suyo (via equipoFilter).
     * idEquipo null = "Sin equipo".
     *
     * <p>La cohorte son los leads con evento {@code REGISTRO} en el período (modo INGRESADOS). El
     * {@code campo} elige el punto de tipificación (primera/última/mayor) con el que se calculan
     * tipificados, bloques y venta cerrada. Omitir el rango equivale al día operativo de hoy.
     */
    public List<LeadsDiariosMetricasEquipoResponse> obtenerMetricasRegistrosDiariosPorEquipo(
            LocalDate desde, LocalDate hasta, CampoTipificacion campo, ModoConteo modo) {
        LocalDate desdeResuelto = OperationalDateTime.resolveDate(desde);
        LocalDate hastaResuelto = OperationalDateTime.resolveDate(hasta);
        if (hastaResuelto.isBefore(desdeResuelto)) {
            throw new BadRequestException("La fecha de inicio no puede ser posterior a la fecha final");
        }
        Instant inicio = OperationalDateTime.startOfDay(desdeResuelto);
        Instant fin = OperationalDateTime.endExclusiveOfDay(hastaResuelto);

        // Acumulador por equipo:
        // [registros, unicos, repetidos, tipificados, b1, b2, b3, ventaCerrada, cartera, gestionados].
        Map<Long, long[]> porEquipo = new LinkedHashMap<>();

        // A, B y D describen la ingesta del período y se calculan en ambos modos: miden la calidad
        // de la base, que no depende de la operación.
        for (Object[] fila : eventoRepository.metricasBaseRegistrosDiariosPorEquipo(Accion.REGISTRO, inicio, fin)) {
            long[] acc = acumuladorEquipo(porEquipo, (Long) fila[0]);
            acc[0] = (Long) fila[1];
            acc[1] = (Long) fila[2];
        }
        for (Object[] fila : eventoRepository.listarLeadsDiariosConRepeticionPorEquipo(Accion.REGISTRO, inicio, fin)) {
            acumuladorEquipo(porEquipo, (Long) fila[0])[2] += 1;
        }

        if (modo == ModoConteo.GESTIONADOS) {
            acumularOperacionDelPeriodo(porEquipo, inicio, fin);
        } else {
            acumularCohorteIngresados(porEquipo, campo, inicio, fin);
        }

        return porEquipo.entrySet().stream()
                .map(entrada -> {
                    long[] a = entrada.getValue();
                    return new LeadsDiariosMetricasEquipoResponse(
                            entrada.getKey(), a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9]);
                })
                .toList();
    }

    /** INGRESADOS: qué pasó con los leads que entraron en el período (cohorte de ingesta). */
    private void acumularCohorteIngresados(
            Map<Long, long[]> porEquipo, CampoTipificacion campo, Instant inicio, Instant fin) {
        for (Object[] fila : tipificadosPorEquipoSegunCampo(campo, inicio, fin)) {
            acumuladorEquipo(porEquipo, (Long) fila[0])[3] = (Long) fila[1];
        }
        for (Object[] fila : bloquesPorEquipoSegunCampo(campo, inicio, fin)) {
            long[] acc = acumuladorEquipo(porEquipo, (Long) fila[0]);
            Integer orden = (Integer) fila[1];
            long cantidad = (Long) fila[2];
            if (orden == null) {
                continue;
            }
            if (orden <= 3) {
                acc[4] += cantidad;
            } else if (orden <= 6) {
                acc[5] += cantidad;
            } else {
                acc[6] += cantidad;
            }
        }
        for (Object[] fila : ventaCerradaPorEquipoSegunCampo(campo, inicio, fin)) {
            acumuladorEquipo(porEquipo, (Long) fila[0])[7] = (Long) fila[1];
        }
    }

    /**
     * GESTIONADOS: qué se hizo en el período, sin importar cuándo entró el lead. Los bloques por
     * orden quedan en cero porque el Evento guarda el código de tipificación pero no su orden.
     */
    private void acumularOperacionDelPeriodo(Map<Long, long[]> porEquipo, Instant inicio, Instant fin) {
        for (Object[] fila : eventoRepository.contarCarteraDelPeriodoPorEquipo(ACCIONES_CARTERA, inicio, fin)) {
            acumuladorEquipo(porEquipo, (Long) fila[0])[8] = (Long) fila[1];
        }
        for (Object[] fila : eventoRepository.contarGestionadosDelPeriodoPorEquipo(
                Accion.TIPIFICACION, Etapa.PREVENTA, inicio, fin)) {
            acumuladorEquipo(porEquipo, (Long) fila[0])[9] = (Long) fila[1];
        }
        for (Object[] fila : eventoRepository.contarPreventasDelPeriodoPorEquipo(
                Accion.TIPIFICACION, Etapa.PREVENTA, inicio, fin, TIPIFICACION_PREVENTA)) {
            acumuladorEquipo(porEquipo, (Long) fila[0])[7] = (Long) fila[1];
        }
    }

    private static long[] acumuladorEquipo(Map<Long, long[]> mapa, Long idEquipo) {
        return mapa.computeIfAbsent(idEquipo, clave -> new long[10]);
    }

    // El punto de tipificación se elige por consulta: JPQL no permite parametrizar la columna.
    private List<Object[]> tipificadosPorEquipoSegunCampo(CampoTipificacion campo, Instant inicio, Instant fin) {
        return switch (campo) {
            case PRIMERA -> eventoRepository.contarLeadsDiariosTipificadosPorEquipoPrimera(
                    Accion.REGISTRO, Etapa.PREVENTA, inicio, fin);
            case ULTIMA -> eventoRepository.contarLeadsDiariosTipificadosPorEquipoUltima(
                    Accion.REGISTRO, Etapa.PREVENTA, inicio, fin);
            case MAYOR -> eventoRepository.contarLeadsDiariosTipificadosPorEquipoMayor(
                    Accion.REGISTRO, Etapa.PREVENTA, inicio, fin);
        };
    }

    private List<Object[]> bloquesPorEquipoSegunCampo(CampoTipificacion campo, Instant inicio, Instant fin) {
        return switch (campo) {
            case PRIMERA -> eventoRepository.agruparLeadsDiariosPorOrdenPorEquipoPrimera(
                    Accion.REGISTRO, Etapa.PREVENTA, inicio, fin);
            case ULTIMA -> eventoRepository.agruparLeadsDiariosPorOrdenPorEquipoUltima(
                    Accion.REGISTRO, Etapa.PREVENTA, inicio, fin);
            case MAYOR -> eventoRepository.agruparLeadsDiariosPorOrdenPorEquipoMayor(
                    Accion.REGISTRO, Etapa.PREVENTA, inicio, fin);
        };
    }

    private List<Object[]> ventaCerradaPorEquipoSegunCampo(CampoTipificacion campo, Instant inicio, Instant fin) {
        return switch (campo) {
            case PRIMERA -> eventoRepository.contarLeadsDiariosVentaCerradaPorEquipoPrimera(
                    Accion.REGISTRO, Etapa.PREVENTA, inicio, fin, TIPIFICACION_PREVENTA);
            case ULTIMA -> eventoRepository.contarLeadsDiariosVentaCerradaPorEquipoUltima(
                    Accion.REGISTRO, Etapa.PREVENTA, inicio, fin, TIPIFICACION_PREVENTA);
            case MAYOR -> eventoRepository.contarLeadsDiariosVentaCerradaPorEquipoMayor(
                    Accion.REGISTRO, Etapa.PREVENTA, inicio, fin, TIPIFICACION_PREVENTA);
        };
    }

    /**
     * Reporte "gestión por campaña" para el DASHBOARD del ADMIN: cuenta leads por código de
     * tipificación, desglosado por equipo y campaña. El {@code campo} elige el punto de tipificación
     * (primera/última/mayor) y, con él, la fecha por la que filtra el período: así el conteo cae en el
     * período en que se tipificó, no en el que se registró el lead. El scope de equipos lo acota el
     * {@code equipoFilter} (visibilidad global ve todo). idEquipo/idCampana null = "Sin equipo/campaña".
     */
    public List<GestionPorCampanaCeldaResponse> obtenerGestionPorCampana(
            Etapa etapa, CampoTipificacion campo, ModoConteo modo, LocalDate desde, LocalDate hasta) {
        LocalDate desdeResuelto = OperationalDateTime.resolveDate(desde);
        LocalDate hastaResuelto = OperationalDateTime.resolveDate(hasta);
        if (hastaResuelto.isBefore(desdeResuelto)) {
            throw new BadRequestException("La fecha de inicio no puede ser posterior a la fecha final");
        }
        Instant inicio = OperationalDateTime.startOfDay(desdeResuelto);
        Instant fin = OperationalDateTime.endExclusiveOfDay(hastaResuelto);

        List<Object[]> filas = switch (modo) {
            case GESTIONADOS -> switch (campo) {
                case PRIMERA -> leadEtapaResumenRepository.gestionPorCampanaPrimera(etapa, inicio, fin);
                case ULTIMA -> leadEtapaResumenRepository.gestionPorCampanaUltima(etapa, inicio, fin);
                case MAYOR -> leadEtapaResumenRepository.gestionPorCampanaMayor(etapa, inicio, fin);
            };
            case INGRESADOS -> switch (campo) {
                case PRIMERA -> leadEtapaResumenRepository.ingresadosPorCampanaPrimera(Accion.REGISTRO, etapa, inicio, fin);
                case ULTIMA -> leadEtapaResumenRepository.ingresadosPorCampanaUltima(Accion.REGISTRO, etapa, inicio, fin);
                case MAYOR -> leadEtapaResumenRepository.ingresadosPorCampanaMayor(Accion.REGISTRO, etapa, inicio, fin);
            };
        };

        return filas.stream()
                .map(fila -> new GestionPorCampanaCeldaResponse(
                        (Long) fila[0],
                        (Long) fila[1],
                        (String) fila[2],
                        (String) fila[3],
                        (Long) fila[4]))
                .toList();
    }

    public List<AfluenciaPorHoraCeldaResponse> obtenerAfluenciaPorHora(
            ModoConteo modo, LocalDate desde, LocalDate hasta) {
        LocalDate desdeResuelto = OperationalDateTime.resolveDate(desde);
        LocalDate hastaResuelto = OperationalDateTime.resolveDate(hasta);
        if (hastaResuelto.isBefore(desdeResuelto)) {
            throw new BadRequestException("La fecha de inicio no puede ser posterior a la fecha final");
        }
        Instant inicio = OperationalDateTime.startOfDay(desdeResuelto);
        Instant fin = OperationalDateTime.endExclusiveOfDay(hastaResuelto);

        Accion accion = switch (modo) {
            case INGRESADOS -> Accion.REGISTRO;
            case GESTIONADOS -> Accion.ASIGNACION;
        };

        return eventoRepository.afluenciaPorHora(accion, Etapa.PREVENTA, inicio, fin)
                .stream()
                .map(fila -> new AfluenciaPorHoraCeldaResponse(
                        (Long) fila[0],
                        (Long) fila[1],
                        (String) fila[2],
                        ((Number) fila[3]).intValue(),
                        ((Number) fila[4]).longValue(),
                        ((Number) fila[5]).longValue()))
                .toList();
    }

    private void validarFiltroAgrupacion(
            TipoGrupoGtr tipoGrupo,
            Long idGrupo,
            String codigoTipificacion,
            boolean sinValor
    ) {
        if (tipoGrupo == null) {
            if (idGrupo != null || codigoTipificacion != null || sinValor) {
                throw new BadRequestException("Debes indicar el tipo de agrupación para filtrar los leads del día");
            }
            return;
        }
        if (sinValor) {
            return;
        }
        if ((tipoGrupo == TipoGrupoGtr.ASESOR
                || tipoGrupo == TipoGrupoGtr.CAMPANA
                || tipoGrupo == TipoGrupoGtr.EQUIPO) && idGrupo == null) {
            throw new BadRequestException("Debes indicar el grupo seleccionado");
        }
        if ((tipoGrupo == TipoGrupoGtr.PRIMERA_TIPIFICACION
                || tipoGrupo == TipoGrupoGtr.MAYOR_TIPIFICACION
                || tipoGrupo == TipoGrupoGtr.ULTIMA_TIPIFICACION)
                && normalizarCodigo(codigoTipificacion) == null) {
            throw new BadRequestException("Debes indicar la tipificación seleccionada");
        }
    }

    private String normalizarCodigo(String codigo) {
        return codigo == null || codigo.isBlank() ? null : codigo.trim();
    }

    private String normalizarBusquedaLead(String lead) {
        if (lead == null || lead.isBlank()) {
            return null;
        }
        String normalizado = lead.replaceAll("\\s+", "").toLowerCase();
        while (normalizado.startsWith("@")) {
            normalizado = normalizado.substring(1);
        }
        return normalizado.isBlank() ? null : normalizado;
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupaciones(
            List<LeadGtrAgrupacionProjection> rows,
            String etiquetaSinValor
    ) {
        Map<Long, Long> cantidades = new LinkedHashMap<>();
        Map<Long, String> etiquetas = new LinkedHashMap<>();
        long cantidadSinValor = 0;
        for (LeadGtrAgrupacionProjection row : rows) {
            if (row.getIdGrupo() == null) {
                cantidadSinValor += row.getCantidad();
                continue;
            }
            cantidades.merge(row.getIdGrupo(), row.getCantidad(), Long::sum);
            if (row.getEtiqueta() != null && !row.getEtiqueta().isBlank()) {
                etiquetas.put(row.getIdGrupo(), row.getEtiqueta());
            }
        }

        List<LeadGtrAgrupacionItemResponse> grupos = new ArrayList<>();
        cantidades.forEach((id, cantidad) -> grupos.add(new LeadGtrAgrupacionItemResponse(
                id,
                null,
                null,
                etiquetas.getOrDefault(id, "Sin nombre"),
                cantidad,
                false
        )));
        if (cantidadSinValor > 0) {
            grupos.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    etiquetaSinValor,
                    cantidadSinValor,
                    true
            ));
        }
        return ordenarAgrupaciones(grupos);
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupacionesEquipo(
            List<LeadGtrAgrupacionProjection> rows,
            List<Object[]> registrosPorEquipo,
            String etiquetaSinValor
    ) {
        Map<Long, Long> registrosMap = registrosPorEquipo.stream()
                .collect(Collectors.toMap(
                        fila -> (Long) fila[0],
                        fila -> (Long) fila[1],
                        Long::sum
                ));
        List<LeadGtrAgrupacionItemResponse> items = mapearAgrupaciones(rows, etiquetaSinValor);
        for (LeadGtrAgrupacionItemResponse item : items) {
            if (item.getIdGrupo() != null) {
                item.setValor(String.valueOf(registrosMap.getOrDefault(item.getIdGrupo(), item.getCantidad())));
            }
        }
        return items;
    }

    private List<LeadGtrAgrupacionItemResponse> mapearAgrupacionesTipificacion(
            List<LeadGtrAgrupacionProjection> rows
    ) {
        List<LeadGtrAgrupacionItemResponse> grupos = new ArrayList<>();
        long cantidadSinTipificar = 0;
        for (LeadGtrAgrupacionProjection row : rows) {
            String tipificacion = normalizarCodigo(row.getCodigoTipificacion());
            String subtipificacion = normalizarCodigo(row.getCodigoSubtipificacion());
            if (tipificacion == null) {
                cantidadSinTipificar += row.getCantidad();
                continue;
            }
            grupos.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    tipificacion,
                    subtipificacion,
                    tipificacion + (subtipificacion == null ? "" : " / " + subtipificacion),
                    row.getCantidad(),
                    false
            ));
        }
        if (cantidadSinTipificar > 0) {
            grupos.add(new LeadGtrAgrupacionItemResponse(
                    null,
                    null,
                    null,
                    "Sin tipificar",
                    cantidadSinTipificar,
                    true
            ));
        }
        return ordenarAgrupaciones(grupos);
    }

    private List<LeadGtrAgrupacionItemResponse> ordenarAgrupaciones(
            List<LeadGtrAgrupacionItemResponse> grupos
    ) {
        return grupos.stream()
                .sorted(Comparator.comparingLong(LeadGtrAgrupacionItemResponse::getCantidad)
                        .reversed()
                        .thenComparing(
                                LeadGtrAgrupacionItemResponse::getEtiqueta,
                                String.CASE_INSENSITIVE_ORDER
                        ))
                .toList();
    }

    private Instant inicioDia(LocalDate fecha) {
        return fecha == null ? null : OperationalDateTime.startOfDay(fecha);
    }

    private Instant finDiaInclusivo(LocalDate fecha) {
        return fecha == null ? null : OperationalDateTime.endExclusiveOfDay(fecha);
    }

    private org.springframework.data.domain.Page<Evento> listarEventosLeadPorRango(
            Long idLead,
            Instant fechaDesde,
            Instant fechaHasta,
            org.springframework.data.domain.Pageable pageable
    ) {
        if (fechaDesde != null && fechaHasta != null) {
            return eventoRepository.findByIdLeadAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                    idLead,
                    fechaDesde,
                    fechaHasta,
                    pageable
            );
        }
        if (fechaDesde != null) {
            return eventoRepository.findByIdLeadAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                    idLead,
                    fechaDesde,
                    pageable
            );
        }
        if (fechaHasta != null) {
            return eventoRepository.findByIdLeadAndCreatedAtLessThanOrderByCreatedAtDesc(
                    idLead,
                    fechaHasta,
                    pageable
            );
        }
        return eventoRepository.findByIdLeadOrderByCreatedAtDesc(idLead, pageable);
    }

    private org.springframework.data.domain.Page<Evento> listarEventosLeadPorAccionYRango(
            Long idLead,
            Accion accion,
            Instant fechaDesde,
            Instant fechaHasta,
            org.springframework.data.domain.Pageable pageable
    ) {
        if (fechaDesde != null && fechaHasta != null) {
            return eventoRepository.findByIdLeadAndAccionAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                    idLead,
                    accion,
                    fechaDesde,
                    fechaHasta,
                    pageable
            );
        }
        if (fechaDesde != null) {
            return eventoRepository.findByIdLeadAndAccionAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                    idLead,
                    accion,
                    fechaDesde,
                    pageable
            );
        }
        if (fechaHasta != null) {
            return eventoRepository.findByIdLeadAndAccionAndCreatedAtLessThanOrderByCreatedAtDesc(
                    idLead,
                    accion,
                    fechaHasta,
                    pageable
            );
        }
        return eventoRepository.findByIdLeadAndAccionOrderByCreatedAtDesc(idLead, accion, pageable);
    }

    private org.springframework.data.domain.Page<Evento> listarEventosActorPorRango(
            Long idActor,
            Instant fechaDesde,
            Instant fechaHasta,
            org.springframework.data.domain.Pageable pageable
    ) {
        if (fechaDesde != null && fechaHasta != null) {
            return eventoRepository.findByIdActorAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                    idActor,
                    fechaDesde,
                    fechaHasta,
                    pageable
            );
        }
        if (fechaDesde != null) {
            return eventoRepository.findByIdActorAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                    idActor,
                    fechaDesde,
                    pageable
            );
        }
        if (fechaHasta != null) {
            return eventoRepository.findByIdActorAndCreatedAtLessThanOrderByCreatedAtDesc(
                    idActor,
                    fechaHasta,
                    pageable
            );
        }
        return eventoRepository.findByIdActorOrderByCreatedAtDesc(idActor, pageable);
    }

    private record EquipoScope(boolean filtrar, List<Long> ids) {
    }
}
