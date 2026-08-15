package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.LeadMeritoCorreccion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Repository
public interface LeadMeritoCorreccionRepository extends JpaRepository<LeadMeritoCorreccion, Long> {

    boolean existsByIdLeadAndEtapaMerito(Long idLead, Etapa etapaMerito);
}
