package pe.albrugroup.lead_service.entity.response;

import java.util.List;

public record AlbFileContent(
        int version,
        String origenCodigo,
        int count,
        List<AlbLeadRow> leads
) {}
