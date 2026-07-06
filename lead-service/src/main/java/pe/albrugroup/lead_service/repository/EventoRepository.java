package pe.albrugroup.lead_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadDiarioResponse;
import pe.albrugroup.lead_service.entity.response.RegistroDiarioLeadResponse;
import pe.albrugroup.lead_service.repository.projection.AsesorCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorProveedorCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorUltimoEventoProjection;
import pe.albrugroup.lead_service.repository.projection.CampanaTipificacionCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.LeadGtrAgrupacionProjection;
import pe.albrugroup.lead_service.repository.projection.LeadUltimaAsignacionProjection;
import pe.albrugroup.lead_service.repository.projection.SubtipificacionCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.TipificacionCantidadProjection;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {

    Page<Evento> findByIdLeadOrderByCreatedAtDesc(Long idLead, Pageable pageable);

    @Modifying
    @Query("DELETE FROM Evento e WHERE e.idLead = :idLead")
    void deleteByIdLead(@Param("idLead") Long idLead);

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
    Page<Evento> findByIdLeadAndAccionOrderByCreatedAtDesc(
            Long idLead,
            Accion accion,
            Pageable pageable
    );
    Page<Evento> findByIdLeadAndAccionAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long idLead,
            Accion accion,
            Instant fechaDesde,
            Instant fechaHasta,
            Pageable pageable
    );
    Page<Evento> findByIdLeadAndAccionAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            Long idLead,
            Accion accion,
            Instant fechaDesde,
            Pageable pageable
    );
    Page<Evento> findByIdLeadAndAccionAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long idLead,
            Accion accion,
            Instant fechaHasta,
            Pageable pageable
    );
    List<Evento> findAllByIdLeadOrderByCreatedAtDesc(Long idLead);

    boolean existsByIdLeadAndAccionInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            Long idLead,
            Collection<Accion> acciones,
            Instant fechaDesde,
            Instant fechaHasta
    );

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

    // Resuelve el nombre denormalizado de un conjunto de actores (empleados) por su id.
    // Usado para nombrar asesores cuyo id viene del Lead (idAsesorPreventa) sin cruzar conteos.
    @Query("""
            SELECT e.idActor, MAX(e.nombreActor)
            FROM Evento e
            WHERE e.idActor IN :ids
            GROUP BY e.idActor
            """)
    List<Object[]> resolverNombresActores(@Param("ids") Collection<Long> ids);

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

    @Query(value = """
            SELECT e
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.idLead = :idLead
              AND (:filtrarAccion = false OR e.accion = :accion)
              AND (:filtrarFechaDesde = false OR e.createdAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR e.createdAt < :fechaHasta)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """,
            countQuery = """
            SELECT COUNT(e)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.idLead = :idLead
              AND (:filtrarAccion = false OR e.accion = :accion)
              AND (:filtrarFechaDesde = false OR e.createdAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR e.createdAt < :fechaHasta)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """)
    Page<Evento> listarEventosLeadVisibles(
            @Param("idLead") Long idLead,
            @Param("filtrarAccion") boolean filtrarAccion,
            @Param("accion") Accion accion,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query(value = """
            SELECT e
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.idActor = :idActor
              AND (:filtrarFechaDesde = false OR e.createdAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR e.createdAt < :fechaHasta)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """,
            countQuery = """
            SELECT COUNT(e)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.idActor = :idActor
              AND (:filtrarFechaDesde = false OR e.createdAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR e.createdAt < :fechaHasta)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """)
    Page<Evento> listarEventosActorVisibles(
            @Param("idActor") Long idActor,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query(value = """
            SELECT new pe.albrugroup.lead_service.entity.response.LeadDiarioResponse(
                       e.idLead,
                       l.prefijo,
                       l.lead,
                       e.nombreActor,
                       e.rolActor,
                       e.accion,
                       e.createdAt,
                       l.idEquipo,
                       c.nombre,
                       l.primeraCodigoTipificacion,
                       l.primeraCodigoSubtipificacion,
                       l.codigoTipificacion,
                       l.codigoSubtipificacion,
                       null,
                       0L,
                       0L)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            LEFT JOIN l.campana c
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND NOT EXISTS (
                    SELECT 1 FROM Evento anterior
                    WHERE anterior.idLead = e.idLead
                      AND anterior.accion = :accion
                      AND anterior.createdAt >= :inicio
                      AND anterior.createdAt < :fin
                      AND (
                            anterior.createdAt < e.createdAt
                            OR (anterior.createdAt = e.createdAt AND anterior.id < e.id)
                      )
              )
              AND (:filtrarLead = false OR LOWER(REPLACE(l.lead, ' ', '')) LIKE CONCAT('%', :lead, '%'))
              AND (
                    :filtrarAsesor = false
                    OR (:sinValor = true AND e.idActor IS NULL)
                    OR (:sinValor = false AND e.idActor = :idGrupo)
              )
              AND (
                    :filtrarCampana = false
                    OR (:sinValor = true AND c.id IS NULL)
                    OR (:sinValor = false AND c.id = :idGrupo)
              )
              AND (
                    :filtrarEquipo = false
                    OR (:sinValor = true AND l.idEquipo IS NULL)
                    OR (:sinValor = false AND l.idEquipo = :idGrupo)
              )
              AND (
                    :filtrarPrimeraTipificacion = false
                    OR (
                        :sinValor = true
                        AND l.primeraCodigoTipificacion IS NULL
                        AND l.primeraCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND l.primeraCodigoTipificacion = :codigoTipificacion
                        AND (
                            (:codigoSubtipificacion IS NULL AND l.primeraCodigoSubtipificacion IS NULL)
                            OR l.primeraCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
              AND (
                    :filtrarUltimaTipificacion = false
                    OR (
                        :sinValor = true
                        AND l.codigoTipificacion IS NULL
                        AND l.codigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND l.codigoTipificacion = :codigoTipificacion
                        AND (
                            (:codigoSubtipificacion IS NULL AND l.codigoSubtipificacion IS NULL)
                            OR l.codigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
            """,
            countQuery = """
            SELECT COUNT(e)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            LEFT JOIN l.campana c
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND NOT EXISTS (
                    SELECT 1 FROM Evento anterior
                    WHERE anterior.idLead = e.idLead
                      AND anterior.accion = :accion
                      AND anterior.createdAt >= :inicio
                      AND anterior.createdAt < :fin
                      AND (
                            anterior.createdAt < e.createdAt
                            OR (anterior.createdAt = e.createdAt AND anterior.id < e.id)
                      )
              )
              AND (:filtrarLead = false OR LOWER(REPLACE(l.lead, ' ', '')) LIKE CONCAT('%', :lead, '%'))
              AND (
                    :filtrarAsesor = false
                    OR (:sinValor = true AND e.idActor IS NULL)
                    OR (:sinValor = false AND e.idActor = :idGrupo)
              )
              AND (
                    :filtrarCampana = false
                    OR (:sinValor = true AND c.id IS NULL)
                    OR (:sinValor = false AND c.id = :idGrupo)
              )
              AND (
                    :filtrarEquipo = false
                    OR (:sinValor = true AND l.idEquipo IS NULL)
                    OR (:sinValor = false AND l.idEquipo = :idGrupo)
              )
              AND (
                    :filtrarPrimeraTipificacion = false
                    OR (
                        :sinValor = true
                        AND l.primeraCodigoTipificacion IS NULL
                        AND l.primeraCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND l.primeraCodigoTipificacion = :codigoTipificacion
                        AND (
                            (:codigoSubtipificacion IS NULL AND l.primeraCodigoSubtipificacion IS NULL)
                            OR l.primeraCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
              AND (
                    :filtrarUltimaTipificacion = false
                    OR (
                        :sinValor = true
                        AND l.codigoTipificacion IS NULL
                        AND l.codigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND l.codigoTipificacion = :codigoTipificacion
                        AND (
                            (:codigoSubtipificacion IS NULL AND l.codigoSubtipificacion IS NULL)
                            OR l.codigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
            """)
    Page<LeadDiarioResponse> listarRegistrosDiarios(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("filtrarCampana") boolean filtrarCampana,
            @Param("filtrarEquipo") boolean filtrarEquipo,
            @Param("filtrarPrimeraTipificacion") boolean filtrarPrimeraTipificacion,
            @Param("filtrarUltimaTipificacion") boolean filtrarUltimaTipificacion,
            @Param("idGrupo") Long idGrupo,
            @Param("codigoTipificacion") String codigoTipificacion,
            @Param("codigoSubtipificacion") String codigoSubtipificacion,
            @Param("filtrarLead") boolean filtrarLead,
            @Param("lead") String lead,
            @Param("sinValor") boolean sinValor,
            Pageable pageable
    );

    @Query("""
            SELECT e.idLead AS idLead,
                   e.nombreAsesorAsignado AS nombreAsesorAsignado
            FROM Evento e
            WHERE e.accion = :accion
              AND e.idLead IN :idsLead
              AND NOT EXISTS (
                    SELECT 1
                    FROM Evento posterior
                    WHERE posterior.idLead = e.idLead
                      AND posterior.accion = :accion
                      AND (
                            posterior.createdAt > e.createdAt
                            OR (posterior.createdAt = e.createdAt AND posterior.id > e.id)
                      )
              )
            """)
    List<LeadUltimaAsignacionProjection> listarUltimosAsesoresAsignados(
            @Param("idsLead") Collection<Long> idsLead,
            @Param("accion") Accion accion
    );

    @Query("""
            SELECT e.idActor AS idGrupo,
                   e.nombreActor AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND NOT EXISTS (
                    SELECT 1 FROM Evento anterior
                    WHERE anterior.idLead = e.idLead
                      AND anterior.accion = :accion
                      AND anterior.createdAt >= :inicio
                      AND anterior.createdAt < :fin
                      AND (
                            anterior.createdAt < e.createdAt
                            OR (anterior.createdAt = e.createdAt AND anterior.id < e.id)
                      )
              )
              AND (:filtrarLead = false OR LOWER(REPLACE(l.lead, ' ', '')) LIKE CONCAT('%', :lead, '%'))
            GROUP BY e.idActor, e.nombreActor
            """)
    List<LeadGtrAgrupacionProjection> agruparRegistrosDiariosPorAsesor(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarLead") boolean filtrarLead,
            @Param("lead") String lead
    );

    @Query("""
            SELECT l.idEquipo AS idGrupo,
                   NULL AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND NOT EXISTS (
                    SELECT 1 FROM Evento anterior
                    WHERE anterior.idLead = e.idLead
                      AND anterior.accion = :accion
                      AND anterior.createdAt >= :inicio
                      AND anterior.createdAt < :fin
                      AND (
                            anterior.createdAt < e.createdAt
                            OR (anterior.createdAt = e.createdAt AND anterior.id < e.id)
                      )
              )
              AND (:filtrarLead = false OR LOWER(REPLACE(l.lead, ' ', '')) LIKE CONCAT('%', :lead, '%'))
            GROUP BY l.idEquipo
            """)
    List<LeadGtrAgrupacionProjection> agruparRegistrosDiariosPorEquipo(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarLead") boolean filtrarLead,
            @Param("lead") String lead
    );

    @Query("""
            SELECT c.id AS idGrupo,
                   c.nombre AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            LEFT JOIN l.campana c
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND NOT EXISTS (
                    SELECT 1 FROM Evento anterior
                    WHERE anterior.idLead = e.idLead
                      AND anterior.accion = :accion
                      AND anterior.createdAt >= :inicio
                      AND anterior.createdAt < :fin
                      AND (
                            anterior.createdAt < e.createdAt
                            OR (anterior.createdAt = e.createdAt AND anterior.id < e.id)
                      )
              )
              AND (:filtrarLead = false OR LOWER(REPLACE(l.lead, ' ', '')) LIKE CONCAT('%', :lead, '%'))
            GROUP BY c.id, c.nombre
            """)
    List<LeadGtrAgrupacionProjection> agruparRegistrosDiariosPorCampana(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarLead") boolean filtrarLead,
            @Param("lead") String lead
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   l.primeraCodigoTipificacion AS codigoTipificacion,
                   l.primeraCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND NOT EXISTS (
                    SELECT 1 FROM Evento anterior
                    WHERE anterior.idLead = e.idLead
                      AND anterior.accion = :accion
                      AND anterior.createdAt >= :inicio
                      AND anterior.createdAt < :fin
                      AND (
                            anterior.createdAt < e.createdAt
                            OR (anterior.createdAt = e.createdAt AND anterior.id < e.id)
                      )
              )
              AND (:filtrarLead = false OR LOWER(REPLACE(l.lead, ' ', '')) LIKE CONCAT('%', :lead, '%'))
            GROUP BY l.primeraCodigoTipificacion, l.primeraCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparRegistrosDiariosPorPrimeraTipificacion(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarLead") boolean filtrarLead,
            @Param("lead") String lead
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   l.codigoTipificacion AS codigoTipificacion,
                   l.codigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND NOT EXISTS (
                    SELECT 1 FROM Evento anterior
                    WHERE anterior.idLead = e.idLead
                      AND anterior.accion = :accion
                      AND anterior.createdAt >= :inicio
                      AND anterior.createdAt < :fin
                      AND (
                            anterior.createdAt < e.createdAt
                            OR (anterior.createdAt = e.createdAt AND anterior.id < e.id)
                      )
              )
              AND (:filtrarLead = false OR LOWER(REPLACE(l.lead, ' ', '')) LIKE CONCAT('%', :lead, '%'))
            GROUP BY l.codigoTipificacion, l.codigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparRegistrosDiariosPorUltimaTipificacion(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarLead") boolean filtrarLead,
            @Param("lead") String lead
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.RegistroDiarioLeadResponse(
                       e.createdAt,
                       e.nombreActor,
                       c.nombre)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            LEFT JOIN Campana c ON c.id = e.idCampana
            WHERE e.idLead = :idLead
              AND e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            ORDER BY e.createdAt ASC, e.id ASC
            """)
    List<RegistroDiarioLeadResponse> listarRegistrosDiariosDeLead(
            @Param("idLead") Long idLead,
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT COUNT(e.id)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND (:filtrarLead = false OR LOWER(REPLACE(l.lead, ' ', '')) LIKE CONCAT('%', :lead, '%'))
            """)
    long contarRegistrosDiarios(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarLead") boolean filtrarLead,
            @Param("lead") String lead
    );

    @Query("""
            SELECT e.idLead, COUNT(e.id)
            FROM Evento e
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND e.idLead IN :idsLead
            GROUP BY e.idLead
            """)
    List<Object[]> contarRegistrosDiariosPorLead(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("idsLead") Collection<Long> idsLead
    );

    Optional<Evento> findTopByIdLeadAndAccionOrderByCreatedAtDesc(Long idLead, Accion accion);

    Optional<Evento> findTopByIdLeadAndIdActorAndAccionInOrderByCreatedAtDesc(
            Long idLead,
            Long idActor,
            Collection<Accion> acciones
    );

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
            SELECT COUNT(e)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
            """)
    long contarIngresosGtr(
            @Param("accion") Accion accion,
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
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
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
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
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
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
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
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT e.idAsesorAsignado AS idAsesor,
                   e.nombreAsesorAsignado AS nombreAsesor,
                   COUNT(DISTINCT e.idLead) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.idAsesorAsignado IS NOT NULL
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = e.idAsesorAsignado
                                AND la.etapa = 'PREVENTA'))
            GROUP BY e.idAsesorAsignado, e.nombreAsesorAsignado
            """)
    List<AsesorCantidadProjection> resumirAsignacionesPorAsesorDestinoGtr(
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT e.idActor AS idAsesor,
                   e.nombreActor AS nombreAsesor,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = e.idActor
                                AND la.etapa = 'PREVENTA'))
            GROUP BY e.idActor, e.nombreActor
            """)
    List<AsesorCantidadProjection> resumirNuevasOportunidadesPorAsesorGtr(
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT e.idCampana AS idCampana,
                   c.nombre AS nombreCampana,
                   e.tipificacion AS tipificacion,
                   e.subtipificacion AS subtipificacion,
                   COUNT(DISTINCT e.idLead) AS cantidad
            FROM Evento e
            JOIN Campana c ON c.id = e.idCampana
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND e.idCampana IS NOT NULL
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:soloActivos = false OR c.activo = true)
            GROUP BY e.idCampana, c.nombre, e.tipificacion, e.subtipificacion
            """)
    List<CampanaTipificacionCantidadProjection> resumirTipificacionesPorCampanaGtr(
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT TRIM(e.tipificacion) AS tipificacion,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND e.tipificacion IS NOT NULL
              AND TRIM(e.tipificacion) <> ''
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = e.idActor
                                AND la.etapa = 'PREVENTA'))
            GROUP BY TRIM(e.tipificacion)
            """)
    List<TipificacionCantidadProjection> resumirTipificacionesRankingGtr(
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COALESCE(NULLIF(TRIM(e.subtipificacion), ''), 'SIN_SUBTIPIFICACION') AS subtipificacion,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND TRIM(e.tipificacion) = :tipificacion
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = e.idActor
                                AND la.etapa = 'PREVENTA'))
            GROUP BY COALESCE(NULLIF(TRIM(e.subtipificacion), ''), 'SIN_SUBTIPIFICACION')
            """)
    List<SubtipificacionCantidadProjection> resumirSubtipificacionesRankingGtr(
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );
}
