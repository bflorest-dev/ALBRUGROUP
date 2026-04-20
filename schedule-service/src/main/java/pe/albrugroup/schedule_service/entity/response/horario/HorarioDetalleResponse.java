package pe.albrugroup.schedule_service.entity.response.horario;

import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.Dia;

import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HorarioDetalleResponse {

    private Long id;
    private Dia dia;
    private LocalTime horaEntrada;
    private LocalTime horaSalida;
    private LocalTime inicioAlmuerzo;
    private LocalTime finAlmuerzo;
    private Boolean laborable;
}
