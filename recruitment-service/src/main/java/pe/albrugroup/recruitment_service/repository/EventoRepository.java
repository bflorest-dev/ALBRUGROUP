package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.albrugroup.recruitment_service.entity.Evento;
import pe.albrugroup.recruitment_service.entity.enums.Accion;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    Page<Evento> findByPostulacionId(Long idPostulacion, Pageable pageable);

    List<Evento> findByPostulacionIdOrderByCreatedAtAscIdAsc(Long idPostulacion);

    Optional<Evento> findFirstByPostulacionIdAndFechaHoraGestionIsNotNullOrderByFechaHoraGestionDescIdDesc(
            Long idPostulacion
    );

    @Query("""
            select count(e)
            from Evento e
            join e.postulacion p
            where e.accion = :accion
              and e.createdAt >= :inicio
              and (:negocio is null or p.negocio = :negocio)
            """)
    long countByAccionSince(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("negocio") Negocio negocio
    );

    @Query("""
            select count(distinct e.postulacion.id)
            from Evento e
            join e.postulacion p
            where e.accion = :accion
              and e.createdAt >= :inicio
              and e.createdAt < :fin
              and p.negocio = :negocio
            """)
    long countDistinctPostulacionesByAccionBetween(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("negocio") Negocio negocio
    );

    @Query("""
            select count(distinct e.postulacion.id)
            from Evento e
            join e.postulacion p
            where e.accion = :accion
              and e.tipificacion = :tipificacion
              and e.createdAt >= :inicio
              and e.createdAt < :fin
              and p.negocio = :negocio
            """)
    long countDistinctPostulacionesByTipificacionBetween(
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("negocio") Negocio negocio
    );
}
