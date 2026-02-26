package pe.albrugroup.auth_service.entity.Response;

import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class CredencialesResponse {
    private String username;
    private String password;
}
