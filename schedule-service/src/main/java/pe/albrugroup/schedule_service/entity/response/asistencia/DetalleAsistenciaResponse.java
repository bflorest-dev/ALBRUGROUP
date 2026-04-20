package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetalleAsistenciaResponse {

    private Long idEmpleado;
    private Long idHorario;
    private LocalDate fecha;
    private LocalTime entradaProgramada;
    private LocalTime salidaProgramada;
    private LocalTime inicioAlmuerzoProgramado;
    private LocalTime finAlmuerzoProgramado;
    private LocalDateTime fechaHoraIngreso;
    private LocalDateTime fechaHoraSalida;
    private LocalDateTime fechaHoraInicioAlmuerzo;
    private LocalDateTime fechaHoraFinAlmuerzo;
    private Integer minutosObjetivoDia;
    private Integer minutosTrabajados;
    private Integer minutosBalance;
    private Integer minutosAlmuerzoTomados;
    private Integer minutosServiciosPermitidos;
    private Integer minutosServiciosAcumulados;
    private Boolean excedioServicios;
    private Boolean jornadaCerrada;
}
