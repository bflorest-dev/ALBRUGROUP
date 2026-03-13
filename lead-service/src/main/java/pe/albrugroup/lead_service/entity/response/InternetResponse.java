package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Tecnologia;
import pe.albrugroup.lead_service.entity.enums.Unidad;

public record InternetResponse(
        Long id,
        Integer velocidad,
        Unidad unidad,
        Tecnologia tecnologia
) {
}
