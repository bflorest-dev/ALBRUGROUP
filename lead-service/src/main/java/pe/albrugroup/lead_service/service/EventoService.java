package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.service.mapper.EventoMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final LeadRepository leadRepository;
    private final CurrentUser currentUser;
    private final EventoMapper eventoMapper;

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
                .accion(request.getAccion())
                .etapa(request.getEtapa())
                .tipificacion(request.getTipificacion())
                .subtipificacion(request.getSubtipificacion())
                .fechaInstalacion(request.getFechaInstalacion())
                .comentario(request.getComentario())
                .build();

        return eventoMapper.toResponse(eventoRepository.save(evento));
    }

    public List<EventoResponse> listarPorLead(Long idLead) {
        if (!leadRepository.existsById(idLead)) {
            throw new NotFoundException(Lead.class, idLead);
        }

        return eventoRepository.findByIdLeadOrderByCreatedAtDesc(idLead).stream()
                .map(eventoMapper::toResponse)
                .toList();
    }

    public List<EventoResponse> listarPorEmpleado(Long idEmpleado, LocalDate fechaDesde, LocalDate fechaHasta) {
        Instant fechaDesdeInstant = fechaDesde == null
                ? null
                : fechaDesde.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant fechaHastaInstant = fechaHasta == null
                ? null
                : fechaHasta.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        return eventoRepository.listarPorActorYFechas(idEmpleado, fechaDesdeInstant, fechaHastaInstant).stream()
                .map(eventoMapper::toResponse)
                .toList();
    }
}
