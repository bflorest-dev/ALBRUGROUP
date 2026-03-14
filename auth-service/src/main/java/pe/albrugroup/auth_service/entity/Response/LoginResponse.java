package pe.albrugroup.auth_service.entity.Response;

import lombok.*;

import java.util.List;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class LoginResponse {

    private String token;
    private String type;
    private String username;
    private Long empleadoId;
    private String nombreCompleto;
    private List<String> roles;
}
