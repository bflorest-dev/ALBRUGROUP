package pe.albrugroup.schedule_service.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class InternalRequestAuthorizer {

    private final byte[] sharedSecret;

    public InternalRequestAuthorizer(@Value("${internal.shared-secret:}") String sharedSecret) {
        this.sharedSecret = sharedSecret == null
                ? new byte[0]
                : sharedSecret.getBytes(StandardCharsets.UTF_8);
    }

    public void requireValidSecret(String candidate) {
        byte[] provided = candidate == null
                ? new byte[0]
                : candidate.getBytes(StandardCharsets.UTF_8);
        if (sharedSecret.length == 0 || !MessageDigest.isEqual(sharedSecret, provided)) {
            throw new AccessDeniedException("Solicitud interna no autorizada");
        }
    }
}
