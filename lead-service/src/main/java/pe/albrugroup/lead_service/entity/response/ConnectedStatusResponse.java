package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ConnectedStatusResponse {

    private Long empleadoId;
    private boolean conectado;
}
