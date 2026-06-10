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
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.LeadDiarioResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.service.mapper.EventoMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
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

    private static final Set<String> EVENTO_SORT_FIELDS = Set.of("createdAt", "accion", "etapa", "tipificacion", "subtipificacion");

    @Transactional
    public EventoResponse registrarEvento(RegistrarEventoRequest request) {
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
        var eventos = accion == null
                ? listarEventosLeadPorRango(idLead, fechaDesdeInstant, fechaHastaInstant, pageable)
                : listarEventosLeadPorAccionYRango(idLead, accion, fechaDesdeInstant, fechaHastaInstant, pageable);
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

        var pageEventos = listarEventosActorPorRango(
                idEmpleado,
                fechaDesdeInstant,
                fechaHastaInstant,
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

    public PageResponse<LeadDiarioResponse> listarRegistrosDiarios(LocalDate fecha, PageRequest pageRequest) {
        OperationalDateTime.InstantRange rango = OperationalDateTime.dayRange(fecha);

        var pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPageNumber(),
                pageRequest.getPageSize()
        );

        var registros = eventoRepository.listarRegistrosDiarios(
                Accion.REGISTRO,
                rango.inicio(),
                rango.fin(),
                pageable
        );
        return PageResponse.from(registros);
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
}
