package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.GastoCampana;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GastoCampanaRepository extends JpaRepository<GastoCampana, Long> {

    List<GastoCampana> findAllByOrderByReportedAtAscIdAsc();

    List<GastoCampana> findByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
            Long idCampana,
            LocalDateTime inicio,
            LocalDateTime fin
    );

    List<GastoCampana> findByReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
            LocalDateTime inicio,
            LocalDateTime fin
    );

    List<GastoCampana> findByCampanaProveedorIdInAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
            List<Long> proveedorIds,
            LocalDateTime inicio,
            LocalDateTime fin
    );

    List<GastoCampana> findByCampanaProveedorIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtAscIdAsc(
            Long idProveedor,
            LocalDateTime inicio,
            LocalDateTime fin
    );

    Optional<GastoCampana> findTopByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtDescIdDesc(
            Long idCampana,
            LocalDateTime inicio,
            LocalDateTime fin
    );

    Optional<GastoCampana> findByIdAndCampanaId(Long id, Long idCampana);

    @Query(value = """
            SELECT COALESCE(SUM(sub.costo_total), 0)
            FROM (
              SELECT DISTINCT ON (g.id_campana, g.reported_at::date)
                     g.costo_total
              FROM gasto_campana g
              JOIN campana c ON c.id = g.id_campana
              WHERE c.id_proveedor = :idProveedor
                AND g.reported_at >= :inicio
                AND g.reported_at < :fin
              ORDER BY g.id_campana,
                       g.reported_at::date,
                       g.reported_at DESC,
                       g.id DESC
            ) sub
            """, nativeQuery = true)
    BigDecimal sumCostoTotalByProveedorAndCierreDiario(
            @Param("idProveedor") Long idProveedor,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin
    );
}
