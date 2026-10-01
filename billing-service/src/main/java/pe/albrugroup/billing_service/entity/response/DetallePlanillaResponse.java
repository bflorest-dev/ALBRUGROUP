package pe.albrugroup.billing_service.entity.response;

import pe.albrugroup.billing_service.entity.enums.Concepto;
import pe.albrugroup.billing_service.entity.enums.TipoMovimiento;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DetallePlanillaResponse(
        Long id,
        Long idTramoPlanillaEmpleado,
        Concepto concepto,
        TipoMovimiento tipoMovimiento,
        String descripcion,
        LocalDate fechaReferencia,
        BigDecimal cantidad,
        BigDecimal tarifa,
        BigDecimal monto,
        String fuente
) {
}
