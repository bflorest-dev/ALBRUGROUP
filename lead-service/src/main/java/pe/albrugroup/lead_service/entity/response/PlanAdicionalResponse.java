package pe.albrugroup.lead_service.entity.response;

import java.math.BigDecimal;

public record PlanAdicionalResponse(
        Long idAdicional,
        String nombreAdicional,
        Integer cantidadIncluida,
        Boolean permiteCompraAdicional,
        Integer cantidadMaximaAdicional,
        BigDecimal precioUnitarioAdicional
) {
}
