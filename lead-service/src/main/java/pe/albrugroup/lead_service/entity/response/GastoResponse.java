package pe.albrugroup.lead_service.entity.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record GastoResponse(
        Long id,
        Long idTipoGasto,
        String nombreTipoGasto,
        BigDecimal monto,
        String documento,
        String descripcion,
        LocalDate fecha,
        Instant createdAt
) {}
