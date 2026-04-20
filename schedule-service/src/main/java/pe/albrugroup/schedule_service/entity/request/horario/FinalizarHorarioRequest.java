package pe.albrugroup.schedule_service.entity.request.horario;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalizarHorarioRequest {

    @NotNull(message = "fechaFin es obligatoria")
    private LocalDate fechaFin;
}
