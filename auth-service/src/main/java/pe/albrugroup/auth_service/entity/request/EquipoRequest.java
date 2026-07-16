package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class EquipoRequest {

    @NotBlank(message = "El nombre del equipo es obligatorio")
    private String nombre;
    private String descripcion;

    // Color de marca en formato '#RRGGBB' (opcional).
    @Pattern(regexp = "^(#[0-9A-Fa-f]{6})?$", message = "El color debe tener el formato #RRGGBB")
    private String color;
}
