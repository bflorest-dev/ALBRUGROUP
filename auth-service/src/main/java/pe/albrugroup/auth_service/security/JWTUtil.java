package pe.albrugroup.auth_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import pe.albrugroup.auth_service.entity.Equipo;
import pe.albrugroup.auth_service.entity.Permiso;
import pe.albrugroup.auth_service.entity.Rol;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JWTUtil {

    private final PrivateKey privateKey;
    private final PublicKey publicKey;
    private final Duration jwtExpiration;
    private final String issuer;
    private final int tokenVersion;

    public JWTUtil(
            @Value("${jwt.private-key-base64}") String privateKeyBase64,
            @Value("${jwt.public-key-base64}") String publicKeyBase64,
            @Value("${jwt.expiration:30m}") Duration jwtExpiration,
            @Value("${jwt.issuer}") String issuer,
            @Value("${jwt.token-version:2}") int tokenVersion
    ) {
        this.privateKey = parsePrivateKey(privateKeyBase64);
        this.publicKey = parsePublicKey(publicKeyBase64);
        this.jwtExpiration = jwtExpiration;
        this.issuer = issuer;
        this.tokenVersion = tokenVersion;
    }

    public String generateToken(CustomUserDetails userDetails, Rol rolActivo) {
        if (rolActivo == null || userDetails.getUsuario().getRoles().stream()
                .noneMatch(rol -> rol.getId().equals(rolActivo.getId()))) {
            throw new IllegalArgumentException("El rol activo debe estar asignado al usuario");
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put("sessionIssuedAt", System.currentTimeMillis());
        claims.put("tokenVersion", tokenVersion);
        claims.put("empleadoId", userDetails.getEmpleadoId());
        claims.put("nombreCompleto", userDetails.getNombreCompleto());
        claims.put("roles", java.util.List.of(rolActivo.getNombre()));
        claims.put("rolActivo", rolActivo.getNombre());
        claims.put("rolPrincipal", userDetails.getUsuario().getRolPrincipal().getNombre());
        claims.put("rolesAsignados", userDetails.getUsuario().getRoles().stream()
                .map(Rol::getNombre)
                .sorted()
                .toList());

        var permisos = rolActivo.getPermisos().stream()
                .map(Permiso::getNombre)
                .distinct()
                .sorted()
                .toList();
        claims.put("permisos", permisos);

        // Equipos del usuario (partición de datos). Vacío = sin equipo; el acceso global
        // se resuelve por permiso en los servicios consumidores, no por ausencia de equipo.
        var equipos = userDetails.getUsuario().getEquipos().stream()
                .map(Equipo::getId)
                .toList();
        claims.put("equipos", equipos);

        return createToken(claims, userDetails.getUsername());
    }

    public Long getExpiresInSeconds() {
        return jwtExpiration.toSeconds();
    }

    private String createToken(Map<String, Object> claims, String subject) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuer(issuer)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + jwtExpiration.toMillis()))
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    public Boolean validateToken(String token, String username) {
        final String tokenUsername = extractUsername(token);
        Integer version = extractClaim(token, claims -> claims.get("tokenVersion", Integer.class));
        return tokenUsername.equals(username)
                && Integer.valueOf(tokenVersion).equals(version)
                && !isTokenExpired(token);
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Long extractEmpleadoId(String token) {
        return extractClaim(token, claims -> claims.get("empleadoId", Long.class));
    }

    public Long extractSessionIssuedAt(String token) {
        Long sessionIssuedAt = extractClaim(token, claims -> claims.get("sessionIssuedAt", Long.class));
        if (sessionIssuedAt != null) {
            return sessionIssuedAt;
        }
        Date issuedAt = extractClaim(token, Claims::getIssuedAt);
        return issuedAt == null ? null : issuedAt.getTime();
    }

    public java.util.List<String> extractRoles(String token) {
        Object value = extractAllClaims(token).get("roles");
        if (!(value instanceof java.util.List<?> list)) return java.util.List.of();
        return list.stream().map(String::valueOf).toList();
    }

    public java.util.List<String> extractPermisos(String token) {
        Object value = extractAllClaims(token).get("permisos");
        if (!(value instanceof java.util.List<?> list)) return java.util.List.of();
        return list.stream().map(String::valueOf).toList();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .requireIssuer(issuer)
                .require("tokenVersion", tokenVersion)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private PrivateKey parsePrivateKey(String encodedKey) {
        try {
            byte[] keyBytes = decodeKey(encodedKey);
            return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
        } catch (Exception e) {
            throw new IllegalStateException("JWT private key invalida", e);
        }
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
