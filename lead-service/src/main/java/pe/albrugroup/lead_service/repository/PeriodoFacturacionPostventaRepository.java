package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.repository.projection.GestionCohorteCorteProjection;
import pe.albrugroup.lead_service.repository.projection.GestionMensualCorteProjection;

import java.time.LocalDate;
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

    @Query(value = """
            SELECT c.mes_corte_base AS "mesCorteBase",
                   c.numero_corte_base AS "numeroCorteBase",
                   p.numero_periodo AS "numeroFactura",
                   COALESCE(p.fecha_vencimiento_confirmado, p.fecha_vencimiento_estimado) AS "fechaVencimiento",
                   COUNT(*) AS "total",
                   COUNT(*) FILTER (WHERE p.estado = 'CERRADO_PAGO_CLIENTE') AS "pagadoCliente",
                   COUNT(*) FILTER (WHERE p.estado = 'CERRADO_PAGO_EMPRESA') AS "pagadoEmpresa",
                   COUNT(*) FILTER (WHERE p.estado = 'ABIERTO') AS "impagos",
                   COUNT(*) FILTER (WHERE p.estado IN ('CERRADO_BAJA', 'CERRADO_BAJA_ADEUDO')) AS "bajas"
            FROM calendario_facturacion_postventa c
            JOIN periodo_facturacion_postventa p ON p.id_calendario_facturacion = c.id
            WHERE c.proveedor_snapshot = :proveedor
              AND c.activo = true
              AND c.mes_corte_base = :mesCohorte
              AND p.numero_periodo BETWEEN 1 AND COALESCE(c.meses_permanencia_snapshot, 3)
            GROUP BY c.mes_corte_base,
                     c.numero_corte_base,
                     p.numero_periodo,
                     COALESCE(p.fecha_vencimiento_confirmado, p.fecha_vencimiento_estimado)
            ORDER BY p.numero_periodo, c.numero_corte_base, "fechaVencimiento"
            """, nativeQuery = true)
    List<GestionCohorteCorteProjection> gestionPorCohorte(
            @Param("mesCohorte") LocalDate mesCohorte,
            @Param("proveedor") String proveedor
    );

    @EntityGraph(attributePaths = {
            "lead", "lead.datosPreventa", "lead.plan", "lead.plan.internet", "calendarioFacturacionPostventa"
    })
    @Query(value = """
            SELECT p
            FROM PeriodoFacturacionPostventa p
            JOIN p.calendarioFacturacionPostventa c
            JOIN p.lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            WHERE c.proveedorSnapshot = :proveedor
              AND c.activo = true
              AND p.numeroPeriodo BETWEEN 1 AND COALESCE(c.mesesPermanenciaSnapshot, 3)
              AND (
                    (:modo = 'COHORTE' AND c.mesCorteBase = :mesReferencia)
                 OR (:modo = 'MENSUAL' AND p.numeroPeriodo =
                        :anioMes
                        - (YEAR(c.mesCorteBase) * 12 + MONTH(c.mesCorteBase))
                        - CASE WHEN c.numeroCorteBase = 2 THEN 1 ELSE 0 END
                        + 1)
              )
              AND (:filtrarMesCorte = false OR c.mesCorteBase = :mesCorteBase)
              AND (:filtrarNumeroCorte = false OR c.numeroCorteBase = :numeroCorte)
              AND (:filtrarNumeroRecibo = false OR p.numeroPeriodo = :numeroRecibo)
              AND (
                    :categoria = 'TOTAL'
                 OR (:categoria = 'PAGADOS' AND p.estado IN (
                        pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa.CERRADO_PAGO_CLIENTE,
                        pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa.CERRADO_PAGO_EMPRESA))
                 OR (:categoria = 'IMPAGOS' AND p.estado = pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa.ABIERTO)
                 OR (:categoria = 'BAJAS' AND p.estado IN (
                        pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa.CERRADO_BAJA,
                        pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa.CERRADO_BAJA_ADEUDO))
              )
              AND (
                    :filtrarEstadoPostventa = false
                 OR l.estadoClientePostventa = :estadoPostventa
                 OR (:estadoPostventa = pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa.ACTIVO
                     AND l.estadoClientePostventa IS NULL)
              )
              AND (:tipificacion = '' OR r.ultimaCodigoTipificacion = :tipificacion)
              AND (:subtipificacion = '' OR r.ultimaCodigoSubtipificacion = :subtipificacion)
              AND (
                    :buscar = ''
                 OR LOWER(COALESCE(l.lead, '')) LIKE LOWER(CONCAT('%', :buscar, '%'))
                 OR LOWER(COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot, '')) LIKE LOWER(CONCAT('%', :buscar, '%'))
                 OR LOWER(COALESCE(dp.nombreTitularServicio, '')) LIKE LOWER(CONCAT('%', :buscar, '%'))
              )
            ORDER BY
              CASE WHEN :sortBy = 'ultimaGestion' AND r.fechaUltimaGestion IS NULL THEN 1 ELSE 0 END ASC,
              CASE WHEN :sortBy = 'fechaInstalacion' AND :direction = 'asc' THEN c.fechaInstalacion END ASC,
              CASE WHEN :sortBy = 'fechaInstalacion' AND :direction = 'desc' THEN c.fechaInstalacion END DESC,
              CASE WHEN :sortBy = 'ultimaGestion' AND :direction = 'asc' THEN r.fechaUltimaGestion END ASC,
              CASE WHEN :sortBy = 'ultimaGestion' AND :direction = 'desc' THEN r.fechaUltimaGestion END DESC,
              p.id DESC
            """,
            countQuery = """
            SELECT COUNT(p)
            FROM PeriodoFacturacionPostventa p
            JOIN p.calendarioFacturacionPostventa c
            JOIN p.lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapa
            WHERE c.proveedorSnapshot = :proveedor
              AND c.activo = true
              AND p.numeroPeriodo BETWEEN 1 AND COALESCE(c.mesesPermanenciaSnapshot, 3)
              AND (
                    (:modo = 'COHORTE' AND c.mesCorteBase = :mesReferencia)
                 OR (:modo = 'MENSUAL' AND p.numeroPeriodo =
                        :anioMes
                        - (YEAR(c.mesCorteBase) * 12 + MONTH(c.mesCorteBase))
                        - CASE WHEN c.numeroCorteBase = 2 THEN 1 ELSE 0 END
                        + 1)
              )
              AND (:filtrarMesCorte = false OR c.mesCorteBase = :mesCorteBase)
              AND (:filtrarNumeroCorte = false OR c.numeroCorteBase = :numeroCorte)
              AND (:filtrarNumeroRecibo = false OR p.numeroPeriodo = :numeroRecibo)
              AND (
                    :categoria = 'TOTAL'
                 OR (:categoria = 'PAGADOS' AND p.estado IN (
                        pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa.CERRADO_PAGO_CLIENTE,
                        pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa.CERRADO_PAGO_EMPRESA))
                 OR (:categoria = 'IMPAGOS' AND p.estado = pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa.ABIERTO)
                 OR (:categoria = 'BAJAS' AND p.estado IN (
                        pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa.CERRADO_BAJA,
                        pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa.CERRADO_BAJA_ADEUDO))
              )
              AND (
                    :filtrarEstadoPostventa = false
                 OR l.estadoClientePostventa = :estadoPostventa
                 OR (:estadoPostventa = pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa.ACTIVO
                     AND l.estadoClientePostventa IS NULL)
              )
              AND (:tipificacion = '' OR r.ultimaCodigoTipificacion = :tipificacion)
              AND (:subtipificacion = '' OR r.ultimaCodigoSubtipificacion = :subtipificacion)
              AND (
                    :buscar = ''
                 OR LOWER(COALESCE(l.lead, '')) LIKE LOWER(CONCAT('%', :buscar, '%'))
                 OR LOWER(COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot, '')) LIKE LOWER(CONCAT('%', :buscar, '%'))
                 OR LOWER(COALESCE(dp.nombreTitularServicio, '')) LIKE LOWER(CONCAT('%', :buscar, '%'))
              )
            """)
    Page<PeriodoFacturacionPostventa> detalleMetrica(
            @Param("modo") String modo,
            @Param("mesReferencia") LocalDate mesReferencia,
            @Param("anioMes") int anioMes,
            @Param("proveedor") String proveedor,
            @Param("filtrarMesCorte") boolean filtrarMesCorte,
            @Param("mesCorteBase") LocalDate mesCorteBase,
            @Param("filtrarNumeroCorte") boolean filtrarNumeroCorte,
            @Param("numeroCorte") Integer numeroCorte,
            @Param("filtrarNumeroRecibo") boolean filtrarNumeroRecibo,
            @Param("numeroRecibo") Integer numeroRecibo,
            @Param("categoria") String categoria,
            @Param("filtrarEstadoPostventa") boolean filtrarEstadoPostventa,
            @Param("estadoPostventa") EstadoClientePostventa estadoPostventa,
            @Param("tipificacion") String tipificacion,
            @Param("subtipificacion") String subtipificacion,
            @Param("buscar") String buscar,
            @Param("etapa") Etapa etapa,
            @Param("sortBy") String sortBy,
            @Param("direction") String direction,
            Pageable pageable
    );

    @Query(value = """
            SELECT MAX(c.mes_corte_base)
            FROM calendario_facturacion_postventa c
            WHERE c.proveedor_snapshot = :proveedor
              AND c.activo = true
            """, nativeQuery = true)
    LocalDate ultimaMesCohorte(@Param("proveedor") String proveedor);

    List<PeriodoFacturacionPostventa> findByLeadIdOrderByNumeroPeriodoAsc(Long idLead);
    long countByLeadId(Long idLead);

    @Modifying
    @Query("DELETE FROM PeriodoFacturacionPostventa p WHERE p.lead.id = :idLead")
    void deleteByLeadId(@Param("idLead") Long idLead);

    Optional<PeriodoFacturacionPostventa> findTopByLeadIdOrderByNumeroPeriodoDesc(Long idLead);

    Optional<PeriodoFacturacionPostventa> findTopByLeadIdAndEstadoOrderByNumeroPeriodoDesc(
            Long idLead,
            EstadoPeriodoFacturacionPostventa estado
    );

    Optional<PeriodoFacturacionPostventa> findByCalendarioFacturacionPostventaIdAndNumeroPeriodo(
            Long idCalendarioFacturacionPostventa,
            Integer numeroPeriodo
    );

    List<PeriodoFacturacionPostventa> findByLeadIdAndEstadoOrderByNumeroPeriodoAsc(
            Long idLead,
            EstadoPeriodoFacturacionPostventa estado
    );

    List<PeriodoFacturacionPostventa> findByLeadIdInOrderByLeadIdAscNumeroPeriodoDesc(Collection<Long> leadIds);
}
