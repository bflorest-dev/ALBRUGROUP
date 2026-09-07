package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.lead_service.entity.SubsanacionAuditoria;

import java.util.Optional;
import java.util.UUID;

public interface SubsanacionAuditoriaRepository extends JpaRepository<SubsanacionAuditoria, Long> {
    Optional<SubsanacionAuditoria> findByRequestId(UUID requestId);
}
