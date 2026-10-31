package pe.albrugroup.schedule_service.entity.response.asistencia;

import java.time.LocalDate;
import java.util.List;

public record BillingEmpleadoIncidenciasResponse(
        Long idEmpleado,
        List<BillingIncidenciaDiaResponse> incidencias,
        List<LocalDate> diasLibres
) {
}
