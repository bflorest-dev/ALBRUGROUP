package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.PostulanteEvento;
import pe.albrugroup.rrhh_service.entity.enums.CapacitacionEstado;
import pe.albrugroup.rrhh_service.entity.enums.Compania;
import pe.albrugroup.rrhh_service.entity.enums.EtapaProceso;
import pe.albrugroup.rrhh_service.entity.enums.TurnoHorario;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarEventoPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteEventoResponse;
import pe.albrugroup.rrhh_service.exception.NotFoundException;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.repository.PostulanteEventoRepository;
import pe.albrugroup.rrhh_service.service.mapper.PostulanteEventoMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostulanteEventoService {

    private final PostulanteEventoRepository eventoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PostulanteEventoMapper eventoMapper;

    private static final ZoneId ZONA_HORARIA_PERU = ZoneId.of("America/Lima");

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
                .orElseThrow(() -> new NotFoundException(Empleado.class, responsableId));

        PostulanteEvento evento = eventoMapper.toEntity(request);
        evento.setPostulante(postulante);
        evento.setResponsable(responsable);

        return eventoMapper.toResponse(eventoRepository.save(evento));
    }

    @Transactional(readOnly = true)
    public List<PostulanteEventoResponse> buscarEventos(Long postulanteId, LocalDate desde, LocalDate hasta) {
        Instant inicio = desde != null ? desde.atStartOfDay(ZONA_HORARIA_PERU).toInstant() : null;
        Instant fin = hasta != null ? hasta.atTime(LocalTime.MAX).atZone(ZONA_HORARIA_PERU).toInstant() : null;

        return eventoRepository.buscarEventos(postulanteId, inicio, fin)
                .stream()
                .map(eventoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<Long, PostulanteEvento> buscarUltimosEventosPorPostulanteIds(Collection<Long> postulanteIds) {
        if (postulanteIds == null || postulanteIds.isEmpty()) {
            return Map.of();
        }

        return eventoRepository.buscarUltimosEventosPorPostulanteIds(postulanteIds)
                .stream()
                .collect(Collectors.toMap(evento -> evento.getPostulante().getId(), Function.identity()));
    }

    @Transactional(readOnly = true)
    public long contarInscritosEnGrupoCapacitacion(Compania compania, LocalDate inicioCapa, TurnoHorario turnoHorario,
                                                   Long postulanteIdExcluir) {
        return eventoRepository.contarInscritosEnGrupoCapacitacion(
                EtapaProceso.CAPACITACION,
                CapacitacionEstado.POR_CAPACITAR.name(),
                compania,
                inicioCapa,
                turnoHorario,
                postulanteIdExcluir
        );
    }
}

