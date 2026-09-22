package pe.albrugroup.auth_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.auth_service.entity.RefreshToken;
import pe.albrugroup.auth_service.entity.Rol;
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

    public String createRefreshToken(Usuario usuario, Rol rolActivo) {
        String plainToken = generateOpaqueToken();
        RefreshToken refreshToken = RefreshToken.builder()
                .tokenHash(hashToken(plainToken))
                .usuario(usuario)
                .rolActivo(rolActivo)
                .expiresAt(Instant.now().plus(refreshExpiration))
                .build();
        refreshTokenRepository.save(refreshToken);
        return plainToken;
    }

    public TokenPair rotate(String plainRefreshToken) {
        Instant now = Instant.now();
        RefreshToken currentToken = refreshTokenRepository.findByTokenHashForUpdate(hashToken(plainRefreshToken.trim()))
                .orElseThrow(() -> new UnauthorizedException("Refresh token invalido"));

        if (currentToken.isRevoked() || currentToken.isExpired(now)) {
            throw new UnauthorizedException("Refresh token invalido o expirado");
        }

        Usuario usuario = currentToken.getUsuario();
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            currentToken.setRevokedAt(now);
            throw new NotFoundException("Usuario no encontrado");
        }

        Rol rolActivo = currentToken.getRolActivo();
        if (usuario.getRolPrincipal() == null || rolActivo == null
                || usuario.getRoles().stream().noneMatch(rol -> rol.getId().equals(rolActivo.getId()))) {
            currentToken.setRevokedAt(now);
            throw new UnauthorizedException("El rol activo ya no esta asignado al usuario");
        }

        String newRefreshToken = generateOpaqueToken();
        String newRefreshTokenHash = hashToken(newRefreshToken);

        currentToken.setRevokedAt(now);
        currentToken.setReplacedByTokenHash(newRefreshTokenHash);

        RefreshToken replacement = RefreshToken.builder()
                .tokenHash(newRefreshTokenHash)
                .usuario(usuario)
                .rolActivo(rolActivo)
                .expiresAt(now.plus(refreshExpiration))
                .build();
        refreshTokenRepository.save(replacement);

        String accessToken = jwtUtil.generateToken(new CustomUserDetails(usuario), rolActivo);
        return new TokenPair(accessToken, newRefreshToken, jwtUtil.getExpiresInSeconds(), usuario, rolActivo);
    }

    public TokenPair switchActiveRole(String plainRefreshToken, Long empleadoId, Rol nuevoRolActivo) {
        Instant now = Instant.now();
        RefreshToken currentToken = refreshTokenRepository.findByTokenHashForUpdate(hashToken(plainRefreshToken.trim()))
                .orElseThrow(() -> new UnauthorizedException("Refresh token invalido"));
        if (currentToken.isRevoked() || currentToken.isExpired(now)) {
            throw new UnauthorizedException("Refresh token invalido o expirado");
        }
        Usuario usuario = currentToken.getUsuario();
        if (!usuario.getEmpleadoId().equals(empleadoId)) {
            throw new UnauthorizedException("El refresh token no pertenece a la sesion autenticada");
        }
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            currentToken.setRevokedAt(now);
            throw new NotFoundException("Usuario no encontrado");
        }
        boolean asignado = usuario.getRoles().stream().anyMatch(rol -> rol.getId().equals(nuevoRolActivo.getId()));
        if (!asignado) {
            throw new UnauthorizedException("El rol solicitado no esta asignado al usuario");
        }

        String newRefreshToken = generateOpaqueToken();
        String newRefreshTokenHash = hashToken(newRefreshToken);
        currentToken.setRevokedAt(now);
        currentToken.setReplacedByTokenHash(newRefreshTokenHash);
        refreshTokenRepository.save(RefreshToken.builder()
                .tokenHash(newRefreshTokenHash)
                .usuario(usuario)
                .rolActivo(nuevoRolActivo)
                .expiresAt(now.plus(refreshExpiration))
                .build());

        String accessToken = jwtUtil.generateToken(new CustomUserDetails(usuario), nuevoRolActivo);
        return new TokenPair(accessToken, newRefreshToken, jwtUtil.getExpiresInSeconds(), usuario, nuevoRolActivo);
    }

    public void revoke(String plainRefreshToken) {
        refreshTokenRepository.findByTokenHash(hashToken(plainRefreshToken.trim()))
                .ifPresent(refreshToken -> {
                    if (!refreshToken.isRevoked()) {
                        refreshToken.setRevokedAt(Instant.now());
                    }
                });
    }

    public int revokeActiveTokens(Usuario usuario) {
        return refreshTokenRepository.revokeActiveByUsuario(usuario, Instant.now());
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

    public record TokenPair(
            String accessToken,
            String refreshToken,
            Long expiresIn,
            Usuario usuario,
            Rol rolActivo
    ) {
    }
}
