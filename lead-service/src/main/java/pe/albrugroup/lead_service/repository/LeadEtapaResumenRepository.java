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
              AND r.primeraTipificacionAt >= :inicio
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
              AND r.ultimaTipificacionAt >= :inicio
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
              AND r.mayorRangoAt >= :inicio
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

    // ===== DASHBOARD de VENTA (docs/PLAN_DASHBOARD_VENTA.md §10) =====
    // Scope por PROVEEDOR: JOIN l.plan.proveedor.id = :idProveedor (el equipoFilter se desactiva en el
    // servicio; el proveedor es la partición). Universo = fila VENTA con fechaIngresoEtapa ∈ período.
    // El prefijo de ubigeo (SUBSTRING 1,2) se pliega a Lima ('15'/'07') / Provincia / SinUbigeo en Java.

    // Q1 — universo por (última tipificación, mayor rango, prefijo de ubigeo). Da: preventasCompletas
    // (por mayor rango >= INGRESADO ó última nula), registradas, rechazadas, programadasActual, estadoLeads
    // (por última) y zonas.registradas (subidas). El mayor rango entra en el GROUP BY porque "preventa
    // genuina" se decide con el high-water mark, no con la última tipificación.
    @Query("""
            SELECT r.ultimaCodigoTipificacion, r.mayorRangoCodigoTipificacion, SUBSTRING(d.ubigeoDomicilio, 1, 2), COUNT(DISTINCT l.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            JOIN l.plan pl
            JOIN pl.proveedor pr
            LEFT JOIN l.direccion d
            WHERE pr.id = :idProveedor
              AND r.fechaIngresoEtapa >= :inicio
              AND r.fechaIngresoEtapa < :fin
            GROUP BY r.ultimaCodigoTipificacion, r.mayorRangoCodigoTipificacion, SUBSTRING(d.ubigeoDomicilio, 1, 2)
            """)
    List<Object[]> dashboardVentaUniverso(
            @Param("etapa") Etapa etapa,
            @Param("idProveedor") Long idProveedor,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );

    // Q2 — embudo "programada alguna vez" (mayorRango ∈ {PROGRAMADO, INSTALADO}) por última tipificación.
    // Da: programadasTotal (suma), programadasInstaladas (bucket INSTALADO), programadasRechazadas (rechazo).
    @Query("""
            SELECT r.ultimaCodigoTipificacion, COUNT(DISTINCT l.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            JOIN l.plan pl
            JOIN pl.proveedor pr
            WHERE pr.id = :idProveedor
              AND r.fechaIngresoEtapa >= :inicio
              AND r.fechaIngresoEtapa < :fin
              AND r.mayorRangoCodigoTipificacion IN :codigosProgramadaOMas
            GROUP BY r.ultimaCodigoTipificacion
            """)
    List<Object[]> dashboardVentaEmbudo(
            @Param("etapa") Etapa etapa,
            @Param("idProveedor") Long idProveedor,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("codigosProgramadaOMas") Collection<String> codigosProgramadaOMas
    );

    // Q3 — zonas: instaladas EN EL PERÍODO (fechaInstalacion) por prefijo de ubigeo, con CF (SUM/AVG del
    // precioPlanSnapshot) y cuántas de esas también ingresaron a venta en el período (registradasEInstaladas).
    @Query("""
            SELECT SUBSTRING(d.ubigeoDomicilio, 1, 2),
                   COUNT(DISTINCT l.id),
                   SUM(l.precioPlanSnapshot),
                   AVG(l.precioPlanSnapshot),
                   SUM(CASE WHEN r.fechaIngresoEtapa >= :inicio AND r.fechaIngresoEtapa < :fin THEN 1 ELSE 0 END)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            JOIN l.plan pl
            JOIN pl.proveedor pr
            LEFT JOIN l.direccion d
            JOIN CalendarioFacturacionPostventa c ON c.lead = l AND c.activo = true
            WHERE pr.id = :idProveedor
              AND r.ultimaCodigoTipificacion = :codigoInstalado
              AND c.fechaInstalacion >= :desdeDate
              AND c.fechaInstalacion < :hastaDateExcl
            GROUP BY SUBSTRING(d.ubigeoDomicilio, 1, 2)
            """)
    List<Object[]> dashboardVentaZonasInstaladas(
            @Param("etapa") Etapa etapa,
            @Param("idProveedor") Long idProveedor,
            @Param("codigoInstalado") String codigoInstalado,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("desdeDate") java.time.LocalDate desdeDate,
            @Param("hastaDateExcl") java.time.LocalDate hastaDateExcl
    );

    // Q5 — programación actual: cartera viva de PROGRAMADO por subtipificación (estado actual, sin período).
    @Query("""
            SELECT r.ultimaCodigoSubtipificacion, COUNT(DISTINCT l.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            JOIN l.plan pl
            JOIN pl.proveedor pr
            WHERE pr.id = :idProveedor
              AND l.etapa = :etapa
              AND r.ultimaCodigoTipificacion = :codigoProgramado
            GROUP BY r.ultimaCodigoSubtipificacion
            """)
    List<Object[]> dashboardVentaProgramacionActual(
            @Param("etapa") Etapa etapa,
            @Param("idProveedor") Long idProveedor,
            @Param("codigoProgramado") String codigoProgramado
    );

    // Q6 — ranking por asesor de mérito de PREVENTA sobre el universo VENTA, con prefijo de ubigeo.
    @Query("""
            SELECT rp.idAsesorMerito, rp.nombreAsesorMerito, SUBSTRING(d.ubigeoDomicilio, 1, 2),
                   COUNT(DISTINCT l.id),
                   SUM(CASE WHEN rv.ultimaCodigoTipificacion = :codigoInstalado THEN 1 ELSE 0 END)
            FROM Lead l
            JOIN LeadEtapaResumen rv ON rv.idLead = l.id AND rv.etapa = :etapaVenta
            JOIN LeadEtapaResumen rp ON rp.idLead = l.id AND rp.etapa = :etapaPreventa
            JOIN l.plan pl
            JOIN pl.proveedor pr
            LEFT JOIN l.direccion d
            WHERE pr.id = :idProveedor
              AND rv.fechaIngresoEtapa >= :inicio
              AND rv.fechaIngresoEtapa < :fin
              AND rp.idAsesorMerito IS NOT NULL
            GROUP BY rp.idAsesorMerito, rp.nombreAsesorMerito, SUBSTRING(d.ubigeoDomicilio, 1, 2)
            """)
    List<Object[]> dashboardVentaRanking(
            @Param("etapaVenta") Etapa etapaVenta,
            @Param("etapaPreventa") Etapa etapaPreventa,
            @Param("idProveedor") Long idProveedor,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("codigoInstalado") String codigoInstalado
    );

    // Q4 (endpoint auxiliar) — tramos: cartera viva de PROGRAMADO cuyo evento de programación VIGENTE cae en
    // uno de los días pedidos (hoy/mañana/pasado). Devuelve [fechaProgramacion, horaProgramada, cantidad]; el
    // servicio agrupa por tramo horario × día. El evento vigente = el último PROGRAMADO con hora (MAX createdAt).
    @Query("""
            SELECT e.fechaProgramacion, e.horaProgramada, COUNT(DISTINCT l.id)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            JOIN l.plan pl
            JOIN pl.proveedor pr
            JOIN Evento e ON e.idLead = l.id AND e.etapa = :etapa AND e.tipificacion = :codigoProgramado
                         AND e.horaProgramada IS NOT NULL AND e.fechaProgramacion IS NOT NULL
            WHERE pr.id = :idProveedor
              AND l.etapa = :etapa
              AND r.ultimaCodigoTipificacion = :codigoProgramado
              AND e.fechaProgramacion IN :dias
              AND e.createdAt = (
                  SELECT MAX(es.createdAt) FROM Evento es
                  WHERE es.idLead = l.id AND es.etapa = :etapa AND es.tipificacion = :codigoProgramado
                    AND es.horaProgramada IS NOT NULL
              )
            GROUP BY e.fechaProgramacion, e.horaProgramada
            """)
    List<Object[]> dashboardVentaTramos(
            @Param("etapa") Etapa etapa,
            @Param("idProveedor") Long idProveedor,
            @Param("codigoProgramado") String codigoProgramado,
            @Param("dias") Collection<java.time.LocalDate> dias
    );

    // ===== DETALLE paginado del dashboard (drill-down para auditar cada contador) =====

    // Detalle de un ASESOR: sus leads del universo VENTA (fechaIngresoEtapa en período) atribuidos por
    // mérito de PREVENTA. Trae la tipi VIVA del Lead + etapa + último comentario del último evento de
    // tipificación (idiom MAX(ev.id)). countQuery explícito (sin el join al subquery/datosPreventa).
    @Query(value = """
            SELECT new pe.albrugroup.lead_service.entity.response.VentaAsesorDetalleResponse(
                l.id, l.lead, l.usermeta,
                dp.numeroDocumentoTitularServicio, dp.nombreTitularServicio,
                l.etapa, l.codigoTipificacion, l.codigoSubtipificacion,
                ultTip.comentario
            )
            FROM Lead l
            JOIN LeadEtapaResumen rv ON rv.idLead = l.id AND rv.etapa = :etapaVenta
            JOIN LeadEtapaResumen rp ON rp.idLead = l.id AND rp.etapa = :etapaPreventa
            JOIN l.plan pl
            JOIN pl.proveedor pr
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN Evento ultTip ON ultTip.id = (
                SELECT MAX(ev.id) FROM Evento ev WHERE ev.idLead = l.id AND ev.accion = :accionTip
            )
            WHERE pr.id = :idProveedor
              AND rv.fechaIngresoEtapa >= :inicio
              AND rv.fechaIngresoEtapa < :fin
              AND rp.idAsesorMerito = :idAsesor
            ORDER BY rv.fechaIngresoEtapa DESC, l.id DESC
            """,
            countQuery = """
            SELECT COUNT(l.id)
            FROM Lead l
            JOIN LeadEtapaResumen rv ON rv.idLead = l.id AND rv.etapa = :etapaVenta
            JOIN LeadEtapaResumen rp ON rp.idLead = l.id AND rp.etapa = :etapaPreventa
            JOIN l.plan pl
            JOIN pl.proveedor pr
            WHERE pr.id = :idProveedor
              AND rv.fechaIngresoEtapa >= :inicio
              AND rv.fechaIngresoEtapa < :fin
              AND rp.idAsesorMerito = :idAsesor
            """)
    Page<pe.albrugroup.lead_service.entity.response.VentaAsesorDetalleResponse> dashboardVentaAsesorDetalle(
            @Param("etapaVenta") Etapa etapaVenta,
            @Param("etapaPreventa") Etapa etapaPreventa,
            @Param("idProveedor") Long idProveedor,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("idAsesor") Long idAsesor,
            @Param("accionTip") Accion accionTip,
            Pageable pageable
    );

    // Detalle de una MÉTRICA del resumen: el universo VENTA (fechaIngresoEtapa en período) filtrado por la
    // métrica clickeada (flags booleanos, mismos criterios que los contadores). Tipi VIVA del Lead.
    //   - PREVENTAS:   preventa genuina = mayor rango en {INGRESADO, PROGRAMADO, INSTALADO} ó última nula.
    //   - REGISTRADAS: última == INGRESADO (foto: registrada y aún sin avanzar/rechazar).
    //   - PROGRAMADAS: última == PROGRAMADO.
    //   - RECHAZADAS:  última ∈ {SUBSANABLE, NO RECUPERABLE}.
    // INSTALADAS NO sale por aquí: se ancla en fechaInstalacion (ver dashboardVentaInstaladasDetalle).
    @Query(value = """
            SELECT new pe.albrugroup.lead_service.entity.response.VentaResumenDetalleResponse(
                rv.fechaIngresoEtapa,
                dp.numeroDocumentoTitularServicio,
                l.lead,
                dp.nombreTitularServicio,
                l.codigoTipificacion, l.codigoSubtipificacion,
                rv.fechaUltimaGestion
            )
            FROM Lead l
            JOIN LeadEtapaResumen rv ON rv.idLead = l.id AND rv.etapa = :etapaVenta
            JOIN l.plan pl
            JOIN pl.proveedor pr
            LEFT JOIN l.datosPreventa dp
            WHERE pr.id = :idProveedor
              AND rv.fechaIngresoEtapa >= :inicio
              AND rv.fechaIngresoEtapa < :fin
              AND ( (:preventas = true AND (rv.mayorRangoCodigoTipificacion IN :codigosIngresadoOMas OR rv.ultimaCodigoTipificacion IS NULL))
                 OR (:registradas = true AND rv.ultimaCodigoTipificacion = :codigoIngresado)
                 OR (:programadas = true AND rv.ultimaCodigoTipificacion = :codigoProgramado)
                 OR (:rechazadas  = true AND rv.ultimaCodigoTipificacion IN :codigosRechazo) )
            ORDER BY rv.fechaIngresoEtapa DESC, l.id DESC
            """,
            countQuery = """
            SELECT COUNT(l.id)
            FROM Lead l
            JOIN LeadEtapaResumen rv ON rv.idLead = l.id AND rv.etapa = :etapaVenta
            JOIN l.plan pl
            JOIN pl.proveedor pr
            WHERE pr.id = :idProveedor
              AND rv.fechaIngresoEtapa >= :inicio
              AND rv.fechaIngresoEtapa < :fin
              AND ( (:preventas = true AND (rv.mayorRangoCodigoTipificacion IN :codigosIngresadoOMas OR rv.ultimaCodigoTipificacion IS NULL))
                 OR (:registradas = true AND rv.ultimaCodigoTipificacion = :codigoIngresado)
                 OR (:programadas = true AND rv.ultimaCodigoTipificacion = :codigoProgramado)
                 OR (:rechazadas  = true AND rv.ultimaCodigoTipificacion IN :codigosRechazo) )
            """)
    Page<pe.albrugroup.lead_service.entity.response.VentaResumenDetalleResponse> dashboardVentaResumenDetalle(
            @Param("etapaVenta") Etapa etapaVenta,
            @Param("idProveedor") Long idProveedor,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin,
            @Param("preventas") boolean preventas,
            @Param("registradas") boolean registradas,
            @Param("programadas") boolean programadas,
            @Param("rechazadas") boolean rechazadas,
            @Param("codigoIngresado") String codigoIngresado,
            @Param("codigoProgramado") String codigoProgramado,
            @Param("codigosIngresadoOMas") Collection<String> codigosIngresadoOMas,
            @Param("codigosRechazo") Collection<String> codigosRechazo,
            Pageable pageable
    );

    // Detalle de INSTALADAS: leads instalados EN EL PERÍODO (fechaInstalacion ∈ período), en VENTA o
    // POSTVENTA. Ancla distinta al resto (fechaInstalacion, no fechaIngresoEtapa), por eso query aparte.
    @Query(value = """
            SELECT new pe.albrugroup.lead_service.entity.response.VentaResumenDetalleResponse(
                rv.fechaIngresoEtapa,
                dp.numeroDocumentoTitularServicio,
                l.lead,
                dp.nombreTitularServicio,
                l.codigoTipificacion, l.codigoSubtipificacion,
                rv.fechaUltimaGestion
            )
            FROM Lead l
            JOIN LeadEtapaResumen rv ON rv.idLead = l.id AND rv.etapa = :etapaVenta
            JOIN l.plan pl
            JOIN pl.proveedor pr
            LEFT JOIN l.datosPreventa dp
            JOIN CalendarioFacturacionPostventa c ON c.lead = l AND c.activo = true
            WHERE pr.id = :idProveedor
              AND rv.ultimaCodigoTipificacion = :codigoInstalado
              AND c.fechaInstalacion >= :desdeDate
              AND c.fechaInstalacion < :hastaDateExcl
            ORDER BY c.fechaInstalacion DESC, l.id DESC
            """,
            countQuery = """
            SELECT COUNT(l.id)
            FROM Lead l
            JOIN LeadEtapaResumen rv ON rv.idLead = l.id AND rv.etapa = :etapaVenta
            JOIN l.plan pl
            JOIN pl.proveedor pr
            JOIN CalendarioFacturacionPostventa c ON c.lead = l AND c.activo = true
            WHERE pr.id = :idProveedor
              AND rv.ultimaCodigoTipificacion = :codigoInstalado
              AND c.fechaInstalacion >= :desdeDate
              AND c.fechaInstalacion < :hastaDateExcl
            """)
    Page<pe.albrugroup.lead_service.entity.response.VentaResumenDetalleResponse> dashboardVentaInstaladasDetalle(
            @Param("etapaVenta") Etapa etapaVenta,
            @Param("idProveedor") Long idProveedor,
            @Param("codigoInstalado") String codigoInstalado,
            @Param("desdeDate") java.time.LocalDate desdeDate,
            @Param("hastaDateExcl") java.time.LocalDate hastaDateExcl,
            Pageable pageable
    );
}
