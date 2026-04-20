package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.schedule_service.entity.enums.TipoExcepcionHorario;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrarExcepcionHorarioRequest {

    @NotNull(message = "fecha es obligatoria")
    private LocalDate fecha;

    @NotNull(message = "tipo es obligatorio")
    private TipoExcepcionHorario tipo;

    private LocalTime horaEntrada;
    private LocalTime horaSalida;
    private LocalTime inicioAlmuerzo;
    private LocalTime finAlmuerzo;
    private Boolean laborable;

    @NotBlank(message = "motivo es obligatorio")
    private String motivo;
}
