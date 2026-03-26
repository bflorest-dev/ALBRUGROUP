package pe.albrugroup.rrhh_service.integration.auth.dto;

import lombok.*;

import java.util.Set;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class UsuarioResponse {
    private Long empleadoId;
    private String dni;
    private String nombreCompleto;
    private String username;
    private Boolean activo;
    private String email;
    private Set<String> roles;
}
