package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Set;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class RegistrarUsuarioRequest {

    @NotBlank(message = "Falta Username")
    private String username;
    @NotBlank(message = "Falta Password")
    private String password;
    @NotBlank(message = "Falta Email")
    @Email(message = "Email Invalido")
    private String email;
    @NotNull(message = "EmpleadoID es obligatorio")
    private Long empleadoId;
    @NotNull(message = "Faltan Roles")
    private Set<String> roles;
}

