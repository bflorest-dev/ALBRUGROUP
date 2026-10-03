package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import pe.albrugroup.lead_service.entity.ResumenFinancieroDia;

import java.time.LocalDate;
import java.util.List;

public interface ResumenFinancieroDiaRepository extends JpaRepository<ResumenFinancieroDia, Long> {

    @Query("""
            SELECT r FROM ResumenFinancieroDia r
            LEFT JOIN FETCH r.zonas
            WHERE r.proveedor.id = :idProveedor
              AND r.fecha BETWEEN :desde AND :hasta
            ORDER BY r.fecha
            """)
    List<ResumenFinancieroDia> findByProveedorAndRango(Long idProveedor, LocalDate desde, LocalDate hasta);

    @Modifying
    @Query("DELETE FROM ResumenFinancieroDia r WHERE r.proveedor.id = :idProveedor AND r.fecha BETWEEN :desde AND :hasta")
    void deleteByProveedorAndRango(Long idProveedor, LocalDate desde, LocalDate hasta);

    // --- Queries de cálculo sobre las entidades fuente (nativas) ---

    @Query(nativeQuery = true, value = """
            SELECT l.id_zona AS idZona, COUNT(*) AS cantidad
            FROM lead l
            JOIN lead_seguimiento ls ON ls.id_lead = l.id
            JOIN zona z ON z.id = l.id_zona
            WHERE l.id_proveedor = :idProveedor
              AND z.es_geografica = true
              AND (ls.fecha_registro_crm AT TIME ZONE 'America/Lima')::date = :fecha
            GROUP BY l.id_zona
            """)
    List<Object[]> ingresadasPorZona(Long idProveedor, LocalDate fecha);

    @Query(nativeQuery = true, value = """
            SELECT l.id_zona AS idZona,
                   COUNT(*)  AS cantidad,
                   COALESCE(SUM(l.precio_plan_snapshot), 0) AS cfInstaladas
            FROM lead l
            JOIN lead_seguimiento ls ON ls.id_lead = l.id
            JOIN zona z ON z.id = l.id_zona
            WHERE l.id_proveedor = :idProveedor
              AND z.es_geografica = true
              AND ls.fecha_instalacion = :fecha
            GROUP BY l.id_zona
            """)
    List<Object[]> instaladasPorZona(Long idProveedor, LocalDate fecha);

    @Query(nativeQuery = true, value = """
            SELECT COALESCE(SUM(r.monto), 0)
            FROM recarga_cuenta_publicitaria r
            JOIN cuenta_publicitaria cp ON cp.id = r.id_cuenta_publicitaria
            WHERE cp.id_proveedor = :idProveedor
              AND r.fecha::date = :fecha
            """)
    java.math.BigDecimal ctaBancaria(Long idProveedor, LocalDate fecha);

    @Query(nativeQuery = true, value = """
            SELECT COALESCE(SUM(sub.costo_total), 0)
            FROM (
              SELECT DISTINCT ON (gc.id_campana) gc.costo_total
              FROM gasto_campana gc
              JOIN campana c ON c.id = gc.id_campana
              WHERE c.id_proveedor = :idProveedor
                AND gc.reported_at::date = :fecha
              ORDER BY gc.id_campana, gc.reported_at DESC
            ) sub
            """)
    java.math.BigDecimal ctaPublicitaria(Long idProveedor, LocalDate fecha);
}
