package pe.albrugroup.recruitment_service.entity.response;

import java.util.List;

public record TipificacionResponse(
        Long id,
        String codigo,
        String descripcion,
        Integer orden,
        List<SubtipificacionResponse> subtipificaciones) {
}
