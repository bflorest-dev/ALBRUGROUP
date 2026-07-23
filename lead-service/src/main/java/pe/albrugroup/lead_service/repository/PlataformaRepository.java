package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Plataforma;

import java.util.List;

@Repository
public interface PlataformaRepository extends JpaRepository<Plataforma, Long> {

    List<Plataforma> findByActivoTrueOrderByNombreAsc();
}
