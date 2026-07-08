package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.LeadEtapaResumen;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeadEtapaResumenRepository extends JpaRepository<LeadEtapaResumen, Long> {

    Optional<LeadEtapaResumen> findByIdLeadAndEtapa(Long idLead, Etapa etapa);

    List<LeadEtapaResumen> findByIdLead(Long idLead);

    // Re-ejecutabilidad del backfill: se borran las filas del lead antes de reconstruirlas.
    void deleteByIdLead(Long idLead);
}
