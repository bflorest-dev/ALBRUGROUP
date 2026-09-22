package pe.albrugroup.auth_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.auth_service.entity.Rol;

import java.util.Optional;
import java.util.Collection;
import java.util.List;

@Repository
public interface RolRepository extends JpaRepository<Rol, Long> {

    Optional<Rol> findByNombre(String nombre);
    List<Rol> findAllByNombreIn(Collection<String> nombres);
    boolean existsByNombre(String nombre);
    // TODO
}
