package pe.albrugroup.gateway_service.integration.schedule.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
public class EstadoMonitorResponse {

    private Long idEmpleado;
    private LocalDate fecha;
    private Long idHorario;
    private LocalTime entradaProgramada;
    private LocalTime salidaProgramada;
    private Boolean tieneHorarioVigente;
    private Boolean laborableHoy;
    private Boolean esperadoHoy;
    private Boolean tieneRegistroHoy;
    private String estadoActual;
    private LocalDateTime desde;
    private Integer minutosServiciosPermitidos;
    private Integer minutosServiciosAcumulados;
    private Integer minutosServiciosEnCurso;
    private Boolean excedioServicios;
    private Boolean operativo;
}
