package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.albrugroup.lead_service.entity.FreelanceVentaOrigen;
import pe.albrugroup.lead_service.entity.FreelanceVentaReenvio;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface FreelanceVentaReenvioRepository extends JpaRepository<FreelanceVentaReenvio, Long> {
    Optional<FreelanceVentaReenvio> findByRequestId(UUID requestId);
    long countByOrigen(FreelanceVentaOrigen origen);

    @Modifying
    @Query("DELETE FROM FreelanceVentaReenvio r WHERE r.origen.id IN :idsOrigen")
    void deleteByOrigenIdIn(@Param("idsOrigen") Collection<Long> idsOrigen);
}
