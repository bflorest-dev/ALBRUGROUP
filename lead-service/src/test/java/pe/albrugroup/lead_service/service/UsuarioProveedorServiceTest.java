package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.UsuarioProveedor;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.UsuarioProveedorRepository;
import pe.albrugroup.lead_service.service.mapper.ProveedorMapper;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioProveedorServiceTest {

    @Mock private UsuarioProveedorRepository repository;
    @Mock private ProveedorRepository proveedorRepository;
    @Mock private ProveedorMapper proveedorMapper;

    @InjectMocks private UsuarioProveedorService service;

    @Test
    void asignarPostventaReplicaElMismoProveedorABackoffice() {
        Proveedor claro = Proveedor.builder().id(2L).nombre("CLARO").activo(true).build();
        when(proveedorRepository.findAllById(Set.of(2L))).thenReturn(List.of(claro));
        when(repository.findByIdEmpleadoAndAmbitoAndActivoTrueOrderByProveedorNombreAsc(15L, AmbitoProveedor.POSTVENTA))
                .thenReturn(List.of());

        service.asignarProveedores(15L, AmbitoProveedor.POSTVENTA, Set.of(2L));

        verify(repository).deleteByIdEmpleadoAndAmbito(15L, AmbitoProveedor.POSTVENTA);
        verify(repository).deleteByIdEmpleadoAndAmbito(15L, AmbitoProveedor.BACKOFFICE);
        verify(repository, atLeastOnce()).save(argThat(asignacion ->
                asignacion != null
                        && asignacion.getIdEmpleado().equals(15L)
                        && asignacion.getProveedor().getId().equals(2L)
                        && asignacion.getAmbito() == AmbitoProveedor.POSTVENTA));
        verify(repository, atLeastOnce()).save(argThat(asignacion ->
                asignacion != null
                        && asignacion.getIdEmpleado().equals(15L)
                        && asignacion.getProveedor().getId().equals(2L)
                && asignacion.getAmbito() == AmbitoProveedor.BACKOFFICE));
    }

    @Test
    void listarAsignacionesSoloDevuelveAsignacionesActivasDelAmbito() {
        Proveedor claro = Proveedor.builder().id(2L).nombre("CLARO").activo(true).build();
        UsuarioProveedor activa = UsuarioProveedor.builder()
                .idEmpleado(15L)
                .proveedor(claro)
                .ambito(AmbitoProveedor.BACKOFFICE)
                .activo(true)
                .build();
        when(repository.findByAmbitoAndActivoTrue(AmbitoProveedor.BACKOFFICE)).thenReturn(List.of(activa));

        var result = service.listarAsignaciones(AmbitoProveedor.BACKOFFICE);

        assertThat(result).containsExactly(new pe.albrugroup.lead_service.entity.response.AsignacionUsuarioProveedorResponse(
                15L, Set.of(2L)));
        verify(repository).findByAmbitoAndActivoTrue(AmbitoProveedor.BACKOFFICE);
    }

    @Test
    void reconciliarRolesUneAsignacionesDeAmbosAmbitos() {
        Proveedor claro = Proveedor.builder().id(2L).nombre("CLARO").activo(true).build();
        Proveedor win = Proveedor.builder().id(3L).nombre("WIN").activo(true).build();
        when(repository.findByIdEmpleadoAndAmbitoAndActivoTrueOrderByProveedorNombreAsc(15L, AmbitoProveedor.BACKOFFICE))
                .thenReturn(List.of(UsuarioProveedor.builder().idEmpleado(15L).proveedor(claro).ambito(AmbitoProveedor.BACKOFFICE).activo(true).build()));
        when(repository.findByIdEmpleadoAndAmbitoAndActivoTrueOrderByProveedorNombreAsc(15L, AmbitoProveedor.POSTVENTA))
                .thenReturn(List.of(UsuarioProveedor.builder().idEmpleado(15L).proveedor(win).ambito(AmbitoProveedor.POSTVENTA).activo(true).build()));

        service.reconciliarScopePorRoles(15L, Set.of("ASESOR_BACKOFFICE", "ASESOR_VENTAS"));

        verify(repository).deleteByIdEmpleadoAndAmbito(15L, AmbitoProveedor.BACKOFFICE);
        verify(repository).deleteByIdEmpleadoAndAmbito(15L, AmbitoProveedor.POSTVENTA);
        verify(repository, atLeastOnce()).save(argThat(asignacion -> asignacion != null
                && asignacion.getProveedor().getId().equals(2L)
                && asignacion.getAmbito() == AmbitoProveedor.BACKOFFICE));
        verify(repository, atLeastOnce()).save(argThat(asignacion -> asignacion != null
                && asignacion.getProveedor().getId().equals(3L)
                && asignacion.getAmbito() == AmbitoProveedor.POSTVENTA));
    }

    @Test
    void reconciliarSinRolDeProveedorLimpiaAmbosAmbitos() {
        service.reconciliarScopePorRoles(15L, Set.of("ASESOR_VENTAS"));

        verify(repository).deleteByIdEmpleadoAndAmbito(15L, AmbitoProveedor.BACKOFFICE);
        verify(repository).deleteByIdEmpleadoAndAmbito(15L, AmbitoProveedor.POSTVENTA);
        verify(repository, never()).findByIdEmpleadoAndAmbitoAndActivoTrueOrderByProveedorNombreAsc(any(), any());
        verify(repository, never()).save(any());
    }
}
