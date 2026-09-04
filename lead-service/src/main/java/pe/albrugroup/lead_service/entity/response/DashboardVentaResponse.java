package pe.albrugroup.lead_service.entity.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Payload del DASHBOARD de la etapa VENTA (una foto atómica, filtrada por proveedor y período).
 * Solo devuelve absolutos; los porcentajes (6 conversiones, % por tipificación, Total por zona) los
 * calcula el frontend. Ver docs/PLAN_DASHBOARD_VENTA.md §10.
 *
 * Anclajes (cada métrica el suyo, a propósito): PREVENTAS + embudo de conversiones + breakdown + ranking =
 * cohorte por {@code fechaIngresoEtapa ∈ período}; REGISTRADAS/PROGRAMADAS/RECHAZADAS + zonas.registradas =
 * {@code ultimaTipificacionAt ∈ período}; INSTALADAS + zonas.instaladas/CF/registradasEInstaladas =
 * {@code fechaInstalacion ∈ período}; programacionActual = foto del estado actual (ignora período).
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
     * Dos grupos:
     *  - CARDS (los 5 contadores) = slices DISTINTOS con anclaje temporal propio (ver comentarios por campo),
     *    ya no un embudo anidado.
     *  - EMBUDO (solo para las 6 conversiones que calcula el frontend) = "alcanzó X alguna vez" por mayor
     *    rango sobre la cohorte (fechaIngresoEtapa), monotónico y anidado, para que los % sean coherentes
     *    (≤ 100%). NO son los cards.
     */
    public record Contadores(
            // Cards — cada uno con su propio anclaje temporal:
            long preventasCompletas,      // cohorte fechaIngresoEtapa; todos menos NO RECUPERABLE que nunca ingresó — UI: "Preventas"
            long ventasRegistradas,       // ultimaTipificacionAt ∈ período; ultima == INGRESADO — UI: "Registradas"
            long ventasInstaladas,        // fechaInstalacion ∈ período — UI: "Instaladas"
            long ventasRechazadas,        // ultimaTipificacionAt ∈ período; ultima ∈ rechazo Y mayorRango ≥ INGRESADO — UI: "Rechazadas"
            long ventasProgramadasActual, // ultimaTipificacionAt ∈ período; ultima == PROGRAMADO — UI: "Programadas"
            // Embudo (conversiones): base = preventasCompletas
            long registradasFunnel,       // mayorRango ∈ {INGRESADO,PROGRAMADO,INSTALADO} (registró alguna vez)
            long instaladasFunnel,        // ultima == INSTALADO en la cohorte (instaló alguna vez)
            long rechazadasFunnel,        // registró alguna vez Y última ∈ rechazo (cayó tras registrarse)
            long programadasTotal,        // mayorRango ∈ {PROGRAMADO, INSTALADO} (programó alguna vez)
            long programadasInstaladas,   // programadasTotal ∩ ultima == INSTALADO
            long programadasRechazadas    // programadasTotal ∩ ultima ∈ rechazo
    ) {}

    /**
     * Breakdown "Por tipificación": cohorte (fechaIngresoEtapa ∈ período) agrupada por última tipificación
     * (código null => SIN_INGRESAR). Suma == cohorte total (todos los que entraron), NO == preventasCompletas.
     */
    public record EstadoLead(String codigo, long cantidad) {}

    /** Tabla de zonas. "registradas" = card REGISTRADAS por zona (ultimaTipificacionAt); instaladas por fechaInstalacion. */
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
