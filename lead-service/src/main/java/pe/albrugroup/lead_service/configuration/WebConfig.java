package pe.albrugroup.lead_service.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import pe.albrugroup.lead_service.security.EquipoFilterInterceptor;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final EquipoFilterInterceptor equipoFilterInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Orden bajo (último) a propósito: debe ejecutarse DESPUÉS del interceptor de
        // Open-Session-In-View, que abre la sesión de Hibernate. Si corre antes, no hay
        // sesión a la cual habilitarle el filtro y el @Filter por equipo queda inactivo.
        registry.addInterceptor(equipoFilterInterceptor).order(Ordered.LOWEST_PRECEDENCE);
    }
}
