package pe.albrugroup.lead_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;

@Component
public class JWTUtil {

    private final PublicKey publicKey;
    private final String issuer;

    public JWTUtil(
            @Value("${jwt.public-key-base64}") String publicKeyBase64,
            @Value("${jwt.issuer}") String issuer
    ) {
        this.publicKey = parsePublicKey(publicKeyBase64);
        this.issuer = issuer;
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .requireIssuer(issuer)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractEmpleadoId(String token) {
        return extractAllClaims(token).get("empleadoId", Long.class);
    }

    public String extractNombreCompleto(String token) {
        return extractAllClaims(token).get("nombreCompleto", String.class);
    }

    public List<String> extractRoles(String token) {
        Object value = extractAllClaims(token).get("roles");
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        return list.stream().map(String::valueOf).toList();
    }

    public List<String> extractPermisos(String token) {
        Object value = extractAllClaims(token).get("permisos");
        if (!(value instanceof List<?> list)) {
            return List.of();
        }
        return list.stream().map(String::valueOf).toList();
    }

    private PublicKey parsePublicKey(String encodedKey) {
        try {
            byte[] keyBytes = decodeKey(encodedKey);
            return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(keyBytes));
        } catch (Exception e) {
            throw new IllegalStateException("JWT public key invalida", e);
        }
    }

    private byte[] decodeKey(String encodedKey) {
        byte[] decoded = Base64.getDecoder().decode(encodedKey.trim());
        String decodedText = new String(decoded, StandardCharsets.UTF_8);
        if (decodedText.contains("-----BEGIN")) {
            return Base64.getDecoder().decode(stripPem(decodedText));
        }
        return decoded;
    }

    private String stripPem(String pem) {
        return pem
                .replaceAll("-----BEGIN [A-Z ]+-----", "")
                .replaceAll("-----END [A-Z ]+-----", "")
                .replaceAll("\\s", "");
    }
}
