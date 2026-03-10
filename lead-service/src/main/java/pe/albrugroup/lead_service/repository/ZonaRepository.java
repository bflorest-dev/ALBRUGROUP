package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Zona;

@Repository
public interface ZonaRepository extends JpaRepository<Zona, Long> {
}
