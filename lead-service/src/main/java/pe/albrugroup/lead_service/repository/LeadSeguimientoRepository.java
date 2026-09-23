package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.LeadSeguimiento;

import java.util.Optional;

@Repository
public interface LeadSeguimientoRepository extends JpaRepository<LeadSeguimiento, Long> {

    Optional<LeadSeguimiento> findByIdLead(Long idLead);
}
