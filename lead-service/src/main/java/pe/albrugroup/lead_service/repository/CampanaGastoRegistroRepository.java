package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.CampanaGastoRegistro;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CampanaGastoRegistroRepository extends JpaRepository<CampanaGastoRegistro, Long> {

    List<CampanaGastoRegistro> findByCampanaIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
            Long idCampana,
            Instant inicio,
            Instant fin
    );

    List<CampanaGastoRegistro> findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
            Instant inicio,
            Instant fin
    );

    List<CampanaGastoRegistro> findByCampanaProveedorIdInAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
            List<Long> proveedorIds,
            Instant inicio,
            Instant fin
    );

    Optional<CampanaGastoRegistro> findTopByCampanaIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long idCampana,
            Instant inicio,
            Instant fin
    );

    boolean existsByCampanaIdAndFechaCarga(Long idCampana, LocalDate fechaCarga);

    boolean existsByCampanaIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            Long idCampana,
            Instant inicio,
            Instant fin
    );

    boolean existsByCampanaIdAndCreatedAtAndFechaCarga(Long idCampana, Instant createdAt, LocalDate fechaCarga);

    Optional<CampanaGastoRegistro> findTopByCampanaIdAndFechaCargaOrderByIdDesc(Long idCampana, LocalDate fechaCarga);

    @Query(value = """
            SELECT COALESCE(SUM(sub.costo_total), 0)
            FROM (
              SELECT DISTINCT ON (g.id_campana, (g.created_at AT TIME ZONE 'America/Lima')::date)
                     g.costo_total
              FROM campana_gasto_registro g
              JOIN campana c ON c.id = g.id_campana
              WHERE c.id_proveedor = :idProveedor
                AND g.created_at >= :inicio
                AND g.created_at < :fin
              ORDER BY g.id_campana,
                       (g.created_at AT TIME ZONE 'America/Lima')::date,
                       g.created_at DESC
            ) sub
            """, nativeQuery = true)
    BigDecimal sumCostoTotalByProveedorAndCierreDiario(
            @Param("idProveedor") Long idProveedor,
            @Param("inicio") Instant inicio,
            @Param("fin") Instant fin
    );
}
