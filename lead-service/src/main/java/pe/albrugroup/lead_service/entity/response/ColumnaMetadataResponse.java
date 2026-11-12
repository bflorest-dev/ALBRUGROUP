package pe.albrugroup.lead_service.entity.response;

import java.util.List;

public record ColumnaMetadataResponse(
        String grupo,
        List<ColumnaInfo> columnas
) {
    public record ColumnaInfo(
            String key,
            String label
    ) {}
}
