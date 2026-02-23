package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.enums.*;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarEventoPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;
import pe.albrugroup.rrhh_service.exception.EmpleadoListaNegraException;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.repository.PostulanteRepository;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoMapper;
import pe.albrugroup.rrhh_service.service.mapper.PostulanteMapper;
import pe.albrugroup.rrhh_service.usecase.IPostulante;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class PostulanteService implements IPostulante {

    private final PostulanteEventoService eventoService;
    private final PostulanteRepository postulanteRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PostulanteMapper postulanteMapper;
    private final EmpleadoMapper  empleadoMapper;

    private static final ZoneId ZONA_HORARIA_PERU =  ZoneId.of("America/Lima");

    @Override
    public PostulanteResponse registrarPostulante(RegistrarPostulanteRequest nuevoPostulante, Long responsableId) {
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
                responsableId,
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

//
//    @Override
//    public PostulanteResponse actulizarPostulante(Long idPostulante, DatosPostulanteRequest infoPostulante) {
//        Postulante postulante = postulanteRepository.findById(idPostulante)
//                .orElseThrow(() -> new PostulanteNotFoundException(idPostulante));
//        postulanteMapper.updateDatosPostulacion(infoPostulante, postulante);
//        return postulanteMapper.toResponse(postulante);
//    }
//
//    @Override
//    public List<PostulanteResponse> actualizarEstadosPostulacion(CambiosEstadoPostulacionRequest cambios) {
//        Map<Long, EstadoPostulacion> destino = cambios.getCambios().stream()
//                .collect(Collectors.toMap(
//                        CambioEstadoPostulacionItem::getId, CambioEstadoPostulacionItem::getEstado,
//                        (a, b) ->
//                        { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "IDs duplicados"); }
//                ));
//        List<Postulante> postulantes = postulanteRepository
//                .findAllByIdInWithEmpleado(new ArrayList<>(destino.keySet()));
//        if (postulantes.size() != destino.size()) {
//            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Uno o más postulantes no existen");
//        }
//        postulantes.forEach(p -> {
//            if(p.getEstadoPostulacion() != EstadoPostulacion.EN_PROCESO) {
//                throw new ResponseStatusException(HttpStatus.CONFLICT,
//                        "ERROR: Postulante[" + p.getId() + "][" + p.getEstadoPostulacion() + "]");
//            }
//        });
//        postulantes.forEach(postulante -> postulante.setEstadoPostulacion(destino.get(postulante.getId())));
//        return postulantes.stream().map(postulanteMapper::toResponse).toList();
//    }
}
