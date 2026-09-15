package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;
import java.util.UUID;

public record FreelanceVentaResponse(
        Long idOrigen,
        UUID requestId,
        Long idLead,
        Etapa etapa,
        int numeroIntento,
        Instant registradoAt
) { }
