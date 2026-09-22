package pe.albrugroup.lead_service.service;

import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.repository.CampanaGastoRegistroRepository;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardFunnelServiceTest {

    @Mock private LeadEtapaResumenRepository resumenRepository;
    @Mock private CampanaGastoRegistroRepository gastoRepository;
    @Mock private ProveedorRepository proveedorRepository;
    @Mock private ProveedorScopeService proveedorScopeService;
    @Mock private EntityManager entityManager;
    @Mock private Session session;
    private DashboardFunnelService dashboardFunnelService;

    @BeforeEach
    void setUp() {
        dashboardFunnelService = new DashboardFunnelService(
                resumenRepository,
                gastoRepository,
                proveedorRepository,
                proveedorScopeService,
                entityManager
        );
    }

    @Test
    void instaladasUsaLaCohorteVentaYLaFechaDeInstalacionDelPeriodo() {
        LocalDate desde = LocalDate.of(2026, 9, 1);
        LocalDate hasta = LocalDate.of(2026, 9, 30);
        when(proveedorRepository.findById(2L)).thenReturn(Optional.of(
                Proveedor.builder().id(2L).nombre("CLARO").build()));
        when(entityManager.unwrap(Session.class)).thenReturn(session);
        when(session.getEnabledFilter("equipoFilter")).thenReturn(null);
        when(resumenRepository.dashboardFunnelPorMayorRango(
                Etapa.PREVENTA, 2L, Instant.parse("2026-09-01T05:00:00Z"), Instant.parse("2026-10-01T05:00:00Z")))
                .thenReturn(List.of());
        when(resumenRepository.dashboardFunnelInstaladas(
                2L,
                Instant.parse("2026-09-01T05:00:00Z"),
                Instant.parse("2026-10-01T05:00:00Z"),
                Etapa.VENTA,
                "INSTALADO",
                desde,
                hasta.plusDays(1)))
                .thenReturn(117L);
        when(gastoRepository.sumCostoTotalByProveedorAndCierreDiario(
                2L, Instant.parse("2026-09-01T05:00:00Z"), Instant.parse("2026-10-01T05:00:00Z")))
                .thenReturn(BigDecimal.ZERO);

        var response = dashboardFunnelService.obtener(2L, desde, hasta);

        assertThat(response.contadores().instaladas()).isEqualTo(117L);
        verify(resumenRepository).dashboardFunnelInstaladas(
                2L,
                Instant.parse("2026-09-01T05:00:00Z"),
                Instant.parse("2026-10-01T05:00:00Z"),
                Etapa.VENTA,
                "INSTALADO",
                desde,
                hasta.plusDays(1));
    }
}
