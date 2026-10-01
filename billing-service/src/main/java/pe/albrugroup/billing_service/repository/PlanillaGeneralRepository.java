package pe.albrugroup.billing_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.billing_service.entity.PlanillaGeneral;
import pe.albrugroup.billing_service.entity.enums.TipoPlanilla;

import java.util.Optional;

public interface PlanillaGeneralRepository extends JpaRepository<PlanillaGeneral, Long> {

    Optional<PlanillaGeneral> findByAnioAndMesAndTipoPlanilla(Integer anio, Integer mes, TipoPlanilla tipoPlanilla);
}
