package pe.albrugroup.call_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.call_service.entity.OutboundCampaign;
import pe.albrugroup.call_service.entity.enums.EstadoCampana;

import java.util.List;

@Repository
public interface OutboundCampaignRepository extends JpaRepository<OutboundCampaign, Long> {

    List<OutboundCampaign> findByEstado(EstadoCampana estado);
}
