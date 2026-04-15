package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.Evento;
import pe.albrugroup.rrhh_service.entity.enums.EventoEmpleado;
import pe.albrugroup.rrhh_service.entity.request.PageRequest;
import pe.albrugroup.rrhh_service.entity.response.EventoResponse;
import pe.albrugroup.rrhh_service.entity.response.PageResponse;
import pe.albrugroup.rrhh_service.exception.NotFoundException;
import pe.albrugroup.rrhh_service.repository.EventoRepository;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.service.mapper.EventoMapper;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final EventoMapper eventoMapper;
    private final PaginationService paginationService;

    private static final Set<String> EVENTO_SORT_FIELDS = Set.of(
            "id",
            "createdAt",
            "updatedAt",
            "fechaEvento",
            "evento"
    );

    @Transactional
    public EventoResponse registrarEventoRegistro(Empleado empleado, Long responsableId) {
        return registrarEventoEmpleado(empleado, responsableId, EventoEmpleado.REGISTRO, Instant.now());
    }

    @Transactional
    public EventoResponse registrarEventoContratacion(Empleado empleado, Long responsableId) {
        return registrarEventoEmpleado(empleado, responsableId, EventoEmpleado.CONTRATACION, Instant.now());
    }

    @Transactional
    public EventoResponse registrarEventoListaNegra(Empleado empleado, Long responsableId) {
        return registrarEventoEmpleado(empleado, responsableId, EventoEmpleado.LISTA_NEGRA, Instant.now());
    }

    @Transactional
    public EventoResponse registrarEventoPago(Empleado empleado, Long responsableId) {
        return registrarEventoEmpleado(empleado, responsableId, EventoEmpleado.PAGO, Instant.now());
    }

    @Transactional(readOnly = true)
    public PageResponse<EventoResponse> listarEventosEmpleado(Long idEmpleado, PageRequest pageRequest) {
        if (!empleadoRepository.existsById(idEmpleado)) {
            throw new NotFoundException(Empleado.class, idEmpleado);
        }
        var eventos = eventoRepository
                .findByEmpleadoId(idEmpleado, paginationService.toPageable(pageRequest, EVENTO_SORT_FIELDS))
                .map(eventoMapper::toResponse);
        return PageResponse.from(eventos);
    }

    private EventoResponse registrarEventoEmpleado(Empleado empleado, Long responsableId,
                                                   EventoEmpleado evento, Instant fechaEvento)
    {
        Empleado responsable = empleadoRepository.findById(responsableId)
                .orElseThrow(() -> new NotFoundException(Empleado.class, responsableId));

        Evento nuevoEvento = Evento.builder()
                .empleado(empleado)
                .responsable(responsable)
                .evento(evento)
                .fechaEvento(fechaEvento)
                .build();

        return eventoMapper.toResponse(eventoRepository.save(nuevoEvento));
    }
}

