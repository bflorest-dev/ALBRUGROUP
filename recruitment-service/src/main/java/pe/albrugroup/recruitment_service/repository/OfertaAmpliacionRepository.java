package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.recruitment_service.entity.OfertaAmpliacion;

import java.util.Optional;

@Repository
public interface OfertaAmpliacionRepository extends JpaRepository<OfertaAmpliacion, Long> {

    Optional<OfertaAmpliacion> findTopByOfertaLaboralIdOrderByPlazoDescIdDesc(Long ofertaLaboralId);
}
