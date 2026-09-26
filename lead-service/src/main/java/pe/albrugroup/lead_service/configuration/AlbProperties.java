package pe.albrugroup.lead_service.configuration;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.alb")
@Getter @Setter
public class AlbProperties {

    private String encryptionKey = "";

    @PostConstruct
    void validate() {
        if (encryptionKey == null || encryptionKey.isBlank()) {
            return;
        }
        if (!encryptionKey.matches("^[0-9a-fA-F]{64}$")) {
            throw new IllegalStateException(
                    "app.alb.encryption-key debe ser exactamente 64 caracteres hexadecimales (32 bytes AES-256)");
        }
    }

    public boolean isConfigured() {
        return encryptionKey != null && !encryptionKey.isBlank();
    }
}
