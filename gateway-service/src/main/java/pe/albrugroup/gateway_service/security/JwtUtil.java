package pe.albrugroup.gateway_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

@Component
public class JwtUtil {

    private final PublicKey publicKey;
    private final String issuer;

    public JwtUtil(
            @Value("${jwt.public-key-base64}") String publicKeyBase64,
            @Value("${jwt.issuer}") String issuer
    ) {
        this.publicKey = parsePublicKey(publicKeyBase64);
        this.issuer = issuer;
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    public Long extractEmployeeId(String token) {
        return extractClaim(token, claims -> claims.get("empleadoId", Long.class));
    }
    public String extractNombreCompleto(String token) {
        return extractClaim(token, claims -> claims.get("nombreCompleto", String.class));
    }
    public List<String> extractRoles(String token) {
        return extractClaim(token, claims -> claims.get("roles", List.class));
    }
    public List<String> extractPermisos(String token) {
        return extractClaim(token, claims -> claims.get("permisos", List.class));
    }
    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .requireIssuer(issuer)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
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
