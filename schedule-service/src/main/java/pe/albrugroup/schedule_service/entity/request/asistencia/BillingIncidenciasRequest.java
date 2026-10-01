package pe.albrugroup.schedule_service.entity.request.asistencia;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record BillingIncidenciasRequest(
        @NotNull @Min(2000) Integer anio,
        @NotNull @Min(1) @Max(12) Integer mes,
        @NotEmpty List<Long> empleados
) {
}
