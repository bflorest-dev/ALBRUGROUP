package pe.albrugroup.lead_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.LeadEtapaResumen;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadEtapaResumenRepository extends JpaRepository<LeadEtapaResumen, Long> {

    Optional<LeadEtapaResumen> findByIdLeadAndEtapa(Long idLead, Etapa etapa);

    List<LeadEtapaResumen> findByIdLead(Long idLead);

    @Query("""
            SELECT r.idLead, COALESCE(r.totalAsignaciones, 0)
            FROM LeadEtapaResumen r
            WHERE r.idLead IN :leadIds
              AND r.etapa = :etapa
            """)
    List<Object[]> contarAsignacionesPorLeadIdsYEtapa(
            @Param("leadIds") Collection<Long> leadIds,
            @Param("etapa") Etapa etapa
    );

    // Re-ejecutabilidad del backfill: se borran las filas del lead antes de reconstruirlas.
    void deleteByIdLead(Long idLead);

    @Query("""
            SELECT r, l
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            WHERE r.idAsesorMerito = :idAsesor
              AND r.fechaMerito >= :fechaDesde
              AND r.fechaMerito < :fechaHasta
            ORDER BY r.fechaMerito DESC, r.id DESC
            """)
    Page<Object[]> listarMisPreventasPorMerito(
            @Param("idAsesor") Long idAsesor,
            @Param("etapa") Etapa etapa,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            Pageable pageable
    );

    @Query("""
            SELECT l.etapa, COUNT(r.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            WHERE r.idAsesorMerito = :idAsesor
              AND r.fechaMerito >= :fechaDesde
              AND r.fechaMerito < :fechaHasta
            GROUP BY l.etapa
            """)
    List<Object[]> resumirMisPreventasPorMerito(
            @Param("idAsesor") Long idAsesor,
            @Param("etapa") Etapa etapa,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
    );

    @Query("""
            SELECT r, l, c.fechaInstalacion, rv.fechaUltimaGestion
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaPreventa
            LEFT JOIN CalendarioFacturacionPostventa c ON c.lead = l AND c.activo = true
            LEFT JOIN LeadEtapaResumen rv ON rv.idLead = l.id AND rv.etapa = :etapaVenta
            WHERE r.idAsesorMerito = :idAsesor
              AND (
                    (l.etapa = :etapaPostventa
                     AND c.fechaInstalacion >= :fechaDesdeDate
                     AND c.fechaInstalacion < :fechaHastaDate)
                 OR (l.etapa = :etapaVenta
                     AND r.fechaMerito >= :fechaDesde
                     AND r.fechaMerito < :fechaHasta)
                 OR (l.etapa = :etapaPreventa
                     AND r.fechaMerito IS NULL
                     AND rv.fechaUltimaGestion >= :fechaDesde
                     AND rv.fechaUltimaGestion < :fechaHasta)
              )
            """)
    List<Object[]> listarMisPreventasPorFechaVista(
            @Param("idAsesor") Long idAsesor,
            @Param("etapaPreventa") Etapa etapaPreventa,
            @Param("etapaVenta") Etapa etapaVenta,
            @Param("etapaPostventa") Etapa etapaPostventa,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("fechaDesdeDate") java.time.LocalDate fechaDesdeDate,
            @Param("fechaHastaDate") java.time.LocalDate fechaHastaDate
    );

    // ===== Reporte "gestión por campaña" (DASHBOARD del ADMIN) =====
    // Cada método agrupa por (equipo, campaña, código de tipificación) contando leads distintos,
    // usando el par código/fecha del punto de tipificación elegido. El período filtra por la FECHA
    // de esa tipificación (no por el registro del lead), para no perder conteos entre meses.
    //
    // Las queries nacen en Lead (no en LeadEtapaResumen) para que el @Filter "equipoFilter" acote el
    // resultado al scope del usuario, igual que las demás métricas por equipo. Filas [idEquipo,
    // idCampana, nombreCampana, codigoTipificacion, cantidad].

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre, r.primeraCodigoTipificacion, COUNT(DISTINCT l.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id
            LEFT JOIN l.campana c
            WHERE r.etapa = :etapa
              AND r.primeraCodigoTipificacion IS NOT NULL
              AND r.primeraTipificacionAt >= :inicio
              AND r.primeraTipificacionAt < :fin
            GROUP BY l.idEquipo, c.id, c.nombre, r.primeraCodigoTipificacion
            """)
    List<Object[]> gestionPorCampanaPrimera(
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre, r.ultimaCodigoTipificacion, COUNT(DISTINCT l.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id
            LEFT JOIN l.campana c
            WHERE r.etapa = :etapa
              AND r.ultimaCodigoTipificacion IS NOT NULL
              AND r.ultimaTipificacionAt >= :inicio
              AND r.ultimaTipificacionAt < :fin
            GROUP BY l.idEquipo, c.id, c.nombre, r.ultimaCodigoTipificacion
            """)
    List<Object[]> gestionPorCampanaUltima(
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre, r.mayorRangoCodigoTipificacion, COUNT(DISTINCT l.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id
            LEFT JOIN l.campana c
            WHERE r.etapa = :etapa
              AND r.mayorRangoCodigoTipificacion IS NOT NULL
              AND r.mayorRangoAt >= :inicio
              AND r.mayorRangoAt < :fin
            GROUP BY l.idEquipo, c.id, c.nombre, r.mayorRangoCodigoTipificacion
            """)
    List<Object[]> gestionPorCampanaMayor(
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // ===== Modo INGRESADOS: cohorte de leads con evento REGISTRO en el período =====
    // Igual que "leads del día": la cohorte se define por el evento REGISTRO (un lead re-registrado
    // cuenta aunque sea antiguo), no por Lead.createdAt. Se agrupan por su tipificación ACTUAL del
    // campo elegido (excluyendo los que aún no tienen tipificación). Rooteadas en Evento + JOIN Lead
    // para que el equipoFilter acote, igual que las métricas diarias por equipo.

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre, r.primeraCodigoTipificacion, COUNT(DISTINCT l.id)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            LEFT JOIN l.campana c
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            GROUP BY l.idEquipo, c.id, c.nombre, r.primeraCodigoTipificacion
            """)
    List<Object[]> ingresadosPorCampanaPrimera(
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre, r.ultimaCodigoTipificacion, COUNT(DISTINCT l.id)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            LEFT JOIN l.campana c
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            GROUP BY l.idEquipo, c.id, c.nombre, r.ultimaCodigoTipificacion
            """)
    List<Object[]> ingresadosPorCampanaUltima(
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre, r.mayorRangoCodigoTipificacion, COUNT(DISTINCT l.id)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            LEFT JOIN l.campana c
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
            GROUP BY l.idEquipo, c.id, c.nombre, r.mayorRangoCodigoTipificacion
            """)
    List<Object[]> ingresadosPorCampanaMayor(
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // ===== RESUMEN DIARIO tabla 4: subtipificación × campaña =====
    // Igual que "gestión por campaña" pero un nivel más fino: agrupa por (equipo, campaña, código de
    // tipificación, código de subtipificación). Se conserva la tipificación para poder anteponer su
    // orden en la etiqueta. Filas [idEquipo, idCampana, nombreCampana, codigoTipificacion,
    // codigoSubtipificacion, cantidad].

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre,
                   r.primeraCodigoTipificacion, r.primeraCodigoSubtipificacion, COUNT(DISTINCT l.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id
            LEFT JOIN l.campana c
            WHERE r.etapa = :etapa
              AND r.primeraCodigoTipificacion IS NOT NULL
              AND r.primeraTipificacionAt >= :inicio
              AND r.primeraTipificacionAt < :fin
            GROUP BY l.idEquipo, c.id, c.nombre, r.primeraCodigoTipificacion, r.primeraCodigoSubtipificacion
            """)
    List<Object[]> gestionSubtipPorCampanaPrimera(
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre,
                   r.ultimaCodigoTipificacion, r.ultimaCodigoSubtipificacion, COUNT(DISTINCT l.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id
            LEFT JOIN l.campana c
            WHERE r.etapa = :etapa
              AND r.ultimaCodigoTipificacion IS NOT NULL
              AND r.ultimaTipificacionAt >= :inicio
              AND r.ultimaTipificacionAt < :fin
            GROUP BY l.idEquipo, c.id, c.nombre, r.ultimaCodigoTipificacion, r.ultimaCodigoSubtipificacion
            """)
    List<Object[]> gestionSubtipPorCampanaUltima(
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre,
                   r.mayorRangoCodigoTipificacion, r.mayorRangoCodigoSubtipificacion, COUNT(DISTINCT l.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id
            LEFT JOIN l.campana c
            WHERE r.etapa = :etapa
              AND r.mayorRangoCodigoTipificacion IS NOT NULL
              AND r.mayorRangoAt >= :inicio
              AND r.mayorRangoAt < :fin
            GROUP BY l.idEquipo, c.id, c.nombre, r.mayorRangoCodigoTipificacion, r.mayorRangoCodigoSubtipificacion
            """)
    List<Object[]> gestionSubtipPorCampanaMayor(
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre,
                   r.primeraCodigoTipificacion, r.primeraCodigoSubtipificacion, COUNT(DISTINCT l.id)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            LEFT JOIN l.campana c
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.primeraCodigoTipificacion IS NOT NULL
            GROUP BY l.idEquipo, c.id, c.nombre, r.primeraCodigoTipificacion, r.primeraCodigoSubtipificacion
            """)
    List<Object[]> ingresadosSubtipPorCampanaPrimera(
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre,
                   r.ultimaCodigoTipificacion, r.ultimaCodigoSubtipificacion, COUNT(DISTINCT l.id)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            LEFT JOIN l.campana c
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.ultimaCodigoTipificacion IS NOT NULL
            GROUP BY l.idEquipo, c.id, c.nombre, r.ultimaCodigoTipificacion, r.ultimaCodigoSubtipificacion
            """)
    List<Object[]> ingresadosSubtipPorCampanaUltima(
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    @Query("""
            SELECT l.idEquipo, c.id, c.nombre,
                   r.mayorRangoCodigoTipificacion, r.mayorRangoCodigoSubtipificacion, COUNT(DISTINCT l.id)
            FROM Evento e
            JOIN Lead l ON l.id = e.idLead
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            LEFT JOIN l.campana c
            WHERE e.accion = :accion
              AND e.createdAt >= :inicio
              AND e.createdAt < :fin
              AND r.mayorRangoCodigoTipificacion IS NOT NULL
            GROUP BY l.idEquipo, c.id, c.nombre, r.mayorRangoCodigoTipificacion, r.mayorRangoCodigoSubtipificacion
            """)
    List<Object[]> ingresadosSubtipPorCampanaMayor(
            @Param("accion") Accion accion,
            @Param("etapa") Etapa etapa,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // ===== Detalle de preventas INGRESADAS: cohorte de registro del día cuya tipificación <campo> es
    // PREVENTA, unida a su evento de tipificación a PREVENTA (para traer el asesor real, igual que
    // GESTIONADAS) y a los datos de preventa (documento y nombre del titular). Un lead puede tener
    // varios eventos PREVENTA; el servicio se queda con el más reciente. Filas [idLead, lead, usermeta,
    // numeroDocumento, nombreCompleto, nombreActor, createdAt, nombreCampana].

    @Query("""
            SELECT l.id, l.lead, l.usermeta, dp.numeroDocumentoTitularServicio, dp.nombreTitularServicio,
                   te.nombreActor, te.createdAt, c.nombre
            FROM Evento re
            JOIN Lead l ON l.id = re.idLead
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            JOIN Evento te ON te.idLead = l.id AND te.accion = :accionTipificacion
                          AND te.etapa = :etapa AND te.tipificacion = :codigoTipificacion
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.campana c
            WHERE re.accion = :accionRegistro
              AND re.createdAt >= :inicio
              AND re.createdAt < :fin
              AND r.primeraCodigoTipificacion = :codigoTipificacion
              AND (r.primeraCodigoSubtipificacion IS NULL OR r.primeraCodigoSubtipificacion <> 'INCOMPLETA')
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            ORDER BY te.createdAt DESC
            """)
    List<Object[]> preventasDetalleIngresadasPrimera(
            @Param("accionRegistro") Accion accionRegistro,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("etapa") Etapa etapa,
            @Param("codigoTipificacion") String codigoTipificacion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") java.util.Collection<Long> equipoIds
    );

    @Query("""
            SELECT l.id, l.lead, l.usermeta, dp.numeroDocumentoTitularServicio, dp.nombreTitularServicio,
                   te.nombreActor, te.createdAt, c.nombre
            FROM Evento re
            JOIN Lead l ON l.id = re.idLead
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            JOIN Evento te ON te.idLead = l.id AND te.accion = :accionTipificacion
                          AND te.etapa = :etapa AND te.tipificacion = :codigoTipificacion
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.campana c
            WHERE re.accion = :accionRegistro
              AND re.createdAt >= :inicio
              AND re.createdAt < :fin
              AND r.ultimaCodigoTipificacion = :codigoTipificacion
              AND (r.ultimaCodigoSubtipificacion IS NULL OR r.ultimaCodigoSubtipificacion <> 'INCOMPLETA')
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            ORDER BY te.createdAt DESC
            """)
    List<Object[]> preventasDetalleIngresadasUltima(
            @Param("accionRegistro") Accion accionRegistro,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("etapa") Etapa etapa,
            @Param("codigoTipificacion") String codigoTipificacion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") java.util.Collection<Long> equipoIds
    );

    @Query("""
            SELECT l.id, l.lead, l.usermeta, dp.numeroDocumentoTitularServicio, dp.nombreTitularServicio,
                   te.nombreActor, te.createdAt, c.nombre
            FROM Evento re
            JOIN Lead l ON l.id = re.idLead
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            JOIN Evento te ON te.idLead = l.id AND te.accion = :accionTipificacion
                          AND te.etapa = :etapa AND te.tipificacion = :codigoTipificacion
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.campana c
            WHERE re.accion = :accionRegistro
              AND re.createdAt >= :inicio
              AND re.createdAt < :fin
              AND r.mayorRangoCodigoTipificacion = :codigoTipificacion
              AND (r.mayorRangoCodigoSubtipificacion IS NULL OR r.mayorRangoCodigoSubtipificacion <> 'INCOMPLETA')
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            ORDER BY te.createdAt DESC
            """)
    List<Object[]> preventasDetalleIngresadasMayor(
            @Param("accionRegistro") Accion accionRegistro,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("etapa") Etapa etapa,
            @Param("codigoTipificacion") String codigoTipificacion,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") java.util.Collection<Long> equipoIds
    );
}
