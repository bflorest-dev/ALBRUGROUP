package pe.albrugroup.lead_service.entity.response;

import java.util.List;

/**
 * Respuesta del resumen diario de VENTA (replica web del reporte Excel del equipo). Todo se deriva del mismo
 * cohorte de leads que entraron a VENTA en el periodo, asi que las tablas cuadran entre si por construccion:
 * {@code Retornos + Sin Gestionar + Sum(tipificaciones) == contadores.ingresadas}.
 *
 * <ul>
 *   <li><b>Tabla 1</b> {@link Contadores}: ingresadas / subidas / instaladas (los % los calcula el frontend).</li>
 *   <li><b>Tabla 2</b> {@code tipificaciones}: desglose por bucket (RETORNO / SIN_GESTIONAR / codigo).</li>
 *   <li><b>Tabla 3</b> {@code porAsesor}: mismos buckets agrupados por asesor de merito de PREVENTA.</li>
 *   <li><b>Tabla 4</b> {@code detalle}: una fila por lead ingresado.</li>
 * </ul>
 */
public record VentaResumenDiarioResponse(
        Contadores contadores,
        List<CeldaTipi> tipificaciones,
        List<AsesorFila> porAsesor,
        List<VentaResumenDiarioDetalle> detalle
) {

    /** Tabla 1. Conversion (subidas/ingresadas) y efectividades (instaladas/subidas, instaladas/ingresadas) las calcula el frontend. */
    public record Contadores(long ingresadas, long subidas, long instaladas) {
    }

    /** Una celda del desglose por tipificacion. {@code orden} = orden de la matriz VENTA (null para los buckets RETORNO/SIN_GESTIONAR). */
    public record CeldaTipi(String clave, Integer orden, long cantidad) {
    }

    /** Una fila del desglose por asesor (Tabla 3). {@code idAsesor} null = sin merito ("#N/A"). */
    public record AsesorFila(Long idAsesor, String nombreAsesor, long total, List<CeldaTipi> celdas) {
    }
}
