package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;

public record CatalogoResponse(
        Etapa etapa,
        List<TipificacionResponse> tipificaciones) {}
