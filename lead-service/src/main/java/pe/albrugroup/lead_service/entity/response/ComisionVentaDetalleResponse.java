package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
public record ComisionVentaDetalleResponse(
        long totalLeads,
        long totalValidas,
        long totalNoValidas,
        int page,
        int size,
        int totalPages,
        long totalElements,
        List<LeadDetalle> content
) {

    @Builder
    public record LeadDetalle(
            Long idLead,
            String numeroLead,
            String numeroDocumento,
            String nombreCliente,
            LocalDate fechaInstalacion,
            LocalDate fechaVencimiento,
            LocalDate fechaLimiteEfectiva,
            LocalDate fechaPagoConsiderada,
            String tipoVencimiento,
            String estadoPago,
            String estadoValidacion,
            String motivo
    ) {}
}
