package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;
import pe.albrugroup.recruitment_service.entity.Postulacion;

import java.util.List;
import java.util.Optional;

public interface PostulacionRepository extends JpaRepository<Postulacion, Long>, JpaSpecificationExecutor<Postulacion> {

    @Override
    @EntityGraph(attributePaths = {"postulante", "ofertaLaboral"})
    List<Postulacion> findAll(Specification<Postulacion> spec, Sort sort);

    @EntityGraph(attributePaths = {"postulante", "ofertaLaboral"})
    @Query("""
            select p
            from Postulacion p
            where p.id = :idPostulacion
            """)
    Optional<Postulacion> findDetalleById(@Param("idPostulacion") Long idPostulacion);

    @Query("""
            select count(gcd) > 0
            from GrupoCapacitacionDetalle gcd
            where gcd.postulacion.id = :idPostulacion
            """)
    boolean existsDetalleCapacitacionByIdPostulacion(Long idPostulacion);
}
