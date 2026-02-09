package pe.albrugroup.rrhh_service.service;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.rrhh_service.entity.request.CambioEstadoPostulacionItem;
import pe.albrugroup.rrhh_service.entity.request.CambiosEstadoPostulacionRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.repository.PostulanteRepository;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoMapper;
import pe.albrugroup.rrhh_service.service.mapper.PostulanteMapper;
import pe.albrugroup.rrhh_service.usecase.IPostulante;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service @Transactional
@RequiredArgsConstructor
public class PostulanteService implements IPostulante {

    private final PostulanteRepository postulanteRepository;
    private final EmpleadoRepository empleadoRepository;
    private final PostulanteMapper postulanteMapper;
    private final EmpleadoMapper  empleadoMapper;

    public Boolean DataBaseIsEmpty() { return postulanteRepository.count() == 0; }

    @Transactional(readOnly = true) @Override
    public List<PostulanteResponse> getPostulantesEstadoFechas(
            EstadoPostulacion e, LocalDate d, LocalDate h)
    {
        EstadoPostulacion estado = e != null ? e : EstadoPostulacion.EN_PROCESO;
        LocalDate haceUnMes = d != null ? d : LocalDate.now().minusMonths(1);
        LocalDate dentroUnMes = h != null ? h : LocalDate.now().plusMonths(1);

        return postulanteRepository.findByEstadoPostulacionAndFechaInicioBetween(estado, haceUnMes, dentroUnMes)
                .stream()
                .map(postulanteMapper::toResponse)
                .toList();
    }
    @Override
    public PostulanteResponse registrarPostulante(RegistrarPostulanteRequest nuevoPostulante) {
        Empleado empleado = empleadoRepository.findByNumeroDocumento(nuevoPostulante.getNumeroDocumento())
                .orElseGet(() -> {
                    Empleado e = empleadoMapper.toEntity(nuevoPostulante);
                    e.setEstadoOperativo(EstadoOperativo.POSTULANTE);
                    return empleadoRepository.save(e);
                });
        if(postulanteRepository.existsByEmpleadoIdAndEstadoPostulacion(empleado.getId(), EstadoPostulacion.EN_PROCESO)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El registro ya existe");
        }

        Postulante postulante = postulanteMapper.toEntity(nuevoPostulante);
        postulante.setEstadoPostulacion(EstadoPostulacion.EN_PROCESO);
        postulante.setEmpleado(empleado);

        return postulanteMapper.toResponse(postulanteRepository.save(postulante));
    }

    @Override @Transactional
    public List<PostulanteResponse> actualizarEstadosPostulacion(CambiosEstadoPostulacionRequest cambios) {
        Map<Long, EstadoPostulacion> destino = cambios.getCambios().stream()
                .collect(Collectors.toMap(
                        CambioEstadoPostulacionItem::getId, CambioEstadoPostulacionItem::getEstado,
                        (a, b) ->
                        { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "IDs duplicados"); }
                ));
        List<Postulante> postulantes = postulanteRepository.findAllByIdIn(new ArrayList<>(destino.keySet()));
        if (postulantes.size() != destino.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Uno o más postulantes no existen");
        }
        postulantes.forEach(p -> {
            if(p.getEstadoPostulacion() != EstadoPostulacion.EN_PROCESO) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "ERROR: Postulante[" + p.getId() + "][" + p.getEstadoPostulacion() + "]");
            }
        });
        postulantes.forEach(postulante -> postulante.setEstadoPostulacion(destino.get(postulante.getId())));
        return postulantes.stream().map(postulanteMapper::toResponse).toList();
    }


}
