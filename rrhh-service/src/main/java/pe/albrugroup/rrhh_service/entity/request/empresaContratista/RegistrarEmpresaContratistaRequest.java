package pe.albrugroup.rrhh_service.entity.request.empresaContratista;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder(toBuilder = true)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RegistrarEmpresaContratistaRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
}
