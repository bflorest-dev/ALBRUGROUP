package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Campana;

import java.util.Optional;

@Repository
public interface CampanaRepository extends JpaRepository<Campana, Long> {

    Optional<Campana> findByNombre(String nombre);
}
