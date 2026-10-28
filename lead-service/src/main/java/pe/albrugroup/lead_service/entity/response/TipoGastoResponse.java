package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.CategoriaGasto;

public record TipoGastoResponse(
        Long id,
        GrupoGastoResponse grupo,
        String nombre,
        CategoriaGasto categoria,
        Boolean activo
) {}
