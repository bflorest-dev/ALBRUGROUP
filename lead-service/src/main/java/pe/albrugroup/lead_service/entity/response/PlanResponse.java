package pe.albrugroup.lead_service.entity.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PlanResponse(
        Long id,
        String nombre,
        BigDecimal precio,
        LocalDate vigenciaDesde,
        LocalDate vigenciaHasta,
        Long idProveedor,
        String nombreProveedor,
        InternetResponse internet,
        TelevisionResponse television,
        TelefonoResponse telefono,
        List<PlanAdicionalResponse> adicionales,
        Boolean activo
) {
}
