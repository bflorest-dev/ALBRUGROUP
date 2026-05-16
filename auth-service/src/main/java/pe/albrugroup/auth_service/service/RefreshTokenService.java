package pe.albrugroup.auth_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.auth_service.entity.RefreshToken;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.exception.NotFoundException;
import pe.albrugroup.auth_service.exception.UnauthorizedException;
import pe.albrugroup.auth_service.repository.RefreshTokenRepository;
import pe.albrugroup.auth_service.security.CustomUserDetails;
import pe.albrugroup.auth_service.security.JWTUtil;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
@Transactional
public class RefreshTokenService {

    private static final int REFRESH_TOKEN_BYTES = 64;

    private final RefreshTokenRepository refreshTokenRepository;
    private final JWTUtil jwtUtil;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${jwt.refresh-expiration:8h}")
    private Duration refreshExpiration;

    public String createRefreshToken(Usuario usuario) {
        String plainToken = generateOpaqueToken();
        RefreshToken refreshToken = RefreshToken.builder()
                .tokenHash(hashToken(plainToken))
                .usuario(usuario)
                .expiresAt(Instant.now().plus(refreshExpiration))
                .build();
        refreshTokenRepository.save(refreshToken);
        return plainToken;
    }

    public TokenPair rotate(String plainRefreshToken) {
        Instant now = Instant.now();
        RefreshToken currentToken = refreshTokenRepository.findByTokenHash(hashToken(plainRefreshToken.trim()))
                .orElseThrow(() -> new UnauthorizedException("Refresh token invalido"));

        if (currentToken.isRevoked() || currentToken.isExpired(now)) {
            throw new UnauthorizedException("Refresh token invalido o expirado");
        }

        Usuario usuario = currentToken.getUsuario();
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            currentToken.setRevokedAt(now);
            throw new NotFoundException("Usuario no encontrado");
        }

        String newRefreshToken = generateOpaqueToken();
        String newRefreshTokenHash = hashToken(newRefreshToken);

        currentToken.setRevokedAt(now);
        currentToken.setReplacedByTokenHash(newRefreshTokenHash);

        RefreshToken replacement = RefreshToken.builder()
                .tokenHash(newRefreshTokenHash)
                .usuario(usuario)
                .expiresAt(now.plus(refreshExpiration))
                .build();
        refreshTokenRepository.save(replacement);

        String accessToken = jwtUtil.generateToken(new CustomUserDetails(usuario));
        return new TokenPair(accessToken, newRefreshToken, jwtUtil.getExpiresInSeconds());
    }

    public void revoke(String plainRefreshToken) {
        refreshTokenRepository.findByTokenHash(hashToken(plainRefreshToken.trim()))
                .ifPresent(refreshToken -> {
                    if (!refreshToken.isRevoked()) {
                        refreshToken.setRevokedAt(Instant.now());
                    }
                });
    }

    private String generateOpaqueToken() {
        byte[] bytes = new byte[REFRESH_TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String plainToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(plainToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    public record TokenPair(String accessToken, String refreshToken, Long expiresIn) {
    }
}
