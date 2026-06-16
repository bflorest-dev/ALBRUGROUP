package pe.albrugroup.auth_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.auth_service.entity.Usuario;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<Usuario> findByEmpleadoId(Long empleadoId);
    Optional<Usuario> findByUsernameAndEmailAndDni(String username, String email, String dni);
    List<Usuario> findDistinctByRolesNombreAndActivoTrue(String rolNombre);
    List<Usuario> findDistinctByEquiposIdAndActivoTrue(Long equipoId);
    List<Usuario> findByEquiposId(Long equipoId);
}
