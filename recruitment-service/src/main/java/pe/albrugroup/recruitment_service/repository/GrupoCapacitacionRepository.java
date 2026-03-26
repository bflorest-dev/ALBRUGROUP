package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;

import java.util.List;
import java.util.Optional;

public interface GrupoCapacitacionRepository extends JpaRepository<GrupoCapacitacion, Long> {

    boolean existsByCodigo(String codigo);

    @EntityGraph(attributePaths = {"detalles", "detalles.postulacion", "detalles.postulacion.postulante", "detalles.postulacion.ofertaLaboral"})
    Optional<GrupoCapacitacion> findWithDetallesById(Long id);

    @EntityGraph(attributePaths = {"detalles", "detalles.postulacion", "detalles.postulacion.postulante", "detalles.postulacion.ofertaLaboral"})
    List<GrupoCapacitacion> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"detalles", "detalles.postulacion", "detalles.postulacion.postulante", "detalles.postulacion.ofertaLaboral"})
    List<GrupoCapacitacion> findByEstadoOrderByCreatedAtDesc(EstadoGrupoCapacitacion estado);
}
