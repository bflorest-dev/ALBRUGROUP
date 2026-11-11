package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.repository.projection.ComisionVentaAsesorProjection;
import pe.albrugroup.lead_service.repository.projection.ComisionVentaDetalleCountProjection;
import pe.albrugroup.lead_service.repository.projection.ComisionVentaDetalleProjection;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ComisionVentaRepository extends JpaRepository<Lead, Long> {

    String DETALLE_CTE = """
            WITH base AS (
                SELECT DISTINCT ON (l.id)
                       l.id AS id_lead,
                       COALESCE(NULLIF(TRIM(dp.nombre_titular_servicio), ''), NULLIF(TRIM(c.nombre_conocido), '')) AS nombre_cliente,
                       cf.fecha_instalacion,
                       cf.mes_corte_base,
                       cf.numero_corte_base,
                       pf.numero_periodo,
                       pf.fecha_vencimiento_confirmado,
                       pf.fecha_vencimiento_estimado
                FROM lead l
                JOIN calendario_facturacion_postventa cf ON cf.id_lead = l.id
                JOIN lead_seguimiento ls ON ls.id_lead = l.id
                JOIN lead_etapa_resumen ler ON ler.id_lead = l.id AND ler.etapa = 'PREVENTA'
                LEFT JOIN datos_preventa dp ON dp.id = l.id_datos_preventa
                LEFT JOIN contacto c ON c.id = l.id_contacto
                LEFT JOIN LATERAL (
                    SELECT pf1.numero_periodo,
                           pf1.fecha_vencimiento_confirmado,
                           pf1.fecha_vencimiento_estimado,
                           pf1.id
                    FROM periodo_facturacion_postventa pf1
                    WHERE pf1.id_lead = l.id
                      AND pf1.numero_periodo = 1
                    ORDER BY COALESCE(pf1.fecha_vencimiento_confirmado, pf1.fecha_vencimiento_estimado) DESC NULLS LAST,
                             pf1.id DESC
                    LIMIT 1
                ) pf ON TRUE
                WHERE l.etapa IN ('POSTVENTA', 'COBRANZA')
                  AND cf.proveedor_snapshot = :proveedor
                  AND cf.activo = true
                  AND cf.mes_corte_base = :mesCorteBase
                  AND cf.numero_corte_base = :numeroCorte
                  AND ler.id_asesor_merito = :idAsesor
                ORDER BY l.id, cf.id DESC
            ), evidence AS (
                SELECT b.*,
                       COALESCE(
                           CAST(:fechaLimiteMorosidad AS date),
                           COALESCE(b.fecha_vencimiento_confirmado, b.fecha_vencimiento_estimado) + INTERVAL '7 days'
                       )::date AS fecha_limite_efectiva,
                       vp.fecha_pago AS fecha_pago_valida,
                       vp.estado_pago AS estado_pago_valido,
                       lp.fecha_pago AS fecha_pago_ultimo,
                       lp.estado_pago AS estado_pago_ultimo
                FROM base b
                LEFT JOIN LATERAL (
                    SELECT pp.fecha_pago,
                           CAST(pp.estado AS text) AS estado_pago
                    FROM pago_postventa pp
                    JOIN periodo_facturacion_postventa pf2 ON pf2.id = pp.id_periodo_facturacion
                    WHERE pp.id_lead = b.id_lead
                      AND pf2.numero_periodo = 1
                      AND pp.fecha_pago IS NOT NULL
                      AND pp.fecha_pago <= COALESCE(
                          CAST(:fechaLimiteMorosidad AS date),
                          COALESCE(b.fecha_vencimiento_confirmado, b.fecha_vencimiento_estimado) + INTERVAL '7 days'
                      )
                    ORDER BY pp.fecha_pago ASC, pp.id ASC
                    LIMIT 1
                ) vp ON TRUE
                LEFT JOIN LATERAL (
                    SELECT pp.fecha_pago,
                           CAST(pp.estado AS text) AS estado_pago
                    FROM pago_postventa pp
                    JOIN periodo_facturacion_postventa pf3 ON pf3.id = pp.id_periodo_facturacion
                    WHERE pp.id_lead = b.id_lead
                      AND pf3.numero_periodo = 1
                      AND pp.fecha_pago IS NOT NULL
                    ORDER BY pp.fecha_pago DESC, pp.id DESC
                    LIMIT 1
                ) lp ON TRUE
            ), classified AS (
                SELECT e.*,
                       CASE
                           WHEN e.numero_periodo IS NOT NULL
                                AND e.fecha_pago_valida IS NOT NULL
                           THEN 'VALIDA'
                           ELSE 'NO_VALIDA'
                       END AS estado_validacion,
                       CASE
                           WHEN e.numero_periodo IS NULL
                               THEN 'No válido: sin período de pago 1'
                           WHEN :fechaLimiteMorosidad IS NULL
                                AND COALESCE(e.fecha_vencimiento_confirmado, e.fecha_vencimiento_estimado) IS NULL
                               THEN 'No válido: período sin fecha de vencimiento'
                           WHEN e.fecha_pago_valida IS NOT NULL
                               THEN 'Válido: pago dentro del límite'
                           WHEN e.fecha_pago_ultimo IS NULL
                               THEN 'No válido: sin pago registrado'
                           ELSE 'No válido: pago fuera del límite'
                       END AS motivo,
                       CASE
                           WHEN e.fecha_pago_valida IS NOT NULL THEN e.fecha_pago_valida
                           ELSE e.fecha_pago_ultimo
                       END AS fecha_pago_considerada,
                       CASE
                           WHEN e.fecha_vencimiento_confirmado IS NOT NULL THEN 'CONFIRMADO'
                           WHEN e.fecha_vencimiento_estimado IS NOT NULL THEN 'ESTIMADO'
                           ELSE 'SIN_REGISTRO'
                       END AS tipo_vencimiento,
                       CASE
                           WHEN e.fecha_pago_valida IS NOT NULL THEN e.estado_pago_valido
                           ELSE e.estado_pago_ultimo
                       END AS estado_pago
                FROM evidence e
            )
            """;

    String DETALLE_SELECT = """
            SELECT nombre_cliente AS "nombreCliente",
                   fecha_instalacion AS "fechaInstalacion",
                   COALESCE(fecha_vencimiento_confirmado, fecha_vencimiento_estimado) AS "fechaVencimiento",
                   fecha_limite_efectiva AS "fechaLimiteEfectiva",
                   fecha_pago_considerada AS "fechaPagoConsiderada",
                   tipo_vencimiento AS "tipoVencimiento",
                   estado_pago AS "estadoPago",
                   estado_validacion AS "estadoValidacion",
                   motivo AS "motivo"
            FROM classified
            WHERE :estado = 'TODOS'
               OR (:estado = 'VALIDAS' AND estado_validacion = 'VALIDA')
               OR (:estado = 'NO_VALIDAS' AND estado_validacion = 'NO_VALIDA')
            ORDER BY id_lead DESC
            """;

    String DETALLE_COUNT = """
            SELECT COUNT(*) AS "totalLeads",
                   COUNT(*) FILTER (WHERE estado_validacion = 'VALIDA') AS "totalValidas",
                   COUNT(*) FILTER (WHERE estado_validacion = 'NO_VALIDA') AS "totalNoValidas"
            FROM classified
            """;

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
              AND EXISTS (
                  SELECT 1
                  FROM pago_postventa pp_m
                  JOIN periodo_facturacion_postventa pf_m ON pf_m.id = pp_m.id_periodo_facturacion
                  WHERE pp_m.id_lead = l.id
                    AND pf_m.numero_periodo = 1
                    AND pp_m.fecha_pago IS NOT NULL
                    AND pp_m.fecha_pago <= COALESCE(
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

    @Query(value = DETALLE_CTE + DETALLE_SELECT,
            countQuery = DETALLE_CTE + "SELECT COUNT(*) FROM classified WHERE :estado = 'TODOS' OR (:estado = 'VALIDAS' AND estado_validacion = 'VALIDA') OR (:estado = 'NO_VALIDAS' AND estado_validacion = 'NO_VALIDA')",
            nativeQuery = true)
    Page<ComisionVentaDetalleProjection> detalleVentasPorCorte(
            @Param("proveedor") String proveedor,
            @Param("mesCorteBase") LocalDate mesCorteBase,
            @Param("numeroCorte") int numeroCorte,
            @Param("idAsesor") Long idAsesor,
            @Param("fechaLimiteMorosidad") LocalDate fechaLimiteMorosidad,
            @Param("estado") String estado,
            Pageable pageable
    );

    @Query(value = DETALLE_CTE + DETALLE_COUNT, nativeQuery = true)
    ComisionVentaDetalleCountProjection contarDetalleVentasPorCorte(
            @Param("proveedor") String proveedor,
            @Param("mesCorteBase") LocalDate mesCorteBase,
            @Param("numeroCorte") int numeroCorte,
            @Param("idAsesor") Long idAsesor,
            @Param("fechaLimiteMorosidad") LocalDate fechaLimiteMorosidad
    );
}
