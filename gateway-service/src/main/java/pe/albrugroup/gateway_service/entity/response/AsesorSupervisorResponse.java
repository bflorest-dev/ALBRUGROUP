package pe.albrugroup.gateway_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import pe.albrugroup.gateway_service.entity.enums.Disponibilidad;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
@Builder
public class AsesorSupervisorResponse {

    private Long empleadoId;
    private String nombreCompleto;
    private List<String> roles;
    private Disponibilidad disponibilidad;
    private Instant disponibilidadDesde;
    private Instant lastSeen;
    private String estadoSchedule;
    private LocalDateTime desde;
    private LocalTime entradaProgramada;
    private boolean esperadoHoy;
    private boolean tieneRegistroHoy;
    private boolean operativo;
    private Integer minutosServiciosEnCurso;
    private Integer minutosServiciosAcumulados;
    private Integer minutosServiciosPermitidos;
    private Boolean excedioServicios;
}
