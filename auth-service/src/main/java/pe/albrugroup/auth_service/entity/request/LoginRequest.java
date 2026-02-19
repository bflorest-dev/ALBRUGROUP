package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class LoginRequest {

    @NotBlank(message = "El username es obligatorio")
    private String username;
    @NotBlank(message = "El password es obligatorio")
    private String password;
}
