package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.auth_service.entity.enums.PuestoTrabajo;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class RegistrarUsuarioRequest {

    @NotNull(message = "EmpleadoID es obligatorio")
    private Long empleadoId;
    @NotBlank(message = "Nombres son obligatorios")
    private String nombres;
    @NotBlank(message = "Apellidos son obligatorios")
    private String apellidos;
    @NotBlank(message = "Dni es obligatorio")
    private String dni;
    @NotBlank(message = "Falta Email")
    @Email(message = "Email Invalido")
    private String email;
    @NotNull(message = "Falta Puesto de Trabajo")
    private PuestoTrabajo puestoTrabajo;
}


