package pe.albrugroup.billing_service.entity.response;

import java.math.BigDecimal;
import java.time.Instant;

public record AdelantoSueldoResponse(
        Long id,
        Long idEmpleado,
        Integer anio,
        Integer mes,
        BigDecimal monto,
        String descripcion,
        String registradoPor,
        Instant registradoAt
) {
}
