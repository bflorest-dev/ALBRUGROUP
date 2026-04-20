package pe.albrugroup.auth_service.entity.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRolResponse {

    private Long empleadoId;
    private String nombreCompleto;
    private Set<String> roles;
}
