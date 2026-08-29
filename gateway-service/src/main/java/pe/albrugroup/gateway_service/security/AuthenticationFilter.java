package pe.albrugroup.gateway_service.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@Slf4j
@RequiredArgsConstructor
public class AuthenticationFilter implements WebFilter {

    private final JwtUtil jwtUtil;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final SessionInvalidationService sessionInvalidationService;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return chain.filter(exchange);
        }

        String token = authHeader.substring(7);
        try {
            if (!jwtUtil.validateToken(token)) {
                log.warn("Token invalido o expirado");
                return authenticationEntryPoint.writeJson(exchange, HttpStatus.UNAUTHORIZED, "Token invalido o expirado");
            }

            String username = jwtUtil.extractUsername(token);
            Long empleadoId = jwtUtil.extractEmployeeId(token);
            Long sessionIssuedAt = jwtUtil.extractSessionIssuedAt(token);
            String nombreCompleto = jwtUtil.extractNombreCompleto(token);
            List<String> roles = jwtUtil.extractRoles(token);
            List<String> permisos = jwtUtil.extractPermisos(token);

            List<SimpleGrantedAuthority> authorities = Stream.concat(
                    roles.stream().map(role -> new SimpleGrantedAuthority("ROLE_" + role)),
                    permisos.stream().map(SimpleGrantedAuthority::new)
            ).collect(Collectors.toList());

            AuthenticatedUser authenticatedUser = new AuthenticatedUser(
                    username,
                    empleadoId,
                    nombreCompleto,
                    roles
            );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(authenticatedUser, null, authorities);

            return sessionInvalidationService.isInvalidated(empleadoId, sessionIssuedAt)
                    .flatMap(invalidated -> {
                        if (Boolean.TRUE.equals(invalidated)) {
                            log.warn("Sesion invalidada para empleado {}", empleadoId);
                            return authenticationEntryPoint.writeJson(exchange, HttpStatus.UNAUTHORIZED, "Sesion invalidada");
                        }
                        return chain.filter(exchange)
                                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
                    });
        } catch (Exception e) {
            log.error("Error validando JWT: {}", e.getMessage());
            return authenticationEntryPoint.writeJson(exchange, HttpStatus.UNAUTHORIZED, "No autenticado o token invalido");
        }
    }
}
