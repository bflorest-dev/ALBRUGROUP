package pe.albrugroup.gateway_service.integration.auth;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import pe.albrugroup.gateway_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.gateway_service.integration.DownstreamErrorMapper;
import pe.albrugroup.gateway_service.integration.auth.dto.UsuarioRolResponse;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class AuthMonitoringClient {

    private final WebClient authWebClient;
    private final DownstreamErrorMapper downstreamErrorMapper;

    public AuthMonitoringClient(
            @Qualifier("authWebClient") WebClient authWebClient,
            DownstreamErrorMapper downstreamErrorMapper
    ) {
        this.authWebClient = authWebClient;
        this.downstreamErrorMapper = downstreamErrorMapper;
    }

    public Mono<List<UsuarioRolResponse>> listarUsuariosActivosPorRol(String authHeader, PuestoTrabajo puestoTrabajo) {
        return authWebClient.get()
                .uri("/autorizacion/roles/{puestoTrabajo}/usuarios", puestoTrabajo.name())
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .onStatus(
                        status -> status.isError(),
                        response -> response.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(body -> downstreamErrorMapper.toException(
                                        response.statusCode(),
                                        body,
                                        "Ocurrio un error al consultar empleados activos por rol"
                                ))
                )
                .bodyToFlux(UsuarioRolResponse.class)
                .collectList();
    }
}
