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

import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthEquipoClient {

    private static final String ROL_ASESOR_VENTAS = "ASESOR_VENTAS";

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

    public UsuarioRolAuthResponse obtenerAsesorVentasDelEquipo(Long idEquipo, Long idAsesor) {
        if (idEquipo == null || idAsesor == null) {
            return null;
        }
        return listarAsesoresVentasMerito(idEquipo).stream()
                .filter(asesor -> idAsesor.equals(asesor.empleadoId()))
                .filter(this::esAsesorVentas)
                .findFirst()
                .orElse(null);
    }

    private boolean esAsesorVentas(UsuarioRolAuthResponse asesor) {
        return asesor.roles() != null && asesor.roles().contains(ROL_ASESOR_VENTAS);
    }

    public List<UsuarioRolAuthResponse> listarAsesoresPreventa(Long idEquipo) {
        return listarAsesores(idEquipo, "/equipos/{idEquipo}/asesores-preventa");
    }

    public List<UsuarioRolAuthResponse> listarAsesoresVentasMerito(Long idEquipo) {
        return listarAsesores(idEquipo, "/equipos/{idEquipo}/asesores-ventas-merito");
    }

    public List<UsuarioRolAuthResponse> listarEmpleadosMeritoAdmin(Long idEquipo, Etapa etapa) {
        if (idEquipo == null || etapa == null) {
            return List.of();
        }
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || authorization.isBlank()) {
            throw new ForbiddenException("No se pudo validar el empleado seleccionado");
        }
        return restClientBuilder
                .baseUrl(authBaseUrl)
                .build()
                .get()
                .uri("/equipos/{idEquipo}/asesores-merito-admin?etapa={etapa}", idEquipo, etapa.name())
                .header(HttpHeaders.AUTHORIZATION, authorization)
                .retrieve()
                .body(new ParameterizedTypeReference<List<UsuarioRolAuthResponse>>() {});
    }

    private List<UsuarioRolAuthResponse> listarAsesores(Long idEquipo, String uri) {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || authorization.isBlank()) {
            throw new ForbiddenException("No se pudo validar el equipo del asesor seleccionado");
        }
        return restClientBuilder
                .baseUrl(authBaseUrl)
                .build()
                .get()
                .uri(uri, idEquipo)
                .header(HttpHeaders.AUTHORIZATION, authorization)
                .retrieve()
                .body(new ParameterizedTypeReference<List<UsuarioRolAuthResponse>>() {});
    }
}
