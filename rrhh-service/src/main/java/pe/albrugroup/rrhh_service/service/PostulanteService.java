package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.albrugroup.rrhh_service.configuration.CurrentUser;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.enums.*;
import pe.albrugroup.rrhh_service.entity.request.postulante.EstadoCapacitacionRequest;
import pe.albrugroup.rrhh_service.entity.request.postulante.EventoPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarEventoPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;
import pe.albrugroup.rrhh_service.exception.EmpleadoListaNegraException;
import pe.albrugroup.rrhh_service.exception.PostulanteNotFoundException;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.repository.PostulanteRepository;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoMapper;
import pe.albrugroup.rrhh_service.service.mapper.PostulanteMapper;
import pe.albrugroup.rrhh_service.usecase.IPostulante;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service @Transactional
@RequiredArgsConstructor
public class PostulanteService implements IPostulante {

    private final PostulanteEventoService eventoService;
    private final PostulanteRepository postulanteRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PostulanteMapper postulanteMapper;
    private final EmpleadoMapper  empleadoMapper;

    private static final ZoneId ZONA_HORARIA_PERU =  ZoneId.of("America/Lima");
    private final CurrentUser currentUser;

    @Override
    public PostulanteResponse registrarPostulante(RegistrarPostulanteRequest nuevoPostulante) {
        Empleado empleado = empleadoRepository.findByNumeroDocumento(nuevoPostulante.getNumeroDocumento())
                .orElseGet(() -> {
                    Empleado e = empleadoMapper.toEntity(nuevoPostulante);
                    e.setEstadoOperativo(EstadoOperativo.POSTULANTE);
                    e.setListaNegra(false);
                    return empleadoRepository.save(e);
                });
        if(empleado.getListaNegra()) throw new EmpleadoListaNegraException(empleado.getId());

        Postulante postulante = postulanteMapper.toEntity(nuevoPostulante);
        postulante.setEmpleado(empleado);
        postulante.setEtapaProceso(EtapaProceso.RECLUTAMIENTO);
        postulante.setEstadoProceso(ReclutamientoEstado.POR_RECLUTAR.name());
        postulanteRepository.save(postulante);

        eventoService.registrarEventoCreacionPostulante(
                postulante,
                currentUser.empleadoID(),
                RegistrarEventoPostulanteRequest.builder()
                        .etapaProceso(EtapaProceso.RECLUTAMIENTO)
                        .evento(EventoPostulante.CREAR_POSTULACION)
                        .estado(ReclutamientoEstado.POR_RECLUTAR.name())
                        .subestado(null)
                        .build()
        );

        return postulanteMapper.toResponse(postulante);
    }
    @Override @Transactional(readOnly = true)
    public List<PostulanteResponse> getPostulantesFiltrados(EtapaProceso etapa, String estado, String subestado,
                            Origen origen, PuestoTrabajo puesto, LocalDate desde, LocalDate hasta, Boolean listaNegra) {
        Instant inicio = desde != null ? desde.atStartOfDay(ZONA_HORARIA_PERU).toInstant() : null;
        Instant fin = hasta != null ? hasta.atTime(LocalTime.MAX).atZone(ZONA_HORARIA_PERU).toInstant() : null;
        return postulanteRepository.getPostulantes(etapa, estado, subestado, origen, puesto, inicio, fin, listaNegra)
                .stream().map(postulanteMapper::toResponse)
                .toList();
    }

    @Override
    public PostulanteResponse actualizarEstadoReclutamiento(Long idPostulante, EventoPostulanteRequest evento) {
        Postulante postulante = postulanteRepository.findById(idPostulante)
                .orElseThrow(() -> new PostulanteNotFoundException(idPostulante));

        RegistrarEventoPostulanteRequest eventoRequest = toRegistrarEvento(EtapaProceso.RECLUTAMIENTO, evento);
        eventoService.registrarEventoPostulante(postulante, currentUser.empleadoID(), eventoRequest);

        postulante.setEtapaProceso(EtapaProceso.RECLUTAMIENTO);
        postulante.setEstadoProceso(evento.getEstado());
        postulante.setSubestadoProceso(evento.getSubestado());

        postulanteRepository.save(postulante);
        return postulanteMapper.toResponse(postulante);
    }

    @Override
    public List<PostulanteResponse> actualizarEstadosCapacitacion(List<EstadoCapacitacionRequest> postulantesEstados) {
        if (postulantesEstados == null || postulantesEstados.isEmpty()) {
            return List.of();
        }

        Map<Long, EstadoCapacitacionRequest> requestsById = new HashMap<>();
        for (EstadoCapacitacionRequest request : postulantesEstados) {
            if (requestsById.putIfAbsent(request.getId(), request) != null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "IDs duplicados en la solicitud"
                );
            }
        }

        Set<Long> ids = requestsById.keySet();
        List<Postulante> postulantes = postulanteRepository.findAllByIdInWithEmpleado(ids);
        if (postulantes.size() != ids.size()) {
            Set<Long> encontrados = postulantes.stream().map(Postulante::getId).collect(Collectors.toSet());
            Set<Long> faltantes = new HashSet<>(ids);
            faltantes.removeAll(encontrados);
            Long primeroFaltante = faltantes.iterator().next();
            throw new PostulanteNotFoundException(primeroFaltante);
        }

        for (Postulante postulante : postulantes) {
            EstadoCapacitacionRequest request = requestsById.get(postulante.getId());
            EventoPostulanteRequest evento = request.getEvento();
            RegistrarEventoPostulanteRequest eventoRequest = toRegistrarEvento(EtapaProceso.CAPACITACION, evento);
            eventoService.registrarEventoPostulante(postulante, currentUser.empleadoID(), eventoRequest);

            postulante.setEtapaProceso(EtapaProceso.CAPACITACION);
            postulante.setEstadoProceso(evento.getEstado());
            postulante.setSubestadoProceso(evento.getSubestado());
        }

        postulanteRepository.saveAll(postulantes);
        return postulantes.stream().map(postulanteMapper::toResponse).toList();
    }

    private RegistrarEventoPostulanteRequest toRegistrarEvento(EtapaProceso etapa, EventoPostulanteRequest evento) {
        return RegistrarEventoPostulanteRequest.builder()
                .etapaProceso(etapa)
                .evento(evento.getEvento())
                .estado(evento.getEstado())
                .subestado(evento.getSubestado())
                .fechaEvento(evento.getFechaEvento())
                .inicioCapa(evento.getInicioCapa())
                .finCapa(evento.getFinCapa())
                .pagoDiaCapa(evento.getPagoDiaCapa())
                .build();
    }

}
