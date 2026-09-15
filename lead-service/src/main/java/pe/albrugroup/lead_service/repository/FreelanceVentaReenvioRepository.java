package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.lead_service.entity.FreelanceVentaOrigen;
import pe.albrugroup.lead_service.entity.FreelanceVentaReenvio;

import java.util.Optional;
import java.util.UUID;

public interface FreelanceVentaReenvioRepository extends JpaRepository<FreelanceVentaReenvio, Long> {
    Optional<FreelanceVentaReenvio> findByRequestId(UUID requestId);
    long countByOrigen(FreelanceVentaOrigen origen);
}
