package pe.albrugroup.auth_service.entity.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TokenRefreshResponse {

    private String token;
    private String refreshToken;
    private String type;
    private Long expiresIn;
    private LocalDate fechaIngresoEmpleado;
    private List<String> rolesAsignados;
    private String rolPrincipal;
    private String rolActivo;
}
