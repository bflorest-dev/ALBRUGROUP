package pe.albrugroup.rrhh_service.integration.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import pe.albrugroup.rrhh_service.exception.AuthServiceException;
import pe.albrugroup.rrhh_service.integration.auth.dto.ActualizarCredencialesRequest;
import pe.albrugroup.rrhh_service.integration.auth.dto.RegistrarUsuarioRequest;
import pe.albrugroup.rrhh_service.integration.auth.dto.UsuarioResponse;

@Component
@RequiredArgsConstructor
public class AuthServiceClient {

    @Qualifier("authRestTemplate")
    private final RestTemplate authRestTemplate;

    public void upsertUsuario(String authHeader, RegistrarUsuarioRequest request) {
        HttpEntity<RegistrarUsuarioRequest> entity = new HttpEntity<>(request, buildHeaders(authHeader));
        try {
            authRestTemplate.postForEntity("/autorizacion/upsert-usuario", entity, Void.class);
        } catch (RestClientResponseException e) {
            throw AuthServiceException.from(e);
        }
    }

    public UsuarioResponse getUsuarioPorEmpleadoId(String authHeader, Long empleadoId) {
        HttpEntity<Void> entity = new HttpEntity<>(buildHeaders(authHeader));
        try {
            return authRestTemplate.exchange(
                    "/autorizacion/{empleadoId}/empleado",
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    UsuarioResponse.class,
                    empleadoId
            ).getBody();
        } catch (RestClientResponseException e) {
            if (e.getRawStatusCode() == 404) {
                return null;
            }
            throw AuthServiceException.from(e);
        }
    }

    public void actualizarUsernameRoles(String authHeader, Long empleadoId, ActualizarCredencialesRequest request) {
        HttpEntity<ActualizarCredencialesRequest> entity = new HttpEntity<>(request, buildHeaders(authHeader));
        try {
            authRestTemplate.exchange(
                    "/autorizacion/{empleadoId}/username-roles",
                    org.springframework.http.HttpMethod.PATCH,
                    entity,
                    Void.class,
                    empleadoId
            );
        } catch (RestClientResponseException e) {
            throw AuthServiceException.from(e);
        }
    }

    public void deshabilitarUsuario(String authHeader, Long empleadoId) {
        HttpEntity<Void> entity = new HttpEntity<>(buildHeaders(authHeader));
        try {
            authRestTemplate.exchange(
                    "/autorizacion/{empleadoId}/deshabilitar",
                    org.springframework.http.HttpMethod.DELETE,
                    entity,
                    Void.class,
                    empleadoId
            );
        } catch (RestClientResponseException e) {
            throw AuthServiceException.from(e);
        }
    }

    private HttpHeaders buildHeaders(String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if(authHeader != null && !authHeader.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        }
        return headers;
    }
}
