package pe.albrugroup.lead_service.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.DashboardFunnelResponse;
import pe.albrugroup.lead_service.entity.response.DashboardFunnelResponse.FunnelContadores;
import pe.albrugroup.lead_service.entity.response.DashboardFunnelResponse.PeriodoRef;
import pe.albrugroup.lead_service.entity.response.DashboardFunnelResponse.ProveedorRef;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CampanaGastoRegistroRepository;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardFunnelService {

    private static final String SIN_CONTACTO = "SIN CONTACTO";

    private final LeadEtapaResumenRepository resumenRepository;
    private final CampanaGastoRegistroRepository gastoRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProveedorScopeService proveedorScopeService;
    private final EntityManager entityManager;

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

    @Transactional(readOnly = true)
    public DashboardFunnelResponse obtener(Long idProveedor, LocalDate desde, LocalDate hasta) {
        Proveedor proveedor = proveedorRepository.findById(idProveedor)
                .orElseThrow(() -> new NotFoundException(Proveedor.class, idProveedor));

        desactivarEquipoFilter();

        LocalDate desdeR = desde != null ? desde : OperationalDateTime.currentMonth().atDay(1);
        LocalDate hastaR = hasta != null ? hasta : OperationalDateTime.today();
        Instant inicio = OperationalDateTime.startOfDay(desdeR);
        Instant fin    = OperationalDateTime.endExclusiveOfDay(hastaR);

        List<Object[]> rows = resumenRepository.dashboardFunnelPorMayorRango(
                Etapa.PREVENTA, idProveedor, inicio, fin);

        long brutos = 0, sinContacto = 0, noCalifica = 0, sinCobertura = 0,
             noDesea = 0, servicioActivo = 0, preventa = 0;

        for (Object[] r : rows) {
            String codigo = (String) r[0];
            long n = ((Number) r[1]).longValue();
            brutos += n;

            if (codigo == null || SIN_CONTACTO.equals(codigo)) {
                sinContacto += n;
            } else {
                switch (codigo) {
                    case "NO CALIFICA"     -> noCalifica += n;
                    case "SIN COBERTURA"   -> sinCobertura += n;
                    case "NO DESEA"        -> noDesea += n;
                    case "SERVICIO ACTIVO" -> servicioActivo += n;
                    case "PREVENTA"        -> preventa += n;
                    default -> { /* códigos inesperados: cuentan en brutos pero no en ningún bucket */ }
                }
            }
        }

        long instaladas = resumenRepository.dashboardFunnelInstaladas(
                idProveedor, inicio, fin, Etapa.VENTA, "INSTALADO", desdeR, hastaR.plusDays(1));

        BigDecimal inversion = gastoRepository.sumCostoTotalByProveedorAndCierreDiario(
                idProveedor, inicio, fin);

        return new DashboardFunnelResponse(
                new ProveedorRef(proveedor.getId(), proveedor.getNombre()),
                new PeriodoRef(desdeR, hastaR),
                new FunnelContadores(
                        brutos, sinContacto, noCalifica, sinCobertura,
                        noDesea, servicioActivo, preventa, instaladas, inversion
                )
        );
    }

    private void desactivarEquipoFilter() {
        Session session = entityManager.unwrap(Session.class);
        if (session.getEnabledFilter("equipoFilter") != null) {
            session.disableFilter("equipoFilter");
        }
    }
}
