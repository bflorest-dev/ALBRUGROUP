package pe.albrugroup.auth_service.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pe.albrugroup.auth_service.entity.Equipo;
import pe.albrugroup.auth_service.entity.Permiso;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JWTUtilTest {

    private String privateKey;
    private String publicKey;

    @BeforeEach
    void generarLlaves() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair pair = generator.generateKeyPair();
        privateKey = Base64.getEncoder().encodeToString(pair.getPrivate().getEncoded());
        publicKey = Base64.getEncoder().encodeToString(pair.getPublic().getEncoded());
    }

    @Test
    void tokenSoloAutorizaElRolActivoPeroFirmaTodasLasAsignaciones() {
        Permiso postventaPermiso = Permiso.builder().nombre("READ_POSTVENTA").build();
        Permiso backofficePermiso = Permiso.builder().nombre("READ_BACKOFFICE").build();
        Rol postventa = Rol.builder().id(1L).nombre("ASESOR_POSTVENTA")
                .permisos(Set.of(postventaPermiso)).build();
        Rol backoffice = Rol.builder().id(2L).nombre("ASESOR_BACKOFFICE")
                .permisos(Set.of(backofficePermiso)).build();
        Usuario usuario = Usuario.builder()
                .username("N70000001P@albru.pe")
                .empleadoId(15L)
                .nombreCompleto("Nayeli Palacios")
                .roles(new LinkedHashSet<>(List.of(postventa, backoffice)))
                .rolPrincipal(postventa)
                .equipos(Set.of(Equipo.builder().id(7L).build()))
                .build();
        JWTUtil jwt = new JWTUtil(privateKey, publicKey, Duration.ofMinutes(30), "albru-auth", 2);

        String token = jwt.generateToken(new CustomUserDetails(usuario), backoffice);
        Claims claims = jwt.extractAllClaims(token);

        assertThat(claims.get("roles", List.class)).containsExactly("ASESOR_BACKOFFICE");
        assertThat(claims.get("rolActivo", String.class)).isEqualTo("ASESOR_BACKOFFICE");
        assertThat(claims.get("rolPrincipal", String.class)).isEqualTo("ASESOR_POSTVENTA");
        assertThat(claims.get("rolesAsignados", List.class))
                .containsExactly("ASESOR_BACKOFFICE", "ASESOR_POSTVENTA");
        assertThat(claims.get("permisos", List.class)).containsExactly("READ_BACKOFFICE");
        assertThat(claims.get("equipos", List.class)).containsExactly(7);
        assertThat(claims.get("tokenVersion", Integer.class)).isEqualTo(2);
    }

    @Test
    void tokenDeVersionAnteriorEsRechazado() {
        Rol rol = Rol.builder().id(1L).nombre("RRHH").permisos(Set.of()).build();
        Usuario usuario = Usuario.builder().username("rrhh@albru.pe").empleadoId(2L)
                .roles(Set.of(rol)).rolPrincipal(rol).equipos(Set.of()).build();
        JWTUtil emisorAnterior = new JWTUtil(privateKey, publicKey, Duration.ofMinutes(30), "albru-auth", 1);
        JWTUtil validadorActual = new JWTUtil(privateKey, publicKey, Duration.ofMinutes(30), "albru-auth", 2);

        String tokenAnterior = emisorAnterior.generateToken(new CustomUserDetails(usuario), rol);

        assertThatThrownBy(() -> validadorActual.extractAllClaims(tokenAnterior))
                .hasMessageContaining("tokenVersion");
    }
}
