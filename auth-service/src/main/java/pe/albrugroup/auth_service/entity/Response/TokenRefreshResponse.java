package pe.albrugroup.auth_service.entity.Response;

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
public class TokenRefreshResponse {

    private String token;
    private String refreshToken;
    private String type;
    private Long expiresIn;
}
