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
import java.time.ZonedDateTime;
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
        empleado.setCompania(nuevoPostulante.getCompania());
        empleadoRepository.save(empleado);

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

        return postulanteMapper.toResponse(postulante, EventoPostulante.CREAR_POSTULACION);
    }
    @Override @Transactional(readOnly = true)
    public List<PostulanteResponse> getPostulantesFiltrados(EtapaProceso etapa, String estado, String subestado,
                            Origen origen, PuestoTrabajo puesto, LocalDate desde, LocalDate hasta, Boolean listaNegra) {
        Instant inicio = desde != null ? desde.atStartOfDay(ZONA_HORARIA_PERU).toInstant() : null;
        Instant fin = hasta != null ? hasta.atTime(LocalTime.MAX).atZone(ZONA_HORARIA_PERU).toInstant() : null;
        List<Postulante> postulantes = postulanteRepository.getPostulantes(etapa, estado, subestado, origen, puesto, inicio, fin, listaNegra);
        Map<Long, EventoPostulante> ultimosEventos = eventoService.buscarUltimosEventosPorPostulanteIds(
                        postulantes.stream().map(Postulante::getId).toList()
                ).values().stream()
                .collect(Collectors.toMap(evento -> evento.getPostulante().getId(), pe.albrugroup.rrhh_service.entity.PostulanteEvento::getEvento));

        return postulantes.stream()
                .map(postulante -> postulanteMapper.toResponse(postulante, ultimosEventos.get(postulante.getId())))
                .toList();
    }

    @Override
    public PostulanteResponse actualizarEstadoReclutamiento(Long idPostulante, EventoPostulanteRequest evento) {
        Postulante postulante = postulanteRepository.findById(idPostulante)
                .orElseThrow(() -> new PostulanteNotFoundException(idPostulante));

        validarEvento(EtapaProceso.RECLUTAMIENTO, evento);
        RegistrarEventoPostulanteRequest eventoRequest = toRegistrarEvento(EtapaProceso.RECLUTAMIENTO, evento);
        eventoService.registrarEventoPostulante(postulante, currentUser.empleadoID(), eventoRequest);

        if (ReclutamientoEstado.RECLUTADO.name().equals(evento.getEstado())) {
            postulante.setEtapaProceso(EtapaProceso.CAPACITACION);
            postulante.setEstadoProceso(CapacitacionEstado.POR_CAPACITAR.name());
            postulante.setSubestadoProceso(null);
        } else {
            postulante.setEtapaProceso(EtapaProceso.RECLUTAMIENTO);
            postulante.setEstadoProceso(evento.getEstado());
            postulante.setSubestadoProceso(evento.getSubestado());
        }

        postulanteRepository.save(postulante);
        return postulanteMapper.toResponse(postulante, evento.getEvento());
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
            validarEvento(EtapaProceso.CAPACITACION, evento);
            RegistrarEventoPostulanteRequest eventoRequest = toRegistrarEvento(EtapaProceso.CAPACITACION, evento);
            eventoService.registrarEventoPostulante(postulante, currentUser.empleadoID(), eventoRequest);

            if (CapacitacionEstado.APROBADO.name().equals(evento.getEstado())) {
                postulante.setEtapaProceso(EtapaProceso.GESTION);
                postulante.setEstadoProceso("POR_CONTRATAR");
                postulante.setSubestadoProceso(null);
            } else {
                postulante.setEtapaProceso(EtapaProceso.CAPACITACION);
                postulante.setEstadoProceso(evento.getEstado());
                postulante.setSubestadoProceso(evento.getSubestado());
            }
        }

        postulanteRepository.saveAll(postulantes);
        return postulantes.stream()
                .map(postulante -> postulanteMapper.toResponse(postulante, requestsById.get(postulante.getId()).getEvento().getEvento()))
                .toList();
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
                .turnoHorario(evento.getTurnoHorario())
                .pagoDiaCapa(evento.getPagoDiaCapa())
                .build();
    }

    private void validarEvento(EtapaProceso etapa, EventoPostulanteRequest evento) {
        if (evento == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evento requerido");
        }
        validarFechaNoPasada(evento);

        String estado = evento.getEstado();
        String subestado = evento.getSubestado();

        if ("POR_CONTRATAR".equals(estado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado POR_CONTRATAR no es válido para registro de evento");
        }

        if (etapa == EtapaProceso.RECLUTAMIENTO) {
            if (!isReclutamientoEstado(estado)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de reclutamiento inválido");
            }
            if (subestado != null && !subestado.isBlank() && !isReclutamientoSubestado(subestado)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subestado de reclutamiento inválido");
            }
            return;
        }

        if (etapa == EtapaProceso.CAPACITACION) {
            if (!isCapacitacionEstado(estado)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de capacitación inválido");
            }
            if (subestado != null && !subestado.isBlank() && !isCapacitacionSubestado(subestado)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subestado de capacitación inválido");
            }
        }
    }

    private void validarFechaNoPasada(EventoPostulanteRequest evento) {
        LocalDate hoy = LocalDate.now(ZONA_HORARIA_PERU);
        if (evento.getFechaEvento() != null) {
            ZonedDateTime fecha = evento.getFechaEvento().atZone(ZONA_HORARIA_PERU);
            if (fecha.toLocalDate().isBefore(hoy)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fechaEvento debe ser hoy o posterior");
            }
        }
        if (evento.getInicioCapa() != null && evento.getInicioCapa().isBefore(hoy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "inicioCapa debe ser hoy o posterior");
        }
        if (evento.getFinCapa() != null && evento.getFinCapa().isBefore(hoy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "finCapa debe ser hoy o posterior");
        }
        if (evento.getInicioCapa() != null && evento.getFinCapa() != null
                && evento.getFinCapa().isBefore(evento.getInicioCapa())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "finCapa debe ser mayor o igual a inicioCapa");
        }

        boolean tieneDatosCapa = evento.getInicioCapa() != null
                || evento.getFinCapa() != null
                || evento.getTurnoHorario() != null;
        if (tieneDatosCapa) {
            if (evento.getInicioCapa() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "inicioCapa es requerida");
            }
            if (evento.getFinCapa() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "finCapa es requerida");
            }
            if (evento.getTurnoHorario() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "turnoHorario es requerido");
            }
        }

        if (ReclutamientoEstado.RECLUTADO.name().equals(evento.getEstado())) {
            if (evento.getInicioCapa() == null || evento.getFinCapa() == null || evento.getTurnoHorario() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "RECLUTADO requiere inicioCapa, finCapa y turnoHorario");
            }
        }
    }

    private boolean isReclutamientoEstado(String estado) {
        for (ReclutamientoEstado value : ReclutamientoEstado.values()) {
            if (value.name().equals(estado)) {
                return true;
            }
        }
        return false;
    }

    private boolean isReclutamientoSubestado(String subestado) {
        for (ReclutamientoSubEstado value : ReclutamientoSubEstado.values()) {
            if (value.name().equals(subestado)) {
                return true;
            }
        }
        return false;
    }

    private boolean isCapacitacionEstado(String estado) {
        for (CapacitacionEstado value : CapacitacionEstado.values()) {
            if (value.name().equals(estado)) {
                return true;
            }
        }
        return false;
    }

    private boolean isCapacitacionSubestado(String subestado) {
        for (CapacitacionSubEstado value : CapacitacionSubEstado.values()) {
            if (value.name().equals(subestado)) {
                return true;
            }
        }
        return false;
    }

}
