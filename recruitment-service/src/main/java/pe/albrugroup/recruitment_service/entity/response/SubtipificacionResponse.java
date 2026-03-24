package pe.albrugroup.recruitment_service.entity.response;

import pe.albrugroup.recruitment_service.entity.enums.AlcanceSubtipificacion;

public record SubtipificacionResponse(
        Long id,
        String codigo,
        String descripcion,
        Integer orden,
        AlcanceSubtipificacion alcance) {
}
