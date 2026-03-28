package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.configuration.CurrentUser;
import pe.albrugroup.recruitment_service.entity.Evento;
import pe.albrugroup.recruitment_service.entity.Postulacion;
import pe.albrugroup.recruitment_service.entity.enums.Accion;
import pe.albrugroup.recruitment_service.entity.enums.ModalidadContacto;
import pe.albrugroup.recruitment_service.entity.response.EventoResponse;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.EventoRepository;
import pe.albrugroup.recruitment_service.repository.PostulacionRepository;
import pe.albrugroup.recruitment_service.service.mapper.EventoMapper;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final PostulacionRepository postulacionRepository;
    private final EventoMapper eventoMapper;
    private final CurrentUser currentUser;

    @Transactional
    public void registrarEvento(
            Postulacion postulacion,
            Accion accion,
            ModalidadContacto modalidadContacto,
            Long idTipificacion,
            Long idSubtipificacion,
            String tipificacion,
            String subtipificacion,
            String observacion
    ) {
        Evento evento = Evento.builder()
                .postulacion(postulacion)
                .idEmpleadoResponsable(currentUser.empleadoID())
                .etapa(postulacion.getEtapa())
                .accion(accion)
                .modalidadContacto(modalidadContacto)
                .idTipificacion(idTipificacion)
                .idSubtipificacion(idSubtipificacion)
                .tipificacion(tipificacion)
                .subtipificacion(subtipificacion)
                .observacion(observacion)
                .build();

        eventoRepository.save(evento);
    }

    @Transactional(readOnly = true)
    public List<EventoResponse> listarPorPostulacion(Long idPostulacion) {
        if (!postulacionRepository.existsById(idPostulacion)) {
            throw new NotFoundException(Postulacion.class, idPostulacion);
        }

        return eventoRepository.findByPostulacionIdOrderByCreatedAtDescIdDesc(idPostulacion).stream()
                .map(eventoMapper::toResponse)
                .toList();
    }
}
