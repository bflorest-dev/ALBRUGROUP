package pe.albrugroup.call_service.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Beans Spring para clientes ARI (WebClient) y otras infraestructuras de Asterisk.
 * El cliente AMI (ManagerConnection de asterisk-java) lo maneja AmiClient
 * directamente porque requiere ciclo de vida custom (connect / login / loop).
 */
@Configuration
@RequiredArgsConstructor
public class AsteriskConfig {

    private final AsteriskProperties props;

    /**
     * WebClient pre-configurado con Basic Auth para ARI REST.
     */
    @Bean
    public WebClient ariWebClient() {
        String basic = Base64.getEncoder().encodeToString(
                (props.getAri().getUsername() + ":" + props.getAri().getPassword())
                        .getBytes(StandardCharsets.UTF_8));
        return WebClient.builder()
                .baseUrl(props.getAri().getBaseUrl() + "/ari")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
