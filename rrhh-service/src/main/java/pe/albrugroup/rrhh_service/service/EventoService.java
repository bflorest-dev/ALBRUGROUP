package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.PostulanteEvento;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarEventoPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.EventoResponse;
import pe.albrugroup.rrhh_service.exception.EmpleadoNotFoundException;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.repository.PostulanteEventoRepository;
import pe.albrugroup.rrhh_service.service.mapper.EventoMapper;

@Service @RequiredArgsConstructor
public class EventoService {

    private final PostulanteEventoRepository eventoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final EventoMapper eventoMapper;

    @Transactional
    public EventoResponse registrarEventoCreacionPostulante(Postulante postulante, Long responsableId,
                                                            RegistrarEventoPostulanteRequest request)
    {
        Empleado responsable = empleadoRepository.findById(responsableId)
                .orElseThrow(() -> new EmpleadoNotFoundException(responsableId));

        PostulanteEvento evento = eventoMapper.toEntity(request);
        evento.setPostulante(postulante);
        evento.setResponsable(responsable);

        return eventoMapper.toResponse(eventoRepository.save(evento));
    }

}
