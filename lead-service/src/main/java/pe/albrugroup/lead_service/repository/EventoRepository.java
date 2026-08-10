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
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadDiarioResponse;
import pe.albrugroup.lead_service.entity.response.RegistroDiarioLeadResponse;
import pe.albrugroup.lead_service.repository.projection.AsesorCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorProveedorCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorUltimoEventoProjection;
import pe.albrugroup.lead_service.repository.projection.CampanaTipificacionCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.LeadGtrAgrupacionProjection;
import pe.albrugroup.lead_service.repository.projection.LeadUltimaAsignacionProjection;

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

    long countByIdLead(Long idLead);

    @Modifying
    @Query("UPDATE Evento e SET e.idCampana = :idCampana WHERE e.idLead = :idLead")
    int actualizarCampanaPorLead(@Param("idLead") Long idLead, @Param("idCampana") Long idCampana);

    @Modifying
    @Query("""
            UPDATE Evento e
            SET e.idCampana = :idCampana
            WHERE e.idLead = :idLead
              AND (
                    e.createdAt > :desde
                    OR (e.createdAt = :desde AND e.id >= :idEventoDesde)
              )
            """)
    int actualizarCampanaPorLeadDesdeEvento(
            @Param("idLead") Long idLead,
            @Param("idCampana") Long idCampana,
            @Param("desde") Instant desde,
            @Param("idEventoDesde") Long idEventoDesde
    );

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
    Optional<Evento> findTopByIdLeadAndAccionOrderByCreatedAtDescIdDesc(Long idLead, Accion accion);
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
    // Orden cronologico ascendente para el replay del backfill de LeadEtapaResumen.
    List<Evento> findAllByIdLeadOrderByCreatedAtAscIdAsc(Long idLead);

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
                       l.usermeta,
                       e.nombreActor,
                       e.rolActor,
                       e.accion,
                       e.createdAt,
                       l.idEquipo,
                       c.nombre,
                        r.primeraCodigoTipificacion,
                        r.primeraCodigoSubtipificacion,
                        r.mayorRangoCodigoTipificacion,
                        r.mayorRangoCodigoSubtipificacion,
                        r.ultimaCodigoTipificacion,
                        r.ultimaCodigoSubtipificacion,
                       r.nombreAsesorUltimaGestion,
                       NULL,
                       CAST(COALESCE(r.totalAsignaciones, 0) AS long),
                       0L)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            LEFT JOIN l.campana c
            LEFT JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            LEFT JOIN Tipificacion tPrimera ON tPrimera.codigo = r.primeraCodigoTipificacion AND tPrimera.etapa = :etapaResumen AND tPrimera.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sPrimera ON sPrimera.tipificacion = tPrimera AND sPrimera.codigo = r.primeraCodigoSubtipificacion
            LEFT JOIN Tipificacion tMayor ON tMayor.codigo = r.mayorRangoCodigoTipificacion AND tMayor.etapa = :etapaResumen AND tMayor.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sMayor ON sMayor.tipificacion = tMayor AND sMayor.codigo = r.mayorRangoCodigoSubtipificacion
            LEFT JOIN Tipificacion tUltima ON tUltima.codigo = r.ultimaCodigoTipificacion AND tUltima.etapa = :etapaResumen AND tUltima.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sUltima ON sUltima.tipificacion = tUltima AND sUltima.codigo = r.ultimaCodigoSubtipificacion
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
              AND (
                    :filtrarLead = false
                    OR LOWER(REPLACE(COALESCE(l.lead, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
                    OR LOWER(REPLACE(COALESCE(l.usermeta, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
              )
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
                        AND r.primeraCodigoTipificacion IS NULL
                        AND r.primeraCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND r.primeraCodigoTipificacion = :codigoTipificacion
                        AND (
                            (:codigoSubtipificacion IS NULL AND r.primeraCodigoSubtipificacion IS NULL)
                            OR r.primeraCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
              AND (
                    :filtrarUltimaTipificacion = false
                    OR (
                        :sinValor = true
                        AND r.ultimaCodigoTipificacion IS NULL
                        AND r.ultimaCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND r.ultimaCodigoTipificacion = :codigoTipificacion
                        AND (
                            (:codigoSubtipificacion IS NULL AND r.ultimaCodigoSubtipificacion IS NULL)
                            OR r.ultimaCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
              AND (
                    :filtrarMayorTipificacion = false
                    OR (
                        :sinValor = true
                        AND r.mayorRangoCodigoTipificacion IS NULL
                        AND r.mayorRangoCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND r.mayorRangoCodigoTipificacion = :codigoTipificacion
                        AND (
                            (:codigoSubtipificacion IS NULL AND r.mayorRangoCodigoSubtipificacion IS NULL)
                            OR r.mayorRangoCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
            ORDER BY
              CASE WHEN :sortBy = 'createdAt' AND :sortDesc = false THEN e.createdAt END ASC,
              CASE WHEN :sortBy = 'createdAt' AND :sortDesc = true THEN e.createdAt END DESC,
              CASE WHEN :sortBy = 'totalAsignacionesDia' AND :sortDesc = false THEN COALESCE(r.totalAsignaciones, 0) END ASC,
              CASE WHEN :sortBy = 'totalAsignacionesDia' AND :sortDesc = true THEN COALESCE(r.totalAsignaciones, 0) END DESC,

              CASE WHEN :sortBy = 'primeraTipificacion' THEN CASE WHEN tPrimera.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN tPrimera.orden END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN tPrimera.orden END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN sPrimera.orden END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN sPrimera.orden END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN r.primeraCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN r.primeraCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN r.primeraCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN r.primeraCodigoSubtipificacion END DESC,

              CASE WHEN :sortBy = 'mayorTipificacion' THEN CASE WHEN tMayor.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN tMayor.orden END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN tMayor.orden END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN sMayor.orden END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN sMayor.orden END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN r.mayorRangoCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN r.mayorRangoCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN r.mayorRangoCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN r.mayorRangoCodigoSubtipificacion END DESC,

              CASE WHEN :sortBy = 'ultimaTipificacion' THEN CASE WHEN tUltima.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN tUltima.orden END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN tUltima.orden END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN sUltima.orden END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN sUltima.orden END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN r.ultimaCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN r.ultimaCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN r.ultimaCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN r.ultimaCodigoSubtipificacion END DESC,

              e.createdAt DESC,
              e.id DESC,
              l.id DESC
            """,
            countQuery = """
            SELECT COUNT(e)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            LEFT JOIN l.campana c
            LEFT JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
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
              AND (
                    :filtrarLead = false
                    OR LOWER(REPLACE(COALESCE(l.lead, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
                    OR LOWER(REPLACE(COALESCE(l.usermeta, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
              )
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
                        AND r.primeraCodigoTipificacion IS NULL
                        AND r.primeraCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND r.primeraCodigoTipificacion = :codigoTipificacion
                        AND (
                            (:codigoSubtipificacion IS NULL AND r.primeraCodigoSubtipificacion IS NULL)
                            OR r.primeraCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
              AND (
                    :filtrarUltimaTipificacion = false
                    OR (
                        :sinValor = true
                        AND r.ultimaCodigoTipificacion IS NULL
                        AND r.ultimaCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND r.ultimaCodigoTipificacion = :codigoTipificacion
                        AND (
                            (:codigoSubtipificacion IS NULL AND r.ultimaCodigoSubtipificacion IS NULL)
                            OR r.ultimaCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
              AND (
                    :filtrarMayorTipificacion = false
                    OR (
                        :sinValor = true
                        AND r.mayorRangoCodigoTipificacion IS NULL
                        AND r.mayorRangoCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND r.mayorRangoCodigoTipificacion = :codigoTipificacion
                        AND (
                            (:codigoSubtipificacion IS NULL AND r.mayorRangoCodigoSubtipificacion IS NULL)
                            OR r.mayorRangoCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
            """)
    Page<LeadDiarioResponse> listarRegistrosDiarios(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("filtrarCampana") boolean filtrarCampana,
            @Param("filtrarEquipo") boolean filtrarEquipo,
            @Param("filtrarPrimeraTipificacion") boolean filtrarPrimeraTipificacion,
            @Param("filtrarMayorTipificacion") boolean filtrarMayorTipificacion,
            @Param("filtrarUltimaTipificacion") boolean filtrarUltimaTipificacion,
            @Param("idGrupo") Long idGrupo,
            @Param("codigoTipificacion") String codigoTipificacion,
            @Param("codigoSubtipificacion") String codigoSubtipificacion,
            @Param("filtrarLead") boolean filtrarLead,
            @Param("lead") String lead,
            @Param("sinValor") boolean sinValor,
            @Param("sortBy") String sortBy,
            @Param("sortDesc") boolean sortDesc,
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
              AND (
                    :filtrarLead = false
                    OR LOWER(REPLACE(COALESCE(l.lead, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
                    OR LOWER(REPLACE(COALESCE(l.usermeta, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
              )
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
              AND (
                    :filtrarLead = false
                    OR LOWER(REPLACE(COALESCE(l.lead, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
                    OR LOWER(REPLACE(COALESCE(l.usermeta, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
              )
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
              AND (
                    :filtrarLead = false
                    OR LOWER(REPLACE(COALESCE(l.lead, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
                    OR LOWER(REPLACE(COALESCE(l.usermeta, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
              )
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
                   r.primeraCodigoTipificacion AS codigoTipificacion,
                   r.primeraCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            LEFT JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = e.etapa
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
              AND (
                    :filtrarLead = false
                    OR LOWER(REPLACE(COALESCE(l.lead, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
                    OR LOWER(REPLACE(COALESCE(l.usermeta, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
              )
            GROUP BY r.primeraCodigoTipificacion, r.primeraCodigoSubtipificacion
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
                   r.mayorRangoCodigoTipificacion AS codigoTipificacion,
                   r.mayorRangoCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            LEFT JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = e.etapa
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
              AND (
                    :filtrarLead = false
                    OR LOWER(REPLACE(COALESCE(l.lead, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
                    OR LOWER(REPLACE(COALESCE(l.usermeta, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
              )
            GROUP BY r.mayorRangoCodigoTipificacion, r.mayorRangoCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparRegistrosDiariosPorMayorTipificacion(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarLead") boolean filtrarLead,
            @Param("lead") String lead
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.ultimaCodigoTipificacion AS codigoTipificacion,
                   r.ultimaCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(e.id) AS cantidad
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            LEFT JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = e.etapa
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
              AND (
                    :filtrarLead = false
                    OR LOWER(REPLACE(COALESCE(l.lead, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
                    OR LOWER(REPLACE(COALESCE(l.usermeta, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
              )
            GROUP BY r.ultimaCodigoTipificacion, r.ultimaCodigoSubtipificacion
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
              AND (
                    :filtrarLead = false
                    OR LOWER(REPLACE(COALESCE(l.lead, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
                    OR LOWER(REPLACE(COALESCE(l.usermeta, ''), ' ', '')) LIKE CONCAT('%', :lead, '%')
              )
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

    // --- Métricas de "Leads del día" (día completo, scope por equipo vía JOIN Lead) ---

    // B: leads únicos registrados en el día.
    @Query("""
            SELECT COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            """)
    long contarLeadsUnicosDiarios(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // D: leads con más de un registro en el día. Devuelve una fila por lead repetido; su tamaño = D.
    @Query("""
            SELECT e.idLead
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            GROUP BY e.idLead
            HAVING COUNT(e.id) > 1
            """)
    List<Long> listarLeadsDiariosConRepeticion(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // F: leads registrados hoy que tienen última tipificación en su resumen de la etapa indicada.
    @Query("""
            SELECT COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.ultimaCodigoTipificacion IS NOT NULL
            """)
    long contarLeadsDiariosTipificados(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // G: leads registrados hoy agrupados por el orden de su última tipificación (para los bloques).
    @Query("""
            SELECT r.ultimaTipificacionOrden, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.ultimaTipificacionOrden IS NOT NULL
            GROUP BY r.ultimaTipificacionOrden
            """)
    List<Object[]> agruparLeadsDiariosPorOrdenUltimaTipificacion(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // H: leads registrados hoy cuya última tipificación de la etapa es la preventa. La subtipi no
    // discrimina: COMPLETA, INCOMPLETA, DESAPROBADA y los PENDIENTE son la misma preventa con matices.
    @Query("""
            SELECT COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.ultimaCodigoTipificacion = :codigoTipificacion
            """)
    long contarLeadsDiariosPorUltimaTipificacion(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("codigoTipificacion") String codigoTipificacion
    );

    // --- Métricas de "Leads del día" DESGLOSADAS por equipo (idEquipo null = "Sin equipo") ---

    // A + B por equipo: [idEquipo, registros, leadsUnicos].
    @Query("""
            SELECT l.idEquipo, COUNT(e.id), COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            GROUP BY l.idEquipo
            """)
    List<Object[]> metricasBaseRegistrosDiariosPorEquipo(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // D por equipo: filas [idEquipo, idLead] de leads con más de un registro; se cuenta por equipo.
    @Query("""
            SELECT l.idEquipo, e.idLead
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            GROUP BY l.idEquipo, e.idLead
            HAVING COUNT(e.id) > 1
            """)
    List<Object[]> listarLeadsDiariosConRepeticionPorEquipo(
            @Param("accion") Accion accion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // F por equipo: [idEquipo, leadsTipificados]. Una variante por punto de tipificación
    // (primera/última/mayor rango), igual que en LeadEtapaResumenRepository: JPQL no permite
    // parametrizar el nombre de la columna.
    @Query("""
            SELECT l.idEquipo, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.ultimaCodigoTipificacion IS NOT NULL
            GROUP BY l.idEquipo
            """)
    List<Object[]> contarLeadsDiariosTipificadosPorEquipoUltima(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.primeraCodigoTipificacion IS NOT NULL
            GROUP BY l.idEquipo
            """)
    List<Object[]> contarLeadsDiariosTipificadosPorEquipoPrimera(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.mayorRangoCodigoTipificacion IS NOT NULL
            GROUP BY l.idEquipo
            """)
    List<Object[]> contarLeadsDiariosTipificadosPorEquipoMayor(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // G por equipo: [idEquipo, orden, cantidad] para armar los bloques por equipo.
    @Query("""
            SELECT l.idEquipo, r.ultimaTipificacionOrden, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.ultimaTipificacionOrden IS NOT NULL
            GROUP BY l.idEquipo, r.ultimaTipificacionOrden
            """)
    List<Object[]> agruparLeadsDiariosPorOrdenPorEquipoUltima(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, r.primeraTipificacionOrden, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.primeraTipificacionOrden IS NOT NULL
            GROUP BY l.idEquipo, r.primeraTipificacionOrden
            """)
    List<Object[]> agruparLeadsDiariosPorOrdenPorEquipoPrimera(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, r.mayorRangoOrden, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.mayorRangoOrden IS NOT NULL
            GROUP BY l.idEquipo, r.mayorRangoOrden
            """)
    List<Object[]> agruparLeadsDiariosPorOrdenPorEquipoMayor(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // H por equipo: [idEquipo, leadsPreventa].
    @Query("""
            SELECT l.idEquipo, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.ultimaCodigoTipificacion = :codigoTipificacion
            GROUP BY l.idEquipo
            """)
    List<Object[]> contarLeadsDiariosVentaCerradaPorEquipoUltima(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("codigoTipificacion") String codigoTipificacion
    );

    @Query("""
            SELECT l.idEquipo, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.primeraCodigoTipificacion = :codigoTipificacion
            GROUP BY l.idEquipo
            """)
    List<Object[]> contarLeadsDiariosVentaCerradaPorEquipoPrimera(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("codigoTipificacion") String codigoTipificacion
    );

    @Query("""
            SELECT l.idEquipo, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = e.idLead AND r.etapa = :etapaResumen
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.mayorRangoCodigoTipificacion = :codigoTipificacion
            GROUP BY l.idEquipo
            """)
    List<Object[]> contarLeadsDiariosVentaCerradaPorEquipoMayor(
            @Param("accion") Accion accion,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("codigoTipificacion") String codigoTipificacion
    );

    // --- Modo GESTIONADOS: mide la OPERACIÓN del período, no la cohorte de ingesta ---

    /**
     * Cartera del período por equipo: leads que estuvieron disponibles para trabajar, es decir los
     * ingresados más los traídos de otros días (ASIGNACION). Se incluye TIPIFICACION como blindaje:
     * garantiza que los gestionados sean siempre un subconjunto de la cartera, de modo que el
     * indicador de gestión no pueda superar el 100% si algún lead se tipifica sin asignación previa.
     */
    @Query("""
            SELECT l.idEquipo, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion IN :acciones
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            GROUP BY l.idEquipo
            """)
    List<Object[]> contarCarteraDelPeriodoPorEquipo(
            @Param("acciones") Collection<Accion> acciones,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    /** Gestionados del período por equipo: leads con al menos una tipificación ocurrida en el rango. */
    @Query("""
            SELECT l.idEquipo, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.etapa = :etapa
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            GROUP BY l.idEquipo
            """)
    List<Object[]> contarGestionadosDelPeriodoPorEquipo(
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    /**
     * Preventas OCURRIDAS en el período por equipo. A diferencia del modo INGRESADOS, cuenta el
     * cierre por su fecha real: incluye leads traídos de otros días y excluye los que cerraron después.
     */
    @Query("""
            SELECT l.idEquipo, COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.etapa = :etapa
              AND e.tipificacion = :codigoTipificacion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            GROUP BY l.idEquipo
            """)
    List<Object[]> contarPreventasDelPeriodoPorEquipo(
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("codigoTipificacion") String codigoTipificacion
    );

    Optional<Evento> findTopByIdLeadAndAccionOrderByCreatedAtDesc(Long idLead, Accion accion);

    Optional<Evento> findTopByIdLeadAndAccionAndTipificacionOrderByCreatedAtDesc(Long idLead, Accion accion, String tipificacion);

    @Query(value = """
            SELECT e, l
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.idActor = :idAsesor
              AND e.accion = :accion
              AND e.etapa = :etapa
              AND EXISTS (
                  SELECT 1 FROM Subtipificacion sc
                  JOIN sc.tipificacion tc
                  WHERE tc.idEquipo = l.idEquipo
                    AND tc.etapa = e.etapa
                    AND tc.codigo = e.tipificacion
                    AND sc.codigo = e.subtipificacion
                    AND :comportamientoCierre MEMBER OF sc.comportamientos
              )
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
            ORDER BY e.createdAt DESC, e.id DESC
            """,
            countQuery = """
            SELECT COUNT(e)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.idActor = :idAsesor
              AND e.accion = :accion
              AND e.etapa = :etapa
              AND EXISTS (
                  SELECT 1 FROM Subtipificacion sc
                  JOIN sc.tipificacion tc
                  WHERE tc.idEquipo = l.idEquipo
                    AND tc.etapa = e.etapa
                    AND tc.codigo = e.tipificacion
                    AND sc.codigo = e.subtipificacion
                    AND :comportamientoCierre MEMBER OF sc.comportamientos
              )
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
            """)
    Page<Object[]> listarCierresMisPreventas(
            @Param("idAsesor") Long idAsesor,
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("comportamientoCierre") ComportamientoTipificacion comportamientoCierre,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            Pageable pageable
    );

    @Query("""
            SELECT e
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.idActor = :idAsesor
              AND e.accion = :accion
              AND e.etapa = :etapa
              AND EXISTS (
                  SELECT 1 FROM Subtipificacion sc
                  JOIN sc.tipificacion tc
                  WHERE tc.idEquipo = l.idEquipo
                    AND tc.etapa = e.etapa
                    AND tc.codigo = e.tipificacion
                    AND sc.codigo = e.subtipificacion
                    AND :comportamientoCierre MEMBER OF sc.comportamientos
              )
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
            ORDER BY e.createdAt DESC, e.id DESC
            """)
    List<Evento> listarCierresMisPreventasResumen(
            @Param("idAsesor") Long idAsesor,
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("comportamientoCierre") ComportamientoTipificacion comportamientoCierre,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
    );

    @Query("""
            SELECT MIN(e.createdAt)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.idLead = :idLead
              AND e.accion = :accion
              AND e.etapa = :etapa
              AND EXISTS (
                  SELECT 1 FROM Subtipificacion sc
                  JOIN sc.tipificacion tc
                  WHERE tc.idEquipo = l.idEquipo
                    AND tc.etapa = e.etapa
                    AND tc.codigo = e.tipificacion
                    AND sc.codigo = e.subtipificacion
                    AND :comportamientoCierre MEMBER OF sc.comportamientos
              )
              AND e.createdAt > :fechaCierre
            """)
    Optional<Instant> buscarFechaSiguienteCierrePreventa(
            @Param("idLead") Long idLead,
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("comportamientoCierre") ComportamientoTipificacion comportamientoCierre,
            @Param("fechaCierre") Instant fechaCierre
    );

    @Query("""
            SELECT e, s.etapaCambio
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN Tipificacion t ON t.etapa = e.etapa AND t.idEquipo = l.idEquipo AND t.codigo = e.tipificacion
            JOIN Subtipificacion s ON s.tipificacion = t AND s.codigo = e.subtipificacion
            WHERE e.idLead = :idLead
              AND e.accion = :accion
              AND e.etapa = :etapa
              AND e.createdAt > :fechaDesde
              AND e.createdAt < :fechaHasta
              AND s.etapaCambio IN :etapasDestino
            ORDER BY e.createdAt ASC, e.id ASC
            """)
    List<Object[]> buscarResultadoIntentoVenta(
            @Param("idLead") Long idLead,
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapasDestino") Collection<Etapa> etapasDestino,
            Pageable pageable
    );

    @Query("""
            SELECT e
            FROM Evento e
            WHERE e.idLead = :idLead
              AND e.accion = :accion
              AND e.etapa = :etapa
              AND e.createdAt > :fechaDesde
              AND e.createdAt < :fechaHasta
            ORDER BY e.createdAt DESC, e.id DESC
            """)
    List<Evento> buscarUltimaGestionVentaIntento(
            @Param("idLead") Long idLead,
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            Pageable pageable
    );

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
            SELECT e.idLead, e.nombreActor, e.createdAt
            FROM Evento e
            WHERE e.idLead IN :leadIds
              AND e.etapa = :etapa
              AND e.accion IN :acciones
              AND NOT EXISTS (
                    SELECT 1
                    FROM Evento posterior
                    WHERE posterior.idLead = e.idLead
                      AND posterior.etapa = :etapa
                      AND posterior.accion IN :acciones
                      AND (
                            posterior.createdAt > e.createdAt
                            OR (posterior.createdAt = e.createdAt AND posterior.id > e.id)
                      )
              )
            """)
    List<Object[]> listarUltimaGestionPorLeadIdsEtapaYAcciones(
            @Param("leadIds") Collection<Long> leadIds,
            @Param("etapa") Etapa etapa,
            @Param("acciones") Collection<Accion> acciones
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
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND EXISTS (
                  SELECT 1 FROM Subtipificacion sc
                  JOIN sc.tipificacion tc
                  WHERE tc.idEquipo = l.idEquipo
                    AND tc.etapa = e.etapa
                    AND tc.codigo = e.tipificacion
                    AND sc.codigo = e.subtipificacion
                    AND :comportamientoCierre MEMBER OF sc.comportamientos
              )
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarAsesores = false OR e.idActor IN :asesorIds)
            GROUP BY e.idActor, e.nombreActor
            """)
    List<AsesorCantidadProjection> resumirPreventasPorAsesor(
            @Param("accion") Accion accion,
            @Param("comportamientoCierre") ComportamientoTipificacion comportamientoCierre,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarAsesores") boolean filtrarAsesores,
            @Param("asesorIds") Collection<Long> asesorIds
    );

    @Query("""
            SELECT COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.etapa = :etapa
              AND e.accion IN :acciones
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND NOT EXISTS (
                  SELECT 1 FROM Subtipificacion sc
                  JOIN sc.tipificacion tc
                  WHERE tc.idEquipo = l.idEquipo
                    AND tc.etapa = e.etapa
                    AND tc.codigo = e.tipificacion
                    AND sc.codigo = e.subtipificacion
                    AND :comportamientoCierre MEMBER OF sc.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """)
    long contarGestionadosGtr(
            @Param("etapa") Etapa etapa,
            @Param("acciones") Collection<Accion> acciones,
            @Param("comportamientoCierre") ComportamientoTipificacion comportamientoCierre,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COUNT(e)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """)
    long contarIngresosGtr(
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.accion = :accion
              AND EXISTS (
                  SELECT 1 FROM Subtipificacion sc
                  JOIN sc.tipificacion tc
                  WHERE tc.idEquipo = l.idEquipo
                    AND tc.etapa = e.etapa
                    AND tc.codigo = e.tipificacion
                    AND sc.codigo = e.subtipificacion
                    AND :comportamientoCierre MEMBER OF sc.comportamientos
              )
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """)
    long contarPreventasGtr(
            @Param("accion") Accion accion,
            @Param("comportamientoCierre") ComportamientoTipificacion comportamientoCierre,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COUNT(DISTINCT e.idLead)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.idCampana = :idCampana
              AND e.accion = :accion
              AND EXISTS (
                  SELECT 1 FROM Subtipificacion sc
                  JOIN sc.tipificacion tc
                  WHERE tc.idEquipo = l.idEquipo
                    AND tc.etapa = e.etapa
                    AND tc.codigo = e.tipificacion
                    AND sc.codigo = e.subtipificacion
                    AND :comportamientoCierre MEMBER OF sc.comportamientos
              )
              AND e.createdAt >= :fechaDesde
              AND e.createdAt <= :fechaHasta
            """)
    long contarVentasCerradasPorCampanaYRango(
            @Param("idCampana") Long idCampana,
            @Param("accion") Accion accion,
            @Param("comportamientoCierre") ComportamientoTipificacion comportamientoCierre,
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
            JOIN Lead l ON l.id = e.idLead
            JOIN Plan pl ON pl.id = e.idPlanOfrecido
            JOIN pl.proveedor p
            WHERE e.accion = :accion
              AND EXISTS (
                  SELECT 1 FROM Subtipificacion sc
                  JOIN sc.tipificacion tc
                  WHERE tc.idEquipo = l.idEquipo
                    AND tc.etapa = e.etapa
                    AND tc.codigo = e.tipificacion
                    AND sc.codigo = e.subtipificacion
                    AND :comportamientoCierre MEMBER OF sc.comportamientos
              )
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarAsesores = false OR e.idActor IN :asesorIds)
            GROUP BY e.idActor, e.nombreActor, p.id, p.nombre
            """)
    List<AsesorProveedorCantidadProjection> resumirPreventasMensualesPorProveedor(
            @Param("accion") Accion accion,
            @Param("comportamientoCierre") ComportamientoTipificacion comportamientoCierre,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarAsesores") boolean filtrarAsesores,
            @Param("asesorIds") Collection<Long> asesorIds
    );

    // ── Queries específicos GTR (usan soloActivos con EXISTS para asesores) ────

    // Ids de actores que actuaron con un rol de la operación (ventas/GTR) en el período y scope.
    // Filtra el ranking de asesores para que NO aparezcan backoffice/migración/otros roles que hayan
    // tocado leads de PREVENTA sin ser parte de la operación.
    @Query("""
            SELECT DISTINCT e.idActor
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            WHERE e.idActor IS NOT NULL
              AND e.rolActor IN :rolesPermitidos
              AND e.createdAt >= :fechaDesde
              AND e.createdAt < :fechaHasta
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """)
    List<Long> idsAsesoresRankingGtr(
            @Param("rolesPermitidos") Collection<String> rolesPermitidos,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
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

    // Los rankings de tipificaciones/subtipificaciones GTR se mudaron a LeadRepository: ahora cuentan
    // LEADS distintos por su Tipificacion de Mayor Rango (LeadEtapaResumen), no eventos TIPIFICACION.
}
