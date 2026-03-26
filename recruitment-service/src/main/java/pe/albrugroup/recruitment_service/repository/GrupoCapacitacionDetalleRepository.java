package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacionDetalle;

import java.util.List;
import java.util.Optional;

public interface GrupoCapacitacionDetalleRepository extends JpaRepository<GrupoCapacitacionDetalle, Long> {

    boolean existsByPostulacionId(Long postulacionId);

    Optional<GrupoCapacitacionDetalle> findByGrupoCapacitacionIdAndPostulacionId(Long grupoCapacitacionId, Long postulacionId);

    List<GrupoCapacitacionDetalle> findByGrupoCapacitacionIdOrderByCreatedAtAscIdAsc(Long grupoCapacitacionId);
}
