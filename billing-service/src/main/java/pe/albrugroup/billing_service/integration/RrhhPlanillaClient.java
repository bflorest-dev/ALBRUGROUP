package pe.albrugroup.billing_service.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class RrhhPlanillaClient {

    private final RestClient restClient;
    private final String internalSecret;

    public RrhhPlanillaClient(
            RestClient.Builder builder,
            @Value("${billing.services.rrhh-url}") String baseUrl,
            @Value("${billing.internal-secret}") String internalSecret
    ) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.internalSecret = internalSecret;
    }

    public List<EmpleadoPlanillaDto> obtenerEmpleadosConContratos(Integer anio, Integer mes) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/contratos/internal/billing/periodo")
                        .queryParam("anio", anio)
                        .queryParam("mes", mes)
                        .build())
                .header("X-Internal-Secret", internalSecret)
                .retrieve()
                .body(new ParameterizedTypeReference<List<EmpleadoPlanillaDto>>() {});
    }

    public record EmpleadoPlanillaDto(
            Long idEmpleado,
            String nombres,
            String apellidos,
            String tipoDocumento,
            String numeroDocumento,
            LocalDate primerContratoInicio,
            List<ContratoPlanillaDto> contratos
    ) {
    }

    public record ContratoPlanillaDto(
            Long idContrato,
            String modalidad,
            BigDecimal sueldoBasico,
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {
    }
}
