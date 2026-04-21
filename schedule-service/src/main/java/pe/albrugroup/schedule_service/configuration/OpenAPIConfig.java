package pe.albrugroup.schedule_service.configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;

@OpenAPIDefinition(
        info = @Info(
                title = "API<SpringBoot> para gestion de Horarios y Asistencias",
                version = "1.0.0",
                contact = @Contact(
                        name = "Edinson Vitterio",
                        email = "jevbxx@gmail.com",
                        url = "https://github.com/Bizzard4eva"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8080/schedule", description = "Gateway local"),
                @Server(url = "https://api.albrugroup.com/schedule", description = "Gateway produccion")
        }
)
public class OpenAPIConfig { }
