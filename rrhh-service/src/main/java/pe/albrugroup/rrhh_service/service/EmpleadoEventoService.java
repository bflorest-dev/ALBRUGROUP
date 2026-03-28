package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.EmpleadoEvento;
import pe.albrugroup.rrhh_service.entity.enums.EventoEmpleado;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoEventoResponse;
import pe.albrugroup.rrhh_service.exception.NotFoundException;
import pe.albrugroup.rrhh_service.repository.EmpleadoEventoRepository;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoEventoMapper;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmpleadoEventoService {

    private final EmpleadoEventoRepository eventoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final EmpleadoEventoMapper eventoMapper;

    @Transactional
    public EmpleadoEventoResponse registrarEventoListaNegra(Empleado empleado, Long responsableId) {
        return registrarEventoEmpleado(empleado, responsableId, EventoEmpleado.LISTA_NEGRA, "LISTA_NEGRA", null, Instant.now());
    }

    @Transactional(readOnly = true)
    public List<EmpleadoEventoResponse> listarEventosEmpleado(Long idEmpleado) {
        if (!empleadoRepository.existsById(idEmpleado)) {
            throw new NotFoundException(Empleado.class, idEmpleado);
        }
        return eventoRepository.findByEmpleadoIdOrderByFechaCreacionDescIdDesc(idEmpleado).stream()
                .map(eventoMapper::toResponse)
                .toList();
    }

    private EmpleadoEventoResponse registrarEventoEmpleado(Empleado empleado, Long responsableId,
                                                           EventoEmpleado evento, String estado, String subestado,
                                                           Instant fechaEvento)
    {
        Empleado responsable = empleadoRepository.findById(responsableId)
                .orElseThrow(() -> new NotFoundException(Empleado.class, responsableId));

        EmpleadoEvento nuevoEvento = EmpleadoEvento.builder()
                .empleado(empleado)
                .responsable(responsable)
                .evento(evento)
                .estado(estado)
                .subestado(subestado)
                .fechaEvento(fechaEvento)
                .build();

        return eventoMapper.toResponse(eventoRepository.save(nuevoEvento));
    }
}

