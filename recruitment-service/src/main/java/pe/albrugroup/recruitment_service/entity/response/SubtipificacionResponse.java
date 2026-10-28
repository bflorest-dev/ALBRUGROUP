package pe.albrugroup.recruitment_service.entity.response;

import pe.albrugroup.recruitment_service.entity.enums.AlcanceSubtipificacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;

public record SubtipificacionResponse(
        Long id,
        String codigo,
        String descripcion,
        Integer orden,
        AlcanceSubtipificacion alcance,
        Etapa etapaDestino) {
}
