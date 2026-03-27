package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacionDetalle;
import pe.albrugroup.recruitment_service.entity.enums.EstadoCapacitacionPostulante;

import java.util.List;
import java.util.Optional;

public interface GrupoCapacitacionDetalleRepository extends JpaRepository<GrupoCapacitacionDetalle, Long> {

    boolean existsByPostulacionId(Long postulacionId);

    Optional<GrupoCapacitacionDetalle> findByGrupoCapacitacionIdAndPostulacionId(Long grupoCapacitacionId, Long postulacionId);

    Optional<GrupoCapacitacionDetalle> findByPostulacionId(Long postulacionId);

    List<GrupoCapacitacionDetalle> findByGrupoCapacitacionIdOrderByCreatedAtAscIdAsc(Long grupoCapacitacionId);

    @Query("""
            select gcd
            from GrupoCapacitacionDetalle gcd
            join fetch gcd.postulacion p
            join fetch p.postulante
            join fetch p.ofertaLaboral
            where p.etapa = pe.albrugroup.recruitment_service.entity.enums.Etapa.CONTRATACION
              and gcd.estadoCapacitacion = :estadoCapacitacion
              and gcd.idEmpleadoContratado is null
            order by p.updatedAt desc, p.id desc
            """)
    List<GrupoCapacitacionDetalle> findListosParaContratar(EstadoCapacitacionPostulante estadoCapacitacion);
}
