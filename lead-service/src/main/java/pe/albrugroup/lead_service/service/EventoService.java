package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.service.mapper.EventoMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

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
                .comentario(request.getComentario())
                .horaProgramada(request.getHoraProgramada())
                .build();

        return eventoMapper.toResponse(eventoRepository.save(evento));
    }

    public PageResponse<EventoResponse> listarPorLead(Long idLead, PageRequest pageRequest) {
        if (!leadRepository.existsById(idLead)) {
            throw new NotFoundException(Lead.class, idLead);
        }

        var eventos = eventoRepository.findByIdLeadOrderByCreatedAtDesc(
                idLead,
                paginationService.toPageable(pageRequest, EVENTO_SORT_FIELDS)
        ).map(eventoMapper::toResponse);
        return PageResponse.from(eventos);
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
        Instant fechaDesdeInstant = fechaDesde == null
                ? null
                : fechaDesde.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant fechaHastaInstant = fechaHasta == null
                ? null
                : fechaHasta.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        var eventos = eventoRepository.listarPorActorYFechas(
                idEmpleado,
                fechaDesdeInstant,
                fechaHastaInstant,
                paginationService.toPageable(pageRequest, EVENTO_SORT_FIELDS)
        ).map(eventoMapper::toResponse);
        return PageResponse.from(eventos);
    }
}
