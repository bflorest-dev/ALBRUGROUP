package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface GrupoCapacitacionRepository extends JpaRepository<GrupoCapacitacion, Long> {

    boolean existsByCodigo(String codigo);

    @EntityGraph(attributePaths = {"detalles", "detalles.postulacion", "detalles.postulacion.postulante", "detalles.postulacion.ofertaLaboral"})
    Optional<GrupoCapacitacion> findWithDetallesById(Long id);

    Page<GrupoCapacitacion> findByEstado(EstadoGrupoCapacitacion estado, Pageable pageable);

    Page<GrupoCapacitacion> findByNegocio(Negocio negocio, Pageable pageable);

    Page<GrupoCapacitacion> findByEstadoAndNegocio(EstadoGrupoCapacitacion estado, Negocio negocio, Pageable pageable);

    Page<GrupoCapacitacion> findByEstadoAndNegocioAndFechaInicioGreaterThanOrderByFechaInicioAscTurnoAscCreatedAtAsc(
            EstadoGrupoCapacitacion estado, Negocio negocio, LocalDate fecha, Pageable pageable
    );

    List<GrupoCapacitacion> findByEstadoInAndFechaFinBefore(
            Set<EstadoGrupoCapacitacion> estados, LocalDate fecha
    );

    List<GrupoCapacitacion> findByEstadoAndFechaInicioLessThanEqualAndFechaFinGreaterThanEqual(
            EstadoGrupoCapacitacion estado, LocalDate fechaInicio, LocalDate fechaFin
    );

    @EntityGraph(attributePaths = {"detalles", "detalles.postulacion", "detalles.postulacion.postulante", "detalles.postulacion.ofertaLaboral"})
    List<GrupoCapacitacion> findByFechaInicioBetweenOrderByFechaInicioAscTurnoAsc(LocalDate desde, LocalDate hasta);

    @EntityGraph(attributePaths = {"detalles", "detalles.postulacion", "detalles.postulacion.postulante", "detalles.postulacion.ofertaLaboral"})
    List<GrupoCapacitacion> findByFechaInicioBetweenAndNegocioOrderByFechaInicioAscTurnoAsc(
            LocalDate desde, LocalDate hasta, Negocio negocio
    );
}
