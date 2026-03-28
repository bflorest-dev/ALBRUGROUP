package pe.albrugroup.rrhh_service.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    @Qualifier("authRestTemplate")
    public RestTemplate authRestTemplate(
            RestTemplateBuilder builder,
            @Value("${services.auth.base-url}") String baseUrl
    ) {
        return builder.rootUri(baseUrl).build();
    }

    @Bean
    @Qualifier("recruitmentRestTemplate")
    public RestTemplate recruitmentRestTemplate(
            RestTemplateBuilder builder,
            @Value("${services.recruitment.base-url}") String baseUrl
    ) {
        return builder.rootUri(baseUrl).build();
    }
}
