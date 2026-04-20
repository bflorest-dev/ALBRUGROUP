package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.EstadoAsistencia;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstadoActualResponse {

    private Long idEmpleado;
    private LocalDate fecha;
    private EstadoAsistencia estadoActual;
    private LocalDateTime desde;
    private Integer minutosServiciosPermitidos;
    private Integer minutosServiciosAcumulados;
    private Integer minutosServiciosEnCurso;
    private Boolean excedioServicios;
}
