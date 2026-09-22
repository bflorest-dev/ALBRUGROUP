package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CambiarRolActivoRequest {

    @NotBlank(message = "El rol activo es obligatorio")
    private String rolActivo;

    @NotBlank(message = "El refresh token es obligatorio")
    private String refreshToken;
}
