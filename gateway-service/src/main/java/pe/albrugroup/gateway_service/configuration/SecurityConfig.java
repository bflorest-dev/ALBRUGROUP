package pe.albrugroup.gateway_service.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import pe.albrugroup.gateway_service.security.AuthenticationFilter;
import pe.albrugroup.gateway_service.security.RestAccessDeniedHandler;
import pe.albrugroup.gateway_service.security.RestAuthenticationEntryPoint;

@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthenticationFilter authFilter;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;

    @Bean
    public SecurityWebFilterChain securityFilterChain(ServerHttpSecurity http) {
        http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(
                                "/actuator/health",
                                "/actuator/health/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/auth/autorizacion/login",
                                "/auth/autorizacion/forgot-password",
                                "/auth/autorizacion/estado-acceso/**",
                                "/auth/swagger-ui.html",
                                "/auth/swagger-ui/**",
                                "/auth/v3/api-docs/**",
                                "/rrhh/swagger-ui.html",
                                "/rrhh/swagger-ui/**",
                                "/rrhh/v3/api-docs/**",
                                "/leads/swagger-ui.html",
                                "/leads/swagger-ui/**",
                                "/leads/v3/api-docs/**",
                                "/recruitment/swagger-ui.html",
                                "/recruitment/swagger-ui/**",
                                "/recruitment/v3/api-docs/**",
                                "/schedule/swagger-ui.html",
                                "/schedule/swagger-ui/**",
                                "/schedule/v3/api-docs/**"
                        ).permitAll()
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyExchange().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .addFilterAt(authFilter, SecurityWebFiltersOrder.AUTHENTICATION);
        return http.build();
    }
}
