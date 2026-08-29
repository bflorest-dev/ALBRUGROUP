package pe.albrugroup.auth_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.auth_service.entity.RefreshToken;
import pe.albrugroup.auth_service.entity.Usuario;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update RefreshToken rt
            set rt.revokedAt = :revokedAt
            where rt.usuario = :usuario
              and rt.revokedAt is null
            """)
    int revokeActiveByUsuario(@Param("usuario") Usuario usuario, @Param("revokedAt") Instant revokedAt);
}
