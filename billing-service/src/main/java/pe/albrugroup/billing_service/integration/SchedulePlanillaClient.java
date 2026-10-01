package pe.albrugroup.billing_service.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.List;

@Component
public class SchedulePlanillaClient {

    private final RestClient restClient;
    private final String internalSecret;

    public SchedulePlanillaClient(
            RestClient.Builder builder,
            @Value("${billing.services.schedule-url}") String baseUrl,
            @Value("${billing.internal-secret}") String internalSecret
    ) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.internalSecret = internalSecret;
    }

    public List<EmpleadoIncidenciasDto> obtenerIncidencias(Integer anio, Integer mes, List<Long> empleados) {
        if (empleados.isEmpty()) {
            return List.of();
        }
        return restClient.post()
                .uri("/asistencia/internal/billing/incidencias-mensuales")
                .header("X-Internal-Secret", internalSecret)
                .body(new IncidenciasRequest(anio, mes, empleados))
                .retrieve()
                .body(new ParameterizedTypeReference<List<EmpleadoIncidenciasDto>>() {});
    }

    public record IncidenciasRequest(Integer anio, Integer mes, List<Long> empleados) {
    }

    public record EmpleadoIncidenciasDto(Long idEmpleado, List<IncidenciaDiaDto> incidencias) {
    }

    public record IncidenciaDiaDto(
            LocalDate fecha,
            boolean falta,
            boolean tardanza,
            Integer minutosTarde,
            Integer minutosExtra,
            Integer minutosTrabajados
    ) {
    }
}
