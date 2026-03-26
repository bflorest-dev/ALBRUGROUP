package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class ForgotPasswordRequest {

    @NotBlank(message = "Username es obligatorio")
    private String username;
    @NotBlank(message = "Email es obligatorio")
    @Email(message = "Email Invalido")
    private String email;
    @NotBlank(message = "Dni es obligatorio")
    private String dni;
}
