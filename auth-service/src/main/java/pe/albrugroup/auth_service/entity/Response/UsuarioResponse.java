package pe.albrugroup.auth_service.entity.Response;

import lombok.*;

import java.util.Set;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class UsuarioResponse {

    private Long id;
    private String username;
    private String email;
    private Long empleadoId;
    private String nombreCompleto;
    private Boolean activo;
    private Set<String> roles;
}
