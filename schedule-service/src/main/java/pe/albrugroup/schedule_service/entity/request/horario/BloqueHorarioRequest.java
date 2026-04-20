package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.Dia;

import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BloqueHorarioRequest {

    @NotNull(message = "dia es obligatorio")
    private Dia dia;

    @NotNull(message = "horaEntrada es obligatoria")
    private LocalTime horaEntrada;

    @NotNull(message = "horaSalida es obligatoria")
    private LocalTime horaSalida;

    @NotNull(message = "inicioAlmuerzo es obligatorio")
    private LocalTime inicioAlmuerzo;

    @NotNull(message = "finAlmuerzo es obligatorio")
    private LocalTime finAlmuerzo;

    @Builder.Default
    @NotNull(message = "laborable es obligatorio")
    private Boolean laborable = Boolean.TRUE;
}
