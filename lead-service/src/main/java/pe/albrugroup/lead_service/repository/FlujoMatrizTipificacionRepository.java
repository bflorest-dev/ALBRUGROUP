package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.FlujoMatrizTipificacion;

import java.util.List;

@Repository
public interface FlujoMatrizTipificacionRepository extends JpaRepository<FlujoMatrizTipificacion, Long> {

    List<FlujoMatrizTipificacion> findByMatrizIdAndActivoTrue(Long matrizId);

    List<FlujoMatrizTipificacion> findByMatrizIdAndTipificacionOrigenIsNullAndActivoTrue(Long matrizId);

    List<FlujoMatrizTipificacion> findByMatrizIdAndTipificacionOrigenIdAndActivoTrue(Long matrizId, Long tipificacionOrigenId);
}
