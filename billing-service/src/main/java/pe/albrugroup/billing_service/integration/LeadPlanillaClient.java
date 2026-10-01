package pe.albrugroup.billing_service.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class LeadPlanillaClient {

    private final RestClient restClient;
    private final String internalSecret;

    public LeadPlanillaClient(
            RestClient.Builder builder,
            @Value("${billing.services.lead-url}") String baseUrl,
            @Value("${billing.internal-secret}") String internalSecret
    ) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.internalSecret = internalSecret;
    }

    public List<VentasValidasDto> obtenerVentasValidas(Integer anio, Integer mes) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/leads/internal/billing/ventas-validas")
                        .queryParam("anio", anio)
                        .queryParam("mes", mes)
                        .build())
                .header("X-Internal-Secret", internalSecret)
                .retrieve()
                .body(new ParameterizedTypeReference<List<VentasValidasDto>>() {});
    }

    public record VentasValidasDto(Long idEmpleado, Integer ventasValidas) {
    }
}
