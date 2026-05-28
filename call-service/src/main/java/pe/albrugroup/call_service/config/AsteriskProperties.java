package pe.albrugroup.call_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Properties de conexion a Asterisk (ARI + AMI) y configuracion de grabaciones.
 * Mapea app.asterisk.* de application.yaml.
 */
@Configuration
@ConfigurationProperties(prefix = "app.asterisk")
@Getter @Setter
public class AsteriskProperties {

    private Ari ari = new Ari();
    private Ami ami = new Ami();
    private Recording recording = new Recording();

    @Getter @Setter
    public static class Ari {
        private String baseUrl;
        private String wsUrl;
        private String username;
        private String password;
        private String appName;
        private long reconnectInitialDelayMs = 2000;
        private long reconnectMaxDelayMs = 30000;
    }

    @Getter @Setter
    public static class Ami {
        private String host;
        private int port = 5038;
        private String username;
        private String password;
        private long keepAliveMs = 10000;
    }

    @Getter @Setter
    public static class Recording {
        private String localSpoolDir = "/var/spool/asterisk/recording";
        private String format = "wav";
        private boolean deleteAfterUpload = true;
    }
}
