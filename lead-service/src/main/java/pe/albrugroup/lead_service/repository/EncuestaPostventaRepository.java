package pe.albrugroup.lead_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.EncuestaPostventa;

import java.util.List;

@Repository
public interface EncuestaPostventaRepository extends JpaRepository<EncuestaPostventa, Long> {

    Page<EncuestaPostventa> findByLeadIdOrderByCreatedAtDesc(Long idLead, Pageable pageable);
    List<EncuestaPostventa> findByLeadId(Long idLead);
}
