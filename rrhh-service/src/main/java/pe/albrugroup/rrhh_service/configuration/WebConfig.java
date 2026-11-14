package pe.albrugroup.rrhh_service.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import pe.albrugroup.rrhh_service.security.EmpresaContratistaScopeInterceptor;

@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final EmpresaContratistaScopeInterceptor scopeInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(scopeInterceptor).order(Ordered.LOWEST_PRECEDENCE);
    }
}
