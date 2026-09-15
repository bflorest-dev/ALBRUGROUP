package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.lead_service.entity.FreelanceVentaOrigen;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FreelanceVentaOrigenRepository extends JpaRepository<FreelanceVentaOrigen, Long> {
    Optional<FreelanceVentaOrigen> findByRequestId(UUID requestId);
    Optional<FreelanceVentaOrigen> findByIdLead(Long idLead);
    Optional<FreelanceVentaOrigen> findByIdLeadAndIdFreelance(Long idLead, Long idFreelance);
    List<FreelanceVentaOrigen> findByIdFreelanceAndCreadoAtGreaterThanEqualAndCreadoAtLessThanOrderByCreadoAtDesc(
            Long idFreelance, Instant desde, Instant hasta);
}
