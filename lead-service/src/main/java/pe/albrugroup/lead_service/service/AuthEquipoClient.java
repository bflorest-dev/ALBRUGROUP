package pe.albrugroup.lead_service.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import pe.albrugroup.lead_service.entity.response.UsuarioRolAuthResponse;
import pe.albrugroup.lead_service.exception.ForbiddenException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthEquipoClient {

    private final RestClient.Builder restClientBuilder;
    private final HttpServletRequest request;

    @Value("${app.auth.base-url:http://auth-service:8081}")
    private String authBaseUrl;

    public boolean asesorPerteneceEquipo(Long idEquipo, Long idAsesor) {
        if (idEquipo == null || idAsesor == null) {
            return false;
        }
        return listarAsesoresPreventa(idEquipo).stream()
                .anyMatch(asesor -> idAsesor.equals(asesor.empleadoId()));
    }

    private List<UsuarioRolAuthResponse> listarAsesoresPreventa(Long idEquipo) {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || authorization.isBlank()) {
            throw new ForbiddenException("No se pudo validar el equipo del asesor seleccionado");
        }
        return restClientBuilder
                .baseUrl(authBaseUrl)
                .build()
                .get()
                .uri("/equipos/{idEquipo}/asesores-preventa", idEquipo)
                .header(HttpHeaders.AUTHORIZATION, authorization)
                .retrieve()
                .body(new ParameterizedTypeReference<List<UsuarioRolAuthResponse>>() {});
    }
}
