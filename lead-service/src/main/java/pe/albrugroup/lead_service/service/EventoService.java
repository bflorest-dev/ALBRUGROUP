package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.LeadDiarioResponse;
import pe.albrugroup.lead_service.entity.response.LeadsDiariosMetricasResponse;
import pe.albrugroup.lead_service.entity.response.RegistroDiarioLeadResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionItemResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionesResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.EventoRepository;
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
    private final CurrentUser currentUser;
    private final EventoMapper eventoMapper;
    private final PaginationService paginationService;
    private final LeadAsignacionCounterService leadAsignacionCounterService;

    private static final Set<String> EVENTO_SORT_FIELDS = Set.of("createdAt", "accion", "etapa", "tipificacion", "subtipificacion");
    private static final Map<String, String> LEADS_DIARIOS_SORT_FIELDS = Map.of(
            "createdAt", "r.fechaIngresoEtapa",
            "nombreActor", "nombreActor",
            "campana", "c.nombre",
            "lead", "l.lead",
            "primeraTipificacion", "r.primeraCodigoTipificacion",
            "ultimaTipificacion", "r.ultimaCodigoTipificacion"
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

        var pageable = paginationService.toPageableWithMapping(pageRequest, LEADS_DIARIOS_SORT_FIELDS);

        var registros = eventoRepository.listarRegistrosDiarios(
                Accion.REGISTRO,
                Etapa.PREVENTA,
                rango.inicio(),
                rango.fin(),
                tipoGrupo == TipoGrupoGtr.ASESOR,
                tipoGrupo == TipoGrupoGtr.CAMPANA,
                tipoGrupo == TipoGrupoGtr.EQUIPO,
                tipoGrupo == TipoGrupoGtr.PRIMERA_TIPIFICACION,
                tipoGrupo == TipoGrupoGtr.ULTIMA_TIPIFICACION,
                idGrupo,
                normalizarCodigo(codigoTipificacion),
                normalizarCodigo(codigoSubtipificacion),
                leadNormalizado != null,
                leadNormalizado,
                sinValor,
                pageable
        );
        Map<Long, Long> registrosDiaPorLead = contarRegistrosDia(registros.getContent(), rango);
        var respuesta = registros.map(registro -> {
            registro.setTotalRegistrosDia(registrosDiaPorLead.getOrDefault(registro.getIdLead(), 1L));
            return registro;
        });
        return PageResponse.from(respuesta);
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
                mapearAgrupaciones(
                        eventoRepository.agruparRegistrosDiariosPorEquipo(
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

    private static final String TIPIFICACION_PREVENTA_COMPLETA = "PREVENTA_COMPLETA";
    private static final String SUBTIPIFICACION_VENTA_CERRADA = "VENTA_CERRADA";

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
                Accion.REGISTRO, Etapa.PREVENTA, inicio, fin, TIPIFICACION_PREVENTA_COMPLETA, SUBTIPIFICACION_VENTA_CERRADA);

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
                || tipoGrupo == TipoGrupoGtr.ULTIMA_TIPIFICACION)
                && normalizarCodigo(codigoTipificacion) == null) {
            throw new BadRequestException("Debes indicar la tipificación seleccionada");
        }
    }

    private String normalizarCodigo(String codigo) {
        return codigo == null || codigo.isBlank() ? null : codigo.trim();
    }

    private String normalizarBusquedaLead(String lead) {
        return lead == null || lead.isBlank() ? null : lead.replaceAll("\\s+", "").toLowerCase();
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
