package pe.albrugroup.auth_service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import pe.albrugroup.auth_service.entity.Usuario;
import pe.albrugroup.auth_service.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class CustomDetailsService implements UserDetailsService {

    private final UsuarioRepository repository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = repository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado" + username));

        return new CustomUserDetails(usuario);
    }
}
