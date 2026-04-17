package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.configuration.CurrentUser;
import pe.albrugroup.recruitment_service.entity.Evento;
import pe.albrugroup.recruitment_service.entity.Postulacion;
import pe.albrugroup.recruitment_service.entity.enums.Accion;
import pe.albrugroup.recruitment_service.entity.enums.ModalidadContacto;
import pe.albrugroup.recruitment_service.entity.request.PageRequest;
import pe.albrugroup.recruitment_service.entity.response.EventoResponse;
import pe.albrugroup.recruitment_service.entity.response.PageResponse;
import pe.albrugroup.recruitment_service.exception.NotFoundException;
import pe.albrugroup.recruitment_service.repository.EventoRepository;
import pe.albrugroup.recruitment_service.repository.PostulacionRepository;
import pe.albrugroup.recruitment_service.service.mapper.EventoMapper;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class EventoService {

    private static final Set<String> EVENTO_SORT_FIELDS = Set.of("id", "createdAt", "accion", "etapa");

    private final EventoRepository eventoRepository;
    private final PostulacionRepository postulacionRepository;
    private final EventoMapper eventoMapper;
    private final CurrentUser currentUser;
    private final PaginationService paginationService;

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
    public PageResponse<EventoResponse> listarPorPostulacion(Long idPostulacion, PageRequest pageRequest) {
        if (!postulacionRepository.existsById(idPostulacion)) {
            throw new NotFoundException(Postulacion.class, idPostulacion);
        }

        Page<EventoResponse> eventos = eventoRepository.findByPostulacionId(
                        idPostulacion,
                        paginationService.toPageable(pageRequest, EVENTO_SORT_FIELDS)
                )
                .map(eventoMapper::toResponse);
        return PageResponse.from(eventos);
    }
}
