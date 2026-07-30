package pe.albrugroup.lead_service.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.LeadResponse;
import pe.albrugroup.lead_service.repository.projection.AsesorCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorPreventaCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorProveedorPreventaProjection;
import pe.albrugroup.lead_service.repository.projection.LeadGtrAgrupacionProjection;
import pe.albrugroup.lead_service.repository.projection.HoraProgramadaCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.TipificacionCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.SubtipificacionCantidadProjection;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    Optional<Lead> findByPrefijoAndLead(String prefijo, String lead);
    // Dedup del intake tolerante a multi-titular: con varias oportunidades por teléfono+equipo
    // (hermanas), trabaja sobre la activa (lastEntryAt más reciente). El @Filter lo acota al equipo.
    Optional<Lead> findFirstByPrefijoAndLeadOrderByLastEntryAtDescIdDesc(String prefijo, String lead);
    // Intake: el lead PREVENTA del contacto (si existe) tiene prioridad para gestionarse;
    // si no hay PREVENTA, el más reciente en otra etapa se marca para atención GTR.
    Optional<Lead> findFirstByPrefijoAndLeadAndEtapaOrderByLastEntryAtDescIdDesc(String prefijo, String lead, Etapa etapa);
    // Oportunidades del mismo contacto (acotadas al equipo por @Filter): para multi-titular.
    List<Lead> findByContactoIdOrderByLastEntryAtDescIdDesc(Long idContacto);
    Optional<Lead> findFirstByLeadOrderByLastEntryAtDescIdDesc(String lead);

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH c.proveedor
            WHERE l.lead = :lead
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """)
    List<Lead> buscarCorreccionCampanaPorLead(@Param("lead") String lead);

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH c.proveedor
            WHERE l.id = :idLead
            """)
    Optional<Lead> buscarParaCorreccionCampana(@Param("idLead") Long idLead);

    @Query("SELECT l.id, l.lead FROM Lead l WHERE l.id IN :ids")
    List<Object[]> findLeadNumerosByIds(@Param("ids") Collection<Long> ids);
    Optional<Lead> findByIdAndIdAsesorAsignadoAndEtapa(Long id, Long idAsesorAsignado, Etapa etapa);
    // Lead asignado al asesor en cualquier etapa: para crear oportunidades y para la
    // tipificación informativa de un lead que sigue gestionándose en otra etapa.
    Optional<Lead> findByIdAndIdAsesorAsignado(Long id, Long idAsesorAsignado);
    Optional<Lead> findByIdAndIdAsesorAsignadoAndEtapaIn(Long id, Long idAsesorAsignado, Collection<Etapa> etapas);
    // Gestiones aparcadas del asesor: para topar cuántos leads puede tener EN_GESTION en paralelo.
    long countByIdAsesorAsignadoAndEstado(Long idAsesorAsignado, EstadoSeguimiento estado);
    long countByIdAsesorAsignadoAndEstadoAndEtapa(Long idAsesorAsignado, EstadoSeguimiento estado, Etapa etapa);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Lead> findByIdAndEtapa(Long id, Etapa etapa);

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.lastEntryAt,
                l.prefijo,
                l.lead,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                c.numeroWhatsApp,
                l.base,
                null,
                l.numeroDocumentoTitularServicioSnapshot,
                l.direccionSnapshot,
                r.primeraCodigoTipificacion,
                r.primeraCodigoSubtipificacion,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                r.ultimaCodigoTipificacion,
                r.ultimaCodigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreAsesorAsignado,
                l.estado,
                0L,
                false,
                false,
                false,
                l.etapa
            )
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE (l.etapa = :etapa OR l.requiereAtencionGtr = true)
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND l.lead LIKE :leadPattern
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            ORDER BY l.lastEntryAt DESC
            """)
    Page<LeadGtrResponse> listarBandejaGtr(
            @Param("etapa") Etapa etapa,
            @Param("leadPattern") String leadPattern,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.lastEntryAt,
                l.prefijo,
                l.lead,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                c.numeroWhatsApp,
                l.base,
                null,
                l.numeroDocumentoTitularServicioSnapshot,
                l.direccionSnapshot,
                r.primeraCodigoTipificacion,
                r.primeraCodigoSubtipificacion,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                r.ultimaCodigoTipificacion,
                r.ultimaCodigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreAsesorAsignado,
                l.estado,
                0L,
                false,
                false,
                false,
                l.etapa
            )
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND l.lead LIKE :leadPattern
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (
                    :filtrarAsesor = false
                    OR (:sinValor = true AND l.idAsesorAsignado IS NULL)
                    OR (:sinValor = false AND l.idAsesorAsignado = :idGrupo)
              )
              AND (
                    :filtrarEstado = false
                    OR (:sinValor = true AND l.estado IS NULL)
                    OR (:sinValor = false AND l.estado = :estadoGrupo)
              )
              AND (
                    :filtrarCampana = false
                    OR (:sinValor = true AND c.id IS NULL)
                    OR (:sinValor = false AND c.id = :idGrupo)
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
            ORDER BY l.lastEntryAt DESC
            """)
    Page<LeadGtrResponse> listarBandejaGtrFiltrada(
            @Param("etapa") Etapa etapa,
            @Param("leadPattern") String leadPattern,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("filtrarEstado") boolean filtrarEstado,
            @Param("filtrarCampana") boolean filtrarCampana,
            @Param("filtrarPrimeraTipificacion") boolean filtrarPrimeraTipificacion,
            @Param("filtrarUltimaTipificacion") boolean filtrarUltimaTipificacion,
            @Param("filtrarMayorTipificacion") boolean filtrarMayorTipificacion,
            @Param("idGrupo") Long idGrupo,
            @Param("estadoGrupo") EstadoSeguimiento estadoGrupo,
            @Param("codigoTipificacion") String codigoTipificacion,
            @Param("codigoSubtipificacion") String codigoSubtipificacion,
            @Param("sinValor") boolean sinValor,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query("""
            SELECT l.idAsesorAsignado AS idGrupo,
                   l.nombreAsesorAsignado AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY l.idAsesorAsignado, l.nombreAsesorAsignado
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorAsesor(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT c.id AS idGrupo,
                   c.nombre AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.campana c
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY c.id, c.nombre
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorCampana(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   CONCAT('', l.estado) AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY l.estado
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorEstado(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.primeraCodigoTipificacion AS codigoTipificacion,
                   r.primeraCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY r.primeraCodigoTipificacion, r.primeraCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorPrimeraTipificacion(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.mayorRangoCodigoTipificacion AS codigoTipificacion,
                   r.mayorRangoCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY r.mayorRangoCodigoTipificacion, r.mayorRangoCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorMayorTipificacion(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.primeraCodigoTipificacion AS codigoTipificacion,
                   r.primeraCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaResumen
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = :etapa)
              AND (r.ultimaCodigoTipificacion IS NULL OR r.ultimaCodigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (:filtrarTipificaciones = false OR r.primeraCodigoTipificacion IN :codigosTipificacion)
              AND (:filtrarSubtipificaciones = false OR r.primeraCodigoSubtipificacion IN :codigosSubtipificacion)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:filtrarFechaDesde = false OR l.lastEntryAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.lastEntryAt < :fechaHasta)
            GROUP BY r.primeraCodigoTipificacion, r.primeraCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparLeadsMasivoPorPrimeraTipificacion(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") Etapa etapaResumen
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.mayorRangoCodigoTipificacion AS codigoTipificacion,
                   r.mayorRangoCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaResumen
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = :etapa)
              AND (r.ultimaCodigoTipificacion IS NULL OR r.ultimaCodigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (:filtrarTipificaciones = false OR r.mayorRangoCodigoTipificacion IN :codigosTipificacion)
              AND (:filtrarSubtipificaciones = false OR r.mayorRangoCodigoSubtipificacion IN :codigosSubtipificacion)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:filtrarFechaDesde = false OR l.lastEntryAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.lastEntryAt < :fechaHasta)
            GROUP BY r.mayorRangoCodigoTipificacion, r.mayorRangoCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparLeadsMasivoPorMayorTipificacion(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") Etapa etapaResumen
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.ultimaCodigoTipificacion AS codigoTipificacion,
                   r.ultimaCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY r.ultimaCodigoTipificacion, r.ultimaCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorUltimaTipificacion(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT l
            FROM Lead l
            WHERE l.idAsesorAsignado IS NOT NULL
              AND l.etapa = :etapa
              AND l.estado IN :estados
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            ORDER BY l.idAsesorAsignado ASC, l.lastEntryAt DESC
            """)
    List<Lead> listarPendientesGtrPorAsesor(
            @Param("etapa") Etapa etapa,
            @Param("estados") Collection<EstadoSeguimiento> estados,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    long countByEtapaAndEstadoAndLastEntryAtGreaterThanEqualAndLastEntryAtLessThan(
            Etapa etapa,
            EstadoSeguimiento estado,
            Instant inicioDia,
            Instant finDia
    );

    @Query("""
            SELECT COUNT(l)
            FROM Lead l
            WHERE l.etapa = :etapa
              AND l.estado = :estado
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """)
    long contarMetricasGtrPorEstado(
            @Param("etapa") Etapa etapa,
            @Param("estado") EstadoSeguimiento estado,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COUNT(DISTINCT l.id)
            FROM Lead l
            WHERE l.campana.id = :idCampana
              AND l.lastEntryAt >= :fechaDesde
              AND l.lastEntryAt <= :fechaHasta
            """)
    long contarLeadsRealesPorCampanaYRango(
            @Param("idCampana") Long idCampana,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
    );

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.datosPreventa
            LEFT JOIN FETCH l.direccion
            WHERE l.idAsesorAsignado = :idAsesor
              AND l.estado IN :estados
              AND (
                    (l.etapa = :etapa
                        AND (
                            l.codigoTipificacion IS NULL
                            OR EXISTS (
                                SELECT 1
                                FROM Subtipificacion sa
                                JOIN sa.tipificacion ta
                                WHERE ta.idEquipo = l.idEquipo
                                  AND ta.etapa = l.etapa
                                  AND ta.codigo = l.codigoTipificacion
                                  AND sa.codigo = l.codigoSubtipificacion
                                  AND :comportamiento MEMBER OF sa.comportamientos
                            )
                        ))
                    OR l.requiereAtencionGtr = true
              )
            ORDER BY l.lastEntryAt DESC
            """)
    Page<Lead> listarPendientesAsesorVentas(
            @Param("idAsesor") Long idAsesor,
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("estados") Collection<EstadoSeguimiento> estados,
            Pageable pageable
    );

    @Query("""
            SELECT l.idAsesorAsignado AS idAsesor,
                   l.nombreAsesorAsignado AS nombreAsesor,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            WHERE l.idAsesorAsignado IS NOT NULL
              AND l.etapa = :etapa
              AND l.estado IN :estados
              AND (:filtrarAsesores = false OR l.idAsesorAsignado IN :asesorIds)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY l.idAsesorAsignado, l.nombreAsesorAsignado
            """)
    List<AsesorCantidadProjection> resumirAsignadosActualesPorAsesor(
            @Param("etapa") Etapa etapa,
            @Param("estados") Collection<EstadoSeguimiento> estados,
            @Param("filtrarAsesores") boolean filtrarAsesores,
            @Param("asesorIds") Collection<Long> asesorIds,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.prefijo,
                l.lead,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                l.base,
                dp.nombreTitularServicio,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                l.nombreAsesorAsignado,
                e.nombreActor,
                l.estado,
                0L,
                e.createdAt,
                e.comentario,
                e.horaProgramada,
                e.fechaProgramacion
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
            ORDER BY e.fechaProgramacion ASC, e.horaProgramada ASC, e.createdAt ASC
            """)
    Page<LeadAgendadoGtrResponse> listarLeadsAgendadosGtrPorHoraAsc(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.prefijo,
                l.lead,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                l.base,
                dp.nombreTitularServicio,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                l.nombreAsesorAsignado,
                e.nombreActor,
                l.estado,
                0L,
                e.createdAt,
                e.comentario,
                e.horaProgramada,
                e.fechaProgramacion
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
            ORDER BY e.fechaProgramacion DESC, e.horaProgramada DESC, e.createdAt DESC
            """)
    Page<LeadAgendadoGtrResponse> listarLeadsAgendadosGtrPorHoraDesc(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.prefijo,
                l.lead,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                l.base,
                dp.nombreTitularServicio,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                l.nombreAsesorAsignado,
                e.nombreActor,
                l.estado,
                0L,
                e.createdAt,
                e.comentario,
                e.horaProgramada,
                e.fechaProgramacion
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
            ORDER BY e.createdAt ASC
            """)
    Page<LeadAgendadoGtrResponse> listarLeadsAgendadosGtrPorAgendadoAsc(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.prefijo,
                l.lead,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                l.base,
                dp.nombreTitularServicio,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                l.nombreAsesorAsignado,
                e.nombreActor,
                l.estado,
                0L,
                e.createdAt,
                e.comentario,
                e.horaProgramada,
                e.fechaProgramacion
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
            ORDER BY e.createdAt DESC
            """)
    Page<LeadAgendadoGtrResponse> listarLeadsAgendadosGtrPorAgendadoDesc(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(l)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND EXISTS (
                  SELECT 1
                  FROM Evento e
                  WHERE e.idLead = l.id
                    AND e.accion = :accionTipificacion
                    AND e.tipificacion = r.mayorRangoCodigoTipificacion
                    AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND e.horaProgramada IS NOT NULL
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """)
    long contarAgendadosGtrActivos(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT e.horaProgramada AS horaProgramada, COUNT(l) AS cantidad
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
              AND e.fechaProgramacion = :hoy
            GROUP BY e.horaProgramada
            """)
    List<HoraProgramadaCantidadProjection> contarAgendadosGtrHoyPorHora(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("hoy") LocalDate hoy,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadResponse(
                l.id,
                l.prefijo,
                l.lead,
                l.etapa,
                l.estado,
                l.idAsesorAsignado,
                l.nombreAsesorAsignado,
                COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot),
                l.base,
                l.idTipificacion,
                l.codigoTipificacion,
                l.idSubtipificacion,
                l.codigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreProveedorSnapshot,
                l.precioPlanSnapshot,
                l.nombrePromocionInternaSnapshot,
                l.precioAdicionalesSnapshot,
                l.precioFinal,
                l.diaCorteFacturacion,
                l.mesesPermanenciaSnapshot,
                l.createdAt,
                l.lastEntryAt,
                r.fechaIngresoEtapa,
                l.updatedAt,
                l.sec,
                l.sot,
                COALESCE(pp.requiereSecSotVenta, cp.requiereSecSotVenta, fp.requiereSecSotVenta, false),
                r.nombreAsesorUltimaGestion,
                r.fechaUltimaGestion,
                0L,
                null,
                null,
                inter.velocidad,
                inter.unidad,
                pl.velocidadPromocional,
                pl.mesesPromocionVelocidad,
                (SELECT MAX(ev.createdAt) FROM Evento ev
                    WHERE ev.idLead = l.id
                      AND ev.accion = :accionTipificacion)
            )
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.plan pl
            LEFT JOIN pl.proveedor pp
            LEFT JOIN pl.internet inter
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor cp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN EquipoProveedor epFallback
                ON epFallback.idEquipo = l.idEquipo
               AND epFallback.fallbackLeadSinCampana = true
            LEFT JOIN epFallback.proveedor fp
            WHERE l.etapa = :etapa
              AND (:filtrarVentana = false OR COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :inicioVentana)
              AND (
                    :leadPattern = '%'
                    OR l.lead LIKE :leadPattern
                    OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :leadPattern
              )
              AND (
                    :filtrarGrupo = false
                    OR (:tipoGrupo = 'ESTADO'
                        AND ((:sinValor = true AND l.estado IS NULL) OR CONCAT('', l.estado) IN :valoresGrupo))
                    OR (:tipoGrupo = 'PROVEEDOR'
                        AND ((:sinValor = true AND COALESCE(l.nombreProveedorSnapshot, '') = '') OR l.nombreProveedorSnapshot IN :valoresGrupo))
                    OR (:tipoGrupo = 'PLAN'
                        AND ((:sinValor = true AND COALESCE(l.nombrePlanSnapshot, '') = '') OR l.nombrePlanSnapshot IN :valoresGrupo))
                    OR (:tipoGrupo = 'ULTIMO_GESTOR'
                        AND ((:sinValor = true AND COALESCE(r.nombreAsesorUltimaGestion, '') = '') OR r.nombreAsesorUltimaGestion IN :valoresGrupo))
                    OR (:tipoGrupo = 'TIPIFICACION'
                        AND ((:sinValor = true AND COALESCE(l.codigoTipificacion, '') = '') OR l.codigoTipificacion IN :valoresGrupo))
              )
            ORDER BY COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) DESC,
                     l.id DESC
            """)
    Page<LeadResponse> listarBandejaVenta(
            @Param("etapa") Etapa etapa,
            @Param("leadPattern") String leadPattern,
            @Param("filtrarVentana") boolean filtrarVentana,
            @Param("inicioVentana") Instant inicioVentana,
            @Param("filtrarGrupo") boolean filtrarGrupo,
            @Param("tipoGrupo") String tipoGrupo,
            @Param("valoresGrupo") Collection<String> valoresGrupo,
            @Param("sinValor") boolean sinValor,
            @Param("accionTipificacion") Accion accionTipificacion,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadResponse(
                l.id,
                l.prefijo,
                l.lead,
                l.etapa,
                l.estado,
                l.idAsesorAsignado,
                l.nombreAsesorAsignado,
                COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot),
                l.base,
                l.idTipificacion,
                l.codigoTipificacion,
                l.idSubtipificacion,
                l.codigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreProveedorSnapshot,
                l.precioPlanSnapshot,
                l.nombrePromocionInternaSnapshot,
                l.precioAdicionalesSnapshot,
                l.precioFinal,
                l.diaCorteFacturacion,
                l.mesesPermanenciaSnapshot,
                l.createdAt,
                l.lastEntryAt,
                r.fechaIngresoEtapa,
                l.updatedAt,
                l.sec,
                l.sot,
                COALESCE(pp.requiereSecSotVenta, cp.requiereSecSotVenta, fp.requiereSecSotVenta, false),
                r.nombreAsesorUltimaGestion,
                r.fechaUltimaGestion,
                0L,
                null,
                null,
                inter.velocidad,
                inter.unidad,
                pl.velocidadPromocional,
                pl.mesesPromocionVelocidad,
                (SELECT MAX(ev.createdAt) FROM Evento ev
                    WHERE ev.idLead = l.id
                      AND ev.accion = :accionTipificacion)
            )
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.plan pl
            LEFT JOIN pl.proveedor pp
            LEFT JOIN pl.internet inter
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor cp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN EquipoProveedor epFallback
                ON epFallback.idEquipo = l.idEquipo
               AND epFallback.fallbackLeadSinCampana = true
            LEFT JOIN epFallback.proveedor fp
            WHERE l.etapa = :etapa
              AND l.idAsesorAsignado = :idAsesor
              AND (
                    :searchPattern = '%'
                    OR l.lead LIKE :searchPattern
                    OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
              )
              AND (
                    :filtrarGrupo = false
                    OR (:tipoGrupo = 'ESTADO'
                        AND ((:sinValor = true AND l.estado IS NULL) OR CONCAT('', l.estado) IN :valoresGrupo))
                    OR (:tipoGrupo = 'PROVEEDOR'
                        AND ((:sinValor = true AND COALESCE(l.nombreProveedorSnapshot, '') = '') OR l.nombreProveedorSnapshot IN :valoresGrupo))
                    OR (:tipoGrupo = 'PLAN'
                        AND ((:sinValor = true AND COALESCE(l.nombrePlanSnapshot, '') = '') OR l.nombrePlanSnapshot IN :valoresGrupo))
                    OR (:tipoGrupo = 'ULTIMO_GESTOR'
                        AND ((:sinValor = true AND COALESCE(r.nombreAsesorUltimaGestion, '') = '') OR r.nombreAsesorUltimaGestion IN :valoresGrupo))
                    OR (:tipoGrupo = 'TIPIFICACION'
                        AND ((:sinValor = true AND COALESCE(l.codigoTipificacion, '') = '') OR l.codigoTipificacion IN :valoresGrupo))
              )
            ORDER BY CASE WHEN l.codigoTipificacion IS NULL THEN 0 ELSE 1 END,
                     l.codigoTipificacion,
                     l.codigoSubtipificacion,
                     l.lastEntryAt DESC,
                     l.id DESC
            """)
    Page<LeadResponse> listarLeadsAsignadosPorEtapaYAsesor(
            @Param("etapa") Etapa etapa,
            @Param("idAsesor") Long idAsesor,
            @Param("searchPattern") String searchPattern,
            @Param("filtrarGrupo") boolean filtrarGrupo,
            @Param("tipoGrupo") String tipoGrupo,
            @Param("valoresGrupo") Collection<String> valoresGrupo,
            @Param("sinValor") boolean sinValor,
            @Param("accionTipificacion") Accion accionTipificacion,
            Pageable pageable
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   CONCAT('', l.estado) AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND (:filtrarAsesor = false OR l.idAsesorAsignado = :idAsesor)
              AND (:filtrarVentana = false OR COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :inicioVentana)
              AND (
                    :searchPattern = '%'
                    OR l.lead LIKE :searchPattern
                    OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
              )
            GROUP BY l.estado
            """)
    List<LeadGtrAgrupacionProjection> agruparVentaPorEstado(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("filtrarVentana") boolean filtrarVentana,
            @Param("inicioVentana") Instant inicioVentana,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("idAsesor") Long idAsesor
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   l.nombreProveedorSnapshot AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND (:filtrarAsesor = false OR l.idAsesorAsignado = :idAsesor)
              AND (:filtrarVentana = false OR COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :inicioVentana)
              AND (
                    :searchPattern = '%'
                    OR l.lead LIKE :searchPattern
                    OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
              )
            GROUP BY l.nombreProveedorSnapshot
            """)
    List<LeadGtrAgrupacionProjection> agruparVentaPorProveedor(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("filtrarVentana") boolean filtrarVentana,
            @Param("inicioVentana") Instant inicioVentana,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("idAsesor") Long idAsesor
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   l.nombrePlanSnapshot AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND (:filtrarAsesor = false OR l.idAsesorAsignado = :idAsesor)
              AND (:filtrarVentana = false OR COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :inicioVentana)
              AND (
                    :searchPattern = '%'
                    OR l.lead LIKE :searchPattern
                    OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
              )
            GROUP BY l.nombrePlanSnapshot
            """)
    List<LeadGtrAgrupacionProjection> agruparVentaPorPlan(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("filtrarVentana") boolean filtrarVentana,
            @Param("inicioVentana") Instant inicioVentana,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("idAsesor") Long idAsesor
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   r.nombreAsesorUltimaGestion AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND (:filtrarAsesor = false OR l.idAsesorAsignado = :idAsesor)
              AND (:filtrarVentana = false OR COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :inicioVentana)
              AND (
                    :searchPattern = '%'
                    OR l.lead LIKE :searchPattern
                    OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
              )
            GROUP BY r.nombreAsesorUltimaGestion
            """)
    List<LeadGtrAgrupacionProjection> agruparVentaPorUltimoGestor(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("filtrarVentana") boolean filtrarVentana,
            @Param("inicioVentana") Instant inicioVentana,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("idAsesor") Long idAsesor
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   l.codigoTipificacion AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND (:filtrarAsesor = false OR l.idAsesorAsignado = :idAsesor)
              AND (:filtrarVentana = false OR COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :inicioVentana)
              AND (
                    :searchPattern = '%'
                    OR l.lead LIKE :searchPattern
                    OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
              )
            GROUP BY l.codigoTipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparVentaPorTipificacion(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("filtrarVentana") boolean filtrarVentana,
            @Param("inicioVentana") Instant inicioVentana,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("idAsesor") Long idAsesor
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadResponse(
                l.id,
                l.prefijo,
                l.lead,
                l.etapa,
                l.estado,
                l.idAsesorAsignado,
                l.nombreAsesorAsignado,
                COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot),
                l.base,
                l.idTipificacion,
                l.codigoTipificacion,
                l.idSubtipificacion,
                l.codigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreProveedorSnapshot,
                l.precioPlanSnapshot,
                l.nombrePromocionInternaSnapshot,
                l.precioAdicionalesSnapshot,
                l.precioFinal,
                l.diaCorteFacturacion,
                l.mesesPermanenciaSnapshot,
                l.createdAt,
                l.lastEntryAt,
                r.fechaIngresoEtapa,
                l.updatedAt,
                l.sec,
                l.sot,
                COALESCE(pp.requiereSecSotVenta, cp.requiereSecSotVenta, fp.requiereSecSotVenta, false),
                r.nombreAsesorUltimaGestion,
                r.fechaUltimaGestion,
                0L,
                e.fechaProgramacion,
                e.horaProgramada,
                inter.velocidad,
                inter.unidad,
                pl.velocidadPromocional,
                pl.mesesPromocionVelocidad,
                (SELECT MAX(ev.createdAt) FROM Evento ev
                    WHERE ev.idLead = l.id
                      AND ev.accion = :accionTipificacion)
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.plan pl
            LEFT JOIN pl.proveedor pp
            LEFT JOIN pl.internet inter
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor cp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN EquipoProveedor epFallback
                ON epFallback.idEquipo = l.idEquipo
               AND epFallback.fallbackLeadSinCampana = true
            LEFT JOIN epFallback.proveedor fp
            WHERE l.etapa = :etapa
              AND l.idAsesorAsignado = :idAsesor
              AND l.codigoTipificacion = :codigoProgramado
              AND (l.codigoSubtipificacion IS NULL OR l.codigoSubtipificacion <> :codigoProgramacionCancelada)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = :codigoProgramado
              AND e.fechaProgramacion IS NOT NULL
              AND e.horaProgramada IS NOT NULL
              AND e.fechaProgramacion >= :fechaActual
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = :codigoProgramado
              )
            ORDER BY e.fechaProgramacion ASC,
                     e.horaProgramada ASC,
                     e.createdAt ASC,
                     l.id ASC
            """)
    Page<LeadResponse> listarLeadsProgramadosVentaAsignados(
            @Param("etapa") Etapa etapa,
            @Param("idAsesor") Long idAsesor,
            @Param("codigoProgramado") String codigoProgramado,
            @Param("codigoProgramacionCancelada") String codigoProgramacionCancelada,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("fechaActual") java.time.LocalDate fechaActual,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT l
            FROM Lead l
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH c.proveedor
            LEFT JOIN FETCH l.datosPreventa
            LEFT JOIN FETCH l.direccion
            LEFT JOIN FETCH l.plan
            LEFT JOIN FETCH l.plan.proveedor
            LEFT JOIN FETCH l.plan.internet
            LEFT JOIN FETCH l.plan.television
            LEFT JOIN FETCH l.plan.telefono
            LEFT JOIN FETCH l.plan.zona
            LEFT JOIN FETCH l.plan.adicionales pa
            LEFT JOIN FETCH pa.adicional
            LEFT JOIN FETCH l.promocionInterna
            LEFT JOIN FETCH l.promocionInterna.proveedor
            LEFT JOIN FETCH l.promocionInterna.zona
            LEFT JOIN FETCH l.adicionales la
            LEFT JOIN FETCH la.adicional
            WHERE l.id = :idLead
              AND l.idAsesorAsignado = :idAsesor
              AND l.etapa = :etapa
            """)
    Optional<Lead> buscarDetalleAsesor(
            @Param("idLead") Long idLead,
            @Param("idAsesor") Long idAsesor,
            @Param("etapa") Etapa etapa
    );

    // Igual que buscarDetalleAsesor pero sin filtrar etapa: el asesor de PREVENTA también atiende
    // (en modo solo lectura) leads asignados que siguen en otra etapa (atención GTR).
    @Query("""
            SELECT DISTINCT l
            FROM Lead l
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH c.proveedor
            LEFT JOIN FETCH l.datosPreventa
            LEFT JOIN FETCH l.direccion
            LEFT JOIN FETCH l.plan
            LEFT JOIN FETCH l.plan.proveedor
            LEFT JOIN FETCH l.plan.internet
            LEFT JOIN FETCH l.plan.television
            LEFT JOIN FETCH l.plan.telefono
            LEFT JOIN FETCH l.plan.zona
            LEFT JOIN FETCH l.plan.adicionales pa
            LEFT JOIN FETCH pa.adicional
            LEFT JOIN FETCH l.promocionInterna
            LEFT JOIN FETCH l.promocionInterna.proveedor
            LEFT JOIN FETCH l.promocionInterna.zona
            LEFT JOIN FETCH l.adicionales la
            LEFT JOIN FETCH la.adicional
            WHERE l.id = :idLead
              AND l.idAsesorAsignado = :idAsesor
            """)
    Optional<Lead> buscarDetalleAsesorCualquierEtapa(
            @Param("idLead") Long idLead,
            @Param("idAsesor") Long idAsesor
    );

    // Detalle completo de un lead por id, sin filtro de asesor ni etapa (la autorizacion del caso
    // "mis preventas" se valida aparte contra el evento de cierre del asesor).
    @Query("""
            SELECT DISTINCT l
            FROM Lead l
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH c.proveedor
            LEFT JOIN FETCH l.datosPreventa
            LEFT JOIN FETCH l.direccion
            LEFT JOIN FETCH l.plan
            LEFT JOIN FETCH l.plan.proveedor
            LEFT JOIN FETCH l.plan.internet
            LEFT JOIN FETCH l.plan.television
            LEFT JOIN FETCH l.plan.telefono
            LEFT JOIN FETCH l.plan.zona
            LEFT JOIN FETCH l.plan.adicionales pa
            LEFT JOIN FETCH pa.adicional
            LEFT JOIN FETCH l.promocionInterna
            LEFT JOIN FETCH l.promocionInterna.proveedor
            LEFT JOIN FETCH l.promocionInterna.zona
            LEFT JOIN FETCH l.adicionales la
            LEFT JOIN FETCH la.adicional
            WHERE l.id = :idLead
            """)
    Optional<Lead> buscarDetalleCompletoPorId(@Param("idLead") Long idLead);

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.lastEntryAt,
                l.prefijo,
                l.lead,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                c.numeroWhatsApp,
                l.base,
                null,
                l.numeroDocumentoTitularServicioSnapshot,
                l.direccionSnapshot,
                r.primeraCodigoTipificacion,
                r.primeraCodigoSubtipificacion,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                r.ultimaCodigoTipificacion,
                r.ultimaCodigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreAsesorAsignado,
                l.estado,
                0L,
                false,
                false,
                false,
                l.etapa
            )
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaResumen
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = :etapa)
              AND (r.ultimaCodigoTipificacion IS NULL OR r.ultimaCodigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (
                    :filtrarTipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primeraCodigoTipificacion IN :codigosTipificacion)
                    OR (:usarMayorTipificacion = true AND r.mayorRangoCodigoTipificacion IN :codigosTipificacion)
                    OR (:usarUltimaTipificacion = true AND r.ultimaCodigoTipificacion IN :codigosTipificacion)
              )
              AND (
                    :filtrarSubtipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primeraCodigoSubtipificacion IN :codigosSubtipificacion)
                    OR (:usarMayorTipificacion = true AND r.mayorRangoCodigoSubtipificacion IN :codigosSubtipificacion)
                    OR (:usarUltimaTipificacion = true AND r.ultimaCodigoSubtipificacion IN :codigosSubtipificacion)
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:filtrarFechaDesde = false OR l.lastEntryAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.lastEntryAt < :fechaHasta)
              AND (
                    :filtrarEstadoGrupo = false
                    OR (:sinValorGrupo = true AND l.estado IS NULL)
                    OR (:sinValorGrupo = false AND l.estado = :estadoGrupo)
              )
              AND (
                    :filtrarPrimeraTipificacionGrupo = false
                    OR (:sinValorGrupo = true AND r.primeraCodigoTipificacion IS NULL)
                    OR (
                        :sinValorGrupo = false
                        AND r.primeraCodigoTipificacion = :codigoTipificacionGrupo
                        AND (
                            (:codigoSubtipificacionGrupo IS NULL AND r.primeraCodigoSubtipificacion IS NULL)
                            OR r.primeraCodigoSubtipificacion = :codigoSubtipificacionGrupo
                        )
                    )
              )
              AND (
                    :filtrarMayorTipificacionGrupo = false
                    OR (:sinValorGrupo = true AND r.mayorRangoCodigoTipificacion IS NULL)
                    OR (
                        :sinValorGrupo = false
                        AND r.mayorRangoCodigoTipificacion = :codigoTipificacionGrupo
                        AND (
                            (:codigoSubtipificacionGrupo IS NULL AND r.mayorRangoCodigoSubtipificacion IS NULL)
                            OR r.mayorRangoCodigoSubtipificacion = :codigoSubtipificacionGrupo
                        )
                    )
              )
              AND (
                    :filtrarUltimaTipificacionGrupo = false
                    OR (:sinValorGrupo = true AND r.ultimaCodigoTipificacion IS NULL)
                    OR (
                        :sinValorGrupo = false
                        AND r.ultimaCodigoTipificacion = :codigoTipificacionGrupo
                        AND (
                            (:codigoSubtipificacionGrupo IS NULL AND r.ultimaCodigoSubtipificacion IS NULL)
                            OR r.ultimaCodigoSubtipificacion = :codigoSubtipificacionGrupo
                        )
                    )
              )
              AND (
                    :filtrarIngresoGrupo = false
                    OR (:sinValorGrupo = true AND l.lastEntryAt IS NULL)
                    OR (:sinValorGrupo = false AND l.lastEntryAt >= :ingresoInicio AND l.lastEntryAt < :ingresoFin)
              )
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """)
    Page<LeadGtrResponse> listarLeadsMasivo(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("usarPrimeraTipificacion") boolean usarPrimeraTipificacion,
            @Param("usarMayorTipificacion") boolean usarMayorTipificacion,
            @Param("usarUltimaTipificacion") boolean usarUltimaTipificacion,
            @Param("filtrarEstadoGrupo") boolean filtrarEstadoGrupo,
            @Param("estadoGrupo") EstadoSeguimiento estadoGrupo,
            @Param("filtrarPrimeraTipificacionGrupo") boolean filtrarPrimeraTipificacionGrupo,
            @Param("filtrarMayorTipificacionGrupo") boolean filtrarMayorTipificacionGrupo,
            @Param("filtrarUltimaTipificacionGrupo") boolean filtrarUltimaTipificacionGrupo,
            @Param("codigoTipificacionGrupo") String codigoTipificacionGrupo,
            @Param("codigoSubtipificacionGrupo") String codigoSubtipificacionGrupo,
            @Param("filtrarIngresoGrupo") boolean filtrarIngresoGrupo,
            @Param("ingresoInicio") Instant ingresoInicio,
            @Param("ingresoFin") Instant ingresoFin,
            @Param("sinValorGrupo") boolean sinValorGrupo,
            Pageable pageable
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   CONCAT('', l.estado) AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaResumen
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = :etapa)
              AND (r.ultimaCodigoTipificacion IS NULL OR r.ultimaCodigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (
                    :filtrarTipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primeraCodigoTipificacion IN :codigosTipificacion)
                    OR (:usarMayorTipificacion = true AND r.mayorRangoCodigoTipificacion IN :codigosTipificacion)
                    OR (:usarUltimaTipificacion = true AND r.ultimaCodigoTipificacion IN :codigosTipificacion)
              )
              AND (
                    :filtrarSubtipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primeraCodigoSubtipificacion IN :codigosSubtipificacion)
                    OR (:usarMayorTipificacion = true AND r.mayorRangoCodigoSubtipificacion IN :codigosSubtipificacion)
                    OR (:usarUltimaTipificacion = true AND r.ultimaCodigoSubtipificacion IN :codigosSubtipificacion)
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:filtrarFechaDesde = false OR l.lastEntryAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.lastEntryAt < :fechaHasta)
            GROUP BY l.estado
            """)
    List<LeadGtrAgrupacionProjection> agruparLeadsMasivoPorEstado(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("usarPrimeraTipificacion") boolean usarPrimeraTipificacion,
            @Param("usarMayorTipificacion") boolean usarMayorTipificacion,
            @Param("usarUltimaTipificacion") boolean usarUltimaTipificacion
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.ultimaCodigoTipificacion AS codigoTipificacion,
                   r.ultimaCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaResumen
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = :etapa)
              AND (r.ultimaCodigoTipificacion IS NULL OR r.ultimaCodigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (:filtrarTipificaciones = false OR r.ultimaCodigoTipificacion IN :codigosTipificacion)
              AND (:filtrarSubtipificaciones = false OR r.ultimaCodigoSubtipificacion IN :codigosSubtipificacion)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:filtrarFechaDesde = false OR l.lastEntryAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.lastEntryAt < :fechaHasta)
            GROUP BY r.ultimaCodigoTipificacion, r.ultimaCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparLeadsMasivoPorUltimaTipificacion(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") Etapa etapaResumen
    );

    @Query(value = """
            SELECT NULL AS "idGrupo",
                   to_char(l.last_entry_at AT TIME ZONE 'America/Lima', 'YYYY-MM-DD') AS "etiqueta",
                   NULL AS "codigoTipificacion",
                   NULL AS "codigoSubtipificacion",
                   COUNT(l.id) AS "cantidad"
            FROM lead l
            LEFT JOIN campana c ON c.id = l.id_campana
            LEFT JOIN proveedor p ON p.id = c.id_proveedor
            LEFT JOIN lead_etapa_resumen r ON r.id_lead = l.id AND r.etapa = CAST(:etapaResumen AS text)
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = CAST(:etapa AS text))
              AND (r.ultima_codigo_tipificacion IS NULL OR r.ultima_codigo_tipificacion NOT IN (:codigosTipificacionExcluidos))
              AND (
                    :filtrarTipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primera_codigo_tipificacion IN (:codigosTipificacion))
                    OR (:usarMayorTipificacion = true AND r.mayor_rango_codigo_tipificacion IN (:codigosTipificacion))
                    OR (:usarUltimaTipificacion = true AND r.ultima_codigo_tipificacion IN (:codigosTipificacion))
              )
              AND (
                    :filtrarSubtipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primera_codigo_subtipificacion IN (:codigosSubtipificacion))
                    OR (:usarMayorTipificacion = true AND r.mayor_rango_codigo_subtipificacion IN (:codigosSubtipificacion))
                    OR (:usarUltimaTipificacion = true AND r.ultima_codigo_subtipificacion IN (:codigosSubtipificacion))
              )
              AND (:filtrarEquipos = false OR l.id_equipo IN (:equipoIds))
              AND (:filtrarFechaDesde = false OR l.last_entry_at >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.last_entry_at < :fechaHasta)
            GROUP BY to_char(l.last_entry_at AT TIME ZONE 'America/Lima', 'YYYY-MM-DD')
            """, nativeQuery = true)
    List<LeadGtrAgrupacionProjection> agruparLeadsMasivoPorIngreso(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") String etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") String etapaResumen,
            @Param("usarPrimeraTipificacion") boolean usarPrimeraTipificacion,
            @Param("usarMayorTipificacion") boolean usarMayorTipificacion,
            @Param("usarUltimaTipificacion") boolean usarUltimaTipificacion
    );

    // ── Ranking GTR: preventas concretadas leidas del resumen por etapa (LeadEtapaResumen) ──
    // Fuente de verdad del cierre PREVENTA→VENTA = merito de la etapa PREVENTA (idAsesorMerito/
    // fechaMerito). Lead es raiz para conservar el @Filter por equipo; se joinea el resumen.

    @Query("""
            SELECT r.idAsesorMerito AS idAsesor,
                   COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE r.idAsesorMerito IS NOT NULL
              AND r.fechaMerito >= :fechaDesde
              AND r.fechaMerito < :fechaHasta
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = r.idAsesorMerito
                                AND la.etapa = 'PREVENTA'))
            GROUP BY r.idAsesorMerito
            """)
    List<AsesorPreventaCantidadProjection> resumirPreventasPorAsesorLeadGtr(
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT r.idAsesorMerito AS idAsesor,
                   p.id AS idProveedor,
                   p.nombre AS nombreProveedor,
                   COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            JOIN l.plan pl
            JOIN pl.proveedor p
            WHERE r.idAsesorMerito IS NOT NULL
              AND r.fechaMerito >= :fechaDesde
              AND r.fechaMerito < :fechaHasta
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = r.idAsesorMerito
                                AND la.etapa = 'PREVENTA'))
            GROUP BY r.idAsesorMerito, p.id, p.nombre
            """)
    List<AsesorProveedorPreventaProjection> resumirPreventasMensualesPorProveedorLeadGtr(
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    // ── Ranking GTR: tipificaciones/subtipificaciones por LEADS (no eventos) ──
    // Cuenta LEADS distintos por su tipificacion en PREVENTA (uno por lead), no la suma de intentos.
    // El :campo elige el punto de tipificacion (PRIMERA/ULTIMA/MAYOR) tal como en el DASHBOARD del ADMIN.
    //
    // Dos cohortes (modo):
    //  - GESTIONADOS: el periodo filtra por la FECHA de la tipificacion del campo elegido (primera/
    //    ultima/mayorRangoAt), no por el registro del lead.
    //  - INGRESADOS: cohorte = leads con evento REGISTRO en el periodo (los "leads del dia"), agrupados
    //    por su tipificacion actual del campo elegido.
    // soloActivos no aplica (no hay un actor unico por lead). Lead es raiz (@Filter por equipo) y se
    // acota tambien por equipoIds explicitos, igual que el resto del ranking GTR.

    // El modo es un booleano :ingresados. GESTIONADOS (false): el periodo filtra por la fecha de la
    // tipificacion del campo. INGRESADOS (true): el lead entra si tuvo un evento REGISTRO en el periodo
    // (cohorte "leads del dia"), agrupado por su tipificacion actual del campo. El GROUP BY es una
    // expresion fija (sin parametro) para que Postgres lo empate con el SELECT.

    @Query("""
            SELECT TRIM(r.primeraCodigoTipificacion) AS tipificacion, COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE r.primeraCodigoTipificacion IS NOT NULL AND TRIM(r.primeraCodigoTipificacion) <> ''
              AND ((:ingresados = false AND r.primeraTipificacionAt >= :fechaDesde AND r.primeraTipificacionAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY TRIM(r.primeraCodigoTipificacion)
            """)
    List<TipificacionCantidadProjection> resumirTipiRankingGtrPrimera(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT TRIM(r.ultimaCodigoTipificacion) AS tipificacion, COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE r.ultimaCodigoTipificacion IS NOT NULL AND TRIM(r.ultimaCodigoTipificacion) <> ''
              AND ((:ingresados = false AND r.ultimaTipificacionAt >= :fechaDesde AND r.ultimaTipificacionAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY TRIM(r.ultimaCodigoTipificacion)
            """)
    List<TipificacionCantidadProjection> resumirTipiRankingGtrUltima(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT TRIM(r.mayorRangoCodigoTipificacion) AS tipificacion, COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE r.mayorRangoCodigoTipificacion IS NOT NULL AND TRIM(r.mayorRangoCodigoTipificacion) <> ''
              AND ((:ingresados = false AND r.mayorRangoAt >= :fechaDesde AND r.mayorRangoAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY TRIM(r.mayorRangoCodigoTipificacion)
            """)
    List<TipificacionCantidadProjection> resumirTipiRankingGtrMayor(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COALESCE(NULLIF(TRIM(r.primeraCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION') AS subtipificacion,
                   COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE TRIM(r.primeraCodigoTipificacion) = :tipificacion
              AND ((:ingresados = false AND r.primeraTipificacionAt >= :fechaDesde AND r.primeraTipificacionAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY COALESCE(NULLIF(TRIM(r.primeraCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION')
            """)
    List<SubtipificacionCantidadProjection> resumirSubtipiRankingGtrPrimera(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COALESCE(NULLIF(TRIM(r.ultimaCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION') AS subtipificacion,
                   COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE TRIM(r.ultimaCodigoTipificacion) = :tipificacion
              AND ((:ingresados = false AND r.ultimaTipificacionAt >= :fechaDesde AND r.ultimaTipificacionAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY COALESCE(NULLIF(TRIM(r.ultimaCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION')
            """)
    List<SubtipificacionCantidadProjection> resumirSubtipiRankingGtrUltima(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COALESCE(NULLIF(TRIM(r.mayorRangoCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION') AS subtipificacion,
                   COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE TRIM(r.mayorRangoCodigoTipificacion) = :tipificacion
              AND ((:ingresados = false AND r.mayorRangoAt >= :fechaDesde AND r.mayorRangoAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY COALESCE(NULLIF(TRIM(r.mayorRangoCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION')
            """)
    List<SubtipificacionCantidadProjection> resumirSubtipiRankingGtrMayor(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    // Re-sincroniza id_equipo de TODOS los leads (con campaña mapeada) a su equipo actual según
    // el mapping equipo_proveedor (campaña → proveedor → equipo). Idempotente y seguro de re-ejecutar:
    // alinea también los que cambiaron de equipo al mover un proveedor. Los leads cuya campaña/proveedor
    // no está mapeada a ningún equipo quedan sin tocar. Nativo + subconsulta correlacionada
    // (portable Postgres/H2). No afectado por @Filter.
    @Modifying
    @Query(value = """
            UPDATE lead l
            SET id_equipo = (
                SELECT ep.id_equipo
                FROM equipo_proveedor ep
                JOIN campana c ON c.id_proveedor = ep.id_proveedor
                WHERE c.id = l.id_campana
                LIMIT 1
            )
            WHERE l.id_campana IS NOT NULL
              AND EXISTS (
                  SELECT 1
                  FROM equipo_proveedor ep
                  JOIN campana c ON c.id_proveedor = ep.id_proveedor
                  WHERE c.id = l.id_campana
              )
            """, nativeQuery = true)
    int backfillIdEquipoDesdeMapping();

    // Desvincula del equipo a los leads que apuntaban a él (al eliminar el equipo).
    @Modifying
    @Query(value = "UPDATE lead SET id_equipo = NULL WHERE id_equipo = :idEquipo", nativeQuery = true)
    int desvincularEquipo(@Param("idEquipo") Long idEquipo);

    // Todos los ids de lead (para iterar en el backfill de LeadEtapaResumen). Sin usuario => sin @Filter.
    @Query("SELECT l.id FROM Lead l ORDER BY l.id")
    List<Long> findAllLeadIds();

    @Query("SELECT l.id, l.idEquipo FROM Lead l ORDER BY l.id")
    List<Object[]> findAllLeadIdsAndEquipos();

    @Query("SELECT l.id, l.idEquipo FROM Lead l WHERE l.lead = :lead ORDER BY l.lastEntryAt DESC, l.id DESC")
    List<Object[]> findLeadIdsAndEquiposByLead(@Param("lead") String lead);
}
