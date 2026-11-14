package pe.albrugroup.rrhh_service.entity.request.empresaContratista;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AsignarEmpresaContratistaRequest {

    @NotNull
    @Positive
    private Long idEmpleado;

    @NotEmpty
    private List<@Positive Long> idEmpresasContratistas;
}
