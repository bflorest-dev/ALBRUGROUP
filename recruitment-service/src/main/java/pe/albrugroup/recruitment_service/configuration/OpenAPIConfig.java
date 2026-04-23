package pe.albrugroup.recruitment_service.configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI recruitmentOpenAPI(
            @Value("${app.docs.gateway-url}") String gatewayUrl,
            @Value("${app.docs.public-url}") String publicUrl
    ) {
        return new OpenAPI()
                .info(new Info()
                        .title("API<SpringBoot> para gestion de Reclutamiento/Postulaciones/Capacitaciones")
                        .version("1.1.0")
                        .contact(new Contact()
                                .name("Edinson Vitterio")
                                .email("jevbxx@gmail.com")
                                .url("https://github.com/Bizzard4eva")))
                .servers(List.of(
                        new Server().url(gatewayUrl).description("Gateway actual"),
                        new Server().url(publicUrl).description("Gateway publico")
                ));
    }
}
