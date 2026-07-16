package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class EquipoActualizarRequest {

    private String nombre;
    private String descripcion;

    // Color de marca en formato '#RRGGBB'. Null = no se modifica.
    @Pattern(regexp = "^(#[0-9A-Fa-f]{6})?$", message = "El color debe tener el formato #RRGGBB")
    private String color;

    private Boolean activo;
}
