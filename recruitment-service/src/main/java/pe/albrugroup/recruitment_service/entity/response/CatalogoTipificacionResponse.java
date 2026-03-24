package pe.albrugroup.recruitment_service.entity.response;

import pe.albrugroup.recruitment_service.entity.enums.Etapa;

import java.util.List;

public record CatalogoTipificacionResponse(
        Etapa etapa,
        List<TipificacionResponse> tipificaciones) {
}
