package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class ActualizarNombreCuentaRequest {
    @NotBlank(message = "El nombre de la cuenta es obligatorio")
    private String nombreCuenta;
}
