package pe.albrugroup.gateway_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.gateway_service.entity.enums.Disponibilidad;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Builder
public class AsesorGtrResponse {

    private Long empleadoId;
    private String nombreCompleto;
    private Disponibilidad disponibilidad;
    private Instant lastSeen;
    private String estadoSchedule;
    private LocalDateTime desde;
    private boolean esperadoHoy;
    private boolean operativo;
}
