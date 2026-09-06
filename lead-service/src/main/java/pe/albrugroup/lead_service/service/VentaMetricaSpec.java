package pe.albrugroup.lead_service.service;

import pe.albrugroup.lead_service.entity.enums.EnfoqueVenta;
import pe.albrugroup.lead_service.entity.enums.MetricaVentaDetalle;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Fuente única "una métrica, un anclaje": el predicado + anclaje temporal de cada contador del dashboard de
 * VENTA, expresado como fragmento JPQL sobre los alias del detalle (rv = LeadEtapaResumen VENTA, l = Lead,
 * rp = LeadEtapaResumen PREVENTA, c = CalendarioFacturacionPostventa, prog = evento PROGRAMADO vigente).
 *
 * <p>Los valores/predicados DEBEN coincidir con los de {@link DashboardVentaService} para que el total del
 * detalle cuadre con el número del card (misma ancla, mismo predicado). Si cambia uno, cambiar el otro.</p>
 */
public final class VentaMetricaSpec {

    private VentaMetricaSpec() {}

    public static final String INSTALADO = "INSTALADO";
    public static final String PROGRAMADO = "PROGRAMADO";
    public static final String INGRESADO = "INGRESADO";
    public static final String NO_RECUPERABLE = "NO RECUPERABLE";
    public static final String SUBSANABLE = "SUBSANABLE";
    public static final String SIN_INGRESAR = "SIN INGRESAR";
    public static final Set<String> INGRESADO_O_MAS = Set.of(INGRESADO, PROGRAMADO, INSTALADO);
    public static final Set<String> RECHAZO = Set.of(SUBSANABLE, NO_RECUPERABLE);
    public static final Set<String> PROGRAMADA_O_MAS = Set.of(PROGRAMADO, INSTALADO);

    /** Contexto de período/calificadores ya resuelto (instantes de Lima, fechas, etc.). */
    public record Ctx(
            Instant inicio,
            Instant fin,
            LocalDate desdeDate,
            LocalDate hastaDateExcl,
            String subtipificacion,
            Long idAsesor,
            List<LocalDate> tramoDias,
            String codigoUltima
    ) {}

    /** Predicado JPQL de la métrica + los parámetros nombrados que usa (solo los que referencia el where). */
    public record Spec(String where, Map<String, Object> params) {}

