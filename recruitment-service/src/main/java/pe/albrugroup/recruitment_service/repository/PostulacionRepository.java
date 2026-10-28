package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;
import pe.albrugroup.recruitment_service.entity.Postulacion;

import java.util.Optional;
import java.util.List;

public interface PostulacionRepository extends JpaRepository<Postulacion, Long>, JpaSpecificationExecutor<Postulacion> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Postulacion p where p.id = :id")
    Optional<Postulacion> findLockedById(@Param("id") Long id);

    @Override
    @EntityGraph(attributePaths = {"postulante", "ofertaLaboral"})
    Page<Postulacion> findAll(Specification<Postulacion> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"postulante", "ofertaLaboral"})
    @Query("""
            select p
            from Postulacion p
            where p.id = :idPostulacion
            """)
    Optional<Postulacion> findDetalleById(@Param("idPostulacion") Long idPostulacion);

    @EntityGraph(attributePaths = {"postulante", "ofertaLaboral"})
    List<Postulacion> findByPostulanteIdOrderByFechaPostulacionDescIdDesc(Long idPostulante);

    @Query("""
            select count(gcd) > 0
            from GrupoCapacitacionDetalle gcd
            where gcd.postulacion.id = :idPostulacion
            """)
    boolean existsDetalleCapacitacionByIdPostulacion(Long idPostulacion);
}
