package pe.albrugroup.call_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.call_service.entity.OutboundAttempt;
import pe.albrugroup.call_service.entity.enums.ResultadoIntento;

import java.time.Instant;
import java.util.List;

@Repository
public interface OutboundAttemptRepository extends JpaRepository<OutboundAttempt, Long> {

    List<OutboundAttempt> findByCampaign_IdAndResultado(Long idCampana, ResultadoIntento resultado);

    Page<OutboundAttempt> findByCampaign_IdAndProgramadoParaBefore(Long idCampana,
                                                                   Instant cutoff,
                                                                   Pageable pageable);

    long countByCampaign_IdAndResultado(Long idCampana, ResultadoIntento resultado);
}
