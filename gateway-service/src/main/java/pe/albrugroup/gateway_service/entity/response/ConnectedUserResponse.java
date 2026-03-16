package pe.albrugroup.gateway_service.entity.response;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
public class ConnectedUserResponse {

    private Long empleadoId;
    private String nombreCompleto;
    private List<String> roles;
    private String status;
    private Instant lastSeen;
}
