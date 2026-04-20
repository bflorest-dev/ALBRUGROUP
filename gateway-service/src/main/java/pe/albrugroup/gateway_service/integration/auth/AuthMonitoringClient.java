package pe.albrugroup.gateway_service.integration.auth;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import pe.albrugroup.gateway_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.gateway_service.integration.auth.dto.UsuarioRolResponse;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class AuthMonitoringClient {

    private final WebClient authWebClient;

    public AuthMonitoringClient(@Qualifier("authWebClient") WebClient authWebClient) {
        this.authWebClient = authWebClient;
    }

    public Mono<List<UsuarioRolResponse>> listarUsuariosActivosPorRol(String authHeader, PuestoTrabajo puestoTrabajo) {
        return authWebClient.get()
                .uri("/autorizacion/roles/{puestoTrabajo}/usuarios", puestoTrabajo.name())
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .bodyToFlux(UsuarioRolResponse.class)
                .collectList();
    }
}
