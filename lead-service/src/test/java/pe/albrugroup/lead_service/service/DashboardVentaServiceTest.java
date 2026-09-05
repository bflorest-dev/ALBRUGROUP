package pe.albrugroup.lead_service.service;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.MetricaVentaDetalle;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.exception.ForbiddenException;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardVentaServiceTest {

    @Mock private LeadEtapaResumenRepository resumenRepository;
    @Mock private ProveedorRepository proveedorRepository;
    @Mock private ProveedorScopeService proveedorScopeService;
    @Mock private EquipoProveedorService equipoProveedorService;
    @Mock private CurrentUser currentUser;
    @Mock private EntityManager entityManager;

    @InjectMocks private DashboardVentaService dashboardVentaService;

    @Test
    void supervisorVentasListaSoloProveedoresDeSusEquipos() {
        prepararSupervisorVentas();
        when(equipoProveedorService.proveedorIdsVisibles()).thenReturn(Set.of(1L));
        when(proveedorRepository.findAllById(Set.of(1L))).thenReturn(List.of(
                Proveedor.builder().id(1L).nombre("WIN").activo(true).build()
        ));

        var proveedores = dashboardVentaService.proveedoresSeleccionables();

        assertThat(proveedores)
                .extracting("id", "nombre")
                .containsExactly(org.assertj.core.groups.Tuple.tuple(1L, "WIN"));
    }

    @Test
    void supervisorVentasSinProveedoresVisiblesRecibeListaVacia() {
        prepararSupervisorVentas();
        when(equipoProveedorService.proveedorIdsVisibles()).thenReturn(Set.of());

        var proveedores = dashboardVentaService.proveedoresSeleccionables();

        assertThat(proveedores).isEmpty();
        verify(proveedorRepository, never()).findAllById(any());
    }

    @Test
    void administradorMantieneTodosLosProveedoresActivos() {
        when(currentUser.roles()).thenReturn(List.of("ADMINISTRADOR"));
        when(proveedorScopeService.misProveedores()).thenReturn(List.of());
        when(proveedorRepository.listarPorActivo(true)).thenReturn(List.of(
                Proveedor.builder().id(2L).nombre("CLARO").activo(true).build(),
                Proveedor.builder().id(1L).nombre("WIN").activo(true).build()
        ));

        var proveedores = dashboardVentaService.proveedoresSeleccionables();

        assertThat(proveedores)
                .extracting("id", "nombre")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(2L, "CLARO"),
                        org.assertj.core.groups.Tuple.tuple(1L, "WIN")
                );
    }

    @Test
    void supervisorVentasNoPuedeConsultarProveedorFueraDeSuEquipo() {
        prepararSupervisorVentas();
        when(equipoProveedorService.proveedorIdsVisibles()).thenReturn(Set.of(1L));
        PageRequest pageRequest = PageRequest.builder().pageNumber(0).pageSize(25).build();

        assertThatThrownBy(() -> dashboardVentaService.obtener(2L, null, null))
                .isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> dashboardVentaService.obtenerTramos(2L))
                .isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> dashboardVentaService.obtenerAsesoresDetalle(2L, 10L, null, null, pageRequest))
                .isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> dashboardVentaService.obtenerResumenDetalle(
                2L, MetricaVentaDetalle.PREVENTAS, null, null, pageRequest))
                .isInstanceOf(ForbiddenException.class);

        verify(proveedorRepository, never()).findById(2L);
        verify(resumenRepository, never()).dashboardVentaUniverso(any(), any(), any(), any());
        verify(resumenRepository, never()).dashboardVentaTramos(any(), any(), any(), any());
    }

    private void prepararSupervisorVentas() {
        when(currentUser.roles()).thenReturn(List.of("SUPERVISOR_VENTAS"));
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
    }
}
