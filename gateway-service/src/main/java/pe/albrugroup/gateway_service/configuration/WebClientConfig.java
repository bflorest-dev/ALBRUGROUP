package pe.albrugroup.gateway_service.configuration;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    @Qualifier("authWebClient")
    public WebClient authWebClient(WebClient.Builder builder, @Value("${services.auth.base-url}") String baseUrl) {
        return builder.baseUrl(baseUrl).build();
    }

    @Bean
    @Qualifier("scheduleWebClient")
    public WebClient scheduleWebClient(WebClient.Builder builder, @Value("${services.schedule.base-url}") String baseUrl) {
        return builder.baseUrl(baseUrl).build();
    }
}