    public static Spec build(MetricaVentaDetalle metrica, EnfoqueVenta enfoque, Ctx ctx) {
        Map<String, Object> p = new LinkedHashMap<>();
        boolean dia = enfoque != EnfoqueVenta.GENERAL; // default = DIA
        String w;
        switch (metrica) {
            case PREVENTAS -> {
                p.put("inicio", ctx.inicio());
                p.put("fin", ctx.fin());
                p.put("codigoNoRecuperable", NO_RECUPERABLE);
                p.put("codigosIngresadoOMas", INGRESADO_O_MAS);
                w = "rv.fechaIngresoEtapa >= :inicio AND rv.fechaIngresoEtapa < :fin "
                        + "AND (rv.ultimaCodigoTipificacion IS NULL "
                        + "OR rv.ultimaCodigoTipificacion <> :codigoNoRecuperable "
                        + "OR rv.mayorRangoCodigoTipificacion IN :codigosIngresadoOMas)";
            }
            case SIN_INGRESAR -> {
                p.put("codigoSinIngresar", SIN_INGRESAR);
                p.put("fin", ctx.fin());
                if (dia) {
                    p.put("inicio", ctx.inicio());
                    w = "rv.fechaIngresoEtapa >= :inicio AND rv.fechaIngresoEtapa < :fin "
                            + "AND (rv.ultimaCodigoTipificacion IS NULL OR rv.ultimaCodigoTipificacion = :codigoSinIngresar)";
                } else {
                    w = "rv.fechaIngresoEtapa < :fin "
                            + "AND (rv.ultimaCodigoTipificacion IS NULL OR rv.ultimaCodigoTipificacion = :codigoSinIngresar)";
                }
            }
            case REGISTRADAS -> w = vivo(dia, INGRESADO, ctx, p);
            case PROGRAMADAS -> w = vivo(dia, PROGRAMADO, ctx, p);
            case SUBSANABLES -> w = vivo(dia, SUBSANABLE, ctx, p);
            case RECHAZADAS -> {
                p.put("inicio", ctx.inicio());
                p.put("fin", ctx.fin());
                p.put("codigoNoRecuperable", NO_RECUPERABLE);
                p.put("codigosIngresadoOMas", INGRESADO_O_MAS);
                String ancla = dia ? "rv.fechaIngresoEtapa" : "rv.ultimaTipificacionAt";
                w = ancla + " >= :inicio AND " + ancla + " < :fin "
                        + "AND rv.ultimaCodigoTipificacion = :codigoNoRecuperable "
                        + "AND rv.mayorRangoCodigoTipificacion IN :codigosIngresadoOMas";
            }
            case INSTALADAS -> {
                p.put("codigoInstalado", INSTALADO);
                if (dia) {
                    p.put("inicio", ctx.inicio());
                    p.put("fin", ctx.fin());
                    w = "rv.fechaIngresoEtapa >= :inicio AND rv.fechaIngresoEtapa < :fin "
                            + "AND rv.ultimaCodigoTipificacion = :codigoInstalado";
                } else {
                    p.put("desdeDate", ctx.desdeDate());
                    p.put("hastaDateExcl", ctx.hastaDateExcl());
                    w = "c.fechaInstalacion >= :desdeDate AND c.fechaInstalacion < :hastaDateExcl "
                            + "AND rv.ultimaCodigoTipificacion = :codigoInstalado";
                }
            }
            case COHORTE_ULTIMA -> {
                // Bloque "Por tipificación": cohorte (fechaIngresoEtapa ∈ período) por su ÚLTIMA cruda. Reproduce
                // 1:1 el bucket de `estadoLeads`: null/vacío = "sin ingresar" (última NULL o 'SIN INGRESAR').
                p.put("inicio", ctx.inicio());
                p.put("fin", ctx.fin());
                String codigo = ctx.codigoUltima();
                if (codigo == null || codigo.isBlank()) {
                    p.put("codigoSinIngresar", SIN_INGRESAR);
                    w = "rv.fechaIngresoEtapa >= :inicio AND rv.fechaIngresoEtapa < :fin "
                            + "AND (rv.ultimaCodigoTipificacion IS NULL OR rv.ultimaCodigoTipificacion = :codigoSinIngresar)";
                } else {
                    p.put("codigoUltima", codigo);
                    w = "rv.fechaIngresoEtapa >= :inicio AND rv.fechaIngresoEtapa < :fin "
                            + "AND rv.ultimaCodigoTipificacion = :codigoUltima";
                }
            }
            case ZONA_REGISTRADAS -> {
                // Fila "Registradas" de "Por territorio": mismo anclaje que Q2 dashboardVentaEstado
                // (ultimaTipificacionAt ∈ período, última == INGRESADO). La zona la acota buscar() vía zonaClause.
                p.put("inicio", ctx.inicio());
                p.put("fin", ctx.fin());
                p.put("codigoIngresado", INGRESADO);
                w = "rv.ultimaTipificacionAt >= :inicio AND rv.ultimaTipificacionAt < :fin "
                        + "AND rv.ultimaCodigoTipificacion = :codigoIngresado";
            }
            case PROGRAMACION_SUBTIP -> {
                // Foto del estado actual (ignora período). Usa los parámetros base :etapaVenta y :codigoProgramado.
                w = "l.etapa = :etapaVenta AND rv.ultimaCodigoTipificacion = :codigoProgramado";
                if (ctx.subtipificacion() != null && !ctx.subtipificacion().isBlank()) {
                    p.put("subtip", ctx.subtipificacion());
                    w += " AND rv.ultimaCodigoSubtipificacion = :subtip";
                }
            }
            case RANKING -> {
                p.put("inicio", ctx.inicio());
                p.put("fin", ctx.fin());
                p.put("idAsesor", ctx.idAsesor());
                w = "rv.fechaIngresoEtapa >= :inicio AND rv.fechaIngresoEtapa < :fin "
                        + "AND rp.idAsesorMerito = :idAsesor";
            }
            case TRAMOS -> {
                p.put("dias", ctx.tramoDias());
                w = "l.etapa = :etapaVenta AND rv.ultimaCodigoTipificacion = :codigoProgramado "
                        + "AND prog.fechaProgramacion IN :dias";
            }
            case EMBUDO_REGISTRADAS -> {
                p.put("codigosIngresadoOMas", INGRESADO_O_MAS);
                w = embudo("rv.mayorRangoCodigoTipificacion IN :codigosIngresadoOMas", ctx, p);
            }
            case EMBUDO_INSTALADAS -> {
                p.put("codigoInstalado", INSTALADO);
                w = embudo("rv.ultimaCodigoTipificacion = :codigoInstalado", ctx, p);
            }
            case EMBUDO_RECHAZADAS -> {
                p.put("codigosIngresadoOMas", INGRESADO_O_MAS);
                p.put("codigosRechazo", RECHAZO);
                w = embudo("rv.mayorRangoCodigoTipificacion IN :codigosIngresadoOMas "
                        + "AND rv.ultimaCodigoTipificacion IN :codigosRechazo", ctx, p);
            }
            case EMBUDO_PROGRAMADAS_TOTAL -> {
                p.put("codigosProgramadaOMas", PROGRAMADA_O_MAS);
                w = embudo("rv.mayorRangoCodigoTipificacion IN :codigosProgramadaOMas", ctx, p);
            }
            case EMBUDO_PROGRAMADAS_INSTALADAS -> {
                p.put("codigosProgramadaOMas", PROGRAMADA_O_MAS);
                p.put("codigoInstalado", INSTALADO);
                w = embudo("rv.mayorRangoCodigoTipificacion IN :codigosProgramadaOMas "
                        + "AND rv.ultimaCodigoTipificacion = :codigoInstalado", ctx, p);
            }
            case EMBUDO_PROGRAMADAS_RECHAZADAS -> {
                p.put("codigosProgramadaOMas", PROGRAMADA_O_MAS);
                p.put("codigosRechazo", RECHAZO);
                w = embudo("rv.mayorRangoCodigoTipificacion IN :codigosProgramadaOMas "
                        + "AND rv.ultimaCodigoTipificacion IN :codigosRechazo", ctx, p);
            }
            default -> throw new IllegalArgumentException("Métrica de detalle no soportada: " + metrica);
        }
        return new Spec(w, p);
    }

    /** Estados vivos (registradas/programadas/subsanables): DIA ancla en fechaIngresoEtapa; GENERAL acumula ≤ hasta. */
    private static String vivo(boolean dia, String codigoEstado, Ctx ctx, Map<String, Object> p) {
        p.put("codigoEstado", codigoEstado);
        p.put("fin", ctx.fin());
        if (dia) {
            p.put("inicio", ctx.inicio());
            return "rv.fechaIngresoEtapa >= :inicio AND rv.fechaIngresoEtapa < :fin "
                    + "AND rv.ultimaCodigoTipificacion = :codigoEstado";
        }
        return "rv.ultimaTipificacionAt < :fin AND rv.ultimaCodigoTipificacion = :codigoEstado";
    }

    /** Embudo: cohorte (fechaIngresoEtapa ∈ período) + el predicado de mayor rango / última del embudo. */
    private static String embudo(String extra, Ctx ctx, Map<String, Object> p) {
        p.put("inicio", ctx.inicio());
        p.put("fin", ctx.fin());
        return "rv.fechaIngresoEtapa >= :inicio AND rv.fechaIngresoEtapa < :fin AND " + extra;
    }
}
