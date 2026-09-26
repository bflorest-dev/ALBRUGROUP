package pe.albrugroup.lead_service.entity.response;

public record BaseLeadsCountResponse(
        long totalLeads,
        String suggestedName
) {}
