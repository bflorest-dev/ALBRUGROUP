package pe.albrugroup.auth_service.entity.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private List<String> rolesAsignados;
    private String rolPrincipal;
    private String rolActivo;
}
