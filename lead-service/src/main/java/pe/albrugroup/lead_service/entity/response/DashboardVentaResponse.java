package pe.albrugroup.lead_service.entity.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Payload del DASHBOARD de la etapa VENTA (una foto atómica, filtrada por proveedor y período).
 * Solo devuelve absolutos; los porcentajes (6 conversiones, % por tipificación, Total por zona) los
 * calcula el frontend. Ver docs/PLAN_DASHBOARD_VENTA.md §10.
 *
 * Anclajes: contadores/estado/ranking = universo VENTA por {@code fechaIngresoEtapa ∈ período} + estado por
 * ULTIMA; zonas.instaladas/CF = instaladas por {@code fechaInstalacion ∈ período}; programacionActual = foto
 * del estado actual (ignora período).
 */
public record DashboardVentaResponse(
        ProveedorRef proveedor,
        PeriodoRef periodo,
        Contadores contadores,
        List<EstadoLead> estadoLeads,
        Zonas zonas,
        ProgramacionActual programacionActual,
        List<RankingAsesor> ranking
) {
    public record ProveedorRef(Long id, String nombre) {}

    public record PeriodoRef(LocalDate desde, LocalDate hasta) {}

    /**
     * Absolutos del cohorte VENTA (fila VENTA, fechaIngresoEtapa ∈ período). Los 5 cards son slices
     * DISTINTOS, ya no un embudo anidado: preventas por mayor rango, registradas/programadas/rechazadas
     * por última, instaladas por fechaInstalacion. Los tres "programadas*" alimentan las conversiones.
     */
    public record Contadores(
            long preventasCompletas,      // mayorRango ∈ {INGRESADO,PROGRAMADO,INSTALADO} ó última nula — UI: "Preventas"
            long ventasRegistradas,       // ultima == INGRESADO — UI: "Registradas"
            long ventasInstaladas,        // instaladas por fechaInstalacion ∈ período — UI: "Instaladas"
            long ventasRechazadas,        // ultima ∈ {SUBSANABLE, NO RECUPERABLE}
            long ventasProgramadasActual, // ultima == PROGRAMADO (== programacionActual.total) — UI: "Programadas"
            long programadasTotal,        // embudo (conversiones): mayorRango ∈ {PROGRAMADO, INSTALADO}
            long programadasInstaladas,   // embudo ∩ ultima == INSTALADO
            long programadasRechazadas    // embudo ∩ ultima ∈ rechazo
    ) {}

    /** Universo agrupado por última tipificación (código null => SIN_INGRESAR). Suma == preventasCompletas. */
    public record EstadoLead(String codigo, long cantidad) {}

    /** Tabla de zonas. "registradas" = ventasRegistradas por zona; instaladas ancladas en fechaInstalacion. */
    public record Zonas(Zona lima, Zona provincia, ZonaSinUbigeo sinUbigeo) {}

    public record Zona(
            long registradas,
            long instaladas,
            long registradasEInstaladas,  // ingresó a venta en el período Y instaló en el período
            BigDecimal cfTotal,           // SUM(precioPlanSnapshot) sobre instaladas del período
            BigDecimal cfPromedio         // AVG(precioPlanSnapshot)
    ) {}

    /** Detector de anomalía: ventas registradas sin dirección (ubigeo). Sano = 0. */
    public record ZonaSinUbigeo(long registradas) {}

    /** Bloque 3 — cartera viva de PROGRAMADO por subtipificación (estado actual, ignora período). */
    public record ProgramacionActual(long total, List<SubtipCount> porSubtipificacion) {}

    public record SubtipCount(String codigo, long cantidad) {}

    /** Bloque 6 — por asesor de mérito de preventa; Lima incluye Callao. */
    public record RankingAsesor(
            Long idAsesor, String nombre,
            long registradas, long instaladas,
            long registradasLima, long instaladasLima,
            long registradasProvincia, long instaladasProvincia
    ) {}
}
