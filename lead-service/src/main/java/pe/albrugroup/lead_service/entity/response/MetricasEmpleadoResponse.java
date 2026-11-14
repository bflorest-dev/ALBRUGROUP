package pe.albrugroup.lead_service.entity.response;

import java.time.LocalDate;
import java.util.List;

public record MetricasEmpleadoResponse(List<MetricaDia> dias) {

    public record MetricaDia(LocalDate fecha, long preventas, long instaladas) {}
}
