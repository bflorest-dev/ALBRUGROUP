package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class EquipoRequest {

    @NotBlank(message = "El nombre del equipo es obligatorio")
    private String nombre;
    private String descripcion;
}
