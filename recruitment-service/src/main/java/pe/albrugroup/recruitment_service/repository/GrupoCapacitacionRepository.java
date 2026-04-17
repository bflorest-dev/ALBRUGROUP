package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;

import java.util.Optional;

public interface GrupoCapacitacionRepository extends JpaRepository<GrupoCapacitacion, Long> {

    boolean existsByCodigo(String codigo);

    @EntityGraph(attributePaths = {"detalles", "detalles.postulacion", "detalles.postulacion.postulante", "detalles.postulacion.ofertaLaboral"})
    Optional<GrupoCapacitacion> findWithDetallesById(Long id);

    Page<GrupoCapacitacion> findByEstado(EstadoGrupoCapacitacion estado, Pageable pageable);
}
