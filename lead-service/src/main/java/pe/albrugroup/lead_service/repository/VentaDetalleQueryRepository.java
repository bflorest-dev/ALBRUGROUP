package pe.albrugroup.lead_service.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.EnfoqueVenta;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.MetricaVentaDetalle;
import pe.albrugroup.lead_service.entity.response.VentaDetalleResponse;
import pe.albrugroup.lead_service.entity.response.VentaDetallePage;
import pe.albrugroup.lead_service.service.VentaMetricaSpec;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Detalle UNIFICADO del dashboard de VENTA: arma JPQL dinámico (anclaje según la métrica vía
 * {@link VentaMetricaSpec}, más búsqueda/orden/agrupación) y devuelve una página con el resumen de grupos.
 * Un solo DTO ({@link VentaDetalleResponse}) para todos los contadores; el frontend decide qué columnas mostrar.
 *
 * <p>Joins uniformes (fila / count / grupos) para que los parámetros y el predicado sean idénticos y el total
 * cuadre con el número del card. Los eventos vigentes (prog/rechazo/último) salen por {@code MAX(id)} correlacionado
 * (mismo idiom que las queries existentes). Se asume un solo calendario activo por lead.</p>
 */
@Repository
public class VentaDetalleQueryRepository {

    @PersistenceContext
    private EntityManager em;

    // Alias base y sus parámetros (siempre presentes en el FROM).
    private static final String FROM_JOINS = """
            FROM Lead l
            JOIN LeadEtapaResumen rv ON rv.idLead = l.id AND rv.etapa = :etapaVenta
            JOIN l.plan pl
            JOIN pl.proveedor pr
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.direccion d
            LEFT JOIN LeadEtapaResumen rp ON rp.idLead = l.id AND rp.etapa = :etapaPreventa
            LEFT JOIN CalendarioFacturacionPostventa c ON c.lead = l AND c.activo = true
            LEFT JOIN Evento prog ON prog.id = (
                SELECT MAX(e1.id) FROM Evento e1
                WHERE e1.idLead = l.id AND e1.etapa = :etapaVenta
                  AND e1.tipificacion = :codigoProgramado AND e1.horaProgramada IS NOT NULL)
            LEFT JOIN Evento rech ON rech.id = (
                SELECT MAX(e2.id) FROM Evento e2
                WHERE e2.idLead = l.id AND e2.etapa = :etapaVenta AND e2.fechaRechazo IS NOT NULL)
            LEFT JOIN Evento ultTip ON ultTip.id = (
                SELECT MAX(e3.id) FROM Evento e3
                WHERE e3.idLead = l.id AND e3.accion = :accionTip AND e3.etapa = :etapaVenta)
            """;

    private static final String SELECT_ROW = """
            SELECT new pe.albrugroup.lead_service.entity.response.VentaDetalleResponse(
                l.id, l.lead, l.usermeta,
                dp.numeroDocumentoTitularServicio, dp.nombreTitularServicio,
                l.etapa, rv.ultimaCodigoTipificacion, rv.ultimaCodigoSubtipificacion,
                rv.fechaIngresoEtapa, rv.fechaUltimaGestion,
                prog.fechaProgramacion, prog.horaProgramada,
                c.fechaInstalacion, rech.fechaRechazo,
                rp.nombreAsesorMerito, rv.nombreAsesorUltimaGestion,
                ultTip.comentario,
                d.ubigeoDomicilio, l.precioPlanSnapshot)
            """;

    private static final String ZONA_CASE = "CASE WHEN d.ubigeoDomicilio IS NULL OR d.ubigeoDomicilio = '' "
            + "THEN 'Sin ubigeo' WHEN SUBSTRING(d.ubigeoDomicilio, 1, 2) IN ('15','07') THEN 'Lima' "
            + "ELSE 'Provincia' END";

    private static final Map<String, String> SORT = Map.ofEntries(
            Map.entry("fechaIngresoEtapa", "rv.fechaIngresoEtapa"),
            Map.entry("fechaUltimaGestion", "rv.fechaUltimaGestion"),
            Map.entry("fechaInstalacion", "c.fechaInstalacion"),
            Map.entry("fechaProgramacion", "prog.fechaProgramacion"),
            Map.entry("fechaRechazo", "rech.fechaRechazo"),
            Map.entry("nombreCliente", "dp.nombreTitularServicio"),
            Map.entry("numeroDocumento", "dp.numeroDocumentoTitularServicio"),
            Map.entry("tipificacion", "rv.ultimaCodigoTipificacion"),
            Map.entry("lead", "l.lead"));

