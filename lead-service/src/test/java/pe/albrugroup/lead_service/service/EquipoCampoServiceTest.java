package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.ProveedorCampo;
import pe.albrugroup.lead_service.entity.enums.CampoConfigurable;
import pe.albrugroup.lead_service.repository.EquipoCampoRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.ProveedorCampoRepository;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipoCampoServiceTest {

    @Mock private EquipoCampoRepository equipoCampoRepository;
    @Mock private EquipoProveedorRepository equipoProveedorRepository;
    @Mock private EquipoProveedorService equipoProveedorService;
    @Mock private ProveedorCampoRepository proveedorCampoRepository;

    @InjectMocks private EquipoCampoService equipoCampoService;

    @Test
    void proveedorWinMuestraDatosDelTitularDelCelular() {
        when(equipoProveedorService.proveedorIdsVisibles()).thenReturn(null);
        when(proveedorCampoRepository.findByProveedorId(1L)).thenReturn(List.of(
                proveedorCampo(1L, CampoConfigurable.DOC_TITULAR_CELULAR, true, true),
                proveedorCampo(1L, CampoConfigurable.NOMBRE_TITULAR_CELULAR, true, true),
                proveedorCampo(1L, CampoConfigurable.NOMBRE_MADRE, false, false),
                proveedorCampo(1L, CampoConfigurable.NOMBRE_PADRE, false, false),
                proveedorCampo(1L, CampoConfigurable.PLANO, false, false)
        ));

        var config = equipoCampoService.resolverConfigPorProveedorVisible(1L);

        assertThat(config)
                .filteredOn(campo -> campo.getCampo() == CampoConfigurable.DOC_TITULAR_CELULAR
                        || campo.getCampo() == CampoConfigurable.NOMBRE_TITULAR_CELULAR)
                .allSatisfy(campo -> {
                    assertThat(campo.isVisible()).isTrue();
                    assertThat(campo.isRequerido()).isTrue();
                });
    }

    @Test
    void proveedorClaroOcultaDatosDelTitularDelCelular() {
        when(equipoProveedorService.proveedorIdsVisibles()).thenReturn(null);
        when(proveedorCampoRepository.findByProveedorId(2L)).thenReturn(List.of(
                proveedorCampo(2L, CampoConfigurable.DOC_TITULAR_CELULAR, false, false),
                proveedorCampo(2L, CampoConfigurable.NOMBRE_TITULAR_CELULAR, false, false),
                proveedorCampo(2L, CampoConfigurable.NOMBRE_MADRE, true, true),
                proveedorCampo(2L, CampoConfigurable.NOMBRE_PADRE, true, true),
                proveedorCampo(2L, CampoConfigurable.PLANO, true, true)
        ));

        var config = equipoCampoService.resolverConfigPorProveedorVisible(2L);

        assertThat(config)
                .filteredOn(campo -> campo.getCampo() == CampoConfigurable.DOC_TITULAR_CELULAR
                        || campo.getCampo() == CampoConfigurable.NOMBRE_TITULAR_CELULAR)
                .allSatisfy(campo -> {
                    assertThat(campo.isVisible()).isFalse();
                    assertThat(campo.isRequerido()).isFalse();
                });
    }

    @Test
    void configDirectaPorProveedorNoDependeDelScopeVisibleDelUsuario() {
        when(proveedorCampoRepository.findByProveedorId(2L)).thenReturn(List.of(
                proveedorCampo(2L, CampoConfigurable.DOC_TITULAR_CELULAR, false, false),
                proveedorCampo(2L, CampoConfigurable.NOMBRE_TITULAR_CELULAR, false, false),
                proveedorCampo(2L, CampoConfigurable.NOMBRE_MADRE, true, true),
                proveedorCampo(2L, CampoConfigurable.NOMBRE_PADRE, true, true),
                proveedorCampo(2L, CampoConfigurable.PLANO, true, true)
        ));

        var config = equipoCampoService.resolverConfigPorProveedor(2L);

        assertThat(config)
                .filteredOn(campo -> campo.getCampo() == CampoConfigurable.NOMBRE_MADRE
                        || campo.getCampo() == CampoConfigurable.NOMBRE_PADRE
                        || campo.getCampo() == CampoConfigurable.PLANO)
                .allSatisfy(campo -> {
                    assertThat(campo.isVisible()).isTrue();
                    assertThat(campo.isRequerido()).isTrue();
                });
    }

    @Test
    void configVisiblePorProveedorSigueRespetandoScopeDelUsuario() {
        when(equipoProveedorService.proveedorIdsVisibles()).thenReturn(Set.of(1L));

        var config = equipoCampoService.resolverConfigPorProveedorVisible(2L);

        assertThat(config).allSatisfy(campo -> {
            assertThat(campo.isVisible()).isFalse();
            assertThat(campo.isRequerido()).isFalse();
        });
    }

    private ProveedorCampo proveedorCampo(Long idProveedor, CampoConfigurable campo, boolean visible, boolean requerido) {
        return ProveedorCampo.builder()
                .proveedor(Proveedor.builder().id(idProveedor).build())
                .campo(campo)
                .visible(visible)
                .requerido(requerido)
                .build();
    }
}
