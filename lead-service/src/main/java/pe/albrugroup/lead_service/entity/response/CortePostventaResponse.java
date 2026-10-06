package pe.albrugroup.lead_service.entity.response;

import java.time.LocalDate;

public record CortePostventaResponse(
        LocalDate mesCorteBase,
        Integer numeroCorteBase
) {
}
