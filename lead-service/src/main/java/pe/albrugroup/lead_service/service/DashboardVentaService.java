package pe.albrugroup.lead_service.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.MetricaVentaDetalle;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.VentaAsesorDetalleResponse;
import pe.albrugroup.lead_service.entity.response.VentaResumenDetalleResponse;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.Contadores;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.EstadoLead;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.ProgramacionActual;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.ProveedorRef;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.RankingAsesor;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.SubtipCount;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.Zona;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.ZonaSinUbigeo;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.Zonas;
import pe.albrugroup.lead_service.entity.response.DashboardVentaTramosResponse;
import pe.albrugroup.lead_service.entity.response.DashboardVentaTramosResponse.Tramo;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * DASHBOARD de la etapa VENTA. Scope por PROVEEDOR (no por equipo): desactiva el {@code equipoFilter}
 * de Hibernate para que el filtro por {@code plan.proveedor.id} sea la única partición. Todo se lee de
 * {@link LeadEtapaResumen} (contadores/estado/ranking anclados en {@code fechaIngresoEtapa}); la
 * programación es foto del estado actual y las instaladas de zonas anclan en {@code fechaInstalacion}.
 * Ver docs/PLAN_DASHBOARD_VENTA.md.
 */
@Service
@RequiredArgsConstructor
public class DashboardVentaService {

    private static final String TIPIFICACION_INSTALADO = "INSTALADO";
    private static final String TIPIFICACION_PROGRAMADO = "PROGRAMADO";
    // Estado de ingreso: puede venir como última tipificación NULL (nunca gestionado) o como el código
    // literal "SIN INGRESAR" de la matriz. Ambos son "sin ingresar": NO cuentan como venta registrada.
    private static final String TIPIFICACION_SIN_INGRESAR = "SIN INGRESAR";
    private static final Set<String> TIPIFICACIONES_RECHAZO = Set.of("SUBSANABLE", "NO RECUPERABLE");
    // "Programada alguna vez" = el mayor rango llegó al menos a PROGRAMADO. Como no hay instalación
    // directa (todo INSTALADO pasó antes por PROGRAMADO), basta con estos dos códigos.
    private static final Set<String> TIPIFICACIONES_PROGRAMADA_O_MAS = Set.of(TIPIFICACION_PROGRAMADO, TIPIFICACION_INSTALADO);
    private static final Set<String> PREFIJOS_LIMA = Set.of("15", "07"); // Lima + Callao
    private static final LocalTime T08 = LocalTime.of(8, 0);
    private static final LocalTime T12 = LocalTime.of(12, 0);
    private static final LocalTime T16 = LocalTime.of(16, 0);
    private static final LocalTime T20 = LocalTime.of(20, 0);

    private final LeadEtapaResumenRepository resumenRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProveedorScopeService proveedorScopeService;
    private final EntityManager entityManager;

    /**
     * Proveedores que el usuario puede elegir en el dashboard: los asignados si está acotado por
     * proveedor (BACKOFFICE), o todos los activos si no lo está (ADMIN / SUPERVISOR_VENTAS / COMMUNITY).
     */
    @Transactional(readOnly = true)
    public List<ProveedorRef> proveedoresSeleccionables() {
        List<Proveedor> asignados = proveedorScopeService.misProveedores();
        List<Proveedor> lista = asignados.isEmpty() ? proveedorRepository.listarPorActivo(true) : asignados;
        List<ProveedorRef> out = new ArrayList<>(lista.size());
        for (Proveedor p : lista) {
            out.add(new ProveedorRef(p.getId(), p.getNombre()));
        }
        return out;
    }

