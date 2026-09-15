package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;

public record FreelanceVentaPreparacionResponse(
        Long idLead,
        LeadDetalleResponse detalle,
        String motivoVenta,
        String submotivoVenta,
        String comentarioVenta,
        Instant retornadoAt,
        boolean puedeCorregir
) { }
