package pe.albrugroup.lead_service.entity.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ResumenFinancieroDiaResponse(
        LocalDate fecha,
        BigDecimal ctaBancaria,
        BigDecimal ctaPublicitaria,
        Instant calculadoAt,
        List<ZonaResumen> zonas
) {
    public record ZonaResumen(
            Long idZona,
            String nombreZona,
            int ingresadas,
            int instaladas,
            BigDecimal cfInstaladas
    ) {}

    public record ProveedorRef(Long id, String nombre) {}
}