    /** DETALLE paginado de los leads de un ASESOR (drill-down del ranking). Filtra proveedor + período. */
    @Transactional(readOnly = true)
    public PageResponse<VentaAsesorDetalleResponse> obtenerAsesoresDetalle(
            Long idProveedor, Long idAsesor, LocalDate desde, LocalDate hasta, PageRequest pageRequest) {
        desactivarEquipoFilter();
        Rango r = resolverRango(desde, hasta);
        Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPageNumber(), pageRequest.getPageSize());
        Page<VentaAsesorDetalleResponse> page = resumenRepository.dashboardVentaAsesorDetalle(
                Etapa.VENTA, Etapa.PREVENTA, idProveedor, r.inicio(), r.fin(), idAsesor, Accion.TIPIFICACION, pageable);
        return PageResponse.from(page);
    }

    /** DETALLE paginado de los leads de una MÉTRICA del resumen (drill-down de un contador). */
    @Transactional(readOnly = true)
    public PageResponse<VentaResumenDetalleResponse> obtenerResumenDetalle(
            Long idProveedor, MetricaVentaDetalle metrica, LocalDate desde, LocalDate hasta, PageRequest pageRequest) {
        desactivarEquipoFilter();
        Rango r = resolverRango(desde, hasta);
        Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPageNumber(), pageRequest.getPageSize());
        Page<VentaResumenDetalleResponse> page = resumenRepository.dashboardVentaResumenDetalle(
                Etapa.VENTA, idProveedor, r.inicio(), r.fin(),
                metrica == MetricaVentaDetalle.PREVENTAS,
                metrica == MetricaVentaDetalle.REGISTRADAS,
                metrica == MetricaVentaDetalle.PROGRAMADAS,
                metrica == MetricaVentaDetalle.RECHAZADAS,
                metrica == MetricaVentaDetalle.INSTALADAS,
                TIPIFICACION_SIN_INGRESAR, TIPIFICACIONES_PROGRAMADA_O_MAS, TIPIFICACIONES_RECHAZO, TIPIFICACION_INSTALADO,
                pageable);
        return PageResponse.from(page);
    }

    private record Rango(Instant inicio, Instant fin) {}

    private Rango resolverRango(LocalDate desde, LocalDate hasta) {
        LocalDate d = desde != null ? desde : OperationalDateTime.currentMonth().atDay(1);
        LocalDate h = hasta != null ? hasta : OperationalDateTime.today();
        return new Rango(OperationalDateTime.startOfDay(d), OperationalDateTime.endExclusiveOfDay(h));
    }

    private void desactivarEquipoFilter() {
        Session session = entityManager.unwrap(Session.class);
        if (session.getEnabledFilter("equipoFilter") != null) {
            session.disableFilter("equipoFilter");
        }
    }

    @Transactional(readOnly = true)
    public DashboardVentaResponse obtener(Long idProveedor, LocalDate desde, LocalDate hasta) {
        Proveedor proveedor = proveedorRepository.findById(idProveedor)
                .orElseThrow(() -> new NotFoundException(Proveedor.class, idProveedor));

        // El dashboard es cross-equipo dentro del proveedor: el equipoFilter (auto-activado por rol) no debe
        // estrecharlo. El proveedorFilter (BACKOFFICE) se conserva: es fail-closed sobre proveedores no asignados.
        Session session = entityManager.unwrap(Session.class);
        if (session.getEnabledFilter("equipoFilter") != null) {
            session.disableFilter("equipoFilter");
        }

        LocalDate desdeR = desde != null ? desde : OperationalDateTime.currentMonth().atDay(1);
        LocalDate hastaR = hasta != null ? hasta : OperationalDateTime.today();
        Instant inicio = OperationalDateTime.startOfDay(desdeR);
        Instant fin = OperationalDateTime.endExclusiveOfDay(hastaR);
        LocalDate hastaExcl = hastaR.plusDays(1);

        Acumulador acc = new Acumulador()
                .universo(resumenRepository.dashboardVentaUniverso(Etapa.VENTA, idProveedor, inicio, fin))
                .embudo(resumenRepository.dashboardVentaEmbudo(
                        Etapa.VENTA, idProveedor, inicio, fin, TIPIFICACIONES_PROGRAMADA_O_MAS));
        Contadores contadores = acc.build();

        Zonas zonas = construirZonas(
                acc,
                resumenRepository.dashboardVentaZonasInstaladas(
                        Etapa.VENTA, idProveedor, TIPIFICACION_INSTALADO, inicio, fin, desdeR, hastaExcl));

        ProgramacionActual programacion = construirProgramacion(
                resumenRepository.dashboardVentaProgramacionActual(Etapa.VENTA, idProveedor, TIPIFICACION_PROGRAMADO));

        List<RankingAsesor> ranking = construirRanking(
                resumenRepository.dashboardVentaRanking(
                        Etapa.VENTA, Etapa.PREVENTA, idProveedor, inicio, fin, TIPIFICACION_INSTALADO));

        return new DashboardVentaResponse(
                new ProveedorRef(proveedor.getId(), proveedor.getNombre()),
                new DashboardVentaResponse.PeriodoRef(desdeR, hastaR),
                contadores,
                acc.estadoLeads(),
                zonas,
                programacion,
                ranking
        );
    }

    /** Endpoint auxiliar (bloque 4): matriz tramo horario × día (hoy/mañana/pasado). Relativo a HOY. */
    @Transactional(readOnly = true)
    public DashboardVentaTramosResponse obtenerTramos(Long idProveedor) {
        Proveedor proveedor = proveedorRepository.findById(idProveedor)
                .orElseThrow(() -> new NotFoundException(Proveedor.class, idProveedor));
        Session session = entityManager.unwrap(Session.class);
        if (session.getEnabledFilter("equipoFilter") != null) {
            session.disableFilter("equipoFilter");
        }

        LocalDate hoy = OperationalDateTime.today();
        LocalDate manana = hoy.plusDays(1);
        LocalDate pasado = hoy.plusDays(2);

        long[][] m = new long[4][3]; // [tramo 0..3 (OTROS=3)][día 0=hoy,1=mañana,2=pasado]
        List<Object[]> rows = resumenRepository.dashboardVentaTramos(
                Etapa.VENTA, idProveedor, TIPIFICACION_PROGRAMADO, List.of(hoy, manana, pasado));
        for (Object[] r : rows) {
            LocalDate fecha = (LocalDate) r[0];
            LocalTime hora = (LocalTime) r[1];
            long n = asLong(r[2]);
            int dia = fecha.equals(hoy) ? 0 : fecha.equals(manana) ? 1 : fecha.equals(pasado) ? 2 : -1;
            if (dia < 0) continue;
            m[tramoIndex(hora)][dia] += n;
        }

        List<Tramo> tramos = List.of(
                new Tramo("TRAMO_1", T08, T12, m[0][0], m[0][1], m[0][2]),
                new Tramo("TRAMO_2", T12, T16, m[1][0], m[1][1], m[1][2]),
                new Tramo("TRAMO_3", T16, T20, m[2][0], m[2][1], m[2][2]),
                new Tramo("OTROS", null, null, m[3][0], m[3][1], m[3][2])
        );
        return new DashboardVentaTramosResponse(
                new ProveedorRef(proveedor.getId(), proveedor.getNombre()), hoy, manana, pasado, tramos);
    }

    private static int tramoIndex(LocalTime h) {
        if (h == null) return 3;
        if (!h.isBefore(T08) && h.isBefore(T12)) return 0;
        if (!h.isBefore(T12) && h.isBefore(T16)) return 1;
        if (!h.isBefore(T16) && h.isBefore(T20)) return 2;
        return 3;
    }

    // ── Contadores + estado (Q1 universo + Q2 embudo) ─────────────────────────────────────────────
    private static final class Acumulador {
        long preventasCompletas, ventasRegistradas, ventasInstaladas, ventasRechazadas, ventasProgramadasActual;
        long programadasTotal, programadasInstaladas, programadasRechazadas;
        final Map<String, Long> porUltima = new LinkedHashMap<>();
        final long[] registradasZona = new long[Zona3.values().length];

        Acumulador universo(List<Object[]> rows) {
            for (Object[] r : rows) {
                String ultima = (String) r[0];
                String prefijo = (String) r[1];
                long n = asLong(r[2]);
                preventasCompletas += n;
                boolean sinIngresar = esSinIngresar(ultima);
                // Fusiona null y "SIN INGRESAR" en un solo bucket "sin ingresar".
                porUltima.merge(sinIngresar ? null : ultima, n, Long::sum);
                if (!sinIngresar) {
                    ventasRegistradas += n;
                    registradasZona[Zona3.de(prefijo).ordinal()] += n;
                }
                if (TIPIFICACION_INSTALADO.equals(ultima)) ventasInstaladas += n;
                if (esRechazo(ultima)) ventasRechazadas += n;
                if (TIPIFICACION_PROGRAMADO.equals(ultima)) ventasProgramadasActual += n;
            }
            return this;
        }

        Acumulador embudo(List<Object[]> rows) {
            for (Object[] r : rows) {
                String ultima = (String) r[0];
                long n = asLong(r[1]);
                programadasTotal += n;
                if (TIPIFICACION_INSTALADO.equals(ultima)) programadasInstaladas += n;
                if (esRechazo(ultima)) programadasRechazadas += n;
            }
            return this;
        }

        Contadores build() {
            return new Contadores(preventasCompletas, ventasRegistradas, ventasInstaladas, ventasRechazadas,
                    ventasProgramadasActual, programadasTotal, programadasInstaladas, programadasRechazadas);
        }

        List<EstadoLead> estadoLeads() {
            List<EstadoLead> out = new ArrayList<>(porUltima.size());
            porUltima.forEach((codigo, cantidad) -> out.add(new EstadoLead(codigo, cantidad)));
            out.sort(Comparator.comparingLong(EstadoLead::cantidad).reversed());
            return out;
        }
    }

    // ── Zonas (Q1 registradas + Q3 instaladas/CF/registradasEInstaladas) ──────────────────────────
    private Zonas construirZonas(Acumulador acc, List<Object[]> instaladasRows) {
        long[] instaladas = new long[Zona3.values().length];
        long[] regEInst = new long[Zona3.values().length];
        BigDecimal[] cfTotal = {BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO};
        BigDecimal[] cfProm = {BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO};
        for (Object[] r : instaladasRows) {
            int z = Zona3.de((String) r[0]).ordinal();
            instaladas[z] += asLong(r[1]);
            cfTotal[z] = cfTotal[z].add(asBigDecimal(r[2]));
            cfProm[z] = asBigDecimal(r[3]).setScale(2, RoundingMode.HALF_UP);
            regEInst[z] += asLong(r[4]);
        }
        return new Zonas(
                zonaDe(Zona3.LIMA, acc, instaladas, regEInst, cfTotal, cfProm),
                zonaDe(Zona3.PROVINCIA, acc, instaladas, regEInst, cfTotal, cfProm),
                new ZonaSinUbigeo(acc.registradasZona[Zona3.SIN_UBIGEO.ordinal()])
        );
    }

    private Zona zonaDe(Zona3 z, Acumulador acc, long[] instaladas, long[] regEInst, BigDecimal[] cfTotal, BigDecimal[] cfProm) {
        int i = z.ordinal();
        return new Zona(acc.registradasZona[i], instaladas[i], regEInst[i], cfTotal[i], cfProm[i]);
    }

    // ── Programación actual (Q5) ──────────────────────────────────────────────────────────────────
    private ProgramacionActual construirProgramacion(List<Object[]> rows) {
        long total = 0;
        List<SubtipCount> subtips = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            long n = asLong(r[1]);
            total += n;
            subtips.add(new SubtipCount((String) r[0], n));
        }
        subtips.sort(Comparator.comparingLong(SubtipCount::cantidad).reversed());
        return new ProgramacionActual(total, subtips);
    }

    // ── Ranking (Q6) ──────────────────────────────────────────────────────────────────────────────
    private List<RankingAsesor> construirRanking(List<Object[]> rows) {
        Map<Long, RankingAcc> porAsesor = new LinkedHashMap<>();
        for (Object[] r : rows) {
            Long idAsesor = (Long) r[0];
            RankingAcc a = porAsesor.computeIfAbsent(idAsesor, k -> new RankingAcc(idAsesor, (String) r[1]));
            Zona3 z = Zona3.de((String) r[2]);
            long registradas = asLong(r[3]);
            long instaladas = asLong(r[4]);
            a.registradas += registradas;
            a.instaladas += instaladas;
            if (z == Zona3.LIMA) {
                a.registradasLima += registradas;
                a.instaladasLima += instaladas;
            } else if (z == Zona3.PROVINCIA) {
                a.registradasProv += registradas;
                a.instaladasProv += instaladas;
            }
        }
        List<RankingAsesor> out = new ArrayList<>(porAsesor.size());
        porAsesor.values().forEach(a -> out.add(new RankingAsesor(
                a.idAsesor, a.nombre, a.registradas, a.instaladas,
                a.registradasLima, a.instaladasLima, a.registradasProv, a.instaladasProv)));
        out.sort(Comparator.comparingLong(RankingAsesor::registradas).reversed()
                .thenComparing(Comparator.comparingLong(RankingAsesor::instaladas).reversed()));
        return out;
    }

    private static final class RankingAcc {
        final Long idAsesor;
        final String nombre;
        long registradas, instaladas, registradasLima, instaladasLima, registradasProv, instaladasProv;
        RankingAcc(Long idAsesor, String nombre) { this.idAsesor = idAsesor; this.nombre = nombre; }
    }

    private enum Zona3 {
        LIMA, PROVINCIA, SIN_UBIGEO;
        static Zona3 de(String prefijo) {
            if (prefijo == null || prefijo.isBlank()) return SIN_UBIGEO;
            return PREFIJOS_LIMA.contains(prefijo) ? LIMA : PROVINCIA;
        }
    }

    // Set.of(...) lanza NPE ante contains(null); un lead SIN INGRESAR tiene última = null.
    private static boolean esRechazo(String codigo) {
        return codigo != null && TIPIFICACIONES_RECHAZO.contains(codigo);
    }

    private static boolean esSinIngresar(String codigo) {
        return codigo == null || TIPIFICACION_SIN_INGRESAR.equals(codigo);
    }

    private static long asLong(Object o) {
        return o == null ? 0L : ((Number) o).longValue();
    }

    private static BigDecimal asBigDecimal(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal b) return b;
        return BigDecimal.valueOf(((Number) o).doubleValue());
    }
}
