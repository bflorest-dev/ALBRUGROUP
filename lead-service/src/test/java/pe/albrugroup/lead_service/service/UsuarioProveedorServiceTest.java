package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.UsuarioProveedorRepository;
import pe.albrugroup.lead_service.service.mapper.ProveedorMapper;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.atLeastOnce;
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
}
