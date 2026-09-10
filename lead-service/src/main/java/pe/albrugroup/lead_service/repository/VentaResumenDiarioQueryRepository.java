package pe.albrugroup.lead_service.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.VentaResumenDiarioFila;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cohorte de "ventas ingresadas" del resumen diario de VENTA: los leads cuya fila {@code LeadEtapaResumen(VENTA)}
 * tiene {@code fechaIngresoEtapa} dentro del periodo. Una sola consulta trae todos los campos que necesitan las 4
 * tablas del reporte; el servicio deriva los contadores/desgloses en memoria para que las tablas cuadren.
 *
 * <p>Las fechas relevantes (programacion/rechazo/instalacion/ultima tipificacion) salen por {@code MAX(id)}
 * correlacionado sobre {@code Evento} (mismo idiom que {@link VentaDetalleQueryRepository} y la bandeja de VENTA).
 * El asesor de merito viene de la fila PREVENTA. Filtros {@code idEquipo}/{@code idProveedor} opcionales
 * (se agregan al WHERE solo si vienen; sin ellos el reporte es cross-equipo/proveedor).</p>
 */
@Repository
public class VentaResumenDiarioQueryRepository {

    @PersistenceContext
    private EntityManager em;

    private static final String FROM_JOINS = """
            FROM Lead l
            JOIN LeadEtapaResumen rv ON rv.idLead = l.id AND rv.etapa = :etapaVenta
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.direccion d
            LEFT JOIN l.plan pl
            LEFT JOIN pl.proveedor pr
            LEFT JOIN LeadEtapaResumen rp ON rp.idLead = l.id AND rp.etapa = :etapaPreventa
            LEFT JOIN Evento prog ON prog.id = (
                SELECT MAX(e1.id) FROM Evento e1
                WHERE e1.idLead = l.id AND e1.etapa = :etapaVenta
                  AND e1.fechaProgramacion IS NOT NULL AND e1.horaProgramada IS NOT NULL)
            LEFT JOIN Evento rech ON rech.id = (
                SELECT MAX(e2.id) FROM Evento e2
                WHERE e2.idLead = l.id AND e2.etapa = :etapaVenta AND e2.fechaRechazo IS NOT NULL)
            LEFT JOIN Evento inst ON inst.id = (
                SELECT MAX(e3.id) FROM Evento e3
                WHERE e3.idLead = l.id AND e3.etapa = :etapaVenta AND e3.fechaInstalacion IS NOT NULL)
            LEFT JOIN Evento ultTip ON ultTip.id = (
                SELECT MAX(e4.id) FROM Evento e4
                WHERE e4.idLead = l.id AND e4.accion = :accionTip AND e4.etapa = :etapaVenta)
            """;

    private static final String SELECT_ROW = """
            SELECT new pe.albrugroup.lead_service.entity.response.VentaResumenDiarioFila(
                l.id, l.lead, l.etapa,
                rv.ultimaCodigoTipificacion, rv.ultimaCodigoSubtipificacion,
                rv.ultimaTipificacionOrden, rv.mayorRangoOrden,
                rv.fechaIngresoEtapa,
                rp.idAsesorMerito, rp.nombreAsesorMerito, rv.nombreAsesorUltimaGestion,
                l.comentario,
                dp.tipoDocumento, dp.numeroDocumentoTitularServicio, dp.nombreTitularServicio,
                dp.celularRegistro, dp.celularReferencia,
                prog.fechaProgramacion, prog.horaProgramada, rech.fechaRechazo, inst.fechaInstalacion,
                ultTip.createdAt,
                d.ubigeoDomicilio)
            """;

    @SuppressWarnings("unchecked")
    public List<VentaResumenDiarioFila> cohorteIngresadas(
            Instant inicio, Instant fin, Long idEquipo, Long idProveedor) {

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("etapaVenta", Etapa.VENTA);
        params.put("etapaPreventa", Etapa.PREVENTA);
        params.put("accionTip", Accion.TIPIFICACION);
        params.put("inicio", inicio);
        params.put("fin", fin);

        StringBuilder where = new StringBuilder(
                "rv.fechaIngresoEtapa >= :inicio AND rv.fechaIngresoEtapa < :fin");
        if (idEquipo != null) {
            where.append(" AND l.idEquipo = :idEquipo");
            params.put("idEquipo", idEquipo);
        }
        if (idProveedor != null) {
            where.append(" AND pr.id = :idProveedor");
            params.put("idProveedor", idProveedor);
        }

        Query q = em.createQuery(SELECT_ROW + FROM_JOINS + " WHERE " + where
                + " ORDER BY rv.fechaIngresoEtapa ASC, l.id ASC");
        params.forEach(q::setParameter);
        return q.getResultList();
    }
}
