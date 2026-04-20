package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistorialAsistenciaResponse {

    private LocalDate fecha;
    private LocalDateTime fechaHoraIngreso;
    private LocalDateTime fechaHoraSalida;
    private Integer minutosObjetivoDia;
    private Integer minutosTrabajados;
    private Integer minutosBalance;
    private Integer minutosAlmuerzoTomados;
    private Integer minutosServiciosAcumulados;
    private Boolean excedioServicios;
    private Boolean jornadaCerrada;
}
