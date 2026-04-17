package pe.albrugroup.lead_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.repository.projection.AsesorCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorProveedorCantidadProjection;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {

    Page<Evento> findByIdLeadOrderByCreatedAtDesc(Long idLead, Pageable pageable);

    @Query("""
            SELECT e
            FROM Evento e
            WHERE e.idActor = :idActor
              AND (:fechaDesde IS NULL OR e.createdAt >= :fechaDesde)
              AND (:fechaHasta IS NULL OR e.createdAt < :fechaHasta)
            ORDER BY e.createdAt DESC
            """)
    Page<Evento> listarPorActorYFechas(
            @Param("idActor") Long idActor,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            Pageable pageable
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

    @Query("""
            SELECT e.idActor AS idAsesor,
                   e.nombreActor AS nombreAsesor,
                   COUNT(DISTINCT e.idLead) AS cantidad
            FROM Evento e
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarAsesores = false OR e.idActor IN :asesorIds)
            GROUP BY e.idActor, e.nombreActor
            """)
    List<AsesorCantidadProjection> resumirTipificacionesPorAsesor(
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarAsesores") boolean filtrarAsesores,
            @Param("asesorIds") Collection<Long> asesorIds
    );

    @Query("""
            SELECT e.idActor AS idAsesor,
                   e.nombreActor AS nombreAsesor,
                   COUNT(DISTINCT e.idLead) AS cantidad
            FROM Evento e
            WHERE e.accion = :accion
              AND e.tipificacion = :tipificacion
              AND e.subtipificacion = :subtipificacion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarAsesores = false OR e.idActor IN :asesorIds)
            GROUP BY e.idActor, e.nombreActor
            """)
    List<AsesorCantidadProjection> resumirPreventasPorAsesor(
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("subtipificacion") String subtipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarAsesores") boolean filtrarAsesores,
            @Param("asesorIds") Collection<Long> asesorIds
    );

    @Query("""
            SELECT e.idActor AS idAsesor,
                   e.nombreActor AS nombreAsesor,
                   p.id AS idProveedor,
                   p.nombre AS nombreProveedor,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Plan pl ON pl.id = e.idPlanOfrecido
            JOIN pl.proveedor p
            WHERE e.accion = :accion
              AND e.tipificacion = :tipificacion
              AND e.subtipificacion = :subtipificacion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarAsesores = false OR e.idActor IN :asesorIds)
            GROUP BY e.idActor, e.nombreActor, p.id, p.nombre
            """)
    List<AsesorProveedorCantidadProjection> resumirPreventasMensualesPorProveedor(
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("subtipificacion") String subtipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarAsesores") boolean filtrarAsesores,
            @Param("asesorIds") Collection<Long> asesorIds
    );
}
