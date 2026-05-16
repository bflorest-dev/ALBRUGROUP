package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class ActualizarCredencialesRequest {
    @NotBlank(message = "Nombres son obligatorios")
    private String nombres;
    @NotBlank(message = "Apellidos son obligatorios")
    private String apellidos;
    @NotBlank(message = "Dni es obligatorio")
    private String dni;
    @NotNull(message = "Falta Puesto de Trabajo")
    private PuestoTrabajo puestoTrabajo;
}
