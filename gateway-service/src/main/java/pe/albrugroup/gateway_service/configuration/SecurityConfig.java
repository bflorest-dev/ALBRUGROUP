package pe.albrugroup.gateway_service.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import pe.albrugroup.gateway_service.security.AuthenticationFilter;

@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthenticationFilter authFilter;

    @Bean
    public SecurityWebFilterChain securityFilterChain(ServerHttpSecurity http) {
        http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(
                                "/auth/autorizacion/login",
                                "/auth/autorizacion/registro",
                                "/auth/swagger-ui.html",
                                "/auth/swagger-ui/**",
                                "/auth/v3/api-docs/**",
                                "/rrhh/swagger-ui.html",
                                "/rrhh/swagger-ui/**",
                                "/rrhh/v3/api-docs/**",
                                "/leads/swagger-ui.html",
                                "/leads/swagger-ui/**",
                                "/leads/v3/api-docs/**"
                        ).permitAll()
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyExchange().authenticated()
                )
                .addFilterAt(authFilter, SecurityWebFiltersOrder.AUTHENTICATION);
        return http.build();
    }
}
