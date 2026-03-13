package pe.albrugroup.lead_service.entity.response;

import java.math.BigDecimal;

public record AdicionalResponse(
        Long id,
        String nombre,
        BigDecimal precioUnitario,
        Long idProveedor,
        String nombreProveedor,
        Boolean activo
) {
}