    private static final Map<String, String> GROUP = Map.of(
            "tipificacion", "rv.ultimaCodigoTipificacion",
            "subtipificacion", "rv.ultimaCodigoSubtipificacion",
            "etapa", "l.etapa",
            "asesorMerito", "rp.nombreAsesorMerito",
            "fechaInstalacion", "c.fechaInstalacion",
            "fechaProgramacion", "prog.fechaProgramacion",
            "zona", ZONA_CASE);

    public VentaDetallePage buscar(
            Long idProveedor, MetricaVentaDetalle metrica, EnfoqueVenta enfoque, String zona,
            VentaMetricaSpec.Ctx ctx, String search, String groupBy, String sortBy, String direction,
            int page, int size) {

        VentaMetricaSpec.Spec spec = VentaMetricaSpec.build(metrica, enfoque, ctx);

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("etapaVenta", Etapa.VENTA);
        params.put("etapaPreventa", Etapa.PREVENTA);
        params.put("codigoProgramado", VentaMetricaSpec.PROGRAMADO);
        params.put("accionTip", Accion.TIPIFICACION);
        params.put("idProveedor", idProveedor);
        params.putAll(spec.params());

        StringBuilder where = new StringBuilder("pr.id = :idProveedor AND (").append(spec.where()).append(")");
        where.append(zonaClause(zona));
        boolean hasSearch = search != null && !search.isBlank();
        if (hasSearch) {
            where.append(" AND (LOWER(dp.numeroDocumentoTitularServicio) LIKE :search "
                    + "OR LOWER(dp.nombreTitularServicio) LIKE :search "
                    + "OR LOWER(l.lead) LIKE :search OR LOWER(l.usermeta) LIKE :search)");
            params.put("search", "%" + search.trim().toLowerCase() + "%");
        }

        String groupExpr = groupBy != null ? GROUP.get(groupBy) : null;
        // sortBy fuera de la lista blanca (incluye el "createdAt" por defecto de PageRequest) → más reciente primero.
        boolean known = sortBy != null && SORT.containsKey(sortBy);
        String orderExpr = known ? SORT.get(sortBy) : "rv.fechaIngresoEtapa";
        String dir = !known ? "DESC" : ("desc".equalsIgnoreCase(direction) ? "DESC" : "ASC");

        StringBuilder order = new StringBuilder(" ORDER BY ");
        if (groupExpr != null) {
            order.append(groupExpr).append(" ASC, ");
        }
        order.append(orderExpr).append(' ').append(dir).append(", l.id DESC");

        // Filas
        Query rowQ = em.createQuery(SELECT_ROW + FROM_JOINS + " WHERE " + where + order);
        bind(rowQ, params);
        rowQ.setFirstResult(page * size);
        rowQ.setMaxResults(size);
        @SuppressWarnings("unchecked")
        List<VentaDetalleResponse> content = rowQ.getResultList();

        // Total
        Query countQ = em.createQuery("SELECT COUNT(DISTINCT l.id) " + FROM_JOINS + " WHERE " + where);
        bind(countQ, params);
        long total = ((Number) countQ.getSingleResult()).longValue();

        // Grupos (solo si se pidió agrupar)
        List<VentaDetallePage.GrupoResumen> grupos = new ArrayList<>();
        if (groupExpr != null) {
            Query groupQ = em.createQuery("SELECT " + groupExpr + ", COUNT(DISTINCT l.id) " + FROM_JOINS
                    + " WHERE " + where + " GROUP BY " + groupExpr + " ORDER BY COUNT(DISTINCT l.id) DESC");
            bind(groupQ, params);
            for (Object[] r : (List<Object[]>) groupQ.getResultList()) {
                grupos.add(new VentaDetallePage.GrupoResumen(
                        r[0] == null ? null : String.valueOf(r[0]), ((Number) r[1]).longValue()));
            }
        }

        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new VentaDetallePage(page, size, totalPages, total, content, grupos);
    }

    private static String zonaClause(String zona) {
        if (zona == null || zona.isBlank()) {
            return "";
        }
        return switch (zona.toUpperCase()) {
            case "LIMA" -> " AND SUBSTRING(d.ubigeoDomicilio, 1, 2) IN ('15','07')";
            case "PROVINCIA" -> " AND d.ubigeoDomicilio IS NOT NULL AND d.ubigeoDomicilio <> '' "
                    + "AND SUBSTRING(d.ubigeoDomicilio, 1, 2) NOT IN ('15','07')";
            case "SIN_UBIGEO" -> " AND (d.ubigeoDomicilio IS NULL OR d.ubigeoDomicilio = '')";
            default -> "";
        };
    }

    private static void bind(Query q, Map<String, Object> params) {
        params.forEach(q::setParameter);
    }
}
