package pe.albrugroup.gateway_service.integration.auth.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UsuarioRolResponse {

    private Long empleadoId;
    private String nombreCompleto;
    private List<String> roles;
}
