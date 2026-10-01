package pe.albrugroup.schedule_service.entity.response.asistencia;

import java.time.LocalDate;

public record BillingIncidenciaDiaResponse(
        LocalDate fecha,
        boolean falta,
        boolean tardanza,
        Integer minutosTarde,
        Integer minutosExtra,
        Integer minutosTrabajados
) {
}
