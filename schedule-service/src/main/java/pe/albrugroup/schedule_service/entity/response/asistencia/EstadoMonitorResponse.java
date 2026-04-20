package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private EstadoAsistencia estadoActual;
    private LocalDateTime desde;
    private Integer minutosServiciosPermitidos;
    private Integer minutosServiciosAcumulados;
    private Integer minutosServiciosEnCurso;
    private Boolean excedioServicios;
    private Boolean operativo;
}
