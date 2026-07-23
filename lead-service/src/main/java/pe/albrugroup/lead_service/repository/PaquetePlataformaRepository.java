package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.PaquetePlataforma;

import java.util.List;

@Repository
public interface PaquetePlataformaRepository extends JpaRepository<PaquetePlataforma, Long> {

    List<PaquetePlataforma> findByPlataformaIdAndActivoTrueOrderByNombreAsc(Long idPlataforma);
}
