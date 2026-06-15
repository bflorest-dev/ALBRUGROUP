package pe.albrugroup.auth_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.auth_service.entity.Equipo;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    Optional<Equipo> findByNombre(String nombre);
    boolean existsByNombre(String nombre);
    List<Equipo> findByActivoTrue();
}
