package pe.albrugroup.rrhh_service.integration.auth.dto;

import lombok.*;

import java.util.Set;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class UsuarioResponse {
    private Long id;
    private String username;
    private String email;
    private Long empleadoId;
    private Boolean activo;
    private Set<String> roles;
}
