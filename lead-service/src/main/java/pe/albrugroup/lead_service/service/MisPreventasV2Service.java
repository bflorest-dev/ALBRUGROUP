package pe.albrugroup.lead_service.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.EnfoqueDia;
import pe.albrugroup.lead_service.entity.response.DashboardVentaResponse.ProveedorRef;
import pe.albrugroup.lead_service.entity.response.MisPreventasV2Response;
import pe.albrugroup.lead_service.entity.response.VentaDetallePage;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.VentaDetalleQueryRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Métricas de VENTA acotadas al asesor autenticado (MIS PREVENTAS V2). Análogo a
 * {@link DashboardVentaService} pero scope = {@code rp.idAsesorMerito = currentUser.empleadoID()}
 * en vez de {@code pr.id = idProveedor}. El filtro de proveedor es OPCIONAL: solo aplica cuando el
 * asesor tiene leads de varios proveedores y quiere acotar la vista.
 *
 * <p>Devuelve dos filas de la misma semántica ({@link EnfoqueDia}): {@code delDia} (cohorte nacida hoy)
 * y {@code delMes} (cohorte nacida en el mes hasta hoy). Ambas anclan en
 * {@code rv.fechaIngresoEtapa ∈ ventana} con ventanas distintas.</p>
 */
@Service
@RequiredArgsConstructor
public class MisPreventasV2Service {

    private static final int    ORDEN_INGRESADO = 4; // V50: INGRESADO ocupa el orden 4 en la matriz VENTA
    private static final String INSTALADO      = "INSTALADO";
    private static final String PROGRAMADO     = "PROGRAMADO";
    private static final String INGRESADO      = "INGRESADO";
    private static final String NO_RECUPERABLE = "NO RECUPERABLE";
    private static final String SUBSANABLE     = "SUBSANABLE";
    private static final String SIN_INGRESAR   = "SIN INGRESAR";
    private static final Set<String> INGRESADO_O_MAS  = Set.of(INGRESADO, PROGRAMADO, INSTALADO);
    private static final Set<String> PROGRAMADA_O_MAS = Set.of(PROGRAMADO, INSTALADO);
    private static final Set<String> RECHAZO          = Set.of(SUBSANABLE, NO_RECUPERABLE);

    private final LeadEtapaResumenRepository resumenRepository;
    private final VentaDetalleQueryRepository ventaDetalleQueryRepository;
    private final CurrentUser currentUser;
    private final EntityManager entityManager;

