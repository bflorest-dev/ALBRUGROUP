package pe.albrugroup.auth_service.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoleScopeReconciliationClient {

    private static final String INTERNAL_SECRET_HEADER = "X-Internal-Secret";

    private final RestClient.Builder restClientBuilder;
    private final HttpServletRequest request;

    @Value("${services.lead.base-url:http://lead-service:8083}")
    private String leadBaseUrl;

    @Value("${internal.shared-secret:}")
    private String internalSharedSecret;

    public void reconcile(Long empleadoId, Set<String> roles) {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || authorization.isBlank()) {
            throw new IllegalStateException("No se pudo propagar la autenticacion para reconciliar proveedores");
        }
        if (internalSharedSecret == null || internalSharedSecret.isBlank()) {
            throw new IllegalStateException("No esta configurado el secreto interno de reconciliacion");
        }
        try {
            restClientBuilder.baseUrl(leadBaseUrl).build()
                    .post()
                    .uri("/usuarios/{idEmpleado}/proveedores/reconciliar-roles", empleadoId)
                    .header(HttpHeaders.AUTHORIZATION, authorization)
                    .header(INTERNAL_SECRET_HEADER, internalSharedSecret)
                    .body(Map.of("roles", roles == null ? Set.of() : roles))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            throw new IllegalStateException("No se pudo reconciliar el scope por proveedor", ex);
        }
    }
}
