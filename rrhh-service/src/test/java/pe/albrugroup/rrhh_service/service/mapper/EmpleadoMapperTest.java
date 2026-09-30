package pe.albrugroup.rrhh_service.service.mapper;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.EmpresaContratista;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;

import static org.assertj.core.api.Assertions.assertThat;

class EmpleadoMapperTest {

    private final EmpleadoMapper mapper = Mappers.getMapper(EmpleadoMapper.class);

    @Test
    void conservaElIdYNombreDeLaEmpresaContratistaEnLaRespuesta() {
        Empleado empleado = Empleado.builder()
                .id(7L)
                .empresaContratista(EmpresaContratista.builder()
                        .id(42L)
                        .nombre("Win Company")
                        .build())
                .build();

        EmpleadoResponse response = mapper.toResponse(empleado);

        assertThat(response.getIdEmpresaContratista()).isEqualTo(42L);
        assertThat(response.getEmpresaContratista()).isEqualTo("Win Company");
    }

    @Test
    void dejaNulaLaEmpresaCuandoElEmpleadoNoLaTiene() {
        EmpleadoResponse response = mapper.toResponse(Empleado.builder().id(8L).build());

        assertThat(response.getIdEmpresaContratista()).isNull();
        assertThat(response.getEmpresaContratista()).isNull();
    }
}
