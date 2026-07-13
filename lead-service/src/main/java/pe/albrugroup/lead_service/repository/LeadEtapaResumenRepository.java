package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.LeadEtapaResumen;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadEtapaResumenRepository extends JpaRepository<LeadEtapaResumen, Long> {

    Optional<LeadEtapaResumen> findByIdLeadAndEtapa(Long idLead, Etapa etapa);

    List<LeadEtapaResumen> findByIdLead(Long idLead);

    // Re-ejecutabilidad del backfill: se borran las filas del lead antes de reconstruirlas.
    void deleteByIdLead(Long idLead);

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
}
