package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.EquipoCampana;
import pe.albrugroup.lead_service.entity.EquipoProveedor;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.request.DistribucionCampanaEquipoRequest;
import pe.albrugroup.lead_service.entity.request.DistribucionCampanasProveedorRequest;
import pe.albrugroup.lead_service.entity.response.EquipoCampanaResponse;
import pe.albrugroup.lead_service.exception.ForbiddenException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EquipoCampanaRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipoCampanaServiceTest {

    @Mock private EquipoCampanaRepository equipoCampanaRepository;
    @Mock private EquipoProveedorRepository equipoProveedorRepository;
    @Mock private CampanaRepository campanaRepository;
    @Mock private CurrentUser currentUser;

    @Test
    void trasladaSoloLaCampanaSeleccionadaYConservaLasDemasDelOrigen() {
        EquipoCampanaService service = service();
        Campana campana = campanaClaro(136L);
        EquipoCampana asignacionOrigen = EquipoCampana.builder()
                .id(44L)
                .idEquipo(2L)
                .campana(campana)
                .build();

        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(equipoProveedorRepository.findByIdEquipo(6L)).thenReturn(List.of(proveedorEquipo(6L, 2L)));
        when(campanaRepository.findAllById(Set.of(136L))).thenReturn(List.of(campana));
        when(equipoCampanaRepository.findByCampanaIdIn(Set.of(136L))).thenReturn(List.of(asignacionOrigen));
        when(equipoCampanaRepository.findByIdEquipo(6L)).thenReturn(List.of());

        service.asignarCampanas(6L, Set.of(136L));

        verify(equipoCampanaRepository).deleteByIdEquipo(6L);
        verify(equipoCampanaRepository).deleteAllByIdInBatch(List.of(44L));
        ArgumentCaptor<EquipoCampana> captor = ArgumentCaptor.forClass(EquipoCampana.class);
        verify(equipoCampanaRepository).save(captor.capture());
        assertThat(captor.getValue().getIdEquipo()).isEqualTo(6L);
        assertThat(captor.getValue().getCampana().getId()).isEqualTo(136L);
    }

    @Test
    void rechazaTrasladoDesdeUnEquipoQueElSupervisorNoAdministra() {
        EquipoCampanaService service = service();
        Campana campana = campanaClaro(136L);
        EquipoCampana asignacionOrigen = EquipoCampana.builder()
                .id(44L)
                .idEquipo(2L)
                .campana(campana)
                .build();

        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(List.of(6L));
        when(equipoProveedorRepository.findByIdEquipo(6L)).thenReturn(List.of(proveedorEquipo(6L, 2L)));
        when(campanaRepository.findAllById(Set.of(136L))).thenReturn(List.of(campana));
        when(equipoCampanaRepository.findByCampanaIdIn(Set.of(136L))).thenReturn(List.of(asignacionOrigen));

        assertThatThrownBy(() -> service.asignarCampanas(6L, Set.of(136L)))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void listarConfiguracionConsultaSoloCampanasActivasDelProveedorDelEquipo() {
        EquipoCampanaService service = service();
        Campana campana = campanaClaro(136L);
        campana.setActivo(true);

        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(equipoProveedorRepository.findByIdEquipo(2L)).thenReturn(List.of(proveedorEquipo(2L, 2L)));
        when(campanaRepository.listarActivasPorProveedorIds(Set.of(2L))).thenReturn(List.of(campana));
        when(equipoCampanaRepository.findByCampanaIdIn(List.of(136L))).thenReturn(List.of());

        List<EquipoCampanaResponse> resultado = service.listarConfiguracion(2L);

        verify(campanaRepository).listarActivasPorProveedorIds(Set.of(2L));
        assertThat(resultado).extracting(EquipoCampanaResponse::getId).containsExactly(136L);
    }

    @Test
    void listaSoloLasCampanasDelEquipoOperativoSeleccionado() {
        EquipoCampanaService service = service();
        EquipoCampana asignacion = EquipoCampana.builder()
                .idEquipo(6L)
                .campana(campanaClaro(136L))
                .build();

        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(List.of(2L, 6L));
        when(equipoCampanaRepository.findByIdEquipo(6L)).thenReturn(List.of(asignacion));

        assertThat(service.campanaIdsVisibles(6L)).containsExactly(136L);
        verify(equipoCampanaRepository).findByIdEquipo(6L);
    }

    @Test
    void rechazaElEquipoOperativoFueraDelAlcanceDelUsuario() {
        EquipoCampanaService service = service();

        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(List.of(2L));

        assertThatThrownBy(() -> service.campanaIdsVisibles(6L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void reemplazaLaDistribucionCompletaDeUnProveedorSinTocarOtrosProveedoresDelEquipo() {
        EquipoCampanaService service = service();
        Campana primera = campanaClaro(136L);
        Campana segunda = campanaClaro(150L);
        EquipoCampana asignacionPrimera = EquipoCampana.builder()
                .id(44L)
                .idEquipo(2L)
                .campana(primera)
                .build();
        EquipoCampana asignacionSegunda = EquipoCampana.builder()
                .id(45L)
                .idEquipo(6L)
                .campana(segunda)
                .build();
        DistribucionCampanasProveedorRequest request = DistribucionCampanasProveedorRequest.builder()
                .asignaciones(List.of(
                        DistribucionCampanaEquipoRequest.builder().idCampana(136L).idEquipo(6L).build(),
                        DistribucionCampanaEquipoRequest.builder().idCampana(150L).idEquipo(null).build()
                ))
                .build();

        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(equipoProveedorRepository.findAll()).thenReturn(List.of(
                proveedorEquipo(2L, 2L), proveedorEquipo(6L, 2L)));
        when(campanaRepository.listarActivasPorProveedorIds(Set.of(2L))).thenReturn(List.of(primera, segunda));
        when(equipoCampanaRepository.findByCampanaIdIn(Set.of(136L, 150L)))
                .thenReturn(List.of(asignacionPrimera, asignacionSegunda));

        service.actualizarDistribucionProveedor(2L, request);

        verify(equipoCampanaRepository).deleteAllByIdInBatch(List.of(44L, 45L));
        ArgumentCaptor<EquipoCampana> captor = ArgumentCaptor.forClass(EquipoCampana.class);
        verify(equipoCampanaRepository).save(captor.capture());
        assertThat(captor.getValue().getCampana().getId()).isEqualTo(136L);
        assertThat(captor.getValue().getIdEquipo()).isEqualTo(6L);
    }

    private EquipoCampanaService service() {
        return new EquipoCampanaService(
                equipoCampanaRepository,
                equipoProveedorRepository,
                campanaRepository,
                currentUser
        );
    }

    private Campana campanaClaro(Long id) {
        return Campana.builder()
                .id(id)
                .nombre("CLARO")
                .activo(true)
                .proveedor(Proveedor.builder().id(2L).nombre("CLARO").build())
                .build();
    }

    private EquipoProveedor proveedorEquipo(Long idEquipo, Long idProveedor) {
        return EquipoProveedor.builder()
                .idEquipo(idEquipo)
                .proveedor(Proveedor.builder().id(idProveedor).nombre("CLARO").build())
                .build();
    }
}
