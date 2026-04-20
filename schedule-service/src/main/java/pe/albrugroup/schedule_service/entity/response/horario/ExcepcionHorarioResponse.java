package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExcepcionHorarioResponse {

    private Long id;
    private LocalDate fecha;
    private TipoExcepcionHorario tipo;
    private LocalTime horaEntrada;
    private LocalTime horaSalida;
    private LocalTime inicioAlmuerzo;
    private LocalTime finAlmuerzo;
    private Boolean laborable;
    private String motivo;
}
