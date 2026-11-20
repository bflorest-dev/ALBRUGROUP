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
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;

import java.time.Instant;
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

    @Query("""
            select count(p)
            from Postulacion p
            where p.createdAt >= :inicio
              and (:negocio is null or p.negocio = :negocio)
            """)
    long countCreatedSince(@Param("inicio") Instant inicio, @Param("negocio") Negocio negocio);

    @Query("""
            select count(p)
            from Postulacion p
            where p.createdAt >= :inicio
              and p.createdAt < :fin
              and p.negocio = :negocio
            """)
    long countCreatedBetween(
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("negocio") Negocio negocio
    );

    @Query("""
            select count(p)
            from Postulacion p
            where p.etapa = :etapa
              and p.estado = :estado
              and (:negocio is null or p.negocio = :negocio)
            """)
    long countByEtapaAndEstado(
            @Param("etapa") Etapa etapa,
            @Param("estado") EstadoPostulacion estado,
            @Param("negocio") Negocio negocio
    );

    @Query("""
            select count(p)
            from Postulacion p
            where p.etapa = :etapa
              and (:negocio is null or p.negocio = :negocio)
            """)
    long countByEtapa(@Param("etapa") Etapa etapa, @Param("negocio") Negocio negocio);

    @Query("""
            select count(p)
            from Postulacion p
            where p.estadoBandeja = :estadoBandeja
              and (:negocio is null or p.negocio = :negocio)
            """)
    long countByEstadoBandeja(
            @Param("estadoBandeja") EstadoBandejaPostulacion estadoBandeja,
            @Param("negocio") Negocio negocio
    );
}
