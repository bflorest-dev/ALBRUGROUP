package pe.albrugroup.gateway_service.presence;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.gateway_service.entity.enums.Disponibilidad;

import java.time.Instant;
import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class EmployeePresence {

    private Long empleadoId;
    private String username;
    private String nombreCompleto;
    private List<String> roles;
    private String status;
    private Disponibilidad disponibilidad;
    /** Momento en que empezó la disponibilidad actual (no se reinicia con el heartbeat). */
    private Instant disponibilidadDesde;
    private Instant lastSeen;
}
