package pe.albrugroup.auth_service.configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;

@OpenAPIDefinition(
        info = @Info(
                title = "API de autenticacion y autorizacion",
                version = "1.0.0",
                contact = @Contact(
                        name = "Edinson Vitterio",
                        email = "jevbxx@gmail.com",
                        url = "https://github.com/Bizzard4eva"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8080/auth", description = "Gateway local"),
                @Server(url = "https://api.albrugroup.com/auth", description = "Gateway produccion")
        }
)
public class OpenAPIConfig { }
