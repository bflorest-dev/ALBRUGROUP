package pe.albrugroup.rrhh_service.entity.request.contrato;

import org.junit.jupiter.api.Test;
import pe.albrugroup.rrhh_service.entity.enums.CategoriaPersonal;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

import static org.assertj.core.api.Assertions.assertThat;

class RegistrarContratoRequestTest {

    @Test
    void aceptaLaNuevaCategoriaSinRol() {
        RegistrarContratoRequest request = RegistrarContratoRequest.builder()
                .categoriaPersonal(CategoriaPersonal.ESTRUCTURAL)
                .build();

        assertThat(request.isClasificacionContractualValida()).isTrue();
    }

    @Test
    void mantieneCompatibleUnPuestoLegadoSinCategoria() {
        RegistrarContratoRequest request = RegistrarContratoRequest.builder()
                .puestoTrabajo(PuestoTrabajo.ASESOR_VENTAS)
                .build();

        assertThat(request.isClasificacionContractualValida()).isTrue();
    }

    @Test
    void rechazaCategoriaYRolLegadoInconsistentes() {
        RegistrarContratoRequest request = RegistrarContratoRequest.builder()
                .categoriaPersonal(CategoriaPersonal.ESTRUCTURAL)
                .puestoTrabajo(PuestoTrabajo.ASESOR_VENTAS)
                .build();

        assertThat(request.isClasificacionContractualValida()).isFalse();
    }
}