    /** Lista de proveedores para los que el asesor tiene al menos un lead en VENTA (dropdown). */
    @Transactional(readOnly = true)
    public List<ProveedorRef> proveedores() {
        desactivarEquipoFilter();
        Long idAsesor = currentUser.empleadoID();
        List<Object[]> rows = resumenRepository.misPreventasV2Proveedores(
                idAsesor, Etapa.VENTA, Etapa.PREVENTA);
        List<ProveedorRef> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            out.add(new ProveedorRef((Long) r[0], (String) r[1]));
        }
        return out;
    }

    /**
     * Cuadrante: {@code delDia} + {@code delMes} + embudo mensual de conversiones.
     *
     * @param idProveedor filtro opcional de proveedor; null = todos los proveedores del asesor.
     * @param mes         mes en formato "yyyy-MM"; null = mes operacional actual.
     */
    @Transactional(readOnly = true)
    public MisPreventasV2Response obtenerCuadrante(Long idProveedor, String mes) {
        desactivarEquipoFilter();
        Long idAsesor = currentUser.empleadoID();

        YearMonth yearMonth = mes != null ? YearMonth.parse(mes) : YearMonth.from(OperationalDateTime.currentMonth());
        LocalDate hoy = OperationalDateTime.today();
        LocalDate desdeR = yearMonth.atDay(1);
        LocalDate hastaR = yearMonth.atEndOfMonth().isBefore(hoy) ? yearMonth.atEndOfMonth() : hoy;

        Instant inicio = OperationalDateTime.startOfDay(desdeR);
        Instant fin = OperationalDateTime.endExclusiveOfDay(hastaR);
        LocalDate hastaExcl = hastaR.plusDays(1);

        // ── Del mes (cohort completo del mes hasta hoy) ──────────────────────────────────────
        List<Object[]> universoMes = idProveedor != null
                ? resumenRepository.misPreventasV2CohortePorProveedor(
                        idAsesor, idProveedor, Etapa.VENTA, Etapa.PREVENTA, inicio, fin)
                : resumenRepository.misPreventasV2Cohorte(
                        idAsesor, Etapa.VENTA, Etapa.PREVENTA, inicio, fin);

        Acc accMes = new Acc().consume(universoMes);

        long mesInstaladas = idProveedor != null
                ? resumenRepository.misPreventasV2InstaladasPorProveedor(
                        idAsesor, idProveedor, Etapa.VENTA, Etapa.PREVENTA,
                        INSTALADO, desdeR, hastaExcl)
                : resumenRepository.cuadranteAsesorInstaladas(
                        idAsesor, Etapa.VENTA, Etapa.PREVENTA,
                        INSTALADO, desdeR, hastaExcl);

        long mesInstaladasEnVentana = idProveedor != null
                ? resumenRepository.misPreventasV2InstaladasEnVentanaPorProveedor(
                        idAsesor, idProveedor, Etapa.VENTA, Etapa.PREVENTA,
                        INSTALADO, inicio, fin, desdeR, hastaExcl)
                : resumenRepository.cuadranteAsesorInstaladasEnVentana(
                        idAsesor, Etapa.VENTA, Etapa.PREVENTA,
                        INSTALADO, inicio, fin, desdeR, hastaExcl);

        EnfoqueDia delMes = accMes.enfoqueDia(mesInstaladas, mesInstaladasEnVentana);

        // ── Del día (cohort nacido hoy — solo si estamos en el mes actual) ──────────────────
        EnfoqueDia delDia;
        if (yearMonth.equals(YearMonth.from(OperationalDateTime.currentMonth()))) {
            Instant inicioDia = OperationalDateTime.startOfDay(hoy);
            // fin es el mismo (endExclusiveOfDay(hoy))

            List<Object[]> universoDia = idProveedor != null
                    ? resumenRepository.misPreventasV2CohortePorProveedor(
                            idAsesor, idProveedor, Etapa.VENTA, Etapa.PREVENTA, inicioDia, fin)
                    : resumenRepository.misPreventasV2Cohorte(
                            idAsesor, Etapa.VENTA, Etapa.PREVENTA, inicioDia, fin);

            Acc accDia = new Acc().consume(universoDia);

            long diaInstaladas = idProveedor != null
                    ? resumenRepository.misPreventasV2InstaladasPorProveedor(
                            idAsesor, idProveedor, Etapa.VENTA, Etapa.PREVENTA,
                            INSTALADO, hoy, hastaExcl)
                    : resumenRepository.cuadranteAsesorInstaladas(
                            idAsesor, Etapa.VENTA, Etapa.PREVENTA,
                            INSTALADO, hoy, hastaExcl);

            long diaInstaladasEnVentana = idProveedor != null
                    ? resumenRepository.misPreventasV2InstaladasEnVentanaPorProveedor(
                            idAsesor, idProveedor, Etapa.VENTA, Etapa.PREVENTA,
                            INSTALADO, inicioDia, fin, hoy, hastaExcl)
                    : resumenRepository.cuadranteAsesorInstaladasEnVentana(
                            idAsesor, Etapa.VENTA, Etapa.PREVENTA,
                            INSTALADO, inicioDia, fin, hoy, hastaExcl);

            delDia = accDia.enfoqueDia(diaInstaladas, diaInstaladasEnVentana);
        } else {
            delDia = new EnfoqueDia(0, 0, 0, 0, 0, 0, 0);
        }

        // ── Proveedores disponibles (para el dropdown del filtro) ────────────────────────────
        List<ProveedorRef> pvds = proveedoresInterno(idAsesor);

        return new MisPreventasV2Response(
                accMes.preventasCompletas,
                delDia,
                delMes,
                accMes.conversiones(),
                pvds);
    }

    /**
     * Tabla de leads del asesor para el mes solicitado (misma estructura que el detalle del dashboard VENTA).
     *
     * @param idProveedor filtro opcional; null = todos los proveedores del asesor.
     * @param mes         formato "yyyy-MM"; null = mes actual.
     */
    @Transactional(readOnly = true)
    public VentaDetallePage obtenerDetalle(
            Long idProveedor, String mes,
            String search, String groupBy, PageRequest pageRequest) {
        desactivarEquipoFilter();
        Long idAsesor = currentUser.empleadoID();

        YearMonth yearMonth = mes != null ? YearMonth.parse(mes) : YearMonth.from(OperationalDateTime.currentMonth());
        LocalDate hoy = OperationalDateTime.today();
        LocalDate desdeR = yearMonth.atDay(1);
        LocalDate hastaR = yearMonth.atEndOfMonth().isBefore(hoy) ? yearMonth.atEndOfMonth() : hoy;

        Instant inicio = OperationalDateTime.startOfDay(desdeR);
        Instant fin = OperationalDateTime.endExclusiveOfDay(hastaR);

        return ventaDetalleQueryRepository.buscarPorAsesor(
                idAsesor, idProveedor, inicio, fin,
                search, groupBy,
                pageRequest.getSortBy(), pageRequest.getDirection(),
                pageRequest.getPageNumber(), pageRequest.getPageSize());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────────────────

    private List<ProveedorRef> proveedoresInterno(Long idAsesor) {
        List<Object[]> rows = resumenRepository.misPreventasV2Proveedores(
                idAsesor, Etapa.VENTA, Etapa.PREVENTA);
        List<ProveedorRef> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            out.add(new ProveedorRef((Long) r[0], (String) r[1]));
        }
        return out;
    }

    private void desactivarEquipoFilter() {
        Session session = entityManager.unwrap(Session.class);
        if (session.getEnabledFilter("equipoFilter") != null) {
            session.disableFilter("equipoFilter");
        }
    }

    // ── Acumulador Q1 (replica de DashboardVentaService.Acumulador sin Q2) ────────────────────
    private static final class Acc {
        long preventasCompletas;
        long diaSinIngresar, diaRegistradas, diaProgramadas, diaSubsanables, diaRechazadas, diaInstaladas;
        long registradasFunnel, instaladasFunnel, rechazadasFunnel;
        long programadasTotal, programadasInstaladas, programadasRechazadas;

        Acc consume(List<Object[]> rows) {
            for (Object[] r : rows) {
                String ultima = (String) r[0];
                String mayor  = (String) r[1];
                long n = ((Number) r[2]).longValue();

                boolean sinIngresar = ultima == null || SIN_INGRESAR.equals(ultima);
                boolean alcanzoRegistrado = mayor != null && INGRESADO_O_MAS.contains(mayor);

                preventasCompletas += n;

                if (sinIngresar)                                                 diaSinIngresar  += n;
                else if (INGRESADO.equals(ultima))                               diaRegistradas  += n;
                else if (PROGRAMADO.equals(ultima))                              diaProgramadas  += n;
                else if (SUBSANABLE.equals(ultima))                              diaSubsanables  += n;
                else if (INSTALADO.equals(ultima))                               diaInstaladas   += n;
                else if (NO_RECUPERABLE.equals(ultima))                          diaRechazadas   += n;

                if (alcanzoRegistrado)                                           registradasFunnel   += n;
                if (INSTALADO.equals(ultima))                                    instaladasFunnel    += n;
                if (alcanzoRegistrado && esRechazo(ultima))                      rechazadasFunnel    += n;
                if (mayor != null && PROGRAMADA_O_MAS.contains(mayor)) {
                    programadasTotal += n;
                    if (INSTALADO.equals(ultima))  programadasInstaladas += n;
                    if (esRechazo(ultima))         programadasRechazadas += n;
                }
            }
            return this;
        }

        EnfoqueDia enfoqueDia(long instaladas, long instaladasEnVentana) {
            return new EnfoqueDia(diaSinIngresar, diaRegistradas, diaProgramadas, diaSubsanables,
                    diaRechazadas, instaladas, instaladasEnVentana);
        }

        MisPreventasV2Response.Conversiones conversiones() {
            return new MisPreventasV2Response.Conversiones(
                    registradasFunnel, instaladasFunnel, rechazadasFunnel,
                    programadasTotal, programadasInstaladas, programadasRechazadas);
        }

        private static boolean esRechazo(String c) {
            return c != null && RECHAZO.contains(c);
        }
    }
}
