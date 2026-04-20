package pe.albrugroup.schedule_service.entity.request.asistencia;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoAsistenciaRequest {

    @NotNull(message = "fechaHora es obligatoria")
    private LocalDateTime fechaHora;
}
