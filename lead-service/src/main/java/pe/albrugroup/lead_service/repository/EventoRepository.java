package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.enums.Accion;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {

    List<Evento> findByIdLeadOrderByCreatedAtDesc(Long idLead);

    @Query("""
            SELECT e
            FROM Evento e
            WHERE e.idActor = :idActor
              AND (:fechaDesde IS NULL OR e.createdAt >= :fechaDesde)
              AND (:fechaHasta IS NULL OR e.createdAt < :fechaHasta)
            ORDER BY e.createdAt DESC
            """)
    List<Evento> listarPorActorYFechas(
            @Param("idActor") Long idActor,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
    );

    Optional<Evento> findTopByIdLeadAndAccionOrderByCreatedAtDesc(Long idLead, Accion accion);

    @Query("""
            SELECT e.idLead, MAX(e.createdAt)
            FROM Evento e
            WHERE e.idLead IN :leadIds
              AND e.accion = :accion
            GROUP BY e.idLead
            """)
    List<Object[]> listarUltimaFechaPorLeadIdsYAccion(
            @Param("leadIds") Collection<Long> leadIds,
            @Param("accion") Accion accion
    );
}
