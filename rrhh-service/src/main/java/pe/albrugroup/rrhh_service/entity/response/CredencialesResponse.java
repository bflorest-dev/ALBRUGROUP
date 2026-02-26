package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class CredencialesResponse {
    private String username;
    private String password;
}
