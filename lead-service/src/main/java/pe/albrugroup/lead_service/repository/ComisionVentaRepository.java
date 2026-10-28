package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.repository.projection.ComisionVentaAsesorProjection;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ComisionVentaRepository extends JpaRepository<Lead, Long> {

    @Query(value = """
            SELECT cf.mes_corte_base       AS "mesCorteBase",
                   cf.numero_corte_base    AS "numeroCorteBase",
                   ler.id_asesor_merito    AS "idAsesor",
                   ler.nombre_asesor_merito AS "nombreAsesor",
                   (SELECT COUNT(*)
                    FROM lead l2
                    JOIN calendario_facturacion_postventa cf2 ON cf2.id_lead = l2.id
                    JOIN lead_etapa_resumen ler2 ON ler2.id_lead = l2.id AND ler2.etapa = 'PREVENTA'
                    WHERE l2.etapa IN ('POSTVENTA', 'COBRANZA')
                      AND cf2.proveedor_snapshot = :proveedor
                      AND cf2.activo = true
                      AND cf2.mes_corte_base = cf.mes_corte_base
                      AND ler2.id_asesor_merito = ler.id_asesor_merito
                   ) AS "ventasTotales",
                   COUNT(*) AS "ventasCorte",
                   COUNT(*) FILTER (WHERE z.nombre LIKE 'LIMA%') AS "ventasLima"
            FROM lead l
            JOIN calendario_facturacion_postventa cf ON cf.id_lead = l.id
            JOIN lead_seguimiento ls ON ls.id_lead = l.id
            JOIN lead_etapa_resumen ler ON ler.id_lead = l.id AND ler.etapa = 'PREVENTA'
            LEFT JOIN zona z ON z.id = l.id_zona
            WHERE l.etapa IN ('POSTVENTA', 'COBRANZA')
              AND NOT EXISTS (
                  SELECT 1
                  FROM pago_postventa pp_m
                  JOIN periodo_facturacion_postventa pf_m ON pf_m.id = pp_m.id_periodo_facturacion
                  WHERE pp_m.id_lead = l.id
                    AND pf_m.numero_periodo = 1
                    AND pp_m.fecha_pago IS NOT NULL
                    AND pp_m.fecha_pago > COALESCE(
                            CAST(:fechaLimiteMorosidad AS date),
                            COALESCE(pf_m.fecha_vencimiento_confirmado, pf_m.fecha_vencimiento_estimado) + INTERVAL '7 days'
                        )
              )
              AND cf.proveedor_snapshot = :proveedor
              AND cf.activo = true
              AND (
                  (cf.mes_corte_base = :mesCorte1 AND cf.numero_corte_base = :numCorte1)
                  OR (cf.mes_corte_base = :mesCorte2 AND cf.numero_corte_base = :numCorte2)
              )
              AND ler.id_asesor_merito IS NOT NULL
            GROUP BY cf.mes_corte_base, cf.numero_corte_base,
                     ler.id_asesor_merito, ler.nombre_asesor_merito
            ORDER BY cf.mes_corte_base, cf.numero_corte_base, "ventasTotales" DESC
            """, nativeQuery = true)
    List<ComisionVentaAsesorProjection> ventasPorCorteYAsesor(
            @Param("proveedor") String proveedor,
            @Param("fechaLimiteMorosidad") LocalDate fechaLimiteMorosidad,
            @Param("mesCorte1") LocalDate mesCorte1,
            @Param("numCorte1") int numCorte1,
            @Param("mesCorte2") LocalDate mesCorte2,
            @Param("numCorte2") int numCorte2
    );
}
