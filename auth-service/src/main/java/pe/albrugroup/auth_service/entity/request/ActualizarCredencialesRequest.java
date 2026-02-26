package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class ActualizarCredencialesRequest {
    @NotNull(message = "Nombres son obligatorios")
    private String nombres;
    @NotNull(message = "Apellidos son obligatorios")
    private String apellidos;
    @NotNull(message = "Dni es obligatorio")
    private String dni;
    @NotNull(message = "Falta Puesto de Trabajo")
    private PuestoTrabajo puestoTrabajo;
}
