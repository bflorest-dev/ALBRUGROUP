package pe.albrugroup.rrhh_service.configuration;


import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;

@OpenAPIDefinition(
        info = @Info(
                title = "API<SpringBoot> para gestion de Postulantes/Empleados/Contratos/Pagos",
                version = "1.1.0",
                contact = @Contact(
                        name = "Edinson Vitterio", email = "jevbxx@gmail.com",
                        url = "https://github.com/Bizzard4eva"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8080", description = "Local"),
                @Server(url = "https://api.albrugroup.com", description = "Production")
        }
)
public class OpenAPIConfig { }
