package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

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

    public List<EventoResponse> listarPorLead(Long idLead) {
        if (!leadRepository.existsById(idLead)) {
            throw new NotFoundException(Lead.class, idLead);
        }

        return eventoRepository.findByIdLeadOrderByCreatedAtDesc(idLead).stream()
                .map(this::toResponse)
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
                .map(this::toResponse)
                .toList();
    }

    private EventoResponse toResponse(Evento evento) {
        return EventoResponse.builder()
                .id(evento.getId())
                .idLead(evento.getIdLead())
                .idActor(evento.getIdActor())
                .nombreActor(evento.getNombreActor())
                .rolActor(evento.getRolActor())
                .accion(evento.getAccion())
                .etapa(evento.getEtapa())
                .tipificacion(evento.getTipificacion())
                .subtipificacion(evento.getSubtipificacion())
                .createdAt(evento.getCreatedAt())
                .build();
    }
}
