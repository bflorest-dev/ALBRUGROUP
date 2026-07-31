package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PeriodoFacturacionPostventaRepository extends JpaRepository<PeriodoFacturacionPostventa, Long> {

    List<PeriodoFacturacionPostventa> findByLeadIdOrderByNumeroPeriodoAsc(Long idLead);

    Optional<PeriodoFacturacionPostventa> findTopByLeadIdOrderByNumeroPeriodoDesc(Long idLead);

    Optional<PeriodoFacturacionPostventa> findTopByLeadIdAndEstadoOrderByNumeroPeriodoDesc(
            Long idLead,
            EstadoPeriodoFacturacionPostventa estado
    );

    Optional<PeriodoFacturacionPostventa> findByCalendarioFacturacionPostventaIdAndNumeroPeriodo(
            Long idCalendarioFacturacionPostventa,
            Integer numeroPeriodo
    );

    List<PeriodoFacturacionPostventa> findByLeadIdInOrderByLeadIdAscNumeroPeriodoDesc(Collection<Long> leadIds);
}
