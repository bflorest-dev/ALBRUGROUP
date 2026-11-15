package pe.albrugroup.lead_service.entity.response;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

import pe.albrugroup.lead_service.entity.enums.Etapa;

public record MetricasEmpleadoResponse(List<MetricaDia> dias) {

    public record MetricaDia(
            LocalDate fecha,
            long preventas,
            long instaladas,
            List<DetalleLead> leads
    ) {}

    public record DetalleLead(
            Long idLead,
            String numeroLead,
            String numeroDocumento,
            String nombreCliente,
            String plan,
            BigDecimal cargoFijo,
            String zona,
            LocalDate fechaInstalacion,
            Etapa etapaActual,
            boolean instalada
    ) {}
}
