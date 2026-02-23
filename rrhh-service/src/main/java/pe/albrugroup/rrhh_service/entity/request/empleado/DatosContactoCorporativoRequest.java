package pe.albrugroup.rrhh_service.entity.request.empleado;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class DatosContactoCorporativoRequest {

    // CONTACTO CORPORATIVO
    @NotBlank private String celularCorporativo;
    @NotBlank private String correoCorporativo;
}
