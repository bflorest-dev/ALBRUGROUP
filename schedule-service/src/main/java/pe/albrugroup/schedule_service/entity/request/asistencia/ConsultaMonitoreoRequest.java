package pe.albrugroup.schedule_service.entity.request.asistencia;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ConsultaMonitoreoRequest {

    @NotEmpty(message = "empleadoIds es obligatorio")
    private List<@NotNull(message = "empleadoId no puede ser nulo") @Positive(message = "empleadoId debe ser positivo") Long> empleadoIds;
    private LocalDate fecha;
}
