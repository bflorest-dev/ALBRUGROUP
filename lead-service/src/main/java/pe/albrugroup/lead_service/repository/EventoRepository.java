package pe.albrugroup.lead_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.repository.projection.AsesorCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorProveedorCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorUltimoEventoProjection;
import pe.albrugroup.lead_service.repository.projection.CampanaTipificacionCantidadProjection;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {

    Page<Evento> findByIdLeadOrderByCreatedAtDesc(Long idLead, Pageable pageable);
    Page<Evento> findByIdLeadAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long idLead,
            Instant fechaDesde,
            Instant fechaHasta,
            Pageable pageable
    );
    Page<Evento> findByIdLeadAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            Long idLead,
            Instant fechaDesde,
            Pageable pageable
    );
    Page<Evento> findByIdLeadAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long idLead,
            Instant fechaHasta,
            Pageable pageable
    );
    List<Evento> findAllByIdLeadOrderByCreatedAtDesc(Long idLead);

    @Query("""
            SELECT e.idActor AS idAsesor, MAX(e.createdAt) AS ultimo
            FROM Evento e
            WHERE e.idActor IN :idsAsesor AND e.accion = :accion
            GROUP BY e.idActor
            """)
    List<AsesorUltimoEventoProjection> ultimoEventoPorActorYAccion(
            @Param("idsAsesor") Collection<Long> idsAsesor,
            @Param("accion") Accion accion
    );

    @Query("""
            SELECT e.idLead, COUNT(e.id)
            FROM Evento e
            WHERE e.idLead IN :leadIds
              AND e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
            GROUP BY e.idLead
            """)
    List<Object[]> contarPorLeadIdsYAccionYFechas(
            @Param("leadIds") Collection<Long> leadIds,
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
    );

    @Query("""
            SELECT e.idLead, e.idCampana, COUNT(e.id)
            FROM Evento e
            WHERE e.idLead IN :leadIds
              AND e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
            GROUP BY e.idLead, e.idCampana
            HAVING COUNT(e.id) > 1
            """)
    List<Object[]> listarCampanasDuplicadasPorLeadIdsYAccionYFechas(
            @Param("leadIds") Collection<Long> leadIds,
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
    );

    Page<Evento> findByIdActorOrderByCreatedAtDesc(Long idActor, Pageable pageable);
    Page<Evento> findByIdActorAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long idActor,
            Instant fechaDesde,
            Instant fechaHasta,
            Pageable pageable
    );
    Page<Evento> findByIdActorAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            Long idActor,
            Instant fechaDesde,
            Pageable pageable
    );
    Page<Evento> findByIdActorAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long idActor,
            Instant fechaHasta,
            Pageable pageable
    );

    Optional<Evento> findTopByIdLeadAndAccionOrderByCreatedAtDesc(Long idLead, Accion accion);

    boolean existsByIdLeadAndIdActorAndAccionIn(Long idLead, Long idActor, Collection<Accion> acciones);

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
            SELECT e.idLead, COUNT(e.id)
            FROM Evento e
            WHERE e.idLead IN :leadIds
              AND e.accion = :accion
            GROUP BY e.idLead
            """)
    List<Object[]> contarPorLeadIdsYAccion(
            @Param("leadIds") Collection<Long> leadIds,
            @Param("accion") Accion accion
    );

    @Query("""
            SELECT e.idLead, e.nombreActor
            FROM Evento e
            WHERE e.idLead IN :leadIds
              AND e.etapa = :etapa
              AND e.accion = :accion
              AND e.createdAt = (
                  SELECT MAX(em.createdAt)
                  FROM Evento em
                  WHERE em.idLead = e.idLead
                    AND em.etapa = :etapa
                    AND em.accion = :accion
              )
            """)
    List<Object[]> listarUltimoActorPorLeadIdsEtapaYAccion(
            @Param("leadIds") Collection<Long> leadIds,
            @Param("etapa") Etapa etapa,
            @Param("accion") Accion accion
    );

    @Query("""
            SELECT e.idLead, e.fechaInstalacion
            FROM Evento e
            WHERE e.idLead IN :leadIds
              AND e.etapa = :etapa
              AND e.fechaInstalacion IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(em.createdAt)
                  FROM Evento em
                  WHERE em.idLead = e.idLead
                    AND em.etapa = :etapa
                    AND em.fechaInstalacion IS NOT NULL
              )
            """)
    List<Object[]> listarUltimaFechaInstalacionPorLeadIds(
            @Param("leadIds") Collection<Long> leadIds,
            @Param("etapa") Etapa etapa
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
            SELECT COUNT(DISTINCT e.idLead)
            FROM Evento e
            WHERE e.etapa = :etapa
              AND e.accion IN :acciones
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (e.tipificacion IS NULL OR e.tipificacion <> :tipificacionPreventaCompleta)
            """)
    long contarGestionadosGtr(
            @Param("etapa") Etapa etapa,
            @Param("acciones") Collection<Accion> acciones,
            @Param("tipificacionPreventaCompleta") String tipificacionPreventaCompleta,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
    );

    @Query("""
            SELECT COUNT(DISTINCT e.idLead)
            FROM Evento e
            WHERE e.accion = :accion
              AND e.tipificacion = :tipificacion
              AND e.subtipificacion = :subtipificacion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
            """)
    long contarPreventasGtr(
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("subtipificacion") String subtipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
    );

    @Query("""
            SELECT COUNT(DISTINCT e.idLead)
            FROM Evento e
            WHERE e.idCampana = :idCampana
              AND e.accion = :accion
              AND e.tipificacion = :tipificacion
              AND e.subtipificacion = :subtipificacion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt <= :fechaHasta
            """)
    long contarVentasCerradasPorCampanaYRango(
            @Param("idCampana") Long idCampana,
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("subtipificacion") String subtipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
    );

    @Query("""
            SELECT COUNT(e.id)
            FROM Evento e
            WHERE e.idCampana = :idCampana
              AND e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt <= :fechaHasta
            """)
    long contarRegistrosPorCampanaYRango(
            @Param("idCampana") Long idCampana,
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
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

    // ── Queries específicos GTR (usan soloActivos con EXISTS para asesores) ────

    @Query("""
            SELECT e.idActor AS idAsesor,
                   e.nombreActor AS nombreAsesor,
                   COUNT(DISTINCT e.idLead) AS cantidad
            FROM Evento e
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = e.idActor
                                AND la.etapa = 'PREVENTA'))
            GROUP BY e.idActor, e.nombreActor
            """)
    List<AsesorCantidadProjection> resumirTipificacionesPorAsesorGtr(
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos
    );

    @Query("""
            SELECT e.idActor AS idAsesor,
                   e.nombreActor AS nombreAsesor,
                   COUNT(DISTINCT e.idLead) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND l.createdAt >= :fechaDesde
              AND l.createdAt < :fechaHasta
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = e.idActor
                                AND la.etapa = 'PREVENTA'))
            GROUP BY e.idActor, e.nombreActor
            """)
    List<AsesorCantidadProjection> resumirNuevosGestionadosPorAsesorGtr(
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos
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
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = e.idActor
                                AND la.etapa = 'PREVENTA'))
            GROUP BY e.idActor, e.nombreActor
            """)
    List<AsesorCantidadProjection> resumirPreventasPorAsesorGtr(
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("subtipificacion") String subtipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos
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
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = e.idActor
                                AND la.etapa = 'PREVENTA'))
            GROUP BY e.idActor, e.nombreActor, p.id, p.nombre
            """)
    List<AsesorProveedorCantidadProjection> resumirPreventasMensualesPorProveedorGtr(
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("subtipificacion") String subtipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos
    );

    @Query("""
            SELECT e.idCampana AS idCampana,
                   c.nombre AS nombreCampana,
                   e.tipificacion AS tipificacion,
                   e.subtipificacion AS subtipificacion,
                   COUNT(DISTINCT e.idLead) AS cantidad
            FROM Evento e
            JOIN Campana c ON c.id = e.idCampana
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND e.idCampana IS NOT NULL
              AND (:soloActivos = false OR c.activo = true)
            GROUP BY e.idCampana, c.nombre, e.tipificacion, e.subtipificacion
            """)
    List<CampanaTipificacionCantidadProjection> resumirTipificacionesPorCampanaGtr(
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos
    );
}
