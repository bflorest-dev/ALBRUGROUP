package pe.albrugroup.billing_service.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import pe.albrugroup.billing_service.security.AuthenticationFilter;
import pe.albrugroup.billing_service.security.RestAccessDeniedHandler;
import pe.albrugroup.billing_service.security.RestAuthenticationEntryPoint;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthenticationFilter authFilter;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.GET, "/planillas", "/matriz-planilla/activa").hasAuthority("READ_PLANILLAS")
                        .requestMatchers(HttpMethod.GET, "/planillas/*/ajustes").hasAuthority("READ_PLANILLAS")
                        .requestMatchers(HttpMethod.POST, "/planillas/calcular").hasAuthority("CALCULATE_PLANILLAS")
                        .requestMatchers(HttpMethod.POST, "/planillas/*/aprobar").hasAuthority("APPROVE_PLANILLAS")
                        .requestMatchers(HttpMethod.POST, "/matriz-planilla").hasAuthority("MANAGE_PLANILLA_MATRIX")
                        .requestMatchers(HttpMethod.POST, "/adelantos", "/bonos-adicionales").hasAuthority("MANAGE_PLANILLA_ADJUSTMENTS")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(authFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
