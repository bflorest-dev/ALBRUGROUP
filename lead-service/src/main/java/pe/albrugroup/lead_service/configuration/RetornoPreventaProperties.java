package pe.albrugroup.lead_service.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.lead.retorno-preventa")
@Getter @Setter
public class RetornoPreventaProperties {

    private String codigoTipificacion = "NO DESEA";
    private String codigoSubtipificacion = "PREVENTA DESAPROBADA";
    private int diasSinCambio = 3;
    private int diasContactoReciente = 3;
}
