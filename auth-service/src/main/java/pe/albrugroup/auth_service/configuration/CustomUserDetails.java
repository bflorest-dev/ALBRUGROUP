package pe.albrugroup.auth_service.configuration;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import pe.albrugroup.auth_service.entity.Permiso;
import pe.albrugroup.auth_service.entity.Rol;
import pe.albrugroup.auth_service.entity.Usuario;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Usuario usuario;
    private final Long empleadoId;

    public CustomUserDetails(Usuario usuario) {
        this.usuario = usuario;
        this.empleadoId = usuario.getEmpleadoId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();

        for(Rol rol : usuario.getRoles()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + rol.getNombre()));
            for(Permiso permiso : rol.getPermisos()) {
                authorities.add(new SimpleGrantedAuthority(permiso.getNombre()));
            }
        }
        return authorities;
    }
    @Override
    public String getPassword() {
        return usuario.getPassword();
    }
    @Override
    public String getUsername() {
        return usuario.getUsername();
    }
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    @Override
    public boolean isEnabled() {
        return usuario.getActivo();
    }
}
