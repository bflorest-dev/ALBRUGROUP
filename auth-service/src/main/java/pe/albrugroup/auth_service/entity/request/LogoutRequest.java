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
public class LogoutRequest {

    @NotBlank(message = "Refresh token es obligatorio")
    private String refreshToken;
}
