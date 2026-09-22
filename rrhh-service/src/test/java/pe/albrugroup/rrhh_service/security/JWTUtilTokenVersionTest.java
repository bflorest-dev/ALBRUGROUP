package pe.albrugroup.rrhh_service.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JWTUtilTokenVersionTest {

    private KeyPair keyPair;
    private JWTUtil jwtUtil;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keyPair = generator.generateKeyPair();
        String publicKey = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
        jwtUtil = new JWTUtil(publicKey, "albru-auth", 2);
    }

    @Test
    void aceptaVersionActualYRechazaVersionAnterior() {
        assertDoesNotThrow(() -> jwtUtil.extractAllClaims(token(2)));
        assertThrows(RuntimeException.class, () -> jwtUtil.extractAllClaims(token(1)));
    }

    private String token(int version) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject("empleado@albru.pe")
                .setIssuer("albru-auth")
                .claim("tokenVersion", version)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + 60_000))
                .signWith(keyPair.getPrivate(), SignatureAlgorithm.RS256)
                .compact();
    }
}
