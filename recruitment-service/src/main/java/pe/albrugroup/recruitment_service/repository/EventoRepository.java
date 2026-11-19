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
}
