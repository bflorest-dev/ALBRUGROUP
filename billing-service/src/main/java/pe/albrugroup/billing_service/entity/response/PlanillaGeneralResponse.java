package pe.albrugroup.billing_service.entity.response;

import pe.albrugroup.billing_service.entity.enums.Estado;
import pe.albrugroup.billing_service.entity.enums.TipoPlanilla;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PlanillaGeneralResponse(
        Long id,
        Integer anio,
        Integer mes,
        TipoPlanilla tipoPlanilla,
        Estado estado,
        String moneda,
        Integer versionCalculo,
        BigDecimal totalGastoPlanilla,
        BigDecimal totalDescuentos,
        BigDecimal totalBonificaciones,
        Integer cantidadEmpleados,
        Instant approvedAt,
        String approvedBy,
        List<PlanillaEmpleadoResponse> empleados
) {
}
