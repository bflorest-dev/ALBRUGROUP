package pe.albrugroup.schedule_service.entity.response.asistencia;

import java.util.List;

public record BillingEmpleadoIncidenciasResponse(
        Long idEmpleado,
        List<BillingIncidenciaDiaResponse> incidencias
) {
}
