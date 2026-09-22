package pe.albrugroup.lead_service.entity.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DashboardFunnelResponse(
        ProveedorRef proveedor,
        PeriodoRef periodo,
        FunnelContadores contadores
) {
    public record ProveedorRef(Long id, String nombre) {}
    public record PeriodoRef(LocalDate desde, LocalDate hasta) {}
    public record FunnelContadores(
            long leadsBrutos,
            long sinContacto,
            long noCalifica,
            long sinCobertura,
            long noDesea,
            long servicioActivo,
            long preventa,
            long instaladas,
            BigDecimal inversion
    ) {}
}
