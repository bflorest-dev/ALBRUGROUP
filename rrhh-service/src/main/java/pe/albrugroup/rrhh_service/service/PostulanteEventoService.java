package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.PostulanteEvento;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarEventoPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteEventoResponse;
import pe.albrugroup.rrhh_service.exception.EmpleadoNotFoundException;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.repository.PostulanteEventoRepository;
import pe.albrugroup.rrhh_service.service.mapper.PostulanteEventoMapper;

@Service
@RequiredArgsConstructor
public class PostulanteEventoService {

    private final PostulanteEventoRepository eventoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PostulanteEventoMapper eventoMapper;

    @Transactional
    public PostulanteEventoResponse registrarEventoCreacionPostulante(Postulante postulante, Long responsableId,
                                                                      RegistrarEventoPostulanteRequest request)
    {
        return registrarEventoPostulante(postulante, responsableId, request);
    }

    @Transactional
    public PostulanteEventoResponse registrarEventoPostulante(Postulante postulante, Long responsableId,
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
