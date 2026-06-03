package pe.albrugroup.schedule_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Autenticacion service-to-service para los endpoints internos (/asistencia/internal/**).
 * Si la peticion trae el header X-Internal-Secret y coincide con el secreto compartido configurado,
 * se le concede la autoridad SERVICE_INTERNAL. No reemplaza al JWT del usuario: solo aplica a las
 * rutas internas consumidas por otros servicios (ej. el job de reconciliacion del gateway).
 */
@Component
public class InternalAuthFilter extends OncePerRequestFilter {

    private static final String INTERNAL_PATH_PREFIX = "/asistencia/internal/";
    private static final String SECRET_HEADER = "X-Internal-Secret";

    private final String sharedSecret;

    public InternalAuthFilter(@Value("${internal.shared-secret:}") String sharedSecret) {
        this.sharedSecret = sharedSecret;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path != null && path.startsWith(INTERNAL_PATH_PREFIX)
                && sharedSecret != null && !sharedSecret.isBlank()
                && sharedSecret.equals(request.getHeader(SECRET_HEADER))) {
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    "internal-service",
                    null,
                    List.of(new SimpleGrantedAuthority("SERVICE_INTERNAL"))
            );
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }
}
