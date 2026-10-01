package pe.albrugroup.billing_service.entity.response;

import java.math.BigDecimal;
import java.time.Instant;

public record BonoAdicionalResponse(
        Long id,
        Long idEmpleado,
        Integer anio,
        Integer mes,
        BigDecimal monto,
        String comentario,
        String registradoPor,
        Instant registradoAt
) {
}
