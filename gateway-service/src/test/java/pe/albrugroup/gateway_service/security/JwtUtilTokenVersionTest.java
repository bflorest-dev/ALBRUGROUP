package pe.albrugroup.gateway_service.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTokenVersionTest {

    private KeyPair keyPair;
    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keyPair = generator.generateKeyPair();
        String publicKey = Base64.getEncoder().encodeToString(keyPair.getPublic().getEncoded());
        jwtUtil = new JwtUtil(publicKey, "albru-auth", 2);
    }

    @Test
    void aceptaVersionActualYRechazaVersionAnterior() {
        assertTrue(jwtUtil.validateToken(token(2)));
        assertFalse(jwtUtil.validateToken(token(1)));
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
