package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.repository.projection.GestionMensualCorteProjection;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PeriodoFacturacionPostventaRepository extends JpaRepository<PeriodoFacturacionPostventa, Long> {

    // Gestion mensual POSTVENTA (Dashboard ADMIN). Corte-driven: la fila la decide el corte guardado
    // (fuente de verdad) y el recibo/factura que toca en el mes se deriva por aritmetica del corte,
    // no por la fecha de vencimiento (que es solo display). :anioMes = year*12 + month del mes de gestion.
    // INNER JOIN al periodo: las bajas cuentan en el mes en que se dieron; leads en baja sin periodos
    // posteriores se excluyen correctamente. Alias camelCase entre comillas para el projection interface.
    @Query(value = """
            WITH calc AS (
              SELECT c.id AS id_cal, c.mes_corte_base, c.numero_corte_base,
                     ( :anioMes
                       - (EXTRACT(YEAR FROM c.mes_corte_base) * 12 + EXTRACT(MONTH FROM c.mes_corte_base)) )
                     - (CASE WHEN c.numero_corte_base = 2 THEN 1 ELSE 0 END) + 1 AS factura_n,
                     COALESCE(c.meses_permanencia_snapshot, 3) AS permanencia
              FROM calendario_facturacion_postventa c
              WHERE c.proveedor_snapshot = :proveedor AND c.activo = true
            )
            SELECT calc.mes_corte_base AS "mesCorteBase",
                   calc.numero_corte_base AS "numeroCorteBase",
                   CAST(calc.factura_n AS int) AS "numeroFactura",
                   COUNT(*) AS "total",
                   COUNT(*) FILTER (WHERE p.estado = 'CERRADO_PAGO_CLIENTE') AS "pagadoCliente",
                   COUNT(*) FILTER (WHERE p.estado = 'CERRADO_PAGO_EMPRESA') AS "pagadoEmpresa",
                   COUNT(*) FILTER (WHERE p.estado = 'ABIERTO')             AS "impagos",
                   COUNT(*) FILTER (WHERE p.estado IN ('CERRADO_BAJA','CERRADO_BAJA_ADEUDO')) AS "bajas"
            FROM calc
            JOIN periodo_facturacion_postventa p
              ON p.id_calendario_facturacion = calc.id_cal AND p.numero_periodo = calc.factura_n
            WHERE calc.factura_n BETWEEN 1 AND calc.permanencia
            GROUP BY calc.mes_corte_base, calc.numero_corte_base, calc.factura_n
            ORDER BY calc.mes_corte_base, calc.numero_corte_base
            """, nativeQuery = true)
    List<GestionMensualCorteProjection> gestionMensualPorCorte(
            @Param("anioMes") int anioMes,
            @Param("proveedor") String proveedor
    );

    List<PeriodoFacturacionPostventa> findByLeadIdOrderByNumeroPeriodoAsc(Long idLead);

    Optional<PeriodoFacturacionPostventa> findTopByLeadIdOrderByNumeroPeriodoDesc(Long idLead);

    Optional<PeriodoFacturacionPostventa> findTopByLeadIdAndEstadoOrderByNumeroPeriodoDesc(
            Long idLead,
            EstadoPeriodoFacturacionPostventa estado
    );

    Optional<PeriodoFacturacionPostventa> findByCalendarioFacturacionPostventaIdAndNumeroPeriodo(
            Long idCalendarioFacturacionPostventa,
            Integer numeroPeriodo
    );

    List<PeriodoFacturacionPostventa> findByLeadIdInOrderByLeadIdAscNumeroPeriodoDesc(Collection<Long> leadIds);
}
